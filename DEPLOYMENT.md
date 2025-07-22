# Serial UDP Debugger 部署指南

本项目支持多种部署方式，包括 Windows EXE 文件、Web 应用和 Docker 容器。

## 快速开始

### 使用构建脚本

我们提供了一个便捷的构建脚本，可以快速构建不同版本：

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

## 详细部署说明

### 1. Web 版本部署

Web 版本适用于服务器部署，用户可以通过浏览器访问。

#### 构建步骤：
```bash
npm install
npm run build:web
npm start
```

#### 生产环境部署：
```bash
# 使用 PM2 管理进程
npm install -g pm2
pm2 start npm --name "serial-debugger" -- start

# 或使用 Docker
docker build -t serial-udp-debugger .
docker run -p 3000:3000 serial-udp-debugger
```

#### 环境变量：
- `PORT`: 服务端口（默认 3000）
- `NODE_ENV`: 环境模式（production/development）

### 2. Electron 桌面应用

#### 开发模式：
```bash
npm install
npm run dev
```

#### 构建 EXE 文件：
```bash
# 仅构建 Windows 版本
npm run dist:win

# 构建所有平台
npm run dist
```

#### 构建产物：
- Windows: `dist/Serial UDP Debugger Setup.exe`
- macOS: `dist/Serial UDP Debugger.dmg`
- Linux: `dist/Serial UDP Debugger.AppImage`

### 3. Docker 部署

#### 构建镜像：
```bash
docker build -t serial-udp-debugger .
```

#### 运行容器：
```bash
# 基本运行
docker run -p 3000:3000 serial-udp-debugger

# 后台运行
docker run -d -p 3000:3000 --name serial-debugger serial-udp-debugger

# 使用 docker-compose
docker-compose up -d
```

## 功能差异说明

### Electron 版本
- ✅ 完整的串口支持
- ✅ 原生 UDP 支持
- ✅ 文件系统访问
- ✅ 系统集成
- ✅ 离线使用

### Web 版本
- ⚠️ 有限的串口支持（需要 Web Serial API）
- ⚠️ UDP 通过 WebSocket 模拟
- ❌ 无文件系统访问
- ✅ 跨平台访问
- ✅ 无需安装

### 浏览器兼容性

Web 版本的串口功能需要浏览器支持 Web Serial API：

- ✅ Chrome 89+
- ✅ Edge 89+
- ❌ Firefox（不支持）
- ❌ Safari（不支持）

## 配置文件

### next.config.js
项目会根据 `BUILD_MODE` 环境变量自动调整配置：
- `BUILD_MODE=electron`: 导出静态文件用于 Electron
- 默认: 标准 Next.js 应用

### package.json 脚本说明
- `dev`: 开发模式（同时启动 Next.js 和 Electron）
- `build:web`: 构建 Web 版本
- `build:electron`: 构建 Electron 静态文件
- `dist:win`: 打包 Windows 版本
- `dist:mac`: 打包 macOS 版本
- `dist:linux`: 打包 Linux 版本

## 图标文件

在打包 Electron 应用前，请确保在 `assets/` 目录中添加以下图标文件：

- `icon.ico` - Windows 图标（256x256 像素）
- `icon.icns` - macOS 图标
- `icon.png` - Linux 图标（512x512 像素）

可以使用在线工具转换图标格式：
- https://convertio.co/
- https://icoconvert.com/

## 故障排除

### 常见问题

1. **串口模块加载失败**
   - 确保在 Electron 环境下运行
   - 检查 Node.js 版本兼容性

2. **Web Serial API 不可用**
   - 使用支持的浏览器（Chrome/Edge）
   - 确保使用 HTTPS 连接

3. **UDP 连接失败**
   - 检查防火墙设置
   - 确认端口未被占用

4. **构建失败**
   - 清理 node_modules: `rm -rf node_modules && npm install`
   - 检查 Node.js 版本: `node --version`

### 日志调试

开发模式下可以查看详细日志：
```bash
# 启用详细日志
DEBUG=* npm run dev

# Electron 开发者工具
# 在应用中按 F12 或 Ctrl+Shift+I
```

## 性能优化

### Web 版本
- 启用 gzip 压缩
- 配置 CDN
- 使用缓存策略

### Electron 版本
- 减少打包体积
- 启用代码分割
- 优化启动时间

## 安全考虑

- Web 版本默认不支持文件系统访问
- 串口和网络访问需要用户授权
- 生产环境建议使用 HTTPS
- 定期更新依赖包

## 更新部署

### Web 版本更新
```bash
git pull
npm install
npm run build:web
pm2 restart serial-debugger
```

### Electron 版本更新
重新构建并分发新的安装包：
```bash
npm run dist:win
```

## 技术支持

如遇到部署问题，请检查：
1. Node.js 版本 >= 18
2. npm 版本 >= 8
3. 系统权限设置
4. 网络连接状态

更多技术细节请参考项目文档或提交 Issue。