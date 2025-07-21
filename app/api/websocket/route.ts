import { NextRequest } from 'next/server';
import { WebSocketMessage, SerialMessage, UDPMessage, SerialConfig, UDPConfig } from '@/types';
import { hardwareManager } from '@/lib/hardware-manager';

// 连接状态存储
const connections = new Map<string, {
  type: 'serial' | 'udp';
  config: SerialConfig | UDPConfig;
  status: 'connected' | 'disconnected';
}>();

// 数据存储（用于轮询）
const dataBuffer = new Map<string, Array<{
  data: string;
  source?: string;
  timestamp: Date;
  direction: 'sent' | 'received';
}>>();

// 设置硬件管理器的回调
hardwareManager.setSerialDataHandler((data: string) => {
  // 广播串口数据到所有连接的客户端
  connections.forEach((connection, clientId) => {
    if (connection.type === 'serial' && connection.status === 'connected') {
      const buffer = dataBuffer.get(clientId) || [];
      buffer.push({
        data,
        timestamp: new Date(),
        direction: 'received'
      });
      dataBuffer.set(clientId, buffer);
    }
  });
});

hardwareManager.setUDPDataHandler((data: string, source: string) => {
  // 广播UDP数据到所有连接的客户端
  connections.forEach((connection, clientId) => {
    if (connection.type === 'udp' && connection.status === 'connected') {
      const buffer = dataBuffer.get(clientId) || [];
      buffer.push({
        data,
        source,
        timestamp: new Date(),
        direction: 'received'
      });
      dataBuffer.set(clientId, buffer);
    }
  });
});

hardwareManager.setErrorHandler((error: string, type: 'serial' | 'udp') => {
  console.error(`[${type.toUpperCase()}] ${error}`);
  
  // 更新相关连接的状态
  connections.forEach((connection, clientId) => {
    if (connection.type === type) {
      connection.status = 'disconnected';
    }
  });
});

