# 串口UDP调试助手 🔧

> **Electron 和 Web 用一套代码** - 基于 Next.js 的现代化跨平台通信调试工具

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Electron](https://img.shields.io/badge/Electron-29-blue)](https://electronjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## ✨ 项目亮点

🎯 **一套代码，双端运行** - 同一套 React 代码在 Web 浏览器和 Electron 桌面应用中无缝运行

🔧 **智能平台适配** - 自动检测运行环境，动态适配不同平台的 API 和功能

🚀 **现代化架构** - 基于 Next.js 14 + React 18，支持 SSG、类型安全、响应式设计

⚡ **统一构建流程** - 一键构建 Web 版本和 Electron 版本，支持多平台打包

## 🌟 功能特性

### 🔌 串口通信
- **Electron**: 原生 Node.js serialport 模块
- **Web**: Web Serial API (Chrome 89+)
- 自动端口扫描、可配置参数、实时数据收发

### 🌐 UDP通信  
- **Electron**: 原生 Node.js dgram 模块
- **Web**: WebSocket 代理实现
- 服务器/客户端模式、广播支持、多端点通信

### 📊 数据管理
- 实时数据监控和历史记录
- 十六进制/文本显示切换
- 数据导出 (JSON/TXT 格式)
- 统计分析和过滤功能

### 🎨 用户界面
- 响应式设计，支持桌面和移动端
- 现代化 UI，基于 Tailwind CSS
- 实时连接状态显示
- 环境信息面板

## 🚀 快速开始

### 📦 安装依赖
```bash
npm install
```

### 🎮 快速演示
```bash
node demo.js
```

### 🔧 开发模式
```bash
# 同时启动 Next.js 和 Electron
npm run dev
```

### 🏗️ 构建部署
```bash
# 构建所有版本
npm run build

# 单独构建
npm run build:web      # Web 版本
npm run build:electron # Electron 版本

# 打包 Electron 应用
npm run pack           # 当前平台
npm run dist:win       # Windows
npm run dist:mac       # macOS  
npm run dist:linux     # Linux
```

## 🏗️ 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    统一用户界面 (React)                       │
├─────────────────────────────────────────────────────────────┤
│                   平台适配层 (Platform Layer)                │
│  • 自动环境检测  • 功能特性映射  • 统一API接口                │
├─────────────────────────────┬───────────────────────────────┤
│        Electron 环境         │           Web 环境            │
│  • 原生串口/UDP             │  • Web Serial/WebSocket      │
│  • 文件系统                  │  • 浏览器 API                │
│  • 系统通知                  │  • 下载/通知                 │
└─────────────────────────────┴───────────────────────────────┘
```

### 核心文件
- `lib/platform.ts` - 平台检测和适配核心
- `components/PlatformProvider.tsx` - React 上下文提供者
- `build-config.js` - 统一构建管理器
- `next.config.js` - Next.js 配置适配

## 版本差异

| 功能 | Electron 版本 | Web 版本 |
|------|---------------|----------|
| 串口支持 | ✅ 完整支持 | ⚠️ 需要 Web Serial API |
| UDP 通信 | ✅ 原生支持 | ⚠️ WebSocket 模拟 |
| 文件访问 | ✅ 完整支持 | ❌ 受限 |
| 离线使用 | ✅ 支持 | ❌ 需要网络 |
| 跨平台访问 | ❌ 需要安装 | ✅ 浏览器访问 |

**浏览器兼容性：** Web 版本的串口功能需要 Chrome 89+ 或 Edge 89+

## 📱 支持平台

### 🌐 Web 浏览器
- Chrome 89+ (Web Serial API)
- Edge 89+
- 其他基于 Chromium 的浏览器

### 🖥️ Electron 桌面应用
- Windows 10/11
- macOS 10.15+
- Linux (Ubuntu, CentOS, etc.)

## 🧪 测试

```bash
# 运行单元测试
npm test

# 平台适配测试
node test-platform.js

# 构建测试
npm run test:build
```

## 📚 文档

- [📖 使用指南](USAGE.md) - 详细的使用说明和配置
- [🏗️ 架构文档](ARCHITECTURE.md) - 深入的架构设计说明
- [🚀 部署指南](DEPLOYMENT.md) - 生产环境部署说明

## 🛠️ 技术栈

### 前端框架
- **Next.js 14** - React 全栈框架
- **React 18** - 用户界面库
- **TypeScript** - 类型安全

### 样式和UI
- **Tailwind CSS** - 原子化CSS框架
- **响应式设计** - 移动端适配

### 状态管理
- **Zustand** - 轻量级状态管理

### 桌面应用
- **Electron 29** - 跨平台桌面应用框架

### 通信模块
- **serialport** - Node.js 串口通信
- **ws** - WebSocket 服务器

### 开发工具
- **Jest** - 单元测试框架
- **ESLint** - 代码规范检查
- **Prettier** - 代码格式化

## 🎯 使用场景

### 🔬 硬件开发
- 嵌入式设备调试
- 传感器数据采集
- 单片机通信测试

### 🌐 网络调试
- UDP 协议测试
- 网络设备配置
- 数据包分析

### 🏭 工业应用
- 设备监控
- 数据采集
- 自动化测试

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Next.js](https://nextjs.org/) - 优秀的 React 框架
- [Electron](https://electronjs.org/) - 跨平台桌面应用框架
- [serialport](https://serialport.io/) - Node.js 串口通信库
- [Tailwind CSS](https://tailwindcss.com/) - 实用的 CSS 框架

---

⭐ 如果这个项目对你有帮助，请给个 Star！

📧 有问题或建议？欢迎提交 [Issue](../../issues)
