// 串口配置接口
export interface SerialConfig {
  port: string;
  baudRate: number;
  dataBits: 7 | 8;
  stopBits: 1 | 2;
  parity: 'none' | 'even' | 'odd';
}

export interface SerialPortInfo {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  pnpId?: string;
  locationId?: string;
  productId?: string;
  vendorId?: string;
}

// UDP配置接口
export interface UDPConfig {
  localPort: number;
  targetHost: string;
  targetPort: number;
}

// 数据条目接口
export interface DataEntry {
  id: string;
  timestamp: Date;
  direction: 'sent' | 'received';
  data: string;
  format: 'text' | 'hex';
  source?: string;
}

// 连接状态类型
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// WebSocket消息类型
export interface SerialMessage {
  type: 'serial-connect' | 'serial-disconnect' | 'serial-send' | 'serial-receive';
  config?: SerialConfig;
  data?: string;
}

export interface UDPMessage {
  type: 'udp-connect' | 'udp-disconnect' | 'udp-send' | 'udp-receive';
  config?: UDPConfig;
  data?: string;
  source?: string;
}

// 错误消息接口
export interface ErrorMessage {
  type: 'serial-error' | 'udp-error' | 'error';
  message: string;
}

// 状态消息接口
export interface StatusMessage {
  type: 'serial-connect' | 'serial-disconnect' | 'udp-connect' | 'udp-disconnect' | 'status';
  message?: string;
  status?: ConnectionStatus;
  config?: SerialConfig | UDPConfig;
  connectionType?: 'serial' | 'udp';
}

// 数据消息接口
export interface DataMessage {
  type: 'data-receive' | 'data-update';
  data: string | string[];
  timestamp?: Date;
  source?: string;
}

export type WebSocketMessage = SerialMessage | UDPMessage | ErrorMessage | StatusMessage | DataMessage;

// 应用状态接口
export interface AppState {
  // WebSocket连接
  websocket: WebSocket | null;
  
  // 串口状态
  serialConfig: SerialConfig;
  serialStatus: ConnectionStatus;
  
  // UDP状态
  udpConfig: UDPConfig;
  udpStatus: ConnectionStatus;
  
  // 数据
  dataEntries: DataEntry[];
  currentTab: 'serial' | 'udp';
  
  // UI状态
  dataFormat: 'text' | 'hex';
  autoScroll: boolean;
}

// 组件Props接口
export interface SerialDebuggerProps {
  onDataReceived: (data: string) => void;
  onStatusChange: (status: ConnectionStatus) => void;
}

export interface UDPDebuggerProps {
  onDataReceived: (data: string, source: string) => void;
  onStatusChange: (status: ConnectionStatus) => void;
}

export interface DataViewerProps {
  entries: DataEntry[];
  onClear: () => void;
  onExport: () => void;
}

// 默认配置常量
export const DEFAULT_SERIAL_CONFIG: SerialConfig = {
  port: '',
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: 'none'
};

export const DEFAULT_UDP_CONFIG: UDPConfig = {
  localPort: 8080,
  targetHost: 'localhost',
  targetPort: 8081
};

// 常用波特率选项
export const BAUD_RATES = [
  1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200
] as const;

// 数据格式类型
export type DataFormat = 'text' | 'hex';

// 标签页类型
export type TabType = 'serial' | 'udp';