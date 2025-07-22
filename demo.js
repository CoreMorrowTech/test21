#!/usr/bin/env node

/**
 * 快速演示脚本
 * 展示 Electron 和 Web 统一架构的功能
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log(`
🚀 串口UDP调试助手 - 统一架构演示

这个项目展示了如何使用 Next.js 实现：
✨ Electron 和 Web 用一套代码
✨ 智能的平台适配
✨ 统一的用户体验
✨ 现代化的开发流程

`);

// 演示选项
const demos = [
  {
    key: '1',
    name: '🌐 启动 Web 版本',
    description: '在浏览器中运行，使用 Web Serial API',
    action: () => startWebDemo()
  },
  {
    key: '2', 
    name: '🖥️ 启动 Electron 版本',
    description: '桌面应用，使用原生串口和UDP',
    action: () => startElectronDemo()
  },
  {
    key: '3',
    name: '🏗️ 构建所有版本',
    description: '同时构建 Web 和 Electron 版本',
    action: () => buildAllDemo()
  },
  {
    key: '4',
    name: '📦 打包 Electron 应用',
    description: '生成可分发的桌面应用',
    action: () => packageDemo()
  },
  {
    key: '5',
    name: '🧪 运行平台测试',
    description: '验证平台适配配置',
    action: () => testPlatformDemo()
  },
  {
    key: '6',
    name: '🔧 统一硬件接口演示',
    description: '展示 Web 和 Electron 统一的硬件访问',
    action: () => unifiedHardwareDemo()
  },
  {
    key: '7',
    name: '📋 查看项目信息',
    description: '显示架构和功能特性',
    action: () => showProjectInfo()
  }
];

function showMenu() {
  console.log('请选择演示项目:\n');
  demos.forEach(demo => {
    console.log(`${demo.key}. ${demo.name}`);
    console.log(`   ${demo.description}\n`);
  });
  console.log('0. 退出\n');
}

function startWebDemo() {
  console.log('🌐 启动 Web 版本演示...\n');
  console.log('特性:');
  console.log('• 使用 Web Serial API 进行串口通信');
  console.log('• 通过 WebSocket 代理实现 UDP 功能');
  console.log('• 浏览器原生下载和通知');
  console.log('• 响应式界面设计\n');
  
  console.log('正在启动开发服务器...');
  console.log('服务器启动后，请访问: http://localhost:3000\n');
  
  try {
    execSync('npm run dev', { stdio: 'inherit' });
  } catch (error) {
    console.error('启动失败:', error.message);
  }
}

function startElectronDemo() {
  console.log('🖥️ 启动 Electron 版本演示...\n');
  console.log('特性:');
  console.log('• 原生 Node.js serialport 模块');
  console.log('• 原生 UDP dgram 模块');
  console.log('• 系统文件对话框和通知');
  console.log('• 窗口控制功能\n');
  
  console.log('正在启动 Electron 应用...');
  
  try {
    // 先确保构建了 Electron 版本
    if (!fs.existsSync(path.join(__dirname, 'out'))) {
      console.log('首次运行，正在构建 Electron 版本...');
      execSync('npm run build:electron', { stdio: 'inherit' });
    }
    
    execSync('npm run electron', { stdio: 'inherit' });
  } catch (error) {
    console.error('启动失败:', error.message);
  }
}

function buildAllDemo() {
  console.log('🏗️ 构建所有版本演示...\n');
  console.log('这将展示统一构建流程:');
  console.log('• 清理之前的构建');
  console.log('• 构建 Web 版本 (.next/)');
  console.log('• 构建 Electron 版本 (out/)');
  console.log('• 验证构建结果\n');
  
  try {
    execSync('node build-config.js all', { stdio: 'inherit' });
    console.log('\n✅ 构建完成！');
    console.log('📁 Web 版本: .next/ 目录');
    console.log('📁 Electron 版本: out/ 目录');
  } catch (error) {
    console.error('构建失败:', error.message);
  }
}

function packageDemo() {
  console.log('📦 打包 Electron 应用演示...\n');
  console.log('这将创建可分发的桌面应用:');
  console.log('• 打包应用和依赖');
  console.log('• 生成平台特定的可执行文件');
  console.log('• 输出到 dist/ 目录\n');
  
  try {
    execSync('npm run pack', { stdio: 'inherit' });
    console.log('\n✅ 打包完成！');
    console.log('📁 查看 dist/ 目录获取可执行文件');
  } catch (error) {
    console.error('打包失败:', error.message);
  }
}

function testPlatformDemo() {
  console.log('🧪 运行平台测试演示...\n');
  console.log('这将验证平台适配配置:');
  console.log('• 环境检测');
  console.log('• 依赖检查');
  console.log('• 配置文件验证');
  console.log('• 构建脚本检查\n');
  
  try {
    execSync('node test-platform.js', { stdio: 'inherit' });
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

function unifiedHardwareDemo() {
  console.log('🔧 统一硬件接口演示...\n');
  console.log('这将展示统一硬件接口的特性:');
  console.log('• Web 和 Electron 使用相同的 API');
  console.log('• 自动环境检测和适配');
  console.log('• 串口和 UDP 统一接口');
  console.log('• 错误处理和状态管理\n');
  
  console.log('📋 统一接口特性:');
  console.log('');
  console.log('🔌 串口接口:');
  console.log('  • Electron: 原生 serialport 模块');
  console.log('  • Web: Web Serial API');
  console.log('  • 统一的连接、发送、接收方法');
  console.log('');
  console.log('🌐 UDP 接口:');
  console.log('  • Electron: 原生 dgram 模块');
  console.log('  • Web: WebSocket 代理服务器');
  console.log('  • 相同的 API 调用方式');
  console.log('');
  console.log('💡 使用方式:');
  console.log('```typescript');
  console.log('import { unifiedHardware } from "@/lib/unified-hardware";');
  console.log('');
  console.log('// 串口操作');
  console.log('await unifiedHardware.connectSerial(config);');
  console.log('await unifiedHardware.sendSerialData("Hello");');
  console.log('unifiedHardware.onSerialData(data => console.log(data));');
  console.log('');
  console.log('// UDP 操作');
  console.log('await unifiedHardware.connectUDP(config);');
  console.log('await unifiedHardware.sendUDPData("Hello", host, port);');
  console.log('unifiedHardware.onUDPData((data, source) => console.log(data));');
  console.log('```');
  console.log('');
  console.log('📁 相关文件:');
  console.log('  • lib/unified-hardware.ts - 统一硬件接口');
  console.log('  • examples/unified-usage.ts - 使用示例');
  console.log('  • websocket-udp-proxy.js - Web UDP 代理服务器');
  console.log('');
  console.log('🚀 要体验完整功能，请运行:');
  console.log('  npm run dev:full  # 启动完整开发环境（包含代理服务器）');
  console.log('  npm run dev:web   # 仅启动 Web 版本（包含代理服务器）');
}

function showProjectInfo() {
  console.log('📋 项目架构信息\n');
  
  const info = {
    '🎯 项目目标': 'Electron 和 Web 用一套代码',
    '🏗️ 核心架构': 'Next.js + 平台适配层',
    '🔧 关键技术': 'React, TypeScript, Electron, Web APIs',
    '📱 支持平台': 'Web 浏览器, Windows, macOS, Linux',
    '🚀 主要特性': '串口通信, UDP通信, 文件操作, 系统通知'
  };
  
  Object.entries(info).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });
  
  console.log('\n📁 关键文件:');
  const keyFiles = [
    'lib/platform.ts - 平台适配核心',
    'components/PlatformProvider.tsx - React 上下文',
    'build-config.js - 统一构建管理',
    'next.config.js - Next.js 配置适配',
    'main.js - Electron 主进程'
  ];
  
  keyFiles.forEach(file => {
    console.log(`  • ${file}`);
  });
  
  console.log('\n📚 文档:');
  console.log('  • ARCHITECTURE.md - 架构设计文档');
  console.log('  • USAGE.md - 使用指南');
  console.log('  • README.md - 项目介绍');
  
  // 显示构建信息
  try {
    console.log('\n📊 当前构建状态:');
    execSync('node build-config.js info', { stdio: 'inherit' });
  } catch (error) {
    console.log('无法获取构建信息');
  }
}

// 主程序
function main() {
  // 检查是否在正确的目录
  if (!fs.existsSync('package.json')) {
    console.error('❌ 请在项目根目录运行此脚本');
    process.exit(1);
  }
  
  // 检查依赖
  if (!fs.existsSync('node_modules')) {
    console.log('📦 检测到未安装依赖，正在安装...');
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('✅ 依赖安装完成\n');
    } catch (error) {
      console.error('❌ 依赖安装失败:', error.message);
      process.exit(1);
    }
  }
  
  // 显示菜单
  showMenu();
  
  // 等待用户输入
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('请输入选项 (0-7): ', (answer) => {
    rl.close();
    
    if (answer === '0') {
      console.log('👋 感谢体验！');
      process.exit(0);
    }
    
    const demo = demos.find(d => d.key === answer);
    if (demo) {
      console.log(`\n执行: ${demo.name}\n`);
      demo.action();
    } else {
      console.log('❌ 无效选项，请重新运行脚本');
    }
  });
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { demos, showProjectInfo };