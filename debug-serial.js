// 串口调试脚本
const { SerialPort } = require('serialport');

async function debugSerial() {
  console.log('=== 串口调试信息 ===');
  
  // 1. 检查 serialport 模块
  try {
    console.log('✓ serialport 模块已加载');
    console.log('SerialPort 版本:', require('serialport/package.json').version);
  } catch (error) {
    console.error('✗ serialport 模块加载失败:', error.message);
    return;
  }

  // 2. 获取可用串口列表
  try {
    console.log('\n=== 可用串口列表 ===');
    const ports = await SerialPort.list();
    
    if (ports.length === 0) {
      console.log('⚠ 未找到任何串口设备');
    } else {
      ports.forEach((port, index) => {
        console.log(`${index + 1}. ${port.path}`);
        console.log(`   制造商: ${port.manufacturer || '未知'}`);
        console.log(`   序列号: ${port.serialNumber || '未知'}`);
        console.log(`   PnP ID: ${port.pnpId || '未知'}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('✗ 获取串口列表失败:', error.message);
  }

  // 3. 测试串口连接（如果有可用端口）
  try {
    const ports = await SerialPort.list();
    if (ports.length > 0) {
      const testPort = ports[0].path;
      console.log(`=== 测试串口连接: ${testPort} ===`);
      
      const port = new SerialPort({
        path: testPort,
        baudRate: 9600,
        autoOpen: false
      });

      port.on('error', (error) => {
        console.error('串口错误:', error.message);
      });

      // 尝试打开串口
      await new Promise((resolve, reject) => {
        port.open((error) => {
          if (error) {
            console.error('✗ 串口打开失败:', error.message);
            reject(error);
          } else {
            console.log('✓ 串口打开成功');
            port.close();
            resolve();
          }
        });
      });
    }
  } catch (error) {
    console.error('串口连接测试失败:', error.message);
  }

  // 4. 检查系统信息
  console.log('\n=== 系统信息 ===');
  console.log('操作系统:', process.platform);
  console.log('架构:', process.arch);
  console.log('Node.js 版本:', process.version);
  console.log('当前工作目录:', process.cwd());
}

// 运行诊断
debugSerial().catch(console.error);