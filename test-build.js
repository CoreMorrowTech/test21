#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 测试不同构建模式...\n');

function runTest(name, command, expectedFiles = []) {
  console.log(`📦 测试 ${name}...`);
  
  try {
    execSync(command, { stdio: 'inherit' });
    
    // 检查预期文件是否存在
    const missingFiles = expectedFiles.filter(file => !fs.existsSync(file));
    
    if (missingFiles.length === 0) {
      console.log(`✅ ${name} 构建成功\n`);
      return true;
    } else {
      console.log(`❌ ${name} 构建失败，缺少文件:`, missingFiles, '\n');
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name} 构建失败:`, error.message, '\n');
    return false;
  }
}

// 清理之前的构建
console.log('🧹 清理之前的构建...');
if (fs.existsSync('.next')) {
  execSync('rmdir /s /q .next', { stdio: 'inherit' });
}
if (fs.existsSync('out')) {
  execSync('rmdir /s /q out', { stdio: 'inherit' });
}

const tests = [
  {
    name: 'Web 版本',
    command: 'npm run build:web',
    expectedFiles: ['.next/BUILD_ID', '.next/static']
  },
  {
    name: 'Electron 版本',
    command: 'npm run build:electron',
    expectedFiles: ['out/index.html', 'out/_next']
  }
];

let passedTests = 0;
const totalTests = tests.length;

for (const test of tests) {
  if (runTest(test.name, test.command, test.expectedFiles)) {
    passedTests++;
  }
}

console.log(`📊 测试结果: ${passedTests}/${totalTests} 通过`);

if (passedTests === totalTests) {
  console.log('🎉 所有构建测试通过！');
  process.exit(0);
} else {
  console.log('❌ 部分测试失败');
  process.exit(1);
}