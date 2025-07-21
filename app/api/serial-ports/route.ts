import { NextRequest } from 'next/server';
import { hardwareManager } from '@/lib/hardware-manager';

// 获取可用串口列表
export async function GET(request: NextRequest) {
  try {
    const ports = await hardwareManager.getAvailableSerialPorts();
    
    return Response.json({
      success: true,
      ports: ports
    });
  } catch (error) {
    console.error('获取串口列表失败:', error);
    return Response.json({
      success: false,
      error: `获取串口列表失败: ${error}`,
      ports: []
    }, { status: 500 });
  }
}