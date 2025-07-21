'use client';

import React, { useState, useEffect } from 'react';
import { SerialConfig, BAUD_RATES, ConnectionStatus, SerialPortInfo } from '@/types';
import { useSerialState } from '@/lib/store';

interface SerialDebuggerProps {
  onDataReceived: (data: string) => void;
  onStatusChange: (status: ConnectionStatus) => void;
}

export default function SerialDebugger({ onDataReceived, onStatusChange }: SerialDebuggerProps) {
  const { config, status, connect, disconnect, send, updateConfig } = useSerialState();
  const [sendData, setSendData] = useState('');
  const [sendFormat, setSendFormat] = useState<'text' | 'hex'>('text');
  const [availablePorts, setAvailablePorts] = useState<SerialPortInfo[]>([]);
  const [loadingPorts, setLoadingPorts] = useState(false);

  // 获取可用串口列表
  const fetchAvailablePorts = async () => {
    setLoadingPorts(true);
    try {
      const response = await fetch('/api/serial-ports');
      const result = await response.json();
      if (result.success) {
        setAvailablePorts(result.ports);
      } else {
        console.error('获取串口列表失败:', result.error);
        setAvailablePorts([]);
      }
    } catch (error) {
      console.error('获取串口列表失败:', error);
      setAvailablePorts([]);
    } finally {
      setLoadingPorts(false);
    }
  };

  // 组件加载时获取串口列表
  useEffect(() => {
    fetchAvailablePorts();
  }, []);

  // 监听数据接收事件
  React.useEffect(() => {
    const handleDataReceive = (data: string) => {
      onDataReceived(data);
    };

    // 这里可以添加实际的数据监听逻辑
    // 目前通过store的状态管理来处理数据接收
    return () => {
      // 清理监听器
    };
  }, [onDataReceived]);

  // 处理配置更新
  const handleConfigChange = (field: keyof SerialConfig, value: any) => {
    updateConfig({ [field]: value });
  };

  // 处理连接/断开
  const handleConnectionToggle = async () => {
    try {
      if (status === 'connected') {
        await disconnect();
        onStatusChange('disconnected');
      } else {
        await connect(config);
        onStatusChange('connected');
      }
    } catch (error) {
      console.error('串口连接操作失败:', error);
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
      console.error('发送串口数据失败:', error);
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
        <h2 className="text-xl font-semibold text-gray-800">串口调试</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.className}`}>
          {statusDisplay.text}
        </div>
      </div>

      {/* 串口配置表单 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* 串口选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            串口端口
          </label>
          <div className="flex space-x-2">
            <select
              value={config.port}
              onChange={(e) => handleConfigChange('port', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={status === 'connected' || status === 'connecting'}
            >
              <option value="">选择串口</option>
              {availablePorts.map(port => (
                <option key={port.path} value={port.path}>
                  {port.path} {port.manufacturer ? `(${port.manufacturer})` : ''}
                </option>
              ))}
            </select>
            <button
              onClick={fetchAvailablePorts}
              disabled={loadingPorts || status === 'connected' || status === 'connecting'}
              className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="刷新串口列表"
            >
              {loadingPorts ? '...' : '🔄'}
            </button>
          </div>
          {!config.port && (
            <p className="text-xs text-red-500 mt-1">请选择串口端口</p>
          )}
        </div>

        {/* 波特率 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            波特率
          </label>
          <select
            value={config.baudRate}
            onChange={(e) => handleConfigChange('baudRate', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={status === 'connected' || status === 'connecting'}
          >
            {BAUD_RATES.map(rate => (
              <option key={rate} value={rate}>{rate}</option>
            ))}
          </select>
        </div>

        {/* 数据位 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            数据位
          </label>
          <select
            value={config.dataBits}
            onChange={(e) => handleConfigChange('dataBits', parseInt(e.target.value) as 7 | 8)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={status === 'connected' || status === 'connecting'}
          >
            <option value={7}>7</option>
            <option value={8}>8</option>
          </select>
        </div>

        {/* 停止位 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            停止位
          </label>
          <select
            value={config.stopBits}
            onChange={(e) => handleConfigChange('stopBits', parseInt(e.target.value) as 1 | 2)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={status === 'connected' || status === 'connecting'}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </div>

        {/* 校验位 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            校验位
          </label>
          <select
            value={config.parity}
            onChange={(e) => handleConfigChange('parity', e.target.value as 'none' | 'even' | 'odd')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={status === 'connected' || status === 'connecting'}
          >
            <option value="none">无</option>
            <option value="even">偶校验</option>
            <option value="odd">奇校验</option>
          </select>
        </div>
      </div>

      {/* 连接控制 */}
      <div className="flex justify-center mb-6">
        <button
          onClick={handleConnectionToggle}
          disabled={status === 'connecting' || (!config.port && status !== 'connected')}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            status === 'connected'
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {status === 'connecting' ? '连接中...' : status === 'connected' ? '断开连接' : '连接串口'}
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