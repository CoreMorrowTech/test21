
// preload.js
const { contextBridge, ipcRenderer } = require('electron');
const { SerialPort } = require('serialport');

// 暴露 SerialPort 功能给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取可用的串口列表
  getSerialPorts: async () => {
    try {
      return await SerialPort.list();
    } catch (error) {
      console.error('获取串口列表失败:', error);
      return [];
    }
  },

  // 其他可能需要的 API
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  receive: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  }
});
