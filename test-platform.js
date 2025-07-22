#!/usr/bin/env node

/**
 * 平台适配测试脚本
 * 验证不同环境下的功能是否正常
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 开始平台适配测试...\n');

// 测试项目
const tests = [
  {
    name: '环境检测',
    test: () => {
      console.log('📋 检测当前环境...');
      const envInfo = {
        platform: process.platform,
        nodeVersion: process.version,
        hasElectron: fs.existsSync(path.join(__dirname, 'node_modules', 'electron')),
        hasSerialPort: fs.existsSync(path.join(__dirname, 'node_modules', 'serialport')),
        hasNext: fs.existsSync(path.join(__dirname, 'node_modules', 'next'))
      };
      
      console.log('  平台:', envInfo.platform);
      console.log('  Node.js:', envInfo.nodeVersion);
      console.log('  Electron:', envInfo.hasElectron ? '✅ 已安装' : '❌ 未安装');
      console.log('  SerialPort:', envInfo.hasSerialPort ? '✅ 已安装' : '❌ 未安装');
      console.log('  Next.js:', envInfo.hasNext ? '✅ 已安装' : '❌ 未安装');
      
      return envInfo.hasNext;
    }
  },
  
  {
    name: '构建配置',
    test: () => {
      console.log('🔧 检查构建配置...');
      
      const configFiles = [
        'next.config.js',
        'build-config.js',
        'package.json'
      ];
      
      let allExist = true;
      configFiles.forEach(file => {
        const exists = fs.existsSync(path.join(__dirname, file));
        console.log(`  ${file}: ${exists ? '✅' : '❌'}`);
        if (!exists) allExist = false;
      });
      
      return allExist;
    }
  },
  
  {
    name: '平台适配文件',
    test: () => {
      console.log('🌐 检查平台适配文件...');
      
      const platformFiles = [
        'lib/platform.ts',
        'lib/environment.ts',
        'components/PlatformProvider.tsx',
        'components/EnvironmentInfo.tsx'
      ];
      
      let allExist = true;
      platformFiles.forEach(file => {
        const exists = fs.existsSync(path.join(__dirname, file));
        console.log(`  ${file}: ${exists ? '✅' : '❌'}`);
        if (!exists) allExist = false;
      });
      
      return allExist;
    }
  },
  
  {
    name: 'TypeScript 编译',
    test: () => {
      console.log('📝 检查 TypeScript 配置...');
      
      try {
        // 检查 tsconfig.json
        const tsconfigExists = fs.existsSync(path.join(__dirname, 'tsconfig.json'));
        console.log(`  tsconfig.json: ${tsconfigExists ? '✅' : '❌'}`);
        
        if (tsconfigExists) {
          const tsconfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'tsconfig.json'), 'utf8'));
          console.log(`  编译目标: ${tsconfig.compilerOptions?.target || 'default'}`);
          console.log(`  模块系统: ${tsconfig.compilerOptions?.module || 'default'}`);
        }
        
        return tsconfigExists;
      } catch (error) {
        console.log(`  ❌ TypeScript 配置检查失败: ${error.message}`);
        return false;
      }
    }
  },
  
  {
    name: '依赖检查',
    test: () => {
      console.log('📦 检查关键依赖...');
      
      try {
        const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        const criticalDeps = [
          'next',
          'react',
          'react-dom',
          'electron',
          'serialport',
          'typescript'
        ];
        
        let allPresent = true;
        criticalDeps.forEach(dep => {
          const exists = deps[dep] !== undefined;
          console.log(`  ${dep}: ${exists ? '✅ ' + deps[dep] : '❌ 缺失'}`);
          if (!exists) allPresent = false;
        });
        
        return allPresent;
      } catch (error) {
        console.log(`  ❌ 依赖检查失败: ${error.message}`);
        return false;
      }
    }
  },
  
  {
    name: '构建脚本',
    test: () => {
      console.log('🛠️ 检查构建脚本...');
      
      try {
        const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
        const scripts = packageJson.scripts || {};
        
        const requiredScripts = [
          'build',
          'build:web',
          'build:electron',
          'dev',
          'start'
        ];
        
        let allPresent = true;
        requiredScripts.forEach(script => {
          const exists = scripts[script] !== undefined;
          console.log(`  ${script}: ${exists ? '✅' : '❌'}`);
          if (!exists) allPresent = false;
        });
        
        return allPresent;
      } catch (error) {
        console.log(`  ❌ 构建脚本检查失败: ${error.message}`);
        return false;
      }
    }
  }
];

// 运行测试
let passedTests = 0;
const totalTests = tests.length;

console.log(`开始运行 ${totalTests} 个测试...\n`);

for (const test of tests) {
  console.log(`🧪 测试: ${test.name}`);
  try {
    const result = test.test();
    if (result) {
      console.log(`✅ ${test.name} - 通过\n`);
      passedTests++;
    } else {
      console.log(`❌ ${test.name} - 失败\n`);
    }
  } catch (error) {
    console.log(`❌ ${test.name} - 错误: ${error.message}\n`);
  }
}

// 输出结果
console.log('📊 测试结果汇总:');
console.log(`通过: ${passedTests}/${totalTests}`);
console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 所有测试通过！平台适配配置正确。');
  console.log('\n📋 下一步操作:');
  console.log('  1. npm run dev     - 启动开发模式');
  console.log('  2. npm run build   - 构建所有版本');
  console.log('  3. npm run pack    - 打包 Electron 应用');
  process.exit(0);
} else {
  console.log('\n⚠️ 部分测试失败，请检查配置。');
  console.log('\n🔧 建议操作:');
  console.log('  1. npm install     - 重新安装依赖');
  console.log('  2. 检查缺失的文件和配置');
  console.log('  3. 参考 USAGE.md 文档');
  process.exit(1);
}