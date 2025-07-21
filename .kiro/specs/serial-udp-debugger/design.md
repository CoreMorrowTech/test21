# 设计文档

## 概述

串口UDP调试助手是一个基于Next.js的Web应用，通过云端WebSocket服务同时处理串口通信和UDP通信。应用采用React TypeScript开发，完全部署在Vercel云端平台，无需本地服务。

## 架构

### 技术栈
- **前端框架**: Next.js 14 + React 18
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **部署**: Vercel

### 系统架构
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   浏览器客户端   │    │ Vercel云端应用    │    │   外部设备/网络  │
│                │    │                  │    │                │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ React组件   │ │◄──►│ │ Next.js API  │ │◄──►│ │ 串口设备     │ │
│ └─────────────┘ │    │ │ Routes       │ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ └──────────────┘ │    │ ┌─────────────┐ │
│ │ WebSocket   │ │◄──►│ ┌──────────────┐ │◄──►│ │ UDP服务器   │ │
│ │ 客户端      │ │    │ │ WebSocket    │ │    │ └─────────────┘ │
│ └─────────────┘ │    │ │ 服务端       │ │    │                │
│                │    │ └──────────────┘ │    │                │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 组件和接口

### 核心组件

#### 1. 串口调试组件 (SerialDebugger)
```typescript
interface SerialConfig {
  baudRate: number;
  dataBits: 7 | 8;
  stopBits: 1 | 2;
  parity: 'none' | 'even' | 'odd';
}

interface SerialDebuggerProps {
  onDataReceived: (data: string) => void;
  onStatusChange: (status: 'connected' | 'disconnected' | 'error') => void;
}
```

#### 2. UDP调试组件 (UDPDebugger)
```typescript
interface UDPConfig {
  localPort: number;
  targetHost: string;
  targetPort: number;
}

interface UDPDebuggerProps {
  onDataReceived: (data: string, source: string) => void;
  onStatusChange: (status: 'connected' | 'disconnected' | 'error') => void;
}
```

#### 3. 数据显示组件 (DataViewer)
```typescript
interface DataEntry {
  id: string;
  timestamp: Date;
  direction: 'sent' | 'received';
  data: string;
  format: 'text' | 'hex';
  source?: string;
}

interface DataViewerProps {
  entries: DataEntry[];
  onClear: () => void;
  onExport: () => void;
}
```

### API接口

#### WebSocket API (用于串口和UDP通信)
```typescript
// /api/websocket
interface SerialMessage {
  type: 'serial-connect' | 'serial-disconnect' | 'serial-send' | 'serial-receive';
  config?: SerialConfig;
  data?: string;
}

interface UDPMessage {
  type: 'udp-connect' | 'udp-disconnect' | 'udp-send' | 'udp-receive';
  config?: UDPConfig;
  data?: string;
  source?: string;
}

type WebSocketMessage = SerialMessage | UDPMessage;
```

## 数据模型

### 应用状态
```typescript
interface AppState {
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

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
```

## 错误处理

### 串口错误处理
- 设备不可用：显示"串口设备不可用"
- 连接失败：显示"连接失败，请检查设备"
- 数据传输错误：显示"数据传输异常"
- WebSocket连接断开：自动重连机制

### UDP错误处理
- 网络连接失败：显示"网络连接失败"
- 端口占用：显示"端口已被占用"
- 数据格式错误：显示"数据格式不正确"
- WebSocket连接断开：自动重连机制

## 测试策略

### 单元测试
- 数据格式转换函数测试
- 组件渲染测试
- 状态管理测试

### 集成测试
- 串口连接流程测试
- UDP通信流程测试
- 数据收发测试

### 端到端测试
- 完整用户操作流程
- 多设备兼容性测试
- 错误场景处理测试