# 使用輕量 Alpine + Chromium (~500MB)
FROM node:20-alpine

# 安裝 Chromium 和必要依賴
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-cjk \
    curl

# 設定 Puppeteer 使用系統 Chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# 設定工作目錄
WORKDIR /app

# 複製 package 檔案
COPY package*.json ./

# 安裝依賴
RUN npm ci --omit=dev

# 複製應用程式碼
COPY . .

# 設定環境變數
ENV NODE_ENV=production
ENV PORT=3000

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 暴露端口
EXPOSE 3000

# 啟動應用
CMD ["node", "server.js"]