// WebSocket升级处理
export async function GET(request: NextRequest) {
  const upgrade = request.headers.get('upgrade');
  
  if (upgrade !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }

  // 在Vercel环境中，我们需要使用不同的方法处理WebSocket
  // 这里返回一个指示，实际的WebSocket连接需要通过其他方式建立
  return new Response('WebSocket endpoint ready', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

// 处理WebSocket消息的API端点
export async function POST(request: NextRequest) {
  try {
    const message: WebSocketMessage = await request.json();
    const clientId = generateClientId();
    
    let response;
    
    if (message.type.startsWith('serial-')) {
      response = await handleSerialMessage(clientId, message as SerialMessage);
    } else if (message.type.startsWith('udp-')) {
      response = await handleUDPMessage(clientId, message as UDPMessage);
    } else {
      response = {
        type: 'error',
        message: '未知的消息类型'
      };
    }
    
    return Response.json(response);
  } catch (error) {
    console.error('处理WebSocket消息时出错:', error);
    return Response.json({
      type: 'error',
      message: '消息处理失败'
    }, { status: 500 });
  }
}

// 处理串口消息
async function handleSerialMessage(clientId: string, message: SerialMessage) {
  switch (message.type) {
    case 'serial-connect':
      if (!message.config) {
        return {
          type: 'serial-error',
          message: '缺少串口配置'
        };
      }
      
      try {
        return await connectSerial(clientId, message.config);
      } catch (error) {
        return {
          type: 'serial-error',
          message: `串口连接失败: ${error}`
        };
      }
      
    case 'serial-disconnect':
      return disconnectSerial(clientId);
      
    case 'serial-send':
      if (!message.data) {
        return {
          type: 'serial-error',
          message: '缺少发送数据'
        };
      }
      
      try {
        return await sendSerialData(clientId, message.data);
      } catch (error) {
        return {
          type: 'serial-error',
          message: `发送数据失败: ${error}`
        };
      }
      
    default:
      return {
        type: 'serial-error',
        message: '未知的串口操作'
      };
  }
}

// 处理UDP消息
async function handleUDPMessage(clientId: string, message: UDPMessage) {
  switch (message.type) {
    case 'udp-connect':
      if (!message.config) {
        return {
          type: 'udp-error',
          message: '缺少UDP配置'
        };
      }
      
      try {
        return await connectUDP(clientId, message.config);
      } catch (error) {
        return {
          type: 'udp-error',
          message: `UDP连接失败: ${error}`
        };
      }
      
    case 'udp-disconnect':
      return disconnectUDP(clientId);
      
    case 'udp-send':
      if (!message.data || !message.config) {
        return {
          type: 'udp-error',
          message: '缺少发送数据或目标配置'
        };
      }
      
      try {
        return await sendUDPData(clientId, message.data, message.config);
      } catch (error) {
        return {
          type: 'udp-error',
          message: `发送数据失败: ${error}`
        };
      }
      
    default:
      return {
        type: 'udp-error',
        message: '未知的UDP操作'
      };
  }
}

// 连接真实串口
async function connectSerial(clientId: string, config: SerialConfig) {
  try {
    await hardwareManager.connectSerial(config);
    
    connections.set(clientId, {
      type: 'serial',
      config,
      status: 'connected'
    });
    
    // 初始化数据缓冲区
    dataBuffer.set(clientId, []);
    
    return {
      type: 'serial-connect',
      message: `串口已连接 - 端口: ${config.port}, 波特率: ${config.baudRate}, 数据位: ${config.dataBits}, 停止位: ${config.stopBits}, 校验: ${config.parity}`
    };
  } catch (error) {
    throw new Error(`串口连接失败: ${error}`);
  }
}

// 断开串口连接
async function disconnectSerial(clientId: string) {
  try {
    await hardwareManager.disconnectSerial();
    connections.delete(clientId);
    dataBuffer.delete(clientId);
    
    return {
      type: 'serial-disconnect',
      message: '串口已断开连接'
    };
  } catch (error) {
    return {
      type: 'serial-error',
      message: `串口断开失败: ${error}`
    };
  }
}

// 发送串口数据
async function sendSerialData(clientId: string, data: string) {
  const connection = connections.get(clientId);
  if (!connection || connection.status !== 'connected') {
    throw new Error('串口未连接');
  }
  
  try {
    await hardwareManager.sendSerialData(data);
    
    // 记录发送的数据
    const buffer = dataBuffer.get(clientId) || [];
    buffer.push({
      data,
      timestamp: new Date(),
      direction: 'sent'
    });
    dataBuffer.set(clientId, buffer);
    
    return {
      type: 'serial-send',
      data: data,
      message: '数据已发送'
    };
  } catch (error) {
    throw new Error(`发送串口数据失败: ${error}`);
  }
}

// 连接真实UDP
async function connectUDP(clientId: string, config: UDPConfig) {
  try {
    await hardwareManager.connectUDP(config);
    
    connections.set(clientId, {
      type: 'udp',
      config,
      status: 'connected'
    });
    
    // 初始化数据缓冲区
    dataBuffer.set(clientId, []);
    
    return {
      type: 'udp-connect',
      message: `UDP已连接 - 本地端口: ${config.localPort}, 目标: ${config.targetHost}:${config.targetPort}`
    };
  } catch (error) {
    throw new Error(`UDP连接失败: ${error}`);
  }
}

// 断开UDP连接
async function disconnectUDP(clientId: string) {
  try {
    await hardwareManager.disconnectUDP();
    connections.delete(clientId);
    dataBuffer.delete(clientId);
    
    return {
      type: 'udp-disconnect',
      message: 'UDP已断开连接'
    };
  } catch (error) {
    return {
      type: 'udp-error',
      message: `UDP断开失败: ${error}`
    };
  }
}

// 发送UDP数据
async function sendUDPData(clientId: string, data: string, config: UDPConfig) {
  const connection = connections.get(clientId);
  if (!connection || connection.status !== 'connected') {
    throw new Error('UDP未连接');
  }
  
  try {
    await hardwareManager.sendUDPData(data, config);
    
    // 记录发送的数据
    const buffer = dataBuffer.get(clientId) || [];
    buffer.push({
      data,
      source: `${config.targetHost}:${config.targetPort}`,
      timestamp: new Date(),
      direction: 'sent'
    });
    dataBuffer.set(clientId, buffer);
    
    return {
      type: 'udp-send',
      data: data,
      message: `UDP数据已发送到 ${config.targetHost}:${config.targetPort}`
    };
  } catch (error) {
    throw new Error(`发送UDP数据失败: ${error}`);
  }
}

// 获取数据更新的API端点
export async function PUT(request: NextRequest) {
  try {
    const { clientId } = await request.json();
    const buffer = dataBuffer.get(clientId) || [];
    
    // 返回最新的数据并清空缓冲区
    const data = buffer.map(item => ({
      data: item.data,
      source: item.source,
      timestamp: item.timestamp,
      direction: item.direction
    }));
    
    // 清空已返回的数据
    dataBuffer.set(clientId, []);
    
    return Response.json({
      type: 'data-update',
      data: data
    });
  } catch (error) {
    return Response.json({
      type: 'error',
      message: '获取数据失败'
    }, { status: 500 });
  }
}

// 生成客户端ID
function generateClientId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// 获取连接状态
export async function PATCH(request: NextRequest) {
  try {
    const { clientId } = await request.json();
    const connection = connections.get(clientId);
    
    if (!connection) {
      return Response.json({
        type: 'status',
        status: 'disconnected'
      });
    }
    
    return Response.json({
      type: 'status',
      status: connection.status,
      config: connection.config,
      connectionType: connection.type
    });
  } catch (error) {
    return Response.json({
      type: 'error',
      message: '获取状态失败'
    }, { status: 500 });
  }
}