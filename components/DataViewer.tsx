'use client';

import React, { useEffect, useRef } from 'react';
import { DataEntry, DataFormat } from '@/types';
import { useDataState } from '@/lib/store';

interface DataViewerProps {
  entries: DataEntry[];
  onClear: () => void;
  onExport: () => void;
}

// 数据格式转换工具函数
const convertToHex = (text: string): string => {
  return Array.from(text)
    .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join(' ')
    .toUpperCase();
};

const convertFromHex = (hex: string): string => {
  try {
    const hexArray = hex.replace(/\s+/g, '').match(/.{1,2}/g) || [];
    return hexArray
      .map(byte => String.fromCharCode(parseInt(byte, 16)))
      .join('');
  } catch {
    return hex; // 如果转换失败，返回原始字符串
  }
};

const formatData = (data: string, originalFormat: DataFormat, targetFormat: DataFormat): string => {
  if (originalFormat === targetFormat) {
    return data;
  }
  
  if (originalFormat === 'text' && targetFormat === 'hex') {
    return convertToHex(data);
  }
  
  if (originalFormat === 'hex' && targetFormat === 'text') {
    return convertFromHex(data);
  }
  
  return data;
};

const DataViewer: React.FC<DataViewerProps> = ({ entries, onClear, onExport }) => {
  const { format, autoScroll, setFormat, toggleAutoScroll } = useDataState();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isRecentActivity, setIsRecentActivity] = React.useState(false);
  
  // 计算统计信息
  const stats = React.useMemo(() => {
    const sent = entries.filter(e => e.direction === 'sent').length;
    const received = entries.filter(e => e.direction === 'received').length;
    const lastActivity = entries.length > 0 ? entries[entries.length - 1].timestamp : null;
    
    return { sent, received, total: entries.length, lastActivity };
  }, [entries]);

  // 监控最近活动状态
  useEffect(() => {
    if (stats.lastActivity) {
      setIsRecentActivity(true);
      const timer = setTimeout(() => {
        setIsRecentActivity(false);
      }, 3000); // 3秒后取消活动状态
      
      return () => clearTimeout(timer);
    }
  }, [stats.lastActivity]);

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, autoScroll]);

  // 导出数据到剪贴板
  const handleExport = async () => {
    try {
      const exportData = entries.map(entry => ({
        时间: entry.timestamp.toLocaleString('zh-CN'),
        方向: entry.direction === 'sent' ? '发送' : '接收',
        数据: formatData(entry.data, entry.format, format),
        格式: format === 'text' ? '文本' : '十六进制',
        来源: entry.source || ''
      }));

      const jsonString = JSON.stringify(exportData, null, 2);
      await navigator.clipboard.writeText(jsonString);
      
      // 简单的成功提示（可以后续用更好的通知组件替换）
      const button = document.getElementById('export-btn');
      if (button) {
        const originalText = button.textContent;
        button.textContent = '已复制!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
    
    onExport();
  };

  // 下载为文件
  const handleDownload = () => {
    const exportData = entries.map(entry => ({
      时间: entry.timestamp.toLocaleString('zh-CN'),
      方向: entry.direction === 'sent' ? '发送' : '接收',
      数据: formatData(entry.data, entry.format, format),
      格式: format === 'text' ? '文本' : '十六进制',
      来源: entry.source || ''
    }));

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `调试数据_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900">数据监控</h3>
          
          {/* 增强的状态指示器 */}
          <div className="flex items-center space-x-3 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">发送: {stats.sent}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">接收: {stats.received}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-gray-600">总计: {stats.total}</span>
            </div>
            {stats.lastActivity && (
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  isRecentActivity 
                    ? 'bg-yellow-500 animate-pulse' 
                    : 'bg-gray-400'
                }`}></div>
                <span className="text-gray-600">
                  活动: {isRecentActivity ? '传输中' : '空闲'}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 格式切换 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">显示格式:</span>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as DataFormat)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="text">文本</option>
              <option value="hex">十六进制</option>
            </select>
          </div>

          {/* 自动滚动切换 */}
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={toggleAutoScroll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-600">自动滚动</span>
          </label>

          {/* 操作按钮 */}
          <div className="flex space-x-2">
            <button
              id="export-btn"
              onClick={handleExport}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              复制数据
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              下载文件
            </button>
            <button
              onClick={onClear}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              清空数据
            </button>
          </div>
        </div>
      </div>

      {/* 数据列表 */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {entries.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">📡</div>
              <p>暂无数据</p>
              <p className="text-sm">开始调试后数据将显示在这里</p>
            </div>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className={`p-3 rounded-lg border-l-4 ${
                entry.direction === 'sent'
                  ? 'bg-blue-50 border-l-blue-500'
                  : 'bg-green-50 border-l-green-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      entry.direction === 'sent'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-green-100 text-green-800 border border-green-200'
                    }`}
                  >
                    {entry.direction === 'sent' ? '📤 发送' : '📥 接收'}
                  </span>
                  
                  {/* 数据大小指示器 */}
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {entry.data.length} 字节
                  </span>
                  
                  {entry.source && (
                    <span className="text-xs text-gray-500 bg-yellow-100 px-2 py-1 rounded border border-yellow-200">
                      来源: {entry.source}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    {entry.timestamp.toLocaleTimeString('zh-CN')}
                  </span>
                  {/* 实时活动指示器 */}
                  {isRecentActivity && entries[entries.length - 1]?.id === entry.id && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                  )}
                </div>
              </div>
              
              <div className="font-mono text-sm bg-white p-2 rounded border">
                <div className="break-all">
                  {formatData(entry.data, entry.format, format)}
                </div>
              </div>
              
              {entry.format !== format && (
                <div className="mt-1 text-xs text-gray-500">
                  原始格式: {entry.format === 'text' ? '文本' : '十六进制'}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 底部状态栏 */}
      {entries.length > 0 && (
        <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-500">
          最后更新: {entries[entries.length - 1]?.timestamp.toLocaleString('zh-CN')}
        </div>
      )}
    </div>
  );
};

export default DataViewer;