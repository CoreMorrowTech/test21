/**
 * 统一硬件接口使用示例
 * 展示如何在 Web 和 Electron 环境中使用相同的代码
 */

import { unifiedHardware } from '@/lib/unified-hardware';
import { SerialConfig, UDPConfig } from '@/types';

// 串口使用示例
export async function serialExample() {
  console.log('🔌 串口通信示例');
  
  try {
    // 1. 获取可用串口列表
    const ports = await unifiedHardware.listSerialPorts();
    console.log('可用串口:', ports);
    
    if (ports.length === 0) {
      console.log('❌ 没有找到可用的串口');
      return;
    }
    
    // 2. 配置串口参数
    const config: SerialConfig = {
      port: ports[0].path, // 使用第一个可用端口
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none'
    };
    
    // 3. 设置数据接收回调
    unifiedHardware.onSerialData((data: string) => {
      console.log('📥 收到串口数据:', data);
    });
    
    // 4. 设置错误处理回调
    unifiedHardware.onSerialError((error: string) => {
      console.error('❌ 串口错误:', error);
    });
    
    // 5. 连接串口
    await unifiedHardware.connectSerial(config);
    console.log('✅ 串口连接成功');
    
    // 6. 发送测试数据
    await unifiedHardware.sendSerialData('Hello Serial!');
    console.log('📤 数据发送成功');
    
    // 7. 检查连接状态
    console.log('连接状态:', unifiedHardware.isSerialConnected());
    
    // 8. 模拟一些操作后断开连接
    setTimeout(async () => {
      await unifiedHardware.disconnectSerial();
      console.log('🔌 串口已断开');
    }, 5000);
    
  } catch (error) {
    console.error('❌ 串口操作失败:', error);
  }
}

// UDP 使用示例
export async function udpExample() {
  console.log('🌐 UDP 通信示例');
  
  try {
    // 1. 配置 UDP 参数
    const config: UDPConfig = {
      localPort: 8888,
      targetHost: '127.0.0.1',
      targetPort: 9999
    };
    
    // 2. 设置数据接收回调
    unifiedHardware.onUDPData((data: string, source: string) => {
      console.log('📥 收到 UDP 数据:', data, '来源:', source);
    });
    
    // 3. 设置错误处理回调
    unifiedHardware.onUDPError((error: string) => {
      console.error('❌ UDP 错误:', error);
    });
    
    // 4. 连接 UDP
    await unifiedHardware.connectUDP(config);
    console.log('✅ UDP 连接成功，监听端口:', config.localPort);
    
    // 5. 发送测试数据
    await unifiedHardware.sendUDPData('Hello UDP!', config.targetHost!, config.targetPort!);
    console.log('📤 UDP 数据发送成功');
    
    // 6. 检查连接状态
    console.log('连接状态:', unifiedHardware.isUDPConnected());
    
    // 7. 模拟一些操作后断开连接
    setTimeout(async () => {
      await unifiedHardware.disconnectUDP();
      console.log('🌐 UDP 已断开');
    }, 5000);
    
  } catch (error) {
    console.error('❌ UDP 操作失败:', error);
  }
}

// 完整的使用示例
export async function fullExample() {
  console.log('🚀 完整使用示例开始');
  
  try {
    // 同时使用串口和 UDP
    await Promise.all([
      serialExample(),
      udpExample()
    ]);
    
    console.log('✅ 所有操作完成');
    
  } catch (error) {
    console.error('❌ 操作失败:', error);
  } finally {
    // 清理资源
    setTimeout(async () => {
      await unifiedHardware.cleanup();
      console.log('🧹 资源清理完成');
    }, 6000);
  }
}

