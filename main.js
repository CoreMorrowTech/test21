
// 主进程文件
const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const serve = require('electron-serve');
const loadURL = serve({ directory: 'out' });

// 开发环境下是否使用热重载
const isDev = process.env.NODE_ENV === 'development';
const port = process.env.PORT || 3000;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
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

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
