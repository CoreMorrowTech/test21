# 多阶段构建 - 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 设置 npm 国内镜像源和网络配置
RUN npm config set registry https://registry.npmmirror.com && \
    npm config set fetch-timeout 60000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

# 复制 package 文件
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build:web

# 生产阶段
FROM node:18-alpine AS production

# 设置工作目录
WORKDIR /app

# 设置 npm 国内镜像源
RUN npm config set registry https://registry.npmmirror.com

# 复制 package 文件
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# 从构建阶段复制构建产物
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# 复制其他必要文件
COPY next.config.js ./
COPY --from=builder /app/node_modules ./node_modules

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 设置文件权限
RUN chown -R nextjs:nodejs /app
USER nextjs

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 启动应用
CMD ["npm", "start"]