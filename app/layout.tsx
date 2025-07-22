import type { Metadata } from 'next'
import './globals.css'
import { PlatformProvider } from '@/components/PlatformProvider'

export const metadata: Metadata = {
  title: '串口UDP调试助手',
  description: '基于Next.js的串口和UDP通信调试工具，支持Web和Electron环境',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <PlatformProvider>
          {children}
        </PlatformProvider>
      </body>
    </html>
  )
}