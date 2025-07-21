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
  }
}

module.exports = nextConfig