#!/usr/bin/env node

/**
 * WebSocket UDP 代理服务器
 * 为 Web 环境提供 UDP 功能支持
 */

const WebSocket = require('ws');
const dgram = require('dgram');
const http = require('http');

class WebSocketUDPProxy {
  constructor(wsPort = 8080) {
    this.wsPort = wsPort;
    this.clients = new Map(); // WebSocket 客户端映射
    this.udpSockets = new Map(); // UDP 套接字映射
    
    this.setupWebSocketServer();
    console.log(`🌐 WebSocket UDP 代理服务器启动在端口 ${wsPort}`);
  }

  setupWebSocketServer() {
    // 创建 HTTP 服务器
    const server = http.createServer();
    
    // 创建 WebSocket 服务器
    this.wss = new WebSocket.Server({ server });
    
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      console.log(`📱 客户端连接: ${clientId} (${req.socket.remoteAddress})`);
      
      this.clients.set(clientId, {
        ws,
        udpSocket: null,
        config: null
      });

      ws.on('message', (message) => {
        this.handleWebSocketMessage(clientId, message);
      });

      ws.on('close', () => {
        console.log(`📱 客户端断开: ${clientId}`);
        this.cleanupClient(clientId);
      });

      ws.on('error', (error) => {
        console.error(`❌ WebSocket 错误 (${clientId}):`, error);
        this.cleanupClient(clientId);
      });

      // 发送欢迎消息
      ws.send(JSON.stringify({
        type: 'connected',
        clientId,
        message: 'WebSocket UDP 代理已连接'
      }));
    });

    // 启动服务器
    server.listen(this.wsPort, () => {
      console.log(`✅ WebSocket 服务器监听端口 ${this.wsPort}`);
    });
  }

  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  handleWebSocketMessage(clientId, message) {
    try {
      const data = JSON.parse(message.toString());
      const client = this.clients.get(clientId);
      
      if (!client) {
        console.warn(`⚠️ 未知客户端: ${clientId}`);
        return;
      }

      switch (data.type) {
        case 'config':
          this.handleConfig(clientId, data);
          break;
        case 'send':
          this.handleSend(clientId, data);
          break;
        default:
          console.warn(`⚠️ 未知消息类型: ${data.type}`);
      }
    } catch (error) {
      console.error(`❌ 解析消息失败 (${clientId}):`, error);
    }
  }

  handleConfig(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      // 创建 UDP 套接字
      const udpSocket = dgram.createSocket('udp4');
      
      udpSocket.on('message', (msg, rinfo) => {
        // 转发 UDP 数据到 WebSocket 客户端
        const response = {
          type: 'udp-data',
          data: msg.toString(),
          source: `${rinfo.address}:${rinfo.port}`,
          timestamp: new Date().toISOString()
        };
        
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify(response));
        }
      });

      udpSocket.on('error', (error) => {
        console.error(`❌ UDP 错误 (${clientId}):`, error);
        const errorResponse = {
          type: 'error',
          message: `UDP 错误: ${error.message}`
        };
        
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify(errorResponse));
        }
      });

      // 绑定本地端口
      udpSocket.bind(data.localPort, () => {
        console.log(`🔌 UDP 套接字绑定端口 ${data.localPort} (${clientId})`);
        
        client.udpSocket = udpSocket;
        client.config = data;
        
        // 发送配置成功响应
        const response = {
          type: 'config-success',
          localPort: data.localPort,
          message: `UDP 套接字已绑定到端口 ${data.localPort}`
        };
        
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify(response));
        }
      });

    } catch (error) {
      console.error(`❌ 配置 UDP 失败 (${clientId}):`, error);
      
      const errorResponse = {
        type: 'error',
        message: `配置失败: ${error.message}`
      };
      
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(errorResponse));
      }
    }
  }

  handleSend(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || !client.udpSocket) {
      console.warn(`⚠️ 客户端 ${clientId} 没有配置 UDP 套接字`);
      return;
    }

    try {
      const buffer = Buffer.from(data.data);
      client.udpSocket.send(buffer, data.port, data.host, (error) => {
        if (error) {
          console.error(`❌ UDP 发送失败 (${clientId}):`, error);
          
          const errorResponse = {
            type: 'error',
            message: `发送失败: ${error.message}`
          };
          
          if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify(errorResponse));
          }
        } else {
          console.log(`📤 UDP 数据发送成功 (${clientId}): ${data.host}:${data.port}`);
          
          const response = {
            type: 'send-success',
            target: `${data.host}:${data.port}`,
            data: data.data
          };
          
          if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify(response));
          }
        }
      });
    } catch (error) {
      console.error(`❌ 处理发送请求失败 (${clientId}):`, error);
    }
  }

  cleanupClient(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      // 关闭 UDP 套接字
      if (client.udpSocket) {
        client.udpSocket.close();
        console.log(`🔌 UDP 套接字已关闭 (${clientId})`);
      }
      
      // 移除客户端
      this.clients.delete(clientId);
    }
  }

  // 获取服务器状态
  getStatus() {
    return {
      wsPort: this.wsPort,
      connectedClients: this.clients.size,
      clients: Array.from(this.clients.entries()).map(([id, client]) => ({
        id,
        hasUdpSocket: !!client.udpSocket,
        config: client.config
      }))
    };
  }

  // 停止服务器
  stop() {
    console.log('🛑 正在停止 WebSocket UDP 代理服务器...');
    
    // 清理所有客户端
    for (const clientId of this.clients.keys()) {
      this.cleanupClient(clientId);
    }
    
    // 关闭 WebSocket 服务器
    if (this.wss) {
      this.wss.close(() => {
        console.log('✅ WebSocket UDP 代理服务器已停止');
      });
    }
  }
}

// 命令行启动
if (require.main === module) {
  const port = process.argv[2] ? parseInt(process.argv[2]) : 8080;
  
  const proxy = new WebSocketUDPProxy(port);
  
  // 优雅关闭
  process.on('SIGINT', () => {
    console.log('\n🛑 收到停止信号...');
    proxy.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 收到终止信号...');
    proxy.stop();
    process.exit(0);
  });
  
  // 定期显示状态
  setInterval(() => {
    const status = proxy.getStatus();
    if (status.connectedClients > 0) {
      console.log(`📊 状态: ${status.connectedClients} 个客户端连接`);
    }
  }, 30000); // 每30秒显示一次
}

module.exports = WebSocketUDPProxy;