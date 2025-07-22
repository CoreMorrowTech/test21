'use client';

import React, { useState, useEffect } from 'react';

interface PlatformInfoProps {
  platform: {
    platform: 'electron' | 'web';
    features: {
      hasNativeSerial: boolean;
      hasWebSerial: boolean;
      hasNativeUDP: boolean;
    };
  };
}

export default function PlatformInfo({ platform }: PlatformInfoProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 在服务端渲染期间显示静态内容，避免水合错误
  if (!isClient) {
    return (
      <p className="text-xs text-gray-500">
        通信调试工具
      </p>
    );
  }

  // 客户端渲染时显示动态平台信息
  return (
    <p className="text-xs text-gray-500">
      {platform.platform === 'electron' ? 'Electron桌面版' : 'Web浏览器版'}
      {platform.features.hasNativeSerial && ' • 原生串口'}
      {platform.features.hasWebSerial && ' • Web串口'}
      {platform.features.hasNativeUDP && ' • 原生UDP'}
    </p>
  );
}