/**
 * 环境检测和配置
 * 统一处理不同运行环境的差异
 */

export type RuntimeEnvironment = 'electron' | 'web' | 'server';

// 检测当前运行环境
export function detectEnvironment(): RuntimeEnvironment {
  // 服务端环境
  if (typeof window === 'undefined') {
    return 'server';
  }
  
  // Electron 环境检测
  if (typeof window !== 'undefined' && (window as any).require) {
    return 'electron';
  }
  
  // Web 浏览器环境
  return 'web';
}

export const currentEnvironment = detectEnvironment();

// 便捷的环境检测函数
export const isElectron = () => currentEnvironment === 'electron';
export const isWeb = () => currentEnvironment === 'web';
export const isServer = () => currentEnvironment === 'server';

// 环境特性检测
export const features = {
  // 串口支持
  hasNodeSerial: isElectron() || isServer(),
  hasWebSerial: isWeb() && typeof navigator !== 'undefined' && 'serial' in navigator,
  
  // UDP支持
  hasNodeUDP: isElectron() || isServer(),
  hasWebSocket: typeof WebSocket !== 'undefined',
  
  // 文件系统支持
  hasFileSystem: isElectron() || isServer(),
  hasFileDownload: isWeb(),
  
  // 通知支持
  hasNativeNotification: isElectron(),
  hasWebNotification: isWeb() && typeof Notification !== 'undefined',
  
  // 窗口控制
  hasWindowControl: isElectron()
};

// 获取环境信息
export function getEnvironmentInfo() {
  return {
    environment: currentEnvironment,
    features,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    platform: typeof process !== 'undefined' ? process.platform : 'unknown',
    nodeVersion: typeof process !== 'undefined' ? process.version : 'N/A'
  };
}

// 日志环境信息
console.log('🔍 环境检测结果:', getEnvironmentInfo());