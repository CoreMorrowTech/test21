# 串口UDP调试助手 - 使用指南

## 概述

这是一个基于 Next.js 的串口和UDP通信调试工具，支持在 **Web浏览器** 和 **Electron桌面应用** 两种环境中运行，使用同一套代码。

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
# 同时启动 Next.js 开发服务器和 Electron
npm run dev
```

### 构建和部署

#### 构建所有版本
```bash
npm run build
```

#### 单独构建
```bash
# 构建 Web 版本
npm run build:web

# 构建 Electron 版本  
npm run build:electron
```

#### 打包 Electron 应用
```bash
# 打包当前平台
npm run pack

# 打包特定平台
npm run dist:win    # Windows
npm run dist:mac    # macOS
npm run dist:linux  # Linux
```

## 🌐 环境支持

### Web 浏览器版本
- **串口通信**: 使用 Web Serial API（需要 Chrome 89+ 或支持的浏览器）
- **UDP通信**: 通过 WebSocket 代理实现
- **文件保存**: 浏览器下载
- **通知**: 浏览器通知 API

**访问方式**:
```bash
npm run start:web
# 访问 http://localhost:3000
```

### Electron 桌面版本
- **串口通信**: 原生 Node.js serialport 模块
- **UDP通信**: 原生 Node.js dgram 模块  
- **文件保存**: 原生文件系统对话框
- **通知**: 系统原生通知

**启动方式**:
```bash
npm run start:electron
```

## 🔧 功能特性

### 统一的用户界面
- 响应式设计，支持桌面和移动端
- 实时连接状态显示
- 数据收发历史记录
- 环境信息面板

### 平台适配
- 自动检测运行环境
- 功能特性自适应
- 统一的API接口
- 无缝的用户体验

### 串口调试
- 串口列表自动扫描
- 可配置波特率、数据位等参数
- 实时数据收发
- 十六进制/文本显示切换

### UDP调试  
- UDP服务器/客户端模式
- 广播和单播支持
- 多端点通信
- 数据包来源显示

## 📁 项目结构

```
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局，集成平台适配器
│   ├── page.tsx           # 主页面，统一的用户界面
│   └── globals.css        # 全局样式
├── components/            # React 组件
│   ├── PlatformProvider.tsx    # 平台适配器Provider
│   ├── EnvironmentInfo.tsx     # 环境信息组件
│   ├── SerialDebugger.tsx      # 串口调试组件
│   ├── UDPDebugger.tsx         # UDP调试组件
│   └── DataViewer.tsx          # 数据查看器
├── lib/                   # 核心库
│   ├── platform.ts        # 平台检测和适配
│   ├── environment.ts     # 环境配置
│   ├── hardware-manager.ts # 硬件管理器
│   └── store.ts           # 状态管理
├── main.js               # Electron 主进程
├── preload.js            # Electron 预加载脚本
├── build-config.js       # 统一构建配置
└── next.config.js        # Next.js 配置
```

## 🛠️ 开发指南

### 添加新功能
1. 在 `lib/platform.ts` 中添加平台适配方法
2. 在组件中使用 `usePlatform()` Hook 获取平台功能
3. 根据平台特性实现不同的逻辑分支

### 环境检测
```typescript
import { usePlatform } from '@/components/PlatformProvider';

function MyComponent() {
  const platform = usePlatform();
  
  if (platform.platform === 'electron') {
    // Electron 特定逻辑
  } else {
    // Web 浏览器逻辑
  }
}
```

### 平台功能使用
```typescript
// 保存文件
await platform.actions.saveFile('data.json', jsonData);

// 显示通知
platform.actions.showNotification('标题', '消息内容');

// 窗口控制 (仅 Electron)
if (platform.features.canControlWindow) {
  platform.actions.minimizeWindow();
}
```

## 🧪 测试

```bash
# 运行单元测试
npm test

# 监听模式
npm run test:watch

# 构建测试
npm run test:build
```

## 📦 构建管理

使用内置的构建管理器：

```bash
# 查看所有命令
node build-config.js

# 清理构建文件
node build-config.js clean

# 完整构建流程
node build-config.js all

# 查看构建信息
node build-config.js info
```

## 🔍 故障排除

### Web Serial API 不可用
- 确保使用支持的浏览器（Chrome 89+）
- 需要 HTTPS 或 localhost 环境
- 检查浏览器权限设置

### Electron 串口模块加载失败
- 确保安装了 `serialport` 依赖
- 检查 Node.js 版本兼容性
- 重新构建原生模块：`npm rebuild`

### UDP 功能异常
- Web 环境需要 WebSocket 代理服务器
- 检查防火墙和端口设置
- 确认网络权限

## 📄 许可证

MIT License - 详见 LICENSE 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**提示**: 这个项目展示了如何使用 Next.js 创建跨平台应用，同时支持 Web 和 Electron 环境，是学习现代前端架构的好例子。