// React Hook 使用示例
export function useUnifiedHardware() {
  const [serialConnected, setSerialConnected] = React.useState(false);
  const [udpConnected, setUDPConnected] = React.useState(false);
  const [serialData, setSerialData] = React.useState<string[]>([]);
  const [udpData, setUDPData] = React.useState<Array<{data: string, source: string}>>([]);
  
  React.useEffect(() => {
    // 设置数据接收回调
    unifiedHardware.onSerialData((data: string) => {
      setSerialData(prev => [...prev, data]);
    });
    
    unifiedHardware.onUDPData((data: string, source: string) => {
      setUDPData(prev => [...prev, { data, source }]);
    });
    
    // 设置错误处理
    unifiedHardware.onSerialError((error: string) => {
      console.error('串口错误:', error);
      setSerialConnected(false);
    });
    
    unifiedHardware.onUDPError((error: string) => {
      console.error('UDP 错误:', error);
      setUDPConnected(false);
    });
    
    // 清理函数
    return () => {
      unifiedHardware.cleanup();
    };
  }, []);
  
  const connectSerial = async (config: SerialConfig) => {
    try {
      await unifiedHardware.connectSerial(config);
      setSerialConnected(true);
    } catch (error) {
      console.error('串口连接失败:', error);
      setSerialConnected(false);
    }
  };
  
  const disconnectSerial = async () => {
    try {
      await unifiedHardware.disconnectSerial();
      setSerialConnected(false);
    } catch (error) {
      console.error('串口断开失败:', error);
    }
  };
  
  const sendSerialData = async (data: string) => {
    try {
      await unifiedHardware.sendSerialData(data);
    } catch (error) {
      console.error('串口数据发送失败:', error);
    }
  };
  
  const connectUDP = async (config: UDPConfig) => {
    try {
      await unifiedHardware.connectUDP(config);
      setUDPConnected(true);
    } catch (error) {
      console.error('UDP 连接失败:', error);
      setUDPConnected(false);
    }
  };
  
  const disconnectUDP = async () => {
    try {
      await unifiedHardware.disconnectUDP();
      setUDPConnected(false);
    } catch (error) {
      console.error('UDP 断开失败:', error);
    }
  };
  
  const sendUDPData = async (data: string, host: string, port: number) => {
    try {
      await unifiedHardware.sendUDPData(data, host, port);
    } catch (error) {
      console.error('UDP 数据发送失败:', error);
    }
  };
  
  const listSerialPorts = async () => {
    try {
      return await unifiedHardware.listSerialPorts();
    } catch (error) {
      console.error('获取串口列表失败:', error);
      return [];
    }
  };
  
  return {
    // 状态
    serialConnected,
    udpConnected,
    serialData,
    udpData,
    
    // 串口方法
    connectSerial,
    disconnectSerial,
    sendSerialData,
    listSerialPorts,
    
    // UDP 方法
    connectUDP,
    disconnectUDP,
    sendUDPData,
    
    // 工具方法
    clearSerialData: () => setSerialData([]),
    clearUDPData: () => setUDPData([])
  };
}

// 环境检测示例
export function detectEnvironmentCapabilities() {
  const capabilities = {
    platform: typeof window !== 'undefined' && (window as any).require ? 'electron' : 'web',
    serialSupport: {
      native: false,
      webapi: false
    },
    udpSupport: {
      native: false,
      websocket: false
    }
  };
  
  // 检测串口支持
  if (capabilities.platform === 'electron') {
    try {
      require('serialport');
      capabilities.serialSupport.native = true;
    } catch (error) {
      console.warn('Electron 环境下串口模块不可用');
    }
  } else {
    capabilities.serialSupport.webapi = 'serial' in navigator;
  }
  
  // 检测 UDP 支持
  if (capabilities.platform === 'electron') {
    try {
      require('dgram');
      capabilities.udpSupport.native = true;
    } catch (error) {
      console.warn('Electron 环境下 dgram 模块不可用');
    }
  } else {
    capabilities.udpSupport.websocket = typeof WebSocket !== 'undefined';
  }
  
  console.log('🔍 环境能力检测结果:', capabilities);
  return capabilities;
}

// 导出所有示例
export default {
  serialExample,
  udpExample,
  fullExample,
  useUnifiedHardware,
  detectEnvironmentCapabilities
};