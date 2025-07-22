import { SerialConfig, UDPConfig, SerialPortInfo } from '@/types';
import { isElectron } from './environment';

// 动态导入串口模块
let SerialPort: any = null;
let ReadlineParser: any = null;
let dgram: any = null;

// 环境检测
const isServerSide = typeof window === 'undefined';
const isElectronEnv = isElectron();
const isBrowserEnv = typeof window !== 'undefined' && !isElectronEnv;

console.log('环境检测结果:', {
  isServerSide,
  isElectronEnv,
  isBrowserEnv,
  platform: typeof process !== 'undefined' ? process.platform : 'unknown',
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
});

// 在服务端或Electron环境下尝试加载串口模块
if (isServerSide || isElectronEnv) {
  try {
    console.log('正在加载串口模块...');
    const serialport = require('serialport');
    SerialPort = serialport.SerialPort;
    ReadlineParser = require('@serialport/parser-readline').ReadlineParser;
    dgram = require('dgram');
    console.log('✓ 串口模块加载成功');
  } catch (error) {
    console.error('✗ 串口模块加载失败:', error);
    console.warn('将在浏览器模式下运行');
  }
} else {
  console.log('浏览器环境，将使用Web Serial API（如果支持）');
}

export class HardwareManager {
  private serialPort: any = null;
  private udpSocket: any = null;
  private serialParser: any = null;
  private webSocket: WebSocket | null = null;
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
    // 如果串口模块已加载，直接使用
    if (SerialPort) {
      try {
        console.log('使用Node.js串口模块获取端口列表');
        const ports = await SerialPort.list();
        return ports.map((port: any) => ({
          path: port.path,
          manufacturer: port.manufacturer,
          serialNumber: port.serialNumber,
          pnpId: port.pnpId,
          locationId: port.locationId,
          productId: port.productId,
          vendorId: port.vendorId
        }));
      } catch (error) {
        console.error('获取串口列表失败:', error);
        if (this.onError) {
          this.onError(`获取串口列表失败: ${error}`, 'serial');
        }
        throw error;
      }
    }

    // 浏览器环境下的处理
    if (isBrowserEnv && 'serial' in navigator) {
      try {
        console.log('使用Web Serial API获取端口列表');
        const ports = await (navigator as any).serial.getPorts();
        return ports.map((port: any, index: number) => ({
          path: `WebSerial-${index}`,
          manufacturer: 'Web Serial',
          serialNumber: undefined,
          pnpId: undefined,
          locationId: undefined,
          productId: undefined,
          vendorId: undefined
        }));
      } catch (error) {
        console.warn('Web Serial API 不可用:', error);
        return [];
      }
    }

