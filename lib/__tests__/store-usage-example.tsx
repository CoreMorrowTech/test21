/**
 * 使用示例：展示如何在React组件中使用Zustand store
 * 这个文件展示了store的实际使用方法
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAppStore, useSerialState, useUDPState, useDataState, useUIState } from '../store';

// 串口调试组件示例
export const SerialDebuggerExample: React.FC = () => {
  const { config, status, connect, disconnect, send, updateConfig } = useSerialState();
  const { entries, clear } = useDataState();

  const handleConnect = async () => {
    try {
      await connect(config);
    } catch (error) {
      console.error('连接失败:', error);
    }
  };

  const handleSend = async () => {
    const data = 'Hello Serial!';
    try {
      await send(data);
    } catch (error) {
      console.error('发送失败:', error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">串口调试</h2>
      
      {/* 配置区域 */}
      <div className="mb-4">
        <label className="block mb-2">波特率:</label>
        <select 
          value={config.baudRate} 
          onChange={(e) => updateConfig({ baudRate: parseInt(e.target.value) })}
          className="border p-2 rounded"
        >
          <option value={9600}>9600</option>
          <option value={115200}>115200</option>
        </select>
      </div>

      {/* 连接控制 */}
      <div className="mb-4">
        <button 
          onClick={handleConnect}
          disabled={status === 'connecting' || status === 'connected'}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          {status === 'connecting' ? '连接中...' : '连接'}
        </button>
        
        <button 
          onClick={disconnect}
          disabled={status !== 'connected'}
          className="bg-red-500 text-white px-4 py-2 rounded mr-2"
        >
          断开
        </button>

        <span className={`px-2 py-1 rounded text-sm ${
          status === 'connected' ? 'bg-green-100 text-green-800' :
          status === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
          status === 'error' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {status === 'connected' ? '已连接' :
           status === 'connecting' ? '连接中' :
           status === 'error' ? '错误' : '未连接'}
        </span>
      </div>

      {/* 数据发送 */}
      <div className="mb-4">
        <button 
          onClick={handleSend}
          disabled={status !== 'connected'}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          发送测试数据
        </button>
      </div>

      {/* 数据显示 */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">数据记录 ({entries.length})</h3>
          <button 
            onClick={clear}
            className="bg-gray-500 text-white px-3 py-1 rounded text-sm"
          >
            清空
          </button>
        </div>
        
        <div className="border rounded max-h-64 overflow-y-auto">
          {entries.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">暂无数据</div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="p-2 border-b last:border-b-0">
                <div className="flex justify-between text-sm">
                  <span className={entry.direction === 'sent' ? 'text-blue-600' : 'text-green-600'}>
                    {entry.direction === 'sent' ? '发送' : '接收'}
                  </span>
                  <span className="text-gray-500">
                    {entry.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="font-mono text-sm mt-1">{entry.data}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// UDP调试组件示例
export const UDPDebuggerExample: React.FC = () => {
  const { config, status, connect, disconnect, send, updateConfig } = useUDPState();
  const { entries, clear } = useDataState();

  const handleConnect = async () => {
    try {
      await connect(config);
    } catch (error) {
      console.error('连接失败:', error);
    }
  };

  const handleSend = async () => {
    const data = 'Hello UDP!';
    try {
      await send(data);
    } catch (error) {
      console.error('发送失败:', error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">UDP调试</h2>
      
      {/* 配置区域 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-2">本地端口:</label>
          <input 
            type="number"
            value={config.localPort} 
            onChange={(e) => updateConfig({ localPort: parseInt(e.target.value) })}
            className="border p-2 rounded w-full"
          />
        </div>
        <div>
          <label className="block mb-2">目标主机:</label>
          <input 
            type="text"
            value={config.targetHost} 
            onChange={(e) => updateConfig({ targetHost: e.target.value })}
            className="border p-2 rounded w-full"
          />
        </div>
      </div>

      {/* 连接控制 */}
      <div className="mb-4">
        <button 
          onClick={handleConnect}
          disabled={status === 'connecting' || status === 'connected'}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          {status === 'connecting' ? '连接中...' : '连接'}
        </button>
        
        <button 
          onClick={disconnect}
          disabled={status !== 'connected'}
          className="bg-red-500 text-white px-4 py-2 rounded mr-2"
        >
          断开
        </button>

        <span className={`px-2 py-1 rounded text-sm ${
          status === 'connected' ? 'bg-green-100 text-green-800' :
          status === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
          status === 'error' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {status === 'connected' ? '已连接' :
           status === 'connecting' ? '连接中' :
           status === 'error' ? '错误' : '未连接'}
        </span>
      </div>

      {/* 数据发送 */}
      <div className="mb-4">
        <button 
          onClick={handleSend}
          disabled={status !== 'connected'}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          发送测试数据
        </button>
      </div>

      {/* 数据显示 */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">数据记录 ({entries.length})</h3>
          <button 
            onClick={clear}
            className="bg-gray-500 text-white px-3 py-1 rounded text-sm"
          >
            清空
          </button>
        </div>
        
        <div className="border rounded max-h-64 overflow-y-auto">
          {entries.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">暂无数据</div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="p-2 border-b last:border-b-0">
                <div className="flex justify-between text-sm">
                  <span className={entry.direction === 'sent' ? 'text-blue-600' : 'text-green-600'}>
                    {entry.direction === 'sent' ? '发送' : '接收'}
                  </span>
                  <span className="text-gray-500">
                    {entry.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="font-mono text-sm mt-1">{entry.data}</div>
                {entry.source && (
                  <div className="text-xs text-gray-400 mt-1">来源: {entry.source}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// 主应用组件示例
export const AppExample: React.FC = () => {
  const { currentTab, setCurrentTab } = useUIState();
  const connectWebSocket = useAppStore(state => state.connectWebSocket);
  const disconnectWebSocket = useAppStore(state => state.disconnectWebSocket);
  const websocketStatus = useAppStore(state => !!state.websocket);

  // 组件挂载时连接WebSocket
  React.useEffect(() => {
    connectWebSocket();
    
    // 组件卸载时断开连接
    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 头部 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">串口UDP调试助手</h1>
            <div className="flex items-center space-x-4">
              <span className={`px-2 py-1 rounded text-sm ${
                websocketStatus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                WebSocket {websocketStatus ? '已连接' : '未连接'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 导航标签 */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setCurrentTab('serial')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentTab === 'serial'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              串口调试
            </button>
            <button
              onClick={() => setCurrentTab('udp')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentTab === 'udp'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              UDP调试
            </button>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow">
            {currentTab === 'serial' ? <SerialDebuggerExample /> : <UDPDebuggerExample />}
          </div>
        </div>
      </main>
    </div>
  );
};

// 基本测试用例
describe('Store Usage Examples', () => {
  test('SerialDebuggerExample renders correctly', () => {
    render(<SerialDebuggerExample />);
    expect(screen.getByText('串口调试')).toBeTruthy();
    expect(screen.getByText('波特率:')).toBeTruthy();
    expect(screen.getByText('连接')).toBeTruthy();
  });

  test('UDPDebuggerExample renders correctly', () => {
    render(<UDPDebuggerExample />);
    expect(screen.getByText('UDP调试')).toBeTruthy();
    expect(screen.getByText('本地端口:')).toBeTruthy();
    expect(screen.getByText('目标主机:')).toBeTruthy();
  });

  test('AppExample renders correctly', () => {
    render(<AppExample />);
    expect(screen.getByText('串口UDP调试助手')).toBeTruthy();
    expect(screen.getAllByText('串口调试')).toHaveLength(2); // One in nav, one in content
    expect(screen.getByText('UDP调试')).toBeTruthy();
  });
});