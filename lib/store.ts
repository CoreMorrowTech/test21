import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  AppState, 
  ConnectionStatus, 
  DataEntry, 
  SerialConfig, 
  UDPConfig, 
  DEFAULT_SERIAL_CONFIG, 
  DEFAULT_UDP_CONFIG,
  DataFormat,
  TabType
} from '@/types';
import { websocketClient } from './websocket-client';

interface AppStore extends AppState {
  // WebSocket连接管理
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  
  // 串口操作
  connectSerial: (config: SerialConfig) => Promise<void>;
  disconnectSerial: () => Promise<void>;
  sendSerialData: (data: string) => Promise<void>;
  updateSerialConfig: (config: Partial<SerialConfig>) => void;
  setSerialStatus: (status: ConnectionStatus) => void;
  
  // UDP操作
  connectUDP: (config: UDPConfig) => Promise<void>;
  disconnectUDP: () => Promise<void>;
  sendUDPData: (data: string) => Promise<void>;
  updateUDPConfig: (config: Partial<UDPConfig>) => void;
  setUDPStatus: (status: ConnectionStatus) => void;
  
  // 数据管理
  addDataEntry: (entry: Omit<DataEntry, 'id' | 'timestamp'>) => void;
  clearDataEntries: () => void;
  exportDataEntries: () => string;
  
  // UI状态管理
  setCurrentTab: (tab: TabType) => void;
  setDataFormat: (format: DataFormat) => void;
  toggleAutoScroll: () => void;
  
