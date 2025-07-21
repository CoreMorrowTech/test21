import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import * as dgram from 'dgram';
import { SerialConfig, UDPConfig, SerialPortInfo } from '@/types';

export class HardwareManager {
  private serialPort: SerialPort | null = null;
  private udpSocket: dgram.Socket | null = null;
  private serialParser: ReadlineParser | null = null;
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
      const ports = await SerialPort.list();
      return ports.map(port => ({
        path: port.path,
        manufacturer: port.manufacturer,
        serialNumber: port.serialNumber,
        pnpId: port.pnpId,
        locationId: port.locationId,
        productId: port.productId,
        vendorId: port.vendorId
      }));
    } catch (error) {
      if (this.onError) {
        this.onError(`获取串口列表失败: ${error}`, 'serial');
      }
      throw error;
    }
  }

  // 连接串口
  async connectSerial(config: SerialConfig): Promise<void> {
    if (this.serialPort && this.serialPort.isOpen) {
      await this.disconnectSerial();
    }

    if (!config.port) {
      throw new Error('请选择串口');
    }

    try {
      this.serialPort = new SerialPort({
        path: config.port,
        baudRate: config.baudRate,
        dataBits: config.dataBits,
        stopBits: config.stopBits,
        parity: config.parity
      });

      // 创建解析器
      this.serialParser = this.serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

      // 设置数据接收处理
      this.serialParser.on('data', (data: string) => {
        if (this.onSerialData) {
          this.onSerialData(data);
        }
      });

      // 设置错误处理
      this.serialPort.on('error', (error) => {
        if (this.onError) {
          this.onError(`串口错误: ${error.message}`, 'serial');
        }
      });

      // 等待串口打开
      return new Promise((resolve, reject) => {
        if (!this.serialPort) {
          reject(new Error('串口初始化失败'));
          return;
        }

        this.serialPort.on('open', () => {
          resolve();
        });

        this.serialPort.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      if (this.onError) {
        this.onError(`串口连接失败: ${error}`, 'serial');
      }
      throw error;
    }
  }

  // 断开串口连接
  async disconnectSerial(): Promise<void> {
    if (this.serialPort && this.serialPort.isOpen) {
      return new Promise((resolve, reject) => {
        if (!this.serialPort) {
          resolve();
          return;
        }

        this.serialPort.close((error) => {
          if (error) {
            if (this.onError) {
              this.onError(`串口断开失败: ${error.message}`, 'serial');
            }
            reject(error);
          } else {
            this.serialPort = null;
            this.serialParser = null;
            resolve();
          }
        });
      });
    }
  }

  // 发送串口数据
  async sendSerialData(data: string): Promise<void> {
    if (!this.serialPort || !this.serialPort.isOpen) {
      throw new Error('串口未连接');
    }

    return new Promise((resolve, reject) => {
      if (!this.serialPort) {
        reject(new Error('串口未连接'));
        return;
      }

      this.serialPort.write(data + '\r\n', (error) => {
        if (error) {
          if (this.onError) {
            this.onError(`发送串口数据失败: ${error.message}`, 'serial');
          }
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  // 连接UDP
  async connectUDP(config: UDPConfig): Promise<void> {
    if (this.udpSocket) {
      await this.disconnectUDP();
    }

    try {
      this.udpSocket = dgram.createSocket('udp4');

      // 设置数据接收处理
      this.udpSocket.on('message', (msg, rinfo) => {
        const data = msg.toString();
        const source = `${rinfo.address}:${rinfo.port}`;
        if (this.onUDPData) {
          this.onUDPData(data, source);
        }
      });

      // 设置错误处理
      this.udpSocket.on('error', (error) => {
        if (this.onError) {
          this.onError(`UDP错误: ${error.message}`, 'udp');
        }
      });

      // 绑定本地端口
      return new Promise((resolve, reject) => {
        if (!this.udpSocket) {
          reject(new Error('UDP套接字初始化失败'));
          return;
        }

        this.udpSocket.bind(config.localPort, () => {
          resolve();
        });

        this.udpSocket.on('error', (error) => {
          if (this.onError) {
            this.onError(`UDP绑定失败: ${error.message}`, 'udp');
          }
          reject(error);
        });
      });
    } catch (error) {
      if (this.onError) {
        this.onError(`UDP连接失败: ${error}`, 'udp');
      }
      throw error;
    }
  }

  // 断开UDP连接
  async disconnectUDP(): Promise<void> {
    if (this.udpSocket) {
      return new Promise((resolve) => {
        if (!this.udpSocket) {
          resolve();
          return;
        }

        this.udpSocket.close(() => {
          this.udpSocket = null;
          resolve();
        });
      });
    }
  }

  // 发送UDP数据
  async sendUDPData(data: string, config: UDPConfig): Promise<void> {
    if (!this.udpSocket) {
      throw new Error('UDP未连接');
    }

    return new Promise((resolve, reject) => {
      if (!this.udpSocket) {
        reject(new Error('UDP未连接'));
        return;
      }

      const buffer = Buffer.from(data);
      this.udpSocket.send(buffer, config.targetPort, config.targetHost, (error) => {
        if (error) {
          if (this.onError) {
            this.onError(`发送UDP数据失败: ${error.message}`, 'udp');
          }
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  // 获取连接状态
  getSerialStatus(): boolean {
    return this.serialPort ? this.serialPort.isOpen : false;
  }

  getUDPStatus(): boolean {
    return this.udpSocket !== null;
  }

  // 清理资源
  async cleanup(): Promise<void> {
    await Promise.all([
      this.disconnectSerial(),
      this.disconnectUDP()
    ]);
  }
}

// 创建单例实例
export const hardwareManager = new HardwareManager();