'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { PlatformAdapter, platform } from '@/lib/platform';

interface PlatformContextType {
  platform: 'electron' | 'web';
  features: {
    canSaveFile: boolean;
    canShowNotification: boolean;
    canControlWindow: boolean;
    hasNativeSerial: boolean;
    hasWebSerial: boolean;
    hasNativeUDP: boolean;
  };
  actions: {
    saveFile: (filename: string, content: string) => Promise<void>;
    showNotification: (title: string, body: string) => void;
    minimizeWindow: () => void;
    closeWindow: () => void;
    getAppInfo: () => { name: string; version: string; platform: string };
  };
}

const PlatformContext = createContext<PlatformContextType | null>(null);

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const [platformFeatures, setPlatformFeatures] = useState<PlatformContextType>({
    platform: 'web', // 默认为 web，避免服务端渲染不匹配
    features: {
      canSaveFile: true,
      canShowNotification: false,
      canControlWindow: false,
      hasNativeSerial: false,
      hasWebSerial: false,
      hasNativeUDP: false
    },
    actions: {
      saveFile: PlatformAdapter.saveFile,
      showNotification: PlatformAdapter.showNotification,
      minimizeWindow: PlatformAdapter.minimizeWindow,
      closeWindow: PlatformAdapter.closeWindow,
      getAppInfo: PlatformAdapter.getAppInfo
    }
  });

  useEffect(() => {
    // 只在客户端执行平台检测
    setIsClient(true);
    
    const detectedPlatform = (typeof window !== 'undefined' && (window as any).require) ? 'electron' : 'web';
    const hasWebSerial = typeof navigator !== 'undefined' && 'serial' in navigator;
    const hasNotification = typeof window !== 'undefined' && 'Notification' in window;
    
    setPlatformFeatures({
      platform: detectedPlatform,
      features: {
        canSaveFile: true,
        canShowNotification: detectedPlatform === 'electron' || hasNotification,
        canControlWindow: detectedPlatform === 'electron',
        hasNativeSerial: detectedPlatform === 'electron',
        hasWebSerial: detectedPlatform === 'web' && hasWebSerial,
        hasNativeUDP: detectedPlatform === 'electron'
      },
      actions: {
        saveFile: PlatformAdapter.saveFile,
        showNotification: PlatformAdapter.showNotification,
        minimizeWindow: PlatformAdapter.minimizeWindow,
        closeWindow: PlatformAdapter.closeWindow,
        getAppInfo: PlatformAdapter.getAppInfo
      }
    });
  }, []);

  // 在服务端渲染期间显示加载状态，避免水合错误
  if (!isClient) {
    return (
      <PlatformContext.Provider value={platformFeatures}>
        {children}
      </PlatformContext.Provider>
    );
  }

  return (
    <PlatformContext.Provider value={platformFeatures}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
}