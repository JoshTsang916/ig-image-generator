# 使用官方 Puppeteer 映像 (已包含 Chrome)
FROM ghcr.io/puppeteer/puppeteer:24.0.0

# 設定工作目錄
WORKDIR /app

# 複製 package 檔案
COPY package*.json ./

# 安裝依賴 (使用映像內建的 Chrome)
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
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
