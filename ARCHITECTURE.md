# 统一架构设计文档

## 🎯 项目目标

实现 **Electron 和 Web 用一套代码** 的串口UDP调试工具，通过智能的平台适配层，让同一套 React 组件和业务逻辑在两种环境中无缝运行。

## 🏗️ 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    用户界面层 (UI Layer)                      │
├─────────────────────────────────────────────────────────────┤
│  React Components (app/, components/)                      │
│  • 统一的用户界面                                            │
│  • 响应式设计                                               │
│  • 平台无关的交互逻辑                                         │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   平台适配层 (Platform Layer)                │
├─────────────────────────────────────────────────────────────┤
│  PlatformProvider + usePlatform Hook                       │
│  • 自动环境检测                                             │
│  • 功能特性映射                                             │
│  • 统一的API接口                                            │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┬───────────────────────────────┐
│        Electron 环境         │           Web 环境            │
├─────────────────────────────┼───────────────────────────────┤
│  • Node.js SerialPort       │  • Web Serial API            │
│  • Node.js dgram (UDP)      │  • WebSocket (UDP代理)       │
│  • 原生文件系统              │  • 浏览器下载API              │
│  • 系统通知                  │  • 浏览器通知API              │
│  • 窗口控制                  │  • 标准Web API               │
└─────────────────────────────┴───────────────────────────────┘
```

## 🔧 核心组件

### 1. 平台检测与适配 (`lib/platform.ts`)

```typescript
// 自动检测运行环境
export const detectPlatform = (): PlatformType => {
  if (typeof window !== 'undefined') {
    return (window as any).require ? 'electron' : 'web';
  }
  return 'web';
};

// 统一的功能适配器
export class PlatformAdapter {
  static async saveFile(filename: string, content: string) {
    if (this.isElectron()) {
      // Electron: 原生文件对话框
    } else {
      // Web: 浏览器下载
    }
  }
}
```

### 2. 环境配置 (`lib/environment.ts`)

```typescript
// 特性检测
export const features = {
  hasNodeSerial: isElectron() || isServer(),
  hasWebSerial: isWeb() && 'serial' in navigator,
  hasNodeUDP: isElectron() || isServer(),
  hasWebSocket: typeof WebSocket !== 'undefined',
  // ...更多特性
};
```

### 3. React 上下文提供者 (`components/PlatformProvider.tsx`)

```typescript
// 为整个应用提供平台信息和功能
export function PlatformProvider({ children }) {
  const platformFeatures = {
    platform,
    features: { /* 检测到的功能 */ },
    actions: { /* 适配后的方法 */ }
  };
  
  return (
    <PlatformContext.Provider value={platformFeatures}>
      {children}
    </PlatformContext.Provider>
  );
}
```

### 4. 硬件管理器 (`lib/hardware-manager.ts`)

```typescript
// 统一的硬件接口，自动适配不同环境
export class HardwareManager {
  async connectSerial(config) {
    if (this.isElectron) {
      // 使用 Node.js serialport
    } else {
      // 使用 Web Serial API 或 WebSocket 代理
    }
  }
}
```

## 🚀 构建流程

### 统一构建管理器 (`build-config.js`)

```javascript
class BuildManager {
  async buildWeb() {
    process.env.BUILD_MODE = 'web';
    execSync('npm run build:web');
  }
  
  async buildElectron() {
    process.env.BUILD_MODE = 'electron';
    execSync('npm run build:electron');
  }
  
  async buildAll() {
    await this.buildWeb();
    await this.buildElectron();
  }
}
```

### Next.js 配置适配 (`next.config.js`)

```javascript
const nextConfig = {
  // 根据构建模式动态配置
  ...(process.env.BUILD_MODE === 'electron' && {
    output: 'export',        // 静态导出给 Electron
    distDir: 'out',         // 输出到 out 目录
    images: { unoptimized: true }
  })
};
```

## 📱 用户体验统一

### 1. 界面一致性
- 相同的 React 组件在两个环境中渲染
- 统一的样式和交互逻辑
- 响应式设计适配不同屏幕

### 2. 功能适配
- 自动检测环境能力
- 优雅降级不支持的功能
- 统一的错误处理

### 3. 数据持久化
- Electron: 本地文件系统
- Web: LocalStorage + 下载

## 🔄 开发工作流

### 开发模式
```bash
npm run dev
# 同时启动 Next.js 开发服务器和 Electron
```

### 构建部署
```bash
npm run build        # 构建所有版本
npm run build:web    # 仅构建 Web 版本
npm run build:electron # 仅构建 Electron 版本
```

### 打包分发
```bash
npm run pack         # 打包 Electron 应用
npm run dist:win     # Windows 安装包
npm run dist:mac     # macOS 安装包
```

## 🧪 测试策略

### 平台兼容性测试
```bash
node test-platform.js  # 检查平台适配配置
npm run test:build     # 测试构建流程
```

### 功能测试
- 串口通信在两个环境中的表现
- UDP通信的不同实现方式
- 文件保存功能的适配
- 通知系统的兼容性

## 📊 性能优化

### 代码分割
- 平台特定代码按需加载
- 减少不必要的依赖打包

### 资源优化
- 图片和静态资源优化
- 字体和样式压缩

### 运行时优化
- 懒加载非关键组件
- 内存使用监控

## 🔒 安全考虑

### Web 环境
- HTTPS 要求（Web Serial API）
- 用户权限请求
- 跨域资源共享

### Electron 环境
- 上下文隔离
- 预加载脚本安全
- 原生模块权限

## 📈 扩展性

### 添加新平台
1. 在 `platform.ts` 中添加检测逻辑
2. 实现平台特定的适配器方法
3. 更新功能特性映射

### 添加新功能
1. 定义统一的接口
2. 实现各平台的具体逻辑
3. 在组件中使用 `usePlatform` Hook

## 🎉 优势总结

### ✅ 开发效率
- **一套代码，两个平台**
- 统一的开发体验
- 共享的组件和逻辑

### ✅ 维护成本
- 单一代码库维护
- 统一的测试流程
- 一致的功能更新

### ✅ 用户体验
- 界面和交互一致
- 功能无缝切换
- 性能优化统一

### ✅ 技术先进性
- 现代前端架构
- 类型安全 (TypeScript)
- 响应式设计

这个架构展示了如何使用 Next.js 和智能的平台适配层，实现真正的"一套代码，多端运行"，是现代跨平台应用开发的最佳实践。