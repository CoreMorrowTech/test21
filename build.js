#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const buildType = args[0] || 'help';

function runCommand(command) {
  console.log(`执行: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`命令执行失败: ${command}`);
    process.exit(1);
  }
}

function checkIconFiles() {
  const iconFiles = ['assets/icon.ico', 'assets/icon.icns', 'assets/icon.png'];
  const missingIcons = iconFiles.filter(file => !fs.existsSync(file));
  
  if (missingIcons.length > 0) {
    console.warn('警告: 缺少以下图标文件:');
    missingIcons.forEach(file => console.warn(`  - ${file}`));
    console.warn('请参考 assets/README.md 了解如何添加图标文件');
  }
}

switch (buildType) {
  case 'web':
    console.log('构建 Web 版本...');
    runCommand('npm run build:web');
    console.log('Web 版本构建完成！可以使用 npm start 启动');
    break;

  case 'electron':
    console.log('构建 Electron 版本...');
    checkIconFiles();
    runCommand('npm run build:electron');
    console.log('Electron 静态文件构建完成！');
    break;

  case 'exe':
    console.log('打包 Windows EXE 文件...');
    checkIconFiles();
    runCommand('npm run dist:win');
    console.log('Windows EXE 文件已生成在 dist/ 目录中');
    break;

  case 'all':
    console.log('构建所有平台版本...');
    checkIconFiles();
    runCommand('npm run dist');
    console.log('所有平台版本已生成在 dist/ 目录中');
    break;

  case 'docker':
    console.log('构建 Docker 镜像...');
    runCommand('docker build -t serial-udp-debugger .');
    console.log('Docker 镜像构建完成！');
    console.log('使用以下命令运行: docker run -p 3000:3000 serial-udp-debugger');
    break;

  default:
    console.log(`
Serial UDP Debugger 构建工具

用法: node build.js [选项]

选项:
  web      - 构建 Web 版本 (用于服务器部署)
  electron - 构建 Electron 静态文件
  exe      - 打包 Windows EXE 文件
  all      - 打包所有平台版本
  docker   - 构建 Docker 镜像

示例:
  node build.js web      # 构建 Web 版本
  node build.js exe      # 打包 Windows EXE
  node build.js docker   # 构建 Docker 镜像
`);
    break;
}