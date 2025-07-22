/**
 * 统一硬件接口
 * 为 Web 和 Electron 环境提供一致的串口和网口访问接口
 */

import { SerialConfig, UDPConfig, SerialPortInfo } from '@/types';
import { isElectron } from './environment';

export interface UnifiedSerialPort {
  connect(config: SerialConfig): Promise<void>;
  disconnect(): Promise<void>;
  send(data: string): Promise<void>;
  onData(callback: (data: string) => void): void;
  onError(callback: (error: string) => void): void;
  isConnected(): boolean;
  listPorts(): Promise<SerialPortInfo[]>;
}

export interface UnifiedUDPSocket {
  connect(config: UDPConfig): Promise<void>;
  disconnect(): Promise<void>;
  send(data: string, host: string, port: number): Promise<void>;
  onData(callback: (data: string, source: string) => void): void;
  onError(callback: (error: string) => void): void;
  isConnected(): boolean;
}

// Electron 环境的串口实现（通过 IPC）
class ElectronSerialPort implements UnifiedSerialPort {
  private connected = false;
  private dataCallback?: (data: string) => void;
  private errorCallback?: (error: string) => void;

  constructor() {
    // 设置 IPC 事件监听器
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      const electronAPI = (window as any).electronAPI;
      
      // 监听数据接收
      electronAPI.serial.onDataReceived((data: string) => {
        if (this.dataCallback) {
          this.dataCallback(data);
        }
      });

      // 监听错误
      electronAPI.serial.onError((error: string) => {
        if (this.errorCallback) {
          this.errorCallback(error);
        }
      });
    }
  }

  async connect(config: SerialConfig): Promise<void> {
    if (typeof window === 'undefined' || !(window as any).electronAPI) {
      throw new Error('Electron API 不可用');
    }

    try {
      const result = await (window as any).electronAPI.serial.connect(config);
      if (!result.success) {
        throw new Error(result.error);
      }
      this.connected = true;
    } catch (error) {
      throw new Error(`Electron 串口连接失败: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (typeof window === 'undefined' || !(window as any).electronAPI) {
      return;
    }

    try {
      const result = await (window as any).electronAPI.serial.disconnect();
      if (!result.success) {
        console.warn('串口断开警告:', result.error);
      }
    } finally {
      this.connected = false;
    }
  }

  async send(data: string): Promise<void> {
    if (typeof window === 'undefined' || !(window as any).electronAPI) {
      throw new Error('Electron API 不可用');
    }

    const result = await (window as any).electronAPI.serial.send(data);
    if (!result.success) {
      throw new Error(result.error);
    }
  }

  onData(callback: (data: string) => void): void {
    this.dataCallback = callback;
  }

  onError(callback: (error: string) => void): void {
    this.errorCallback = callback;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async listPorts(): Promise<SerialPortInfo[]> {
    if (typeof window === 'undefined' || !(window as any).electronAPI) {
      throw new Error('Electron API 不可用');
    }

    try {
      const result = await (window as any).electronAPI.serial.listPorts();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.ports;
    } catch (error) {
      throw new Error(`获取串口列表失败: ${error}`);
    }
  }
}

// Web 环境的串口实现
class WebSerialPort implements UnifiedSerialPort {
  private port: any = null;
  private reader: any = null;
  private dataCallback?: (data: string) => void;
  private errorCallback?: (error: string) => void;
  private isReading = false;

  async connect(config: SerialConfig): Promise<void> {
    if (!('serial' in navigator)) {
      throw new Error('浏览器不支持 Web Serial API');
    }

    try {
      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({
        baudRate: config.baudRate,
        dataBits: config.dataBits,
        stopBits: config.stopBits,
        parity: config.parity === 'none' ? 'none' : config.parity
      });

      // 开始读取数据
      this.startReading();
    } catch (error) {
      throw new Error(`Web Serial 连接失败: ${error}`);
    }
  }

  private async startReading(): Promise<void> {
    if (!this.port || this.isReading) return;

    this.isReading = true;
    this.reader = this.port.readable.getReader();
    const decoder = new TextDecoder();

    try {
      while (this.isReading) {
        const { value, done } = await this.reader.read();
        if (done) break;

        const data = decoder.decode(value);
        if (this.dataCallback) {
          this.dataCallback(data);
        }
      }
    } catch (error) {
      if (this.errorCallback) {
        this.errorCallback(`Web Serial 读取错误: ${error}`);
      }
    } finally {
      if (this.reader) {
        this.reader.releaseLock();
        this.reader = null;
      }
    }
  }

  async disconnect(): Promise<void> {
    this.isReading = false;
    
    if (this.reader) {
      await this.reader.cancel();
      this.reader.releaseLock();
      this.reader = null;
    }

    if (this.port) {
      await this.port.close();
      this.port = null;
    }
  }

  async send(data: string): Promise<void> {
    if (!this.port || !this.port.writable) {
      throw new Error('串口未连接或不可写');
    }

    const writer = this.port.writable.getWriter();
    const encoder = new TextEncoder();
    
    try {
      await writer.write(encoder.encode(data + '\r\n'));
    } finally {
      writer.releaseLock();
    }
  }

  onData(callback: (data: string) => void): void {
    this.dataCallback = callback;
  }

  onError(callback: (error: string) => void): void {
    this.errorCallback = callback;
  }

  isConnected(): boolean {
    return this.port && this.port.readable;
  }

  async listPorts(): Promise<SerialPortInfo[]> {
    // 检查浏览器支持
    if (!('serial' in navigator)) {
      console.warn('浏览器不支持Web Serial API');
      return [];
    }

    try {
      // 请求用户选择端口
      const port = await (navigator as any).serial.requestPort();
      if (!port) {
        console.warn('用户未选择串口设备');
        return [];
      }

      // 获取已授权端口列表
      const ports = await (navigator as any).serial.getPorts();
      
      return ports.map((port: any) => {
        // 尝试获取更多端口信息
        const info = port.getInfo();
        return {
          path: port.path || port.id || 'unknown',
          manufacturer: info.usbVendorId ? `Vendor ${info.usbVendorId}` : 'Unknown',
          serialNumber: info.usbProductId ? `Product ${info.usbProductId}` : '',
          pnpId: undefined,
          locationId: undefined,
          productId: info.usbProductId,
          vendorId: info.usbVendorId
        };
      });
    } catch (error) {
      console.error('获取串口列表时出错:', error);
      if (error instanceof DOMException && error.name === 'SecurityError') {
        console.warn('需要用户授权才能访问串口设备');
      }
      return [];
    }
  }
}

// Electron 环境的 UDP 实现
class ElectronUDPSocket implements UnifiedUDPSocket {
  private socket: any = null;
  private dataCallback?: (data: string, source: string) => void;
  private errorCallback?: (error: string) => void;

  async connect(config: UDPConfig): Promise<void> {
    try {
      const dgram = require('dgram');
      this.socket = dgram.createSocket('udp4');

      // 数据接收处理
      this.socket.on('message', (msg: any, rinfo: any) => {
        const data = msg.toString();
        const source = `${rinfo.address}:${rinfo.port}`;
        if (this.dataCallback) {
          this.dataCallback(data, source);
        }
      });

      // 错误处理
      this.socket.on('error', (error: any) => {
        if (this.errorCallback) {
          this.errorCallback(`UDP 错误: ${error.message}`);
        }
      });

      // 绑定端口
      await new Promise<void>((resolve, reject) => {
        this.socket.bind(config.localPort, (error: any) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      throw new Error(`Electron UDP 连接失败: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      await new Promise<void>((resolve) => {
        this.socket.close(() => {
          this.socket = null;
          resolve();
        });
      });
    }
  }

  async send(data: string, host: string, port: number): Promise<void> {
    if (!this.socket) {
      throw new Error('UDP 未连接');
    }

    const buffer = Buffer.from(data);
    await new Promise<void>((resolve, reject) => {
      this.socket.send(buffer, port, host, (error: any) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  onData(callback: (data: string, source: string) => void): void {
    this.dataCallback = callback;
  }

  onError(callback: (error: string) => void): void {
    this.errorCallback = callback;
  }

  isConnected(): boolean {
    return this.socket !== null;
  }
}

// Web 环境的 UDP 实现（通过 WebSocket 代理）
class WebUDPSocket implements UnifiedUDPSocket {
  private socket: WebSocket | null = null;
  private dataCallback?: (data: string, source: string) => void;
  private errorCallback?: (error: string) => void;

  async connect(config: UDPConfig): Promise<void> {
    try {
      // 连接到 WebSocket 代理服务器
      const wsUrl = `ws://localhost:${config.localPort + 1000}`; // 使用不同端口避免冲突
      this.socket = new WebSocket(wsUrl);

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'udp-data' && this.dataCallback) {
            this.dataCallback(message.data, message.source);
          }
        } catch (error) {
          console.warn('解析 WebSocket 消息失败:', error);
        }
      };

      this.socket.onerror = (error) => {
        if (this.errorCallback) {
          this.errorCallback(`WebSocket UDP 错误: ${error}`);
        }
      };

      // 等待连接建立
      await new Promise<void>((resolve, reject) => {
        if (!this.socket) {
          reject(new Error('WebSocket 初始化失败'));
          return;
        }

        this.socket.onopen = () => resolve();
        this.socket.onerror = () => reject(new Error('WebSocket 连接失败'));
      });

      // 发送配置信息
      this.socket.send(JSON.stringify({
        type: 'config',
        localPort: config.localPort
      }));
    } catch (error) {
      throw new Error(`Web UDP 连接失败: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  async send(data: string, host: string, port: number): Promise<void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket UDP 未连接');
    }

    this.socket.send(JSON.stringify({
      type: 'send',
      data,
      host,
      port
    }));
  }

  onData(callback: (data: string, source: string) => void): void {
    this.dataCallback = callback;
  }

  onError(callback: (error: string) => void): void {
    this.errorCallback = callback;
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}

// 工厂函数：根据环境创建相应的实现
export function createSerialPort(): UnifiedSerialPort {
  if (isElectron()) {
    return new ElectronSerialPort();
  } else {
    return new WebSerialPort();
  }
}

export function createUDPSocket(): UnifiedUDPSocket {
  if (isElectron()) {
    return new ElectronUDPSocket();
  } else {
    return new WebUDPSocket();
  }
}

// 统一的硬件管理器
export class UnifiedHardwareManager {
  private serialPort: UnifiedSerialPort;
  private udpSocket: UnifiedUDPSocket;

  constructor() {
    this.serialPort = createSerialPort();
    this.udpSocket = createUDPSocket();
  }

  // 串口相关方法
  async connectSerial(config: SerialConfig): Promise<void> {
    return this.serialPort.connect(config);
  }

  async disconnectSerial(): Promise<void> {
    return this.serialPort.disconnect();
  }

  async sendSerialData(data: string): Promise<void> {
    return this.serialPort.send(data);
  }

  onSerialData(callback: (data: string) => void): void {
    this.serialPort.onData(callback);
  }

  onSerialError(callback: (error: string) => void): void {
    this.serialPort.onError(callback);
  }

  isSerialConnected(): boolean {
    return this.serialPort.isConnected();
  }

  async listSerialPorts(): Promise<SerialPortInfo[]> {
    return this.serialPort.listPorts();
  }

  // UDP 相关方法
  async connectUDP(config: UDPConfig): Promise<void> {
    return this.udpSocket.connect(config);
  }

  async disconnectUDP(): Promise<void> {
    return this.udpSocket.disconnect();
  }

  async sendUDPData(data: string, host: string, port: number): Promise<void> {
    return this.udpSocket.send(data, host, port);
  }

  onUDPData(callback: (data: string, source: string) => void): void {
    this.udpSocket.onData(callback);
  }

  onUDPError(callback: (error: string) => void): void {
    this.udpSocket.onError(callback);
  }

  isUDPConnected(): boolean {
    return this.udpSocket.isConnected();
  }

  // 清理资源
  async cleanup(): Promise<void> {
    await Promise.all([
      this.serialPort.disconnect(),
      this.udpSocket.disconnect()
    ]);
  }
}

// 导出单例实例
export const unifiedHardware = new UnifiedHardwareManager();