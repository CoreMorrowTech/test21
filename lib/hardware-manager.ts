import { SerialConfig, UDPConfig, SerialPortInfo } from '@/types';
import { unifiedHardware } from './unified-hardware';

export class HardwareManager {
  private onSerialData?: (data: string) => void;
  private onUDPData?: (data: string, source: string) => void;
  private onError?: (error: string, type: 'serial' | 'udp') => void;

  // 设置数据接收回调
  setSerialDataHandler(handler: (data: string) => void) {
    this.onSerialData = handler;
  }

  setUDPDataHandler(handler: (data: string, source: string) => void) {
    this.onUDPData = handler;
  }

  setErrorHandler(handler: (error: string, type: 'serial' | 'udp') => void) {
    this.onError = handler;
  }

  // 获取可用串口列表
  async getAvailableSerialPorts(): Promise<SerialPortInfo[]> {
    try {
      console.log('使用统一硬件接口获取串口列表');
      return await unifiedHardware.listSerialPorts();
    } catch (error) {
      console.error('获取串口列表失败:', error);
      if (this.onError) {
        this.onError(`获取串口列表失败: ${error}`, 'serial');
      }
      throw error;
    }
  }

  // 连接串口
  async connectSerial(config: SerialConfig): Promise<void> {
    console.log('使用统一硬件接口连接串口:', config);
    
    try {
      // 设置数据和错误处理回调
      unifiedHardware.onSerialData((data: string) => {
        console.log('收到串口数据:', data);
        if (this.onSerialData) {
          this.onSerialData(data);
        }
      });

      unifiedHardware.onSerialError((error: string) => {
        console.error('串口错误:', error);
        if (this.onError) {
          this.onError(error, 'serial');
        }
      });

      // 连接串口
      await unifiedHardware.connectSerial(config);
      console.log('串口连接成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('串口连接失败:', errorMessage);
      if (this.onError) {
        this.onError(`串口连接失败: ${errorMessage}`, 'serial');
      }
      throw new Error(`串口连接失败: ${errorMessage}`);
    }
  }

  // 断开串口连接
  async disconnectSerial(): Promise<void> {
    console.log('使用统一硬件接口断开串口连接');
    
    try {
      await unifiedHardware.disconnectSerial();
      console.log('串口断开成功');
    } catch (error) {
      console.error('断开串口时出错:', error);
      if (this.onError) {
        this.onError(`串口断开失败: ${error}`, 'serial');
      }
    }
  }

  // 发送串口数据
  async sendSerialData(data: string): Promise<void> {
    console.log('使用统一硬件接口发送串口数据:', data);

    try {
      await unifiedHardware.sendSerialData(data);
      console.log('数据发送成功');
    } catch (error) {
      const errorMessage = `发送串口数据失败: ${error}`;
      console.error(errorMessage);
      if (this.onError) {
        this.onError(errorMessage, 'serial');
      }
      throw new Error(errorMessage);
    }
  }

  // 连接UDP
  async connectUDP(config: UDPConfig): Promise<void> {
    console.log('使用统一硬件接口连接UDP:', config);
    
    try {
      // 设置数据和错误处理回调
      unifiedHardware.onUDPData((data: string, source: string) => {
        console.log('收到UDP数据:', data, '来源:', source);
        if (this.onUDPData) {
          this.onUDPData(data, source);
        }
      });

      unifiedHardware.onUDPError((error: string) => {
        console.error('UDP错误:', error);
        if (this.onError) {
          this.onError(error, 'udp');
        }
      });

      // 连接UDP
      await unifiedHardware.connectUDP(config);
      console.log('UDP连接成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('UDP连接失败:', errorMessage);
      if (this.onError) {
        this.onError(`UDP连接失败: ${errorMessage}`, 'udp');
      }
      throw new Error(`UDP连接失败: ${errorMessage}`);
    }
  }

  // 断开UDP连接
  async disconnectUDP(): Promise<void> {
    console.log('使用统一硬件接口断开UDP连接');
    
    try {
      await unifiedHardware.disconnectUDP();
      console.log('UDP断开成功');
    } catch (error) {
      console.error('断开UDP时出错:', error);
      if (this.onError) {
        this.onError(`UDP断开失败: ${error}`, 'udp');
      }
    }
  }

  // 发送UDP数据
  async sendUDPData(data: string, config: UDPConfig): Promise<void> {
    console.log('使用统一硬件接口发送UDP数据:', data, '目标:', `${config.targetHost}:${config.targetPort}`);

    try {
      await unifiedHardware.sendUDPData(data, config.targetHost, config.targetPort);
      console.log('UDP数据发送成功');
    } catch (error) {
      const errorMessage = `发送UDP数据失败: ${error}`;
      console.error(errorMessage);
      if (this.onError) {
        this.onError(errorMessage, 'udp');
      }
      throw new Error(errorMessage);
    }
  }

  // 获取连接状态
  getSerialStatus(): boolean {
    return unifiedHardware.isSerialConnected();
  }

  getUDPStatus(): boolean {
    return unifiedHardware.isUDPConnected();
  }

  // 清理资源
  async cleanup(): Promise<void> {
    console.log('清理硬件管理器资源');
    await Promise.all([
      this.disconnectSerial(),
      this.disconnectUDP()
    ]);
  }
}

// 创建单例实例
export const hardwareManager = new HardwareManager();