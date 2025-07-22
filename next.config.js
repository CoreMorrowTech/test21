/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 14
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 排除原生模块，避免在客户端打包
      config.externals = config.externals || [];
      config.externals.push('serialport');
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['serialport']
  },
  // 根据环境变量决定是否导出静态文件
  ...(process.env.BUILD_MODE === 'electron' && {
    output: 'export',
    distDir: 'out',
    images: {
      unoptimized: true,
    },
    trailingSlash: true
  })
}

module.exports = nextConfig