    // 如果都不可用，返回空数组
    console.warn('无可用的串口接口');
    return [];
  }

  // 连接串口
  async connectSerial(config: SerialConfig): Promise<void> {
    console.log('尝试连接串口:', config);
    
    // 先断开现有连接
    if (this.serialPort) {
      await this.disconnectSerial();
    }

    if (!config.port) {
      throw new Error('请选择串口');
    }

    // 如果串口模块已加载，使用Node.js串口
    if (SerialPort) {
      console.log('使用Node.js串口模块连接');
      try {
        this.serialPort = new SerialPort({
          path: config.port,
          baudRate: config.baudRate,
          dataBits: config.dataBits,
          stopBits: config.stopBits,
          parity: config.parity,
          autoOpen: false
        });

        // 设置错误处理
        this.serialPort.on('error', (error: any) => {
          console.error('串口错误:', error);
          if (this.onError) {
            this.onError(`串口错误: ${error.message}`, 'serial');
          }
        });

        // 打开串口
        await new Promise<void>((resolve, reject) => {
          this.serialPort.open((error: any) => {
            if (error) {
              reject(new Error(`串口打开失败: ${error.message}`));
            } else {
              console.log('串口打开成功');
              resolve();
            }
          });
        });

        // 创建数据解析器
        this.serialParser = this.serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

        // 设置数据接收处理
        this.serialParser.on('data', (data: string) => {
          console.log('收到串口数据:', data);
          if (this.onSerialData) {
            this.onSerialData(data);
          }
        });

        console.log('串口连接成功');
        return;
      } catch (error) {
        // 清理资源
        if (this.serialPort) {
          try {
            if (this.serialPort.removeAllListeners) {
              this.serialPort.removeAllListeners();
            }
            if (this.serialPort.isOpen) {
              this.serialPort.close();
            }
          } catch (cleanupError) {
            console.warn('清理串口资源时出错:', cleanupError);
          }
          this.serialPort = null;
        }
        this.serialParser = null;
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('串口连接失败:', errorMessage);
        if (this.onError) {
          this.onError(`串口连接失败: ${errorMessage}`, 'serial');
        }
        throw new Error(`串口连接失败: ${errorMessage}`);
      }
    }

    // 浏览器环境下使用 Web Serial API
    if (isBrowserEnv && 'serial' in navigator) {
      console.log('使用Web Serial API连接');
      try {
        const port = await (navigator as any).serial.requestPort();
        await port.open({ 
          baudRate: config.baudRate,
          dataBits: config.dataBits,
          stopBits: config.stopBits,
          parity: config.parity === 'none' ? 'none' : config.parity
        });
        
        this.serialPort = port;
        
        // 设置数据读取
        const reader = port.readable.getReader();
        const readLoop = async () => {
          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              
              const data = new TextDecoder().decode(value);
              console.log('收到Web Serial数据:', data);
              if (this.onSerialData) {
                this.onSerialData(data);
              }
            }
          } catch (error) {
            console.error('Web Serial读取错误:', error);
          }
        };
        readLoop();
        
        console.log('Web Serial连接成功');
        return;
      } catch (error) {
        const errorMessage = `Web Serial 连接失败: ${error}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
    }

    // 如果没有可用的串口接口
    throw new Error('无可用的串口接口，请确保在支持的环境中运行');
  }

  // 断开串口连接
  async disconnectSerial(): Promise<void> {
    console.log('断开串口连接');
    
    if (!this.serialPort) {
      return;
    }

    try {
      // Node.js串口
      if (this.serialPort.isOpen !== undefined) {
        if (this.serialPort.isOpen) {
          await new Promise<void>((resolve, reject) => {
            this.serialPort.close((error: any) => {
              if (error) {
                console.error('串口断开失败:', error);
                reject(error);
              } else {
                console.log('串口断开成功');
                resolve();
              }
            });
          });
        }
      }
      // Web Serial API
      else if (this.serialPort.close) {
        await this.serialPort.close();
        console.log('Web Serial断开成功');
      }
    } catch (error) {
      console.error('断开串口时出错:', error);
      if (this.onError) {
        this.onError(`串口断开失败: ${error}`, 'serial');
      }
    } finally {
      this.serialPort = null;
      this.serialParser = null;
    }
  }

  // 发送串口数据
  async sendSerialData(data: string): Promise<void> {
    if (!this.serialPort) {
      throw new Error('串口未连接');
    }

    console.log('发送串口数据:', data);

    try {
      // Node.js串口
      if (this.serialPort.write && this.serialPort.isOpen !== undefined) {
        if (!this.serialPort.isOpen) {
          throw new Error('串口未连接');
        }

        await new Promise<void>((resolve, reject) => {
          this.serialPort.write(data + '\r\n', (error: any) => {
            if (error) {
              console.error('发送数据失败:', error);
              reject(error);
            } else {
              console.log('数据发送成功');
              resolve();
            }
          });
        });
        return;
      }

      // Web Serial API
      if (this.serialPort.writable) {
        const writer = this.serialPort.writable.getWriter();
        const encoder = new TextEncoder();
        await writer.write(encoder.encode(data + '\r\n'));
        writer.releaseLock();
        console.log('Web Serial数据发送成功');
        return;
      }

      throw new Error('串口不可写');
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
    console.log('尝试连接UDP:', config);
    
    // 先断开现有连接
    if (this.udpSocket || this.webSocket) {
      await this.disconnectUDP();
    }

    // Node.js环境下使用dgram
    if (dgram) {
      console.log('使用Node.js dgram模块连接UDP');
      try {
        this.udpSocket = dgram.createSocket('udp4');

        // 设置数据接收处理
        this.udpSocket.on('message', (msg: any, rinfo: any) => {
          const data = msg.toString();
          const source = `${rinfo.address}:${rinfo.port}`;
          console.log('收到UDP数据:', data, '来源:', source);
          if (this.onUDPData) {
            this.onUDPData(data, source);
          }
        });

        // 设置错误处理
        this.udpSocket.on('error', (error: any) => {
          console.error('UDP错误:', error);
          if (this.onError) {
            this.onError(`UDP错误: ${error.message}`, 'udp');
          }
        });

        // 绑定本地端口
        await new Promise<void>((resolve, reject) => {
          this.udpSocket.bind(config.localPort, (error: any) => {
            if (error) {
              console.error('UDP绑定失败:', error);
              reject(error);
            } else {
              console.log('UDP绑定成功，端口:', config.localPort);
              resolve();
            }
          });
        });

        return;
      } catch (error) {
        const errorMessage = `UDP连接失败: ${error}`;
        console.error(errorMessage);
        if (this.onError) {
          this.onError(errorMessage, 'udp');
        }
        throw new Error(errorMessage);
      }
    }

    // 浏览器环境下使用WebSocket模拟UDP
    if (isBrowserEnv) {
      console.log('使用WebSocket模拟UDP连接');
      try {
        const wsUrl = `ws://localhost:${config.localPort}`;
        this.webSocket = new WebSocket(wsUrl);
        
        this.webSocket.onopen = () => {
          console.log('WebSocket UDP连接已建立');
        };
        
        this.webSocket.onmessage = (event) => {
          console.log('收到WebSocket数据:', event.data);
          if (this.onUDPData) {
            this.onUDPData(event.data, 'WebSocket');
          }
        };
        
        this.webSocket.onerror = (error) => {
          console.error('WebSocket错误:', error);
          if (this.onError) {
            this.onError(`WebSocket UDP错误: ${error}`, 'udp');
          }
        };
        
        await new Promise<void>((resolve, reject) => {
          if (!this.webSocket) {
            reject(new Error('WebSocket初始化失败'));
            return;
          }
          
          this.webSocket.onopen = () => {
            console.log('WebSocket连接成功');
            resolve();
          };
          this.webSocket.onerror = () => {
            reject(new Error('WebSocket连接失败'));
          };
        });

        return;
      } catch (error) {
        const errorMessage = `浏览器环境下UDP连接失败: ${error}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
    }

    throw new Error('无可用的UDP接口');
  }

  // 断开UDP连接
  async disconnectUDP(): Promise<void> {
    console.log('断开UDP连接');
    
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
      console.log('WebSocket连接已断开');
      return;
    }
    
    if (this.udpSocket) {
      await new Promise<void>((resolve) => {
        this.udpSocket.close(() => {
          console.log('UDP连接已断开');
          this.udpSocket = null;
          resolve();
        });
      });
    }
  }

  // 发送UDP数据
  async sendUDPData(data: string, config: UDPConfig): Promise<void> {
    console.log('发送UDP数据:', data, '目标:', `${config.targetHost}:${config.targetPort}`);

    // WebSocket方式
    if (this.webSocket) {
      if (this.webSocket.readyState === WebSocket.OPEN) {
        this.webSocket.send(data);
        console.log('WebSocket数据发送成功');
        return;
      } else {
        throw new Error('WebSocket连接未就绪');
      }
    }

    // Node.js dgram方式
    if (this.udpSocket) {
      await new Promise<void>((resolve, reject) => {
        const buffer = Buffer.from(data);
        this.udpSocket.send(buffer, config.targetPort, config.targetHost, (error: any) => {
          if (error) {
            console.error('UDP数据发送失败:', error);
            reject(error);
          } else {
            console.log('UDP数据发送成功');
            resolve();
          }
        });
      });
      return;
    }

    throw new Error('UDP未连接');
  }

  // 获取连接状态
  getSerialStatus(): boolean {
    if (!this.serialPort) {
      return false;
    }
    
    // Node.js串口
    if (this.serialPort.isOpen !== undefined) {
      return this.serialPort.isOpen;
    }
    
    // Web Serial API
    if (this.serialPort.readable !== undefined) {
      return !!this.serialPort.readable;
    }
    
    return false;
  }

  getUDPStatus(): boolean {
    return this.udpSocket !== null || this.webSocket !== null;
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