/**
 * 统一构建配置
 * 管理 Web 和 Electron 版本的构建流程
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class BuildManager {
  constructor() {
    this.projectRoot = process.cwd();
    this.distDir = path.join(this.projectRoot, 'dist');
    this.outDir = path.join(this.projectRoot, 'out');
    this.nextDir = path.join(this.projectRoot, '.next');
  }

  // 清理构建目录
  clean() {
    console.log('🧹 清理构建目录...');
    
    const dirsToClean = [this.distDir, this.outDir, this.nextDir];
    
    dirsToClean.forEach(dir => {
      if (fs.existsSync(dir)) {
        try {
          if (process.platform === 'win32') {
            execSync(`rmdir /s /q "${dir}"`, { stdio: 'inherit' });
          } else {
            execSync(`rm -rf "${dir}"`, { stdio: 'inherit' });
          }
          console.log(`✅ 已清理: ${path.basename(dir)}`);
        } catch (error) {
          console.warn(`⚠️ 清理失败: ${path.basename(dir)} - ${error.message}`);
        }
      }
    });
  }

  // 构建 Web 版本
  async buildWeb() {
    console.log('🌐 构建 Web 版本...');
    
    try {
      // 设置环境变量
      process.env.BUILD_MODE = 'web';
      process.env.NEXT_TELEMETRY_DISABLED = '1';
      
      // 执行构建
      execSync('npm run build:web', { 
        stdio: 'inherit',
        env: { ...process.env, BUILD_MODE: 'web' }
      });
      
      // 验证构建结果
      const buildId = path.join(this.nextDir, 'BUILD_ID');
      const staticDir = path.join(this.nextDir, 'static');
      
      if (fs.existsSync(buildId) && fs.existsSync(staticDir)) {
        console.log('✅ Web 版本构建成功');
        return true;
      } else {
        throw new Error('构建文件不完整');
      }
    } catch (error) {
      console.error('❌ Web 版本构建失败:', error.message);
      return false;
    }
  }

  // 构建 Electron 版本
  async buildElectron() {
    console.log('⚡ 构建 Electron 版本...');
    
    try {
      // 设置环境变量
      process.env.BUILD_MODE = 'electron';
      process.env.NEXT_TELEMETRY_DISABLED = '1';
      
      // 执行构建
      execSync('npm run build:electron', { 
        stdio: 'inherit',
        env: { ...process.env, BUILD_MODE: 'electron' }
      });
      
      // 验证构建结果
      const indexHtml = path.join(this.outDir, 'index.html');
      const nextDir = path.join(this.outDir, '_next');
      
      if (fs.existsSync(indexHtml) && fs.existsSync(nextDir)) {
        console.log('✅ Electron 版本构建成功');
        return true;
      } else {
        throw new Error('构建文件不完整');
      }
    } catch (error) {
      console.error('❌ Electron 版本构建失败:', error.message);
      return false;
    }
  }

  // 打包 Electron 应用
  async packageElectron(platform = 'current') {
    console.log(`📦 打包 Electron 应用 (${platform})...`);
    
    try {
      // 确保先构建了 Electron 版本
      if (!fs.existsSync(this.outDir)) {
        console.log('📋 先构建 Electron 版本...');
        const buildSuccess = await this.buildElectron();
        if (!buildSuccess) {
          throw new Error('Electron 构建失败，无法继续打包');
        }
      }
      
      // 根据平台选择打包命令
      let packCommand;
      switch (platform) {
        case 'win':
          packCommand = 'npm run dist:win';
          break;
        case 'mac':
          packCommand = 'npm run dist:mac';
          break;
        case 'linux':
          packCommand = 'npm run dist:linux';
          break;
        default:
          packCommand = 'npm run pack'; // 仅打包不制作安装包
      }
      
      execSync(packCommand, { stdio: 'inherit' });
      
      console.log('✅ Electron 应用打包成功');
      return true;
    } catch (error) {
      console.error('❌ Electron 应用打包失败:', error.message);
      return false;
    }
  }

  // 开发模式启动
  async startDev() {
    console.log('🚀 启动开发模式...');
    
    try {
      // 设置开发环境变量
      process.env.NODE_ENV = 'development';
      
      // 启动开发服务器
      execSync('npm run dev', { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ 开发模式启动失败:', error.message);
    }
  }

  // 生产模式启动
  async startProd(mode = 'web') {
    console.log(`🌟 启动生产模式 (${mode})...`);
    
    try {
      let startCommand;
      switch (mode) {
        case 'web':
          startCommand = 'npm run start:web';
          break;
        case 'electron':
          startCommand = 'npm run start:electron';
          break;
        default:
          startCommand = 'npm run start';
      }
      
      execSync(startCommand, { stdio: 'inherit' });
    } catch (error) {
      console.error(`❌ ${mode} 模式启动失败:`, error.message);
    }
  }

  // 运行测试
  async runTests() {
    console.log('🧪 运行测试...');
    
    try {
      execSync('npm test', { stdio: 'inherit' });
      console.log('✅ 测试通过');
      return true;
    } catch (error) {
      console.error('❌ 测试失败:', error.message);
      return false;
    }
  }

  // 完整构建流程
  async buildAll() {
    console.log('🏗️ 开始完整构建流程...');
    
    const startTime = Date.now();
    let webSuccess = false;
    let electronSuccess = false;
    
    try {
      // 清理
      this.clean();
      
      // 构建 Web 版本
      webSuccess = await this.buildWeb();
      
      // 构建 Electron 版本
      electronSuccess = await this.buildElectron();
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log('\n📊 构建结果汇总:');
      console.log(`Web 版本: ${webSuccess ? '✅ 成功' : '❌ 失败'}`);
      console.log(`Electron 版本: ${electronSuccess ? '✅ 成功' : '❌ 失败'}`);
      console.log(`总耗时: ${duration}s`);
      
      if (webSuccess && electronSuccess) {
        console.log('🎉 所有版本构建成功！');
        return true;
      } else {
        console.log('⚠️ 部分版本构建失败');
        return false;
      }
    } catch (error) {
      console.error('❌ 构建流程出错:', error.message);
      return false;
    }
  }

  // 获取构建信息
  getBuildInfo() {
    const info = {
      timestamp: new Date().toISOString(),
      platform: process.platform,
      nodeVersion: process.version,
      webBuilt: fs.existsSync(this.nextDir),
      electronBuilt: fs.existsSync(this.outDir),
      packaged: fs.existsSync(this.distDir)
    };
    
    console.log('📋 构建信息:', info);
    return info;
  }
}

// 命令行接口
if (require.main === module) {
  const buildManager = new BuildManager();
  const command = process.argv[2];
  
  switch (command) {
    case 'clean':
      buildManager.clean();
      break;
    case 'web':
      buildManager.buildWeb();
      break;
    case 'electron':
      buildManager.buildElectron();
      break;
    case 'package':
      buildManager.packageElectron(process.argv[3]);
      break;
    case 'dev':
      buildManager.startDev();
      break;
    case 'start':
      buildManager.startProd(process.argv[3]);
      break;
    case 'test':
      buildManager.runTests();
      break;
    case 'all':
      buildManager.buildAll();
      break;
    case 'info':
      buildManager.getBuildInfo();
      break;
    default:
      console.log(`
🔧 构建管理器使用说明:

命令:
  clean              清理构建目录
  web                构建 Web 版本
  electron           构建 Electron 版本
  package [platform] 打包 Electron 应用 (win/mac/linux)
  dev                启动开发模式
  start [mode]       启动生产模式 (web/electron)
  test               运行测试
  all                完整构建流程
  info               显示构建信息

示例:
  node build-config.js clean
  node build-config.js all
  node build-config.js package win
      `);
  }
}

module.exports = BuildManager;