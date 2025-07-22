/**
 * 平台检测和适配层
 * 统一处理 Electron 和 Web 环境的差异
 */

export type PlatformType = 'electron' | 'web';

// 检测当前运行环境
export const detectPlatform = (): PlatformType => {
  if (typeof window !== 'undefined') {
    // 检查是否在 Electron 环境中
    return (window as any).require ? 'electron' : 'web';
  }
  return 'web';
};

export const platform = detectPlatform();

// 平台特定的功能适配器
export class PlatformAdapter {
  static isElectron(): boolean {
    return platform === 'electron';
  }

  static isWeb(): boolean {
    return platform === 'web';
  }

  // 文件操作适配
  static async saveFile(filename: string, content: string): Promise<void> {
    if (PlatformAdapter.isElectron()) {
      // Electron 环境：使用预加载脚本的 API
      try {
        const electronAPI = (window as any).electronAPI;
        if (electronAPI && electronAPI.saveFile) {
          const result = await electronAPI.saveFile(filename, content);
          if (!result.success) {
            throw new Error(result.error);
          }
        } else {
          throw new Error('Electron API 不可用');
        }
      } catch (error) {
        console.error('文件保存失败:', error);
        throw error;
      }
    } else {
      // Web 环境：使用下载链接
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  // 通知适配
  static showNotification(title: string, body: string): void {
    if (PlatformAdapter.isElectron()) {
      // Electron 环境：使用预加载脚本的 API
      try {
        const electronAPI = (window as any).electronAPI;
        if (electronAPI && electronAPI.showNotification) {
          electronAPI.showNotification(title, body);
        } else {
          // 降级到 Web 通知 API
          console.warn('Electron API 不可用，使用 Web 通知 API');
          PlatformAdapter.showWebNotification(title, body);
        }
      } catch (error) {
        // 降级到 Web 通知 API
        console.warn('Electron 通知失败，使用 Web 通知 API:', error);
        PlatformAdapter.showWebNotification(title, body);
      }
    } else {
      // Web 环境：使用浏览器通知 API
      PlatformAdapter.showWebNotification(title, body);
    }
  }

  // Web 通知的具体实现
  private static showWebNotification(title: string, body: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      });
    }
  }

  // 窗口控制适配
  static minimizeWindow(): void {
    if (PlatformAdapter.isElectron()) {
      try {
        const electronAPI = (window as any).electronAPI;
        if (electronAPI && electronAPI.minimizeWindow) {
          electronAPI.minimizeWindow();
        } else {
          console.warn('Electron API 不可用，无法最小化窗口');
        }
      } catch (error) {
        console.warn('无法最小化窗口:', error);
      }
    }
  }

  static closeWindow(): void {
    if (PlatformAdapter.isElectron()) {
      try {
        const electronAPI = (window as any).electronAPI;
        if (electronAPI && electronAPI.closeWindow) {
          electronAPI.closeWindow();
        } else {
          console.warn('Electron API 不可用，无法关闭窗口');
        }
      } catch (error) {
        console.warn('无法关闭窗口:', error);
      }
    } else {
      window.close();
    }
  }

  // 获取应用信息
  static getAppInfo(): { name: string; version: string; platform: string } {
    if (PlatformAdapter.isElectron()) {
      // 在 Electron 环境中，返回默认信息，实际信息可以通过异步方法获取
      return {
        name: 'Serial UDP Debugger',
        version: '0.1.0',
        platform: 'Electron'
      };
    } else {
      return {
        name: 'Serial UDP Debugger',
        version: '0.1.0',
        platform: 'Web'
      };
    }
  }

  // 异步获取应用信息（仅 Electron）
  static async getAppInfoAsync(): Promise<{ name: string; version: string; platform: string }> {
    if (PlatformAdapter.isElectron()) {
      try {
        const electronAPI = (window as any).electronAPI;
        if (electronAPI && electronAPI.getAppInfo) {
          const appInfo = await electronAPI.getAppInfo();
          return {
            name: appInfo.name,
            version: appInfo.version,
            platform: 'Electron'
          };
        }
      } catch (error) {
        console.warn('无法获取 Electron 应用信息:', error);
      }
    }
    
    // 降级到同步方法
    return PlatformAdapter.getAppInfo();
  }
}

// 导出便捷方法
export const {
  isElectron,
  isWeb,
  saveFile,
  showNotification,
  minimizeWindow,
  closeWindow,
  getAppInfo
} = PlatformAdapter;