  // 错误处理
  handleError: (error: string, type?: 'serial' | 'udp') => void;
}

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    websocket: null,
    serialConfig: DEFAULT_SERIAL_CONFIG,
    serialStatus: 'disconnected',
    udpConfig: DEFAULT_UDP_CONFIG,
    udpStatus: 'disconnected',
    dataEntries: [],
    currentTab: 'serial',
    dataFormat: 'text',
    autoScroll: true,

    // WebSocket连接管理
    connectWebSocket: () => {
      const state = get();
      if (state.websocket) {
        return; // 已经连接
      }

      // 设置消息处理器
      websocketClient.setMessageHandler((message) => {
        const currentState = get();
        
        switch (message.type) {
          case 'serial-connect':
            set({ serialStatus: 'connected' });
            break;
          case 'serial-disconnect':
            set({ serialStatus: 'disconnected' });
            break;
          case 'udp-connect':
            set({ udpStatus: 'connected' });
            break;
          case 'udp-disconnect':
            set({ udpStatus: 'disconnected' });
            break;
          case 'data-receive':
            if (message.data) {
              currentState.addDataEntry({
                direction: 'received',
                data: message.data,
                format: currentState.dataFormat,
                source: message.source
              });
            }
            break;
          case 'serial-error':
            currentState.handleError(message.message || '串口错误', 'serial');
            break;
          case 'udp-error':
            currentState.handleError(message.message || 'UDP错误', 'udp');
            break;
          default:
            console.log('收到WebSocket消息:', message);
        }
      });

      // 设置错误处理器
      websocketClient.setErrorHandler((error) => {
        get().handleError(error);
      });

      // 连接WebSocket
      websocketClient.connect();
      
      // 更新状态（注意：在Vercel环境中这是模拟的WebSocket）
      set({ websocket: websocketClient as any });
    },

    disconnectWebSocket: () => {
      websocketClient.disconnect();
      set({ 
        websocket: null,
        serialStatus: 'disconnected',
        udpStatus: 'disconnected'
      });
    },

    // 串口操作
    connectSerial: async (config: SerialConfig) => {
      const state = get();
      if (!state.websocket) {
        state.connectWebSocket();
      }

      try {
        set({ serialStatus: 'connecting' });
        await websocketClient.connectSerial(config);
        set({ 
          serialConfig: config,
          serialStatus: 'connected'
        });
      } catch (error) {
        set({ serialStatus: 'error' });
        state.handleError(`串口连接失败: ${error}`, 'serial');
      }
    },

    disconnectSerial: async () => {
      try {
        await websocketClient.disconnectSerial();
        set({ serialStatus: 'disconnected' });
      } catch (error) {
        get().handleError(`串口断开失败: ${error}`, 'serial');
      }
    },

    sendSerialData: async (data: string) => {
      const state = get();
      if (state.serialStatus !== 'connected') {
        state.handleError('串口未连接', 'serial');
        return;
      }

      try {
        await websocketClient.sendSerialData(data);
        state.addDataEntry({
          direction: 'sent',
          data,
          format: state.dataFormat
        });
      } catch (error) {
        state.handleError(`发送串口数据失败: ${error}`, 'serial');
      }
    },

    updateSerialConfig: (config: Partial<SerialConfig>) => {
      set(state => ({
        serialConfig: { ...state.serialConfig, ...config }
      }));
    },

    setSerialStatus: (status: ConnectionStatus) => {
      set({ serialStatus: status });
    },

    // UDP操作
    connectUDP: async (config: UDPConfig) => {
      const state = get();
      if (!state.websocket) {
        state.connectWebSocket();
      }

      try {
        set({ udpStatus: 'connecting' });
        await websocketClient.connectUDP(config);
        set({ 
          udpConfig: config,
          udpStatus: 'connected'
        });
      } catch (error) {
        set({ udpStatus: 'error' });
        state.handleError(`UDP连接失败: ${error}`, 'udp');
      }
    },

    disconnectUDP: async () => {
      try {
        await websocketClient.disconnectUDP();
        set({ udpStatus: 'disconnected' });
      } catch (error) {
        get().handleError(`UDP断开失败: ${error}`, 'udp');
      }
    },

    sendUDPData: async (data: string) => {
      const state = get();
      if (state.udpStatus !== 'connected') {
        state.handleError('UDP未连接', 'udp');
        return;
      }

      try {
        await websocketClient.sendUDPData(data, state.udpConfig);
        state.addDataEntry({
          direction: 'sent',
          data,
          format: state.dataFormat,
          source: `${state.udpConfig.targetHost}:${state.udpConfig.targetPort}`
        });
      } catch (error) {
        state.handleError(`发送UDP数据失败: ${error}`, 'udp');
      }
    },

    updateUDPConfig: (config: Partial<UDPConfig>) => {
      set(state => ({
        udpConfig: { ...state.udpConfig, ...config }
      }));
    },

    setUDPStatus: (status: ConnectionStatus) => {
      set({ udpStatus: status });
    },

    // 数据管理
    addDataEntry: (entry: Omit<DataEntry, 'id' | 'timestamp'>) => {
      const newEntry: DataEntry = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        timestamp: new Date()
      };

      set(state => ({
        dataEntries: [...state.dataEntries, newEntry]
      }));
    },

    clearDataEntries: () => {
      set({ dataEntries: [] });
    },

    exportDataEntries: () => {
      const state = get();
      const exportData = state.dataEntries.map(entry => ({
        时间: entry.timestamp.toLocaleString('zh-CN'),
        方向: entry.direction === 'sent' ? '发送' : '接收',
        数据: entry.data,
        格式: entry.format === 'text' ? '文本' : '十六进制',
        来源: entry.source || ''
      }));

      return JSON.stringify(exportData, null, 2);
    },

    // UI状态管理
    setCurrentTab: (tab: TabType) => {
      set({ currentTab: tab });
    },

    setDataFormat: (format: DataFormat) => {
      set({ dataFormat: format });
    },

    toggleAutoScroll: () => {
      set(state => ({ autoScroll: !state.autoScroll }));
    },

    // 错误处理
    handleError: (error: string, type?: 'serial' | 'udp') => {
      console.error(`${type ? `[${type.toUpperCase()}]` : '[ERROR]'} ${error}`);
      
      // 根据错误类型更新相应的连接状态
      if (type === 'serial') {
        set({ serialStatus: 'error' });
      } else if (type === 'udp') {
        set({ udpStatus: 'error' });
      }

      // 可以在这里添加更多错误处理逻辑，比如显示通知等
      // 目前只是记录到控制台
    }
  }))
);

// 导出选择器函数以便组件使用
export const useWebSocketStatus = () => useAppStore(state => !!state.websocket);
export const useSerialState = () => useAppStore(state => ({
  config: state.serialConfig,
  status: state.serialStatus,
  connect: state.connectSerial,
  disconnect: state.disconnectSerial,
  send: state.sendSerialData,
  updateConfig: state.updateSerialConfig
}));

export const useUDPState = () => useAppStore(state => ({
  config: state.udpConfig,
  status: state.udpStatus,
  connect: state.connectUDP,
  disconnect: state.disconnectUDP,
  send: state.sendUDPData,
  updateConfig: state.updateUDPConfig
}));

export const useDataState = () => useAppStore(state => ({
  entries: state.dataEntries,
  format: state.dataFormat,
  autoScroll: state.autoScroll,
  add: state.addDataEntry,
  clear: state.clearDataEntries,
  export: state.exportDataEntries,
  setFormat: state.setDataFormat,
  toggleAutoScroll: state.toggleAutoScroll
}));

export const useUIState = () => useAppStore(state => ({
  currentTab: state.currentTab,
  setCurrentTab: state.setCurrentTab
}));