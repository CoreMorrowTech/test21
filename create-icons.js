#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 创建一个简单的 SVG 图标
const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <rect width="256" height="256" fill="#2563eb" rx="32"/>
  <circle cx="128" cy="80" r="24" fill="white"/>
  <rect x="104" y="120" width="48" height="8" fill="white" rx="4"/>
  <rect x="96" y="140" width="64" height="8" fill="white" rx="4"/>
  <rect x="88" y="160" width="80" height="8" fill="white" rx="4"/>
  <rect x="80" y="180" width="96" height="8" fill="white" rx="4"/>
  <text x="128" y="220" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">DEBUG</text>
</svg>`;

// 创建 assets 目录（如果不存在）
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
}

// 保存 SVG 文件
fs.writeFileSync(path.join(assetsDir, 'icon.svg'), svgIcon);

console.log('✅ 已创建 SVG 图标文件: assets/icon.svg');
console.log('');
console.log('📝 要创建完整的图标文件，请：');
console.log('1. 使用在线工具将 SVG 转换为所需格式：');
console.log('   - https://convertio.co/ (SVG to ICO/ICNS/PNG)');
console.log('   - https://icoconvert.com/');
console.log('');
console.log('2. 或使用命令行工具（如果已安装）：');
console.log('   - ImageMagick: convert icon.svg -resize 256x256 icon.ico');
console.log('   - Inkscape: inkscape icon.svg --export-png=icon.png --export-width=256');
console.log('');
console.log('3. 需要的文件：');
console.log('   - assets/icon.ico (Windows, 256x256)');
console.log('   - assets/icon.icns (macOS)');
console.log('   - assets/icon.png (Linux, 512x512)');