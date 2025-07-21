/**
 * 基本的Zustand store测试
 * 验证状态管理和WebSocket连接管理功能
 */

import { useAppStore } from '../store';
import { DEFAULT_SERIAL_CONFIG, DEFAULT_UDP_CONFIG } from '@/types';

// 模拟WebSocket客户端
jest.mock('../websocket-client', () => ({
  websocketClient: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    connectSerial: jest.fn().mockResolvedValue({}),
    disconnectSerial: jest.fn().mockResolvedValue({}),
    sendSerialData: jest.fn().mockResolvedValue({}),
    connectUDP: jest.fn().mockResolvedValue({}),
    disconnectUDP: jest.fn().mockResolvedValue({}),
    sendUDPData: jest.fn().mockResolvedValue({}),
    setMessageHandler: jest.fn(),
    setErrorHandler: jest.fn()
  }
}));

describe('AppStore', () => {
  beforeEach(() => {
    // 重置store状态
    useAppStore.setState({
      websocket: null,
      serialConfig: DEFAULT_SERIAL_CONFIG,
      serialStatus: 'disconnected',
      udpConfig: DEFAULT_UDP_CONFIG,
      udpStatus: 'disconnected',
      dataEntries: [],
      currentTab: 'serial',
      dataFormat: 'text',
      autoScroll: true
    });
  });

  test('初始状态应该正确', () => {
    const state = useAppStore.getState();
    
    expect(state.websocket).toBeNull();
    expect(state.serialStatus).toBe('disconnected');
    expect(state.udpStatus).toBe('disconnected');
    expect(state.dataEntries).toEqual([]);
    expect(state.currentTab).toBe('serial');
    expect(state.dataFormat).toBe('text');
    expect(state.autoScroll).toBe(true);
  });

  test('应该能够更新串口配置', () => {
    const { updateSerialConfig } = useAppStore.getState();
    
    updateSerialConfig({ baudRate: 115200 });
    
    const state = useAppStore.getState();
    expect(state.serialConfig.baudRate).toBe(115200);
    expect(state.serialConfig.dataBits).toBe(DEFAULT_SERIAL_CONFIG.dataBits);
  });

  test('应该能够更新UDP配置', () => {
    const { updateUDPConfig } = useAppStore.getState();
    
    updateUDPConfig({ targetPort: 9000 });
    
    const state = useAppStore.getState();
    expect(state.udpConfig.targetPort).toBe(9000);
    expect(state.udpConfig.localPort).toBe(DEFAULT_UDP_CONFIG.localPort);
  });

  test('应该能够添加数据条目', () => {
    const { addDataEntry } = useAppStore.getState();
    
    addDataEntry({
      direction: 'sent',
      data: 'test data',
      format: 'text'
    });
    
    const state = useAppStore.getState();
    expect(state.dataEntries).toHaveLength(1);
    expect(state.dataEntries[0].data).toBe('test data');
    expect(state.dataEntries[0].direction).toBe('sent');
    expect(state.dataEntries[0].id).toBeDefined();
    expect(state.dataEntries[0].timestamp).toBeInstanceOf(Date);
  });

  test('应该能够清空数据条目', () => {
    const { addDataEntry, clearDataEntries } = useAppStore.getState();
    
    // 先添加一些数据
    addDataEntry({ direction: 'sent', data: 'test1', format: 'text' });
    addDataEntry({ direction: 'received', data: 'test2', format: 'text' });
    
    expect(useAppStore.getState().dataEntries).toHaveLength(2);
    
    // 清空数据
    clearDataEntries();
    
    expect(useAppStore.getState().dataEntries).toHaveLength(0);
  });

  test('应该能够导出数据条目', () => {
    const { addDataEntry, exportDataEntries } = useAppStore.getState();
    
    addDataEntry({
      direction: 'sent',
      data: 'hello',
      format: 'text',
      source: 'test'
    });
    
    const exportedData = exportDataEntries();
    const parsedData = JSON.parse(exportedData);
    
    expect(parsedData).toHaveLength(1);
    expect(parsedData[0]).toHaveProperty('时间');
    expect(parsedData[0]).toHaveProperty('方向', '发送');
    expect(parsedData[0]).toHaveProperty('数据', 'hello');
    expect(parsedData[0]).toHaveProperty('格式', '文本');
    expect(parsedData[0]).toHaveProperty('来源', 'test');
  });

  test('应该能够切换当前标签页', () => {
    const { setCurrentTab } = useAppStore.getState();
    
    expect(useAppStore.getState().currentTab).toBe('serial');
    
    setCurrentTab('udp');
    
    expect(useAppStore.getState().currentTab).toBe('udp');
  });

  test('应该能够切换数据格式', () => {
    const { setDataFormat } = useAppStore.getState();
    
    expect(useAppStore.getState().dataFormat).toBe('text');
    
    setDataFormat('hex');
    
    expect(useAppStore.getState().dataFormat).toBe('hex');
  });

  test('应该能够切换自动滚动', () => {
    const { toggleAutoScroll } = useAppStore.getState();
    
    expect(useAppStore.getState().autoScroll).toBe(true);
    
    toggleAutoScroll();
    
    expect(useAppStore.getState().autoScroll).toBe(false);
    
    toggleAutoScroll();
    
    expect(useAppStore.getState().autoScroll).toBe(true);
  });

  test('应该能够处理错误', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const { handleError } = useAppStore.getState();
    
    handleError('测试错误', 'serial');
    
    expect(consoleSpy).toHaveBeenCalledWith('[SERIAL] 测试错误');
    expect(useAppStore.getState().serialStatus).toBe('error');
    
    consoleSpy.mockRestore();
  });
});