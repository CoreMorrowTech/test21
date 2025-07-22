#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');

const args = process.argv.slice(2);
const mode = args[0] || 'help';

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`命令执行失败，退出码: ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function main() {
  switch (mode) {
    case 'dev':
      console.log('🚀 启动开发模式...');
      await runCommand('npm', ['run', 'dev']);
      break;

    case 'web':
      console.log('🌐 启动 Web 版本...');
      if (!fs.existsSync('.next')) {
        console.log('📦 首次运行，正在构建...');
        await runCommand('npm', ['run', 'build:web']);
      }
      await runCommand('npm', ['start']);
      break;

    case 'electron':
      console.log('💻 启动 Electron 版本...');
      if (!fs.existsSync('out')) {
        console.log('📦 首次运行，正在构建...');
        await runCommand('npm', ['run', 'build:electron']);
      }
      await runCommand('npm', ['run', 'electron']);
      break;

    case 'build':
      const buildType = args[1] || 'web';
      console.log(`📦 构建 ${buildType} 版本...`);
      await runCommand('node', ['build.js', buildType]);
      break;

    case 'test':
      console.log('🧪 运行测试...');
      await runCommand('npm', ['test']);
      break;

    case 'clean':
      console.log('🧹 清理构建文件...');
      const dirsToClean = ['.next', 'out', 'dist'];
      for (const dir of dirsToClean) {
        if (fs.existsSync(dir)) {
          console.log(`删除 ${dir}/`);
          await runCommand('rmdir', ['/s', '/q', dir]);
        }
      }
      console.log('✅ 清理完成');
      break;

    default:
      console.log(`
Serial UDP Debugger 启动工具

用法: node start.js [模式]

模式:
  dev       - 开发模式 (Next.js + Electron)
  web       - Web 版本 (浏览器访问)
  electron  - Electron 桌面版本
  build     - 构建项目 (可选: web, electron, exe, docker)
  test      - 运行测试
  clean     - 清理构建文件

示例:
  node start.js dev           # 开发模式
  node start.js web           # 启动 Web 版本
  node start.js build exe     # 构建 EXE 文件
  node start.js clean         # 清理构建文件
`);
      break;
  }
}

main().catch(error => {
  console.error('❌ 执行失败:', error.message);
  process.exit(1);
});