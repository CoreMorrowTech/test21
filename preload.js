// Electron preload script
const { contextBridge, ipcRenderer } = require('electron');

// 在渲染进程中暴露Electron API
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  versions: process.versions,
  
  // 应用信息
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // 文件操作
  saveFile: (filename, content) => ipcRenderer.invoke('save-file', { filename, content }),
  
  // 通知
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', { title, body }),
  
  // 窗口控制
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  closeWindow: () => ipcRenderer.invoke('window-close')
});

// 确保window.process可用（用于环境检测）
window.process = process;