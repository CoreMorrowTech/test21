# Serial UDP Debugger 使用指南

## 快速开始

### 方式一：使用便捷脚本（推荐）

```bash
# 开发模式（同时启动 Next.js 和 Electron）
npm run start:dev

# 启动 Web 版本（浏览器访问）
npm run start:web

# 启动 Electron 桌面版本
npm run start:electron
```

### 方式二：使用构建脚本

```bash
# 构建 Web 版本
node build.js web

# 打包 Windows EXE 文件
node build.js exe

# 构建 Docker 镜像
node build.js docker

# 构建所有平台版本
node build.js all
```

### 方式三：使用启动脚本

```bash
# 开发模式
node start.js dev

# Web 版本
node start.js web

# Electron 版本
node start.js electron

# 构建项目
node start.js build exe

# 清理构建文件
node start.js clean
```

## 详细使用说明

### 开发环境

#### 1. 安装依赖
```bash
npm install
```

#### 2. 启动开发模式
```bash
npm run dev
# 或
npm run start:dev
# 或
node start.js dev
```

这将同时启动：
- Next.js 开发服务器（http://localhost:3000）
- Electron 桌面应用

### 生产部署

#### Web 版本部署

**方法一：直接部署**
```bash
npm run build:web
npm start
```

**方法二：使用 PM2**
```bash
npm install -g pm2
npm run build:web
pm2 start npm --name "serial-debugger" -- start
```

**方法三：Docker 部署**
```bash
# 构建镜像
docker build -t serial-udp-debugger .

# 运行容器
docker run -p 3000:3000 serial-udp-debugger

# 或使用 docker-compose
docker-compose up -d
```

#### 桌面应用打包

**准备工作：**
1. 在 `assets/` 目录添加图标文件：
   - `icon.ico` (Windows, 256x256)
   - `icon.icns` (macOS)
   - `icon.png` (Linux, 512x512)

**打包命令：**
```bash
# Windows 版本
npm run dist:win

# macOS 版本
npm run dist:mac

# Linux 版本
npm run dist:linux

# 所有平台
npm run dist
```

**输出文件：**
- Windows: `dist/Serial UDP Debugger Setup.exe`
- macOS: `dist/Serial UDP Debugger.dmg`
- Linux: `dist/Serial UDP Debugger.AppImage`

## 功能对比

### Electron 桌面版本
✅ **优势：**
- 完整的串口支持（所有波特率和配置）
- 原生 UDP 通信
- 文件系统完全访问
- 离线使用
- 系统集成（托盘、通知等）
- 更好的性能

❌ **限制：**
- 需要安装
- 占用更多系统资源
- 更新需要重新安装

### Web 浏览器版本
✅ **优势：**
- 无需安装，直接访问
- 跨平台兼容
- 自动更新
- 轻量级
- 易于分享和部署

❌ **限制：**
- 串口支持有限（需要 Web Serial API）
- UDP 通过 WebSocket 模拟
- 浏览器兼容性要求（Chrome 89+, Edge 89+）
- 需要网络连接
- 安全限制较多

## 浏览器兼容性

### Web Serial API 支持
- ✅ Chrome 89+
- ✅ Edge 89+
- ❌ Firefox（不支持）
- ❌ Safari（不支持）

### 推荐浏览器
- **最佳体验：** Chrome 或 Edge 最新版本
- **基本功能：** 任何现代浏览器（UDP 功能通过 WebSocket）

## 常用命令速查

```bash
# 开发
npm run dev                    # 开发模式
npm run start:dev             # 开发模式（便捷脚本）

# 构建
npm run build:web             # 构建 Web 版本
npm run build:electron        # 构建 Electron 静态文件
node build.js web             # 构建 Web 版本（脚本）
node build.js exe             # 打包 EXE 文件

# 启动
npm start                     # 启动 Web 版本
npm run start:web             # 启动 Web 版本（便捷脚本）
npm run start:electron        # 启动 Electron 版本

# 打包
npm run dist:win              # 打包 Windows 版本
npm run dist:mac              # 打包 macOS 版本
npm run dist:linux            # 打包 Linux 版本
npm run dist                  # 打包所有平台

# 测试和清理
npm test                      # 运行测试
npm run test:build            # 测试构建
npm run clean                 # 清理构建文件
```

## 故障排除

### 常见问题

**1. 串口连接失败**
- Electron 版本：检查串口驱动和权限
- Web 版本：确保使用支持的浏览器，并授权串口访问

**2. UDP 连接问题**
- 检查防火墙设置
- 确认端口未被占用
- Web 版本需要 WebSocket 服务器支持

**3. 构建失败**
```bash
# 清理并重新安装
npm run clean
rm -rf node_modules package-lock.json
npm install
```

**4. Electron 打包失败**
- 确保图标文件存在
- 检查 Node.js 版本兼容性
- 清理缓存：`npm run clean`

### 调试模式

**开发调试：**
```bash
# 启用详细日志
DEBUG=* npm run dev

# Electron 开发者工具
# 在应用中按 F12 或 Ctrl+Shift+I
```

**生产调试：**
```bash
# Web 版本日志
NODE_ENV=development npm start

# 查看构建信息
npm run build:web -- --debug
```

## 性能优化建议

### Web 版本
- 启用 gzip 压缩
- 配置 CDN 加速
- 使用缓存策略
- 启用 HTTPS

### Electron 版本
- 减少打包体积（排除不必要的依赖）
- 启用代码分割
- 优化启动时间
- 使用预加载脚本

## 更新和维护

### 更新 Web 版本
```bash
git pull
npm install
npm run build:web
pm2 restart serial-debugger  # 如果使用 PM2
```

### 更新 Electron 版本
```bash
git pull
npm install
npm run dist:win  # 重新打包
```

### 依赖更新
```bash
# 检查过时的包
npm outdated

# 更新依赖
npm update

# 安全审计
npm audit
npm audit fix
```

## 技术支持

如果遇到问题，请按以下顺序排查：

1. 检查 Node.js 版本（推荐 v18+）
2. 清理并重新安装依赖
3. 查看错误日志
4. 检查系统权限设置
5. 确认网络连接状态

更多技术细节请参考 `DEPLOYMENT.md` 或提交 Issue。