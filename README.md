# Serial UDP Debugger

一款基于 Electron 和 Next.js 构建的串口和UDP调试工具，支持桌面应用和Web应用两种部署方式。

## 功能特点

- 🔌 串口通信支持（支持多种波特率和配置）
- 🌐 UDP 网络通信
- 💻 现代化的用户界面
- 🚀 跨平台支持 (Windows, macOS, Linux)
- 🌍 Web 版本支持（浏览器访问）
- 📦 Docker 容器化部署
- ⚡ 实时数据监控和调试

## 开发环境设置

### 前置条件

- Node.js (推荐 v18+)
- npm 或 yarn

### 安装依赖

```bash
npm install
# 或
yarn
```

### 开发模式运行

```bash
npm run dev
# 或
yarn dev
```

这将同时启动 Next.js 服务器和 Electron 应用程序。

## 快速部署

### 使用构建脚本（推荐）

```bash
# 构建 Web 版本（用于服务器部署）
node build.js web

# 打包 Windows EXE 文件
node build.js exe

# 构建 Docker 镜像
node build.js docker

# 构建所有平台版本
node build.js all
```

### 手动构建

#### 1. Web 版本部署
```bash
# 构建 Web 版本
npm run build:web
npm start

# 或使用 Docker
docker build -t serial-udp-debugger .
docker run -p 3000:3000 serial-udp-debugger
```

#### 2. 桌面应用打包

**打包前准备：**
确保在 `assets` 目录中添加了必要的图标文件：
- icon.ico (Windows)
- icon.icns (macOS) 
- icon.png (Linux)

```bash
# 仅打包 Windows 版本
npm run dist:win

# 打包所有平台版本
npm run dist
```

打包后的应用将存放在 `dist` 目录中。

#### 3. Docker 部署
```bash
# 使用 docker-compose（推荐）
docker-compose up -d

# 或单独运行
docker build -t serial-udp-debugger .
docker run -d -p 3000:3000 --name serial-debugger serial-udp-debugger
```

## 版本差异

| 功能 | Electron 版本 | Web 版本 |
|------|---------------|----------|
| 串口支持 | ✅ 完整支持 | ⚠️ 需要 Web Serial API |
| UDP 通信 | ✅ 原生支持 | ⚠️ WebSocket 模拟 |
| 文件访问 | ✅ 完整支持 | ❌ 受限 |
| 离线使用 | ✅ 支持 | ❌ 需要网络 |
| 跨平台访问 | ❌ 需要安装 | ✅ 浏览器访问 |

**浏览器兼容性：** Web 版本的串口功能需要 Chrome 89+ 或 Edge 89+

## 项目结构

```
├── app/                   # Next.js 应用目录
├── assets/                # 应用资源文件(图标等)
├── components/            # React 组件
├── main.js                # Electron 主进程
├── next.config.js         # Next.js 配置
├── package.json           # 项目配置和依赖
├── preload.js             # Electron 预加载脚本
└── ...
```

## 技术栈

- Next.js - React 框架
- Electron - 桌面应用框架
- TailwindCSS - 样式工具
- SerialPort - 串口通信库
- WebSockets - 网络通信
