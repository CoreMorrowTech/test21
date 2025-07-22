import { SerialConfig, UDPConfig, SerialPortInfo } from '@/types';
import { isElectron } from './environment';

// 动态导入，只在 Electron 环境下加载
let SerialPort: any = null;
let ReadlineParser: any = null;
let dgram: any = null;

if (isElectron()) {
  try {
    const serialport = require('serialport');
    SerialPort = serialport.SerialPort;
    ReadlineParser = require('@serialport/parser-readline').ReadlineParser;
    dgram = require('dgram');
  } catch (error) {
    console.warn('串口模块加载失败，将使用模拟模式');
  }
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
    if (!isElectron()) {
      // 浏览器环境下返回模拟数据或通过 Web Serial API
      if ('serial' in navigator) {
        // 使用 Web Serial API (需要用户授权)
        try {
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
          console.warn('Web Serial API 不可用');
          return [];
        }
      }
      return []; // 浏览器环境下无串口支持
    }

    if (!SerialPort) {
      throw new Error('串口模块未加载');
    }

    try {
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
      if (this.onError) {
        this.onError(`获取串口列表失败: ${error}`, 'serial');
      }
      throw error;
    }
  }

  // 连接串口
  async connectSerial(config: SerialConfig): Promise<void> {
    if (this.serialPort && (this.serialPort.isOpen || this.serialPort.readable)) {
      await this.disconnectSerial();
    }

    if (!config.port) {
      throw new Error('请选择串口');
    }

    if (!isElectron()) {
      // 浏览器环境下使用 Web Serial API 或模拟连接
      if ('serial' in navigator) {
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
                if (this.onSerialData) {
                  this.onSerialData(data);
                }
              }
            } catch (error) {
              console.error('串口读取错误:', error);
            }
          };
          readLoop();
          
          return;
        } catch (error) {
          throw new Error(`Web Serial 连接失败: ${error}`);
        }
      } else {
        throw new Error('浏览器不支持串口连接，请使用 Electron 版本');
      }
    }

    if (!SerialPort) {
      throw new Error('串口模块未加载');
    }

    try {
      this.serialPort = new SerialPort({
        path: config.port,
        baudRate: config.baudRate,
        dataBits: config.dataBits,
        stopBits: config.stopBits,
        parity: config.parity,
        autoOpen: false // 手动控制打开
      });

      // 设置错误处理（在打开之前设置）
      this.serialPort.on('error', (error: any) => {
        console.error('串口错误:', error);
        if (this.onError) {
          this.onError(`串口错误: ${error.message}`, 'serial');
        }
      });

      // 等待串口打开
      await new Promise<void>((resolve, reject) => {
        if (!this.serialPort) {
          reject(new Error('串口初始化失败'));
          return;
        }

        this.serialPort.open((error: any) => {
          if (error) {
            reject(new Error(`串口打开失败: ${error.message}`));
          } else {
            resolve();
          }
        });
      });

      // 串口成功打开后创建解析器
      this.serialParser = this.serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

      // 设置数据接收处理
      this.serialParser.on('data', (data: string) => {
        if (this.onSerialData) {
          this.onSerialData(data);
        }
      });

    } catch (error) {
      // 清理资源
      if (this.serialPort) {
        if (this.serialPort.removeAllListeners) {
          this.serialPort.removeAllListeners();
        }
        if (this.serialPort.isOpen) {
          this.serialPort.close();
        }
        this.serialPort = null;
      }
      this.serialParser = null;
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (this.onError) {
        this.onError(`串口连接失败: ${errorMessage}`, 'serial');
      }
      throw new Error(`串口连接失败: ${errorMessage}`);
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

        this.serialPort.close((error: any) => {
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
    if (!this.serialPort) {
      throw new Error('串口未连接');
    }

    if (!isElectron()) {
      // 浏览器环境下使用 Web Serial API
      if (this.serialPort.writable) {
        const writer = this.serialPort.writable.getWriter();
        const encoder = new TextEncoder();
        await writer.write(encoder.encode(data + '\r\n'));
        writer.releaseLock();
        return;
      } else {
        throw new Error('串口不可写');
      }
    }

    if (!this.serialPort.isOpen) {
      throw new Error('串口未连接');
    }

    return new Promise((resolve, reject) => {
      if (!this.serialPort) {
        reject(new Error('串口未连接'));
        return;
      }

      this.serialPort.write(data + '\r\n', (error: any) => {
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
    if (this.udpSocket || this.webSocket) {
      await this.disconnectUDP();
    }

    if (!isElectron()) {
      // 浏览器环境下使用 WebSocket 模拟 UDP
      try {
        const wsUrl = `ws://localhost:${config.localPort}`;
        this.webSocket = new WebSocket(wsUrl);
        
        this.webSocket.onopen = () => {
          console.log('WebSocket UDP 连接已建立');
        };
        
        this.webSocket.onmessage = (event) => {
          if (this.onUDPData) {
            this.onUDPData(event.data, 'WebSocket');
          }
        };
        
        this.webSocket.onerror = (error) => {
          if (this.onError) {
            this.onError(`WebSocket UDP 错误: ${error}`, 'udp');
          }
        };
        
        return new Promise((resolve, reject) => {
          if (!this.webSocket) {
            reject(new Error('WebSocket 初始化失败'));
            return;
          }
          
          this.webSocket.onopen = () => resolve();
          this.webSocket.onerror = () => reject(new Error('WebSocket 连接失败'));
        });
      } catch (error) {
        throw new Error(`浏览器环境下 UDP 连接失败: ${error}`);
      }
    }

    if (!dgram) {
      throw new Error('UDP 模块未加载');
    }

    try {
      this.udpSocket = dgram.createSocket('udp4');

      // 设置数据接收处理
      this.udpSocket.on('message', (msg: any, rinfo: any) => {
        const data = msg.toString();
        const source = `${rinfo.address}:${rinfo.port}`;
        if (this.onUDPData) {
          this.onUDPData(data, source);
        }
      });

      // 设置错误处理
      this.udpSocket.on('error', (error: any) => {
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

        this.udpSocket.on('error', (error: any) => {
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
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
      return;
    }
    
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
    if (this.webSocket) {
      // 浏览器环境下通过 WebSocket 发送
      if (this.webSocket.readyState === WebSocket.OPEN) {
        this.webSocket.send(data);
        return;
      } else {
        throw new Error('WebSocket 连接未就绪');
      }
    }

    if (!this.udpSocket) {
      throw new Error('UDP未连接');
    }

    return new Promise((resolve, reject) => {
      if (!this.udpSocket) {
        reject(new Error('UDP未连接'));
        return;
      }

      const buffer = Buffer.from(data);
      this.udpSocket.send(buffer, config.targetPort, config.targetHost, (error: any) => {
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
    if (!isElectron()) {
      return this.serialPort && this.serialPort.readable;
    }
    return this.serialPort ? this.serialPort.isOpen : false;
  }

  getUDPStatus(): boolean {
    return this.udpSocket !== null || this.webSocket !== null;
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