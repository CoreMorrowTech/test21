import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '串口UDP调试助手',
  description: '基于Web的串口和UDP调试工具',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}