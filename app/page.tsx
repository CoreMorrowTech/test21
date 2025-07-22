'use client';

import React, { useEffect, useState } from 'react';
import SerialDebugger from '@/components/SerialDebugger';
import UDPDebugger from '@/components/UDPDebugger';
import DataViewer from '@/components/DataViewer';
import EnvironmentInfo from '@/components/EnvironmentInfo';
import PlatformInfo from '@/components/PlatformInfo';
import { useAppStore, useUIState, useDataState, useWebSocketStatus } from '@/lib/store';
import { ConnectionStatus } from '@/types';
import { usePlatform } from '@/components/PlatformProvider';

export default function Home() {
  const { currentTab, setCurrentTab } = useUIState();
  const { entries, clear: clearData, export: exportData } = useDataState();
  const isWebSocketConnected = useWebSocketStatus();
  const connectWebSocket = useAppStore(state => state.connectWebSocket);
  const platform = usePlatform();
  
  // 连接状态管理
  const [serialStatus, setSerialStatus] = useState<ConnectionStatus>('disconnected');
  const [udpStatus, setUDPStatus] = useState<ConnectionStatus>('disconnected');

  // 初始化WebSocket连接
  useEffect(() => {
    if (!isWebSocketConnected) {
      connectWebSocket();
    }
  }, [isWebSocketConnected, connectWebSocket]);

  // 数据接收处理器
  const handleSerialDataReceived = (data: string) => {
    // 数据接收已通过store自动处理
    console.log('串口数据接收:', data);
  };

  const handleUDPDataReceived = (data: string, source: string) => {
    // 数据接收已通过store自动处理
    console.log('UDP数据接收:', data, '来源:', source);
  };

  // 状态变化处理器
  const handleSerialStatusChange = (status: ConnectionStatus) => {
    setSerialStatus(status);
  };

  const handleUDPStatusChange = (status: ConnectionStatus) => {
    setUDPStatus(status);
  };

  // 导出数据处理
  const handleExportData = async () => {
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        platform: platform.platform,
        totalEntries: entries.length,
        entries: entries.map(entry => ({
          timestamp: entry.timestamp,
          type: entry.type,
          direction: entry.direction,
          data: entry.data,
          source: entry.source
        }))
      };

      const content = JSON.stringify(exportData, null, 2);
      const filename = `debug-data-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      
      await platform.actions.saveFile(filename, content);
      platform.actions.showNotification('导出成功', `数据已保存为 ${filename}`);
    } catch (error) {
      console.error('导出数据失败:', error);
      platform.actions.showNotification('导出失败', '无法保存数据文件');
    }
  };

  // 获取连接状态指示器
  const getConnectionIndicator = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return { color: 'bg-green-500', text: '已连接' };
      case 'connecting':
        return { color: 'bg-yellow-500 animate-pulse', text: '连接中' };
      case 'error':
        return { color: 'bg-red-500', text: '错误' };
      default:
        return { color: 'bg-gray-400', text: '未连接' };
    }
  };

  const serialIndicator = getConnectionIndicator(serialStatus);
  const udpIndicator = getConnectionIndicator(udpStatus);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 标题和Logo */}
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🔧</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">串口UDP调试助手</h1>
                <PlatformInfo platform={platform} />
              </div>
            </div>

            {/* 连接状态指示器 - 响应式优化 */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${serialIndicator.color}`}></div>
                <span className="text-sm text-gray-600">串口: {serialIndicator.text}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${udpIndicator.color}`}></div>
                <span className="text-sm text-gray-600">UDP: {udpIndicator.text}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isWebSocketConnected ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-gray-600">
                  服务: {isWebSocketConnected ? '在线' : '离线'}
                </span>
              </div>
            </div>
            
            {/* 移动端简化状态指示器 */}
            <div className="md:hidden flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${serialIndicator.color}`}></div>
              <div className={`w-3 h-3 rounded-full ${udpIndicator.color}`}></div>
              <div className={`w-3 h-3 rounded-full ${isWebSocketConnected ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* 功能切换导航 - 增强版 */}
        <div className="mb-6">
          <nav className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 bg-white rounded-lg p-1 shadow-sm border">
            <button
              onClick={() => setCurrentTab('serial')}
              className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                currentTab === 'serial'
                  ? 'bg-blue-500 text-white shadow-md transform scale-[1.02]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm'
              }`}
            >
              <span className="mr-2 text-lg">🔌</span>
              <div className="flex flex-col items-start">
                <span>串口调试</span>
                <span className="text-xs opacity-75">
                  {serialStatus === 'connected' ? '已连接' : '未连接'}
                </span>
              </div>
              {serialStatus === 'connected' && (
                <span className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              )}
            </button>
            <button
              onClick={() => setCurrentTab('udp')}
              className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                currentTab === 'udp'
                  ? 'bg-blue-500 text-white shadow-md transform scale-[1.02]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm'
              }`}
            >
              <span className="mr-2 text-lg">🌐</span>
              <div className="flex flex-col items-start">
                <span>UDP调试</span>
                <span className="text-xs opacity-75">
                  {udpStatus === 'connected' ? '已连接' : '未连接'}
                </span>
              </div>
              {udpStatus === 'connected' && (
                <span className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              )}
            </button>
          </nav>
          
          {/* 快速操作提示 */}
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-500">
              💡 提示: 点击上方标签页切换调试模式，支持同时监控串口和UDP数据
            </p>
          </div>
        </div>

        {/* 响应式布局容器 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* 左侧调试面板 - 在移动端占满宽度，桌面端占2/3 */}
          <div className="lg:col-span-2 order-1 lg:order-1">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {currentTab === 'serial' ? (
                <SerialDebugger
                  onDataReceived={handleSerialDataReceived}
                  onStatusChange={handleSerialStatusChange}
                />
              ) : (
                <UDPDebugger
                  onDataReceived={handleUDPDataReceived}
                  onStatusChange={handleUDPStatusChange}
                />
              )}
            </div>
          </div>

          {/* 右侧数据显示面板 - 在移动端占满宽度，桌面端占1/3 */}
          <div className="lg:col-span-1 order-2 lg:order-2">
            <div className="h-[500px] sm:h-[600px] lg:h-[700px]">
              <DataViewer
                entries={entries}
                onClear={clearData}
                onExport={handleExportData}
              />
            </div>
          </div>
        </div>

        {/* 移动端优化：数据统计卡片 */}
        <div className="mt-6 lg:hidden">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border text-center">
              <div className="text-2xl font-bold text-blue-600">
                {entries.filter(e => e.direction === 'sent').length}
              </div>
              <div className="text-sm text-gray-600">已发送</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border text-center">
              <div className="text-2xl font-bold text-green-600">
                {entries.filter(e => e.direction === 'received').length}
              </div>
              <div className="text-sm text-gray-600">已接收</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border text-center">
              <div className="text-2xl font-bold text-gray-600">
                {entries.length}
              </div>
              <div className="text-sm text-gray-600">总计</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border text-center">
              <div className="text-2xl font-bold text-purple-600">
                {currentTab === 'serial' ? '串口' : 'UDP'}
              </div>
              <div className="text-sm text-gray-600">当前模式</div>
            </div>
          </div>
        </div>

        {/* 环境信息面板 */}
        <div className="mt-6">
          <EnvironmentInfo />
        </div>
      </main>

      {/* 底部信息栏 */}
      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>© 2024 串口UDP调试助手</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">基于 Next.js 构建</span>
            </div>
            <div className="flex items-center space-x-4 mt-2 sm:mt-0">
              <span>数据条目: {entries.length}</span>
              <span>•</span>
              <span>当前模式: {currentTab === 'serial' ? '串口调试' : 'UDP调试'}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}