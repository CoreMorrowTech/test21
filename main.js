
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

// IPC 处理程序
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
