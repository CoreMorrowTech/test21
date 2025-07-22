'use client';

import React, { useState } from 'react';
import { usePlatform } from './PlatformProvider';

export default function EnvironmentInfo() {
  const platform = usePlatform();
  const [showDetails, setShowDetails] = useState(false);
  const appInfo = platform.actions.getAppInfo();

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">
            {platform.platform === 'electron' ? '🖥️' : '🌐'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">运行环境</h3>
            <p className="text-sm text-gray-600">{appInfo.platform}</p>
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          {showDetails ? '隐藏详情' : '显示详情'}
        </button>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">应用信息</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">名称:</span>
                  <span className="font-mono">{appInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">版本:</span>
                  <span className="font-mono">{appInfo.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">平台:</span>
                  <span className="font-mono">{platform.platform}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">功能支持</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">文件保存:</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    platform.features.canSaveFile 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {platform.features.canSaveFile ? '支持' : '不支持'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">系统通知:</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    platform.features.canShowNotification 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {platform.features.canShowNotification ? '支持' : '不支持'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">原生串口:</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    platform.features.hasNativeSerial 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {platform.features.hasNativeSerial ? '支持' : 'Web API'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">UDP通信:</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    platform.features.hasNativeUDP 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {platform.features.hasNativeUDP ? '原生' : 'WebSocket'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 窗口控制按钮 (仅Electron) */}
          {platform.features.canControlWindow && (
            <div className="pt-3 border-t">
              <h4 className="font-medium text-gray-700 mb-2">窗口控制</h4>
              <div className="flex space-x-2">
                <button
                  onClick={platform.actions.minimizeWindow}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  最小化
                </button>
                <button
                  onClick={platform.actions.closeWindow}
                  className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                >
                  关闭应用
                </button>
              </div>
            </div>
          )}

          {/* 测试按钮 */}
          <div className="pt-3 border-t">
            <h4 className="font-medium text-gray-700 mb-2">功能测试</h4>
            <div className="flex space-x-2">
              <button
                onClick={() => platform.actions.showNotification('测试通知', '这是一个测试通知消息')}
                className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                disabled={!platform.features.canShowNotification}
              >
                测试通知
              </button>
              <button
                onClick={async () => {
                  try {
                    await platform.actions.saveFile('test.txt', '这是一个测试文件\n生成时间: ' + new Date().toLocaleString());
                    platform.actions.showNotification('测试成功', '测试文件已保存');
                  } catch (error) {
                    console.error('测试文件保存失败:', error);
                  }
                }}
                className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                disabled={!platform.features.canSaveFile}
              >
                测试保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}