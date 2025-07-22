
// 主进程文件
const { app, BrowserWindow, ipcMain, dialog, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const serve = require('electron-serve');
const loadURL = serve({ directory: 'out' });

// 开发环境下是否使用热重载
const isDev = process.env.NODE_ENV === 'development';
const port = process.env.PORT || 3000;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  if (isDev) {
    // 开发环境：连接到 Next.js 服务器
    mainWindow.loadURL(`http://localhost:${port}`);
    // 打开开发者工具
    mainWindow.webContents.openDevTools();
  } else {
    // 生产环境：加载打包的应用
    loadURL(mainWindow);
  }
}

// 串口模块
let SerialPort = null;
let ReadlineParser = null;

// 尝试加载串口模块
try {
  const serialport = require('serialport');
  SerialPort = serialport.SerialPort;
  ReadlineParser = require('@serialport/parser-readline').ReadlineParser;
  console.log('✓ 串口模块加载成功');
} catch (error) {
  console.warn('⚠️ 串口模块加载失败:', error.message);
}

// 串口连接管理
let activeSerialPort = null;
let serialParser = null;

// IPC 处理程序

// 串口相关处理程序
ipcMain.handle('serial-list-ports', async () => {
  try {
    if (!SerialPort) {
      throw new Error('串口模块未加载');
    }
    
    const ports = await SerialPort.list();
    return {
      success: true,
      ports: ports.map(port => ({
        path: port.path,
        manufacturer: port.manufacturer,
        serialNumber: port.serialNumber,
        pnpId: port.pnpId,
        locationId: port.locationId,
        productId: port.productId,
        vendorId: port.vendorId
      }))
    };
  } catch (error) {
    console.error('获取串口列表失败:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('serial-connect', async (event, config) => {
  try {
    if (!SerialPort) {
      throw new Error('串口模块未加载');
    }

    // 先断开现有连接
    if (activeSerialPort) {
      await new Promise((resolve) => {
        if (activeSerialPort.isOpen) {
          activeSerialPort.close(resolve);
        } else {
          resolve();
        }
      });
      activeSerialPort = null;
      serialParser = null;
    }

    // 创建新连接
    activeSerialPort = new SerialPort({
      path: config.port,
      baudRate: config.baudRate,
      dataBits: config.dataBits,
      stopBits: config.stopBits,
      parity: config.parity
    });

    // 等待连接打开
    await new Promise((resolve, reject) => {
      activeSerialPort.open((error) => {
        if (error) {
          reject(new Error(`串口打开失败: ${error.message}`));
        } else {
          resolve();
        }
      });
    });

    // 创建数据解析器
    serialParser = activeSerialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    // 设置数据接收处理
    serialParser.on('data', (data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('serial-data-received', data.toString());
      }
    });

    // 设置错误处理
    activeSerialPort.on('error', (error) => {
      console.error('串口错误:', error);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('serial-error', error.message);
      }
    });

    return { success: true };
  } catch (error) {
    console.error('串口连接失败:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('serial-disconnect', async () => {
  try {
    if (activeSerialPort && activeSerialPort.isOpen) {
      await new Promise((resolve, reject) => {
        activeSerialPort.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }
    
    activeSerialPort = null;
    serialParser = null;
    return { success: true };
  } catch (error) {
    console.error('串口断开失败:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('serial-send', async (event, data) => {
  try {
    if (!activeSerialPort || !activeSerialPort.isOpen) {
      throw new Error('串口未连接');
    }

    await new Promise((resolve, reject) => {
      activeSerialPort.write(data + '\r\n', (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    return { success: true };
  } catch (error) {
    console.error('发送串口数据失败:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('serial-status', async () => {
  return {
    success: true,
    connected: activeSerialPort ? activeSerialPort.isOpen : false
  };
});

ipcMain.handle('save-file', async (event, { filename, content }) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: path.join(os.homedir(), 'Downloads', filename),
      filters: [
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, content);
      return { success: true };
    } else {
      return { success: false, error: 'User canceled' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('show-notification', async (event, { title, body }) => {
  try {
    const notification = new Notification({ title, body });
    notification.show();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('window-minimize', async () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('window-close', async () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle('get-app-info', async () => {
  return {
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform
  };
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
