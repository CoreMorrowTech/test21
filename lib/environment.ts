// 环境检测工具
export const isElectron = () => {
  return typeof window !== 'undefined' && 
         window.process && 
         (window.process as any).type;
};

export const isBrowser = () => {
  return typeof window !== 'undefined' && !isElectron();
};

export const isServer = () => {
  return typeof window === 'undefined';
};

export const getEnvironment = () => {
  if (isElectron()) return 'electron';
  if (isBrowser()) return 'browser';
  if (isServer()) return 'server';
  return 'unknown';
};

// 获取基础URL
export const getBaseUrl = () => {
  if (isElectron()) {
    return '';
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
};