'use client';

import React, { useState } from 'react';
import { UDPConfig, ConnectionStatus } from '@/types';
import { useUDPState } from '@/lib/store';

interface UDPDebuggerProps {
  onDataReceived: (data: string, source: string) => void;
  onStatusChange: (status: ConnectionStatus) => void;
}

export default function UDPDebugger({ onDataReceived, onStatusChange }: UDPDebuggerProps) {
  const { config, status, connect, disconnect, send, updateConfig } = useUDPState();
  const [sendData, setSendData] = useState('');
  const [sendFormat, setSendFormat] = useState<'text' | 'hex'>('text');

  // 监听数据接收事件
  React.useEffect(() => {
    const handleDataReceive = (data: string, source: string) => {
      onDataReceived(data, source);
    };

    // 这里可以添加实际的数据监听逻辑
    // 目前通过store的状态管理来处理数据接收
    return () => {
      // 清理监听器
    };
  }, [onDataReceived]);

  // 处理配置更新
  const handleConfigChange = (field: keyof UDPConfig, value: any) => {
    updateConfig({ [field]: value });
  };

  // 验证IP地址格式
  const isValidIP = (ip: string): boolean => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip) || ip === 'localhost';
  };

  // 验证端口号
  const isValidPort = (port: number): boolean => {
    return port >= 1 && port <= 65535;
  };

  // 处理连接/断开
  const handleConnectionToggle = async () => {
    // 验证配置
    if (!isValidIP(config.targetHost)) {
      alert('请输入有效的IP地址');
      return;
    }

    if (!isValidPort(config.localPort) || !isValidPort(config.targetPort)) {
      alert('端口号必须在1-65535之间');
      return;
    }

    try {
      if (status === 'connected') {
        await disconnect();
        onStatusChange('disconnected');
      } else {
        await connect(config);
        onStatusChange('connected');
      }
    } catch (error) {
      console.error('UDP连接操作失败:', error);
      onStatusChange('error');
    }
  };

  // 处理数据发送
  const handleSendData = async () => {
    if (!sendData.trim()) return;

    try {
      let dataToSend = sendData;
      
      // 如果是十六进制格式，需要转换
      if (sendFormat === 'hex') {
        // 移除空格和非十六进制字符
        const hexString = sendData.replace(/[^0-9A-Fa-f]/g, '');
        if (hexString.length % 2 !== 0) {
          alert('十六进制数据长度必须为偶数');
          return;
        }
        
        // 转换为字符串
        dataToSend = '';
        for (let i = 0; i < hexString.length; i += 2) {
          const byte = parseInt(hexString.substring(i, i + 2), 16);
          dataToSend += String.fromCharCode(byte);
        }
      }

      await send(dataToSend);
      setSendData(''); // 发送成功后清空输入框
    } catch (error) {
      console.error('发送UDP数据失败:', error);
    }
  };

  // 获取状态显示文本和样式
  const getStatusDisplay = () => {
    switch (status) {
      case 'connected':
        return { text: '已连接', className: 'text-green-600 bg-green-100' };
      case 'connecting':
        return { text: '连接中...', className: 'text-yellow-600 bg-yellow-100' };
      case 'error':
        return { text: '连接错误', className: 'text-red-600 bg-red-100' };
      default:
        return { text: '未连接', className: 'text-gray-600 bg-gray-100' };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">UDP调试</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.className}`}>
          {statusDisplay.text}
        </div>
      </div>

      {/* UDP配置表单 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* 本地端口 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            本地端口
          </label>
          <input
            type="number"
            value={config.localPort}
            onChange={(e) => handleConfigChange('localPort', parseInt(e.target.value) || 0)}
            min="1"
            max="65535"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={status === 'connected' || status === 'connecting'}
            placeholder="8080"
          />
          {!isValidPort(config.localPort) && (
            <p className="text-xs text-red-500 mt-1">端口号必须在1-65535之间</p>
          )}
        </div>

        {/* 目标主机 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            目标主机
          </label>
          <input
            type="text"
            value={config.targetHost}
            onChange={(e) => handleConfigChange('targetHost', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={status === 'connected' || status === 'connecting'}
            placeholder="localhost 或 192.168.1.100"
          />
          {!isValidIP(config.targetHost) && config.targetHost && (
            <p className="text-xs text-red-500 mt-1">请输入有效的IP地址或localhost</p>
          )}
        </div>

        {/* 目标端口 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            目标端口
          </label>
          <input
            type="number"
            value={config.targetPort}
            onChange={(e) => handleConfigChange('targetPort', parseInt(e.target.value) || 0)}
            min="1"
            max="65535"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={status === 'connected' || status === 'connecting'}
            placeholder="8081"
          />
          {!isValidPort(config.targetPort) && (
            <p className="text-xs text-red-500 mt-1">端口号必须在1-65535之间</p>
          )}
        </div>
      </div>

      {/* 连接信息显示 */}
      {status === 'connected' && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-6">
          <p className="text-sm text-blue-800">
            <span className="font-medium">连接信息:</span> 
            本地端口 {config.localPort} ↔ {config.targetHost}:{config.targetPort}
          </p>
        </div>
      )}

      {/* 连接控制 */}
      <div className="flex justify-center mb-6">
        <button
          onClick={handleConnectionToggle}
          disabled={
            status === 'connecting' || 
            !isValidIP(config.targetHost) || 
            !isValidPort(config.localPort) || 
            !isValidPort(config.targetPort)
          }
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            status === 'connected'
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {status === 'connecting' ? '连接中...' : status === 'connected' ? '断开连接' : '连接UDP'}
        </button>
      </div>

      {/* 数据发送区域 */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">数据发送</h3>
        
        {/* 发送格式选择 */}
        <div className="flex items-center space-x-4 mb-4">
          <span className="text-sm font-medium text-gray-700">发送格式:</span>
          <label className="flex items-center">
            <input
              type="radio"
              value="text"
              checked={sendFormat === 'text'}
              onChange={(e) => setSendFormat(e.target.value as 'text' | 'hex')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">文本</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="hex"
              checked={sendFormat === 'hex'}
              onChange={(e) => setSendFormat(e.target.value as 'text' | 'hex')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">十六进制</span>
          </label>
        </div>

        {/* 数据输入和发送 */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={sendData}
            onChange={(e) => setSendData(e.target.value)}
            placeholder={sendFormat === 'hex' ? '输入十六进制数据 (如: 48656C6C6F)' : '输入要发送的文本'}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={status !== 'connected'}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSendData();
              }
            }}
          />
          <button
            onClick={handleSendData}
            disabled={status !== 'connected' || !sendData.trim()}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            发送
          </button>
        </div>

        {sendFormat === 'hex' && (
          <p className="text-xs text-gray-500 mt-2">
            提示: 十六进制格式请输入偶数个字符，如 48656C6C6F 表示 "Hello"
          </p>
        )}
      </div>
    </div>
  );
}