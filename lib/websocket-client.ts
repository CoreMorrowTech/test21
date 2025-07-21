import { WebSocketMessage, SerialMessage, UDPMessage, SerialConfig, UDPConfig } from '@/types';

export class WebSocketClient {
  private clientId: string;
  private onMessage?: (message: any) => void;
  private onError?: (error: string) => void;
  private pollInterval?: NodeJS.Timeout;

  constructor() {
    this.clientId = this.generateClientId();
  }

  // 设置消息处理器
  setMessageHandler(handler: (message: any) => void) {
    this.onMessage = handler;
  }

  // 设置错误处理器
  setErrorHandler(handler: (error: string) => void) {
    this.onError = handler;
  }

  // 连接WebSocket（在Vercel环境中使用轮询模拟）
  connect() {
    // 开始轮询数据更新
    this.startPolling();
    
    // 模拟连接成功
    if (this.onMessage) {
      this.onMessage({
        type: 'connection',
        message: 'WebSocket客户端已连接 (模拟)'
      });
    }
  }

  // 断开连接
  disconnect() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
    
    if (this.onMessage) {
      this.onMessage({
        type: 'disconnection',
        message: 'WebSocket客户端已断开连接'
      });
    }
  }

  // 发送消息
  async send(message: WebSocketMessage) {
    try {
      const response = await fetch('/api/websocket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...message,
          clientId: this.clientId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      // 检查响应中的错误
      if (result.type && result.type.includes('error')) {
        throw new Error(result.message || '服务器返回错误');
      }
      
      if (this.onMessage) {
        this.onMessage(result);
      }
      
      return result;
    } catch (error) {
      const errorMessage = `发送消息失败: ${error instanceof Error ? error.message : error}`;
      console.error('WebSocket发送错误:', error);
      if (this.onError) {
        this.onError(errorMessage);
      }
      throw new Error(errorMessage);
    }
  }

  // 连接串口
  async connectSerial(config: SerialConfig) {
    const message: SerialMessage = {
      type: 'serial-connect',
      config
    };
    return await this.send(message);
  }

  // 断开串口连接
  async disconnectSerial() {
    const message: SerialMessage = {
      type: 'serial-disconnect'
    };
    return await this.send(message);
  }

  // 发送串口数据
  async sendSerialData(data: string) {
    const message: SerialMessage = {
      type: 'serial-send',
      data
    };
    return await this.send(message);
  }

  // 连接UDP
  async connectUDP(config: UDPConfig) {
    const message: UDPMessage = {
      type: 'udp-connect',
      config
    };
    return await this.send(message);
  }

  // 断开UDP连接
  async disconnectUDP() {
    const message: UDPMessage = {
      type: 'udp-disconnect'
    };
    return await this.send(message);
  }

  // 发送UDP数据
  async sendUDPData(data: string, config: UDPConfig) {
    const message: UDPMessage = {
      type: 'udp-send',
      data,
      config
    };
    return await this.send(message);
  }

  // 获取连接状态
  async getConnectionStatus() {
    try {
      const response = await fetch('/api/websocket', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: this.clientId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (this.onError) {
        this.onError(`获取连接状态失败: ${error}`);
      }
      return null;
    }
  }

  // 开始轮询数据更新
  private startPolling() {
    this.pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/websocket', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId: this.clientId
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data && result.data.length > 0 && this.onMessage) {
            // 发送最新的数据更新
            const latestData = result.data[result.data.length - 1];
            this.onMessage({
              type: 'data-receive',
              data: latestData,
              timestamp: new Date()
            });
          }
        }
      } catch (error) {
        // 静默处理轮询错误，避免过多日志
        console.debug('轮询数据更新失败:', error);
      }
    }, 2000); // 每2秒轮询一次
  }

  // 生成客户端ID
  private generateClientId(): string {
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }

  // 获取客户端ID
  getClientId(): string {
    return this.clientId;
  }
}

// 创建单例实例
export const websocketClient = new WebSocketClient();