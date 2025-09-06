# 🐳 橋牌遊戲 Docker 部署指南

## 📋 部署選項

### 🚀 快速部署
```bash
# 使用部署腳本
./deploy.sh

# 或使用 npm 腳本
npm run deploy
```

### 🔧 手動部署

#### 開發環境 (熱重載)
```bash
# 啟動開發環境
docker-compose -f docker-compose.dev.yml up --build

# 或使用 npm 腳本
npm run docker:dev
```

#### 生產環境 (優化構建)
```bash
# 啟動生產環境
docker-compose -f docker-compose.prod.yml up --build -d

# 或使用 npm 腳本
npm run docker:prod
```

## 🌐 訪問地址

### 開發環境
- **前端**: http://localhost:3000
- **後端**: http://localhost:3001
- **健康檢查**: http://localhost:3001/health

### 生產環境
- **前端**: http://localhost:80
- **後端**: http://localhost:3001
- **健康檢查**: http://localhost:3001/health

## 🛠️ 常用命令

```bash
# 停止所有容器
docker-compose down

# 查看容器狀態
docker-compose ps

# 查看日誌
docker-compose logs -f

# 重新構建並啟動
docker-compose up --build

# 清理未使用的 Docker 資源
docker system prune -f
```

## 📁 專案結構

```
projects/bridge/
├── client/                 # React 前端
│   ├── Dockerfile         # 生產環境 Dockerfile
│   ├── Dockerfile.dev     # 開發環境 Dockerfile
│   ├── nginx.conf         # Nginx 配置
│   └── ...
├── server/                # Express 後端
│   ├── Dockerfile         # 生產環境 Dockerfile
│   ├── Dockerfile.dev     # 開發環境 Dockerfile
│   ├── healthcheck.js     # 健康檢查
│   └── ...
├── docker-compose.yml     # 主要配置
├── docker-compose.dev.yml # 開發環境配置
├── docker-compose.prod.yml# 生產環境配置
├── deploy.sh             # 部署腳本
└── .dockerignore         # Docker 忽略文件
```

## 🔧 配置說明

### 前端 (React + Nginx)
- 使用多階段構建優化鏡像大小
- Nginx 提供靜態文件服務
- 支持 React Router (SPA)
- WebSocket 和 API 代理到後端

### 後端 (Express + WebSocket)
- Node.js 18 Alpine 鏡像
- 健康檢查支持
- 非 root 用戶運行
- 自動重啟策略

### 網路配置
- 自定義 bridge 網路
- 容器間通信
- 端口映射

## 🚨 故障排除

### 常見問題

1. **端口被佔用**
   ```bash
   # 檢查端口使用情況
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :3001
   ```

2. **容器無法啟動**
   ```bash
   # 查看詳細日誌
   docker-compose logs [service-name]
   ```

3. **WebSocket 連接失敗**
   - 檢查 nginx 配置中的 WebSocket 代理設置
   - 確認後端服務正常運行

4. **清理 Docker 資源**
   ```bash
   # 停止並刪除容器
   docker-compose down
   
   # 清理未使用的鏡像
   docker image prune -f
   
   # 清理所有未使用的資源
   docker system prune -f
   ```

## 📝 環境變數

### 開發環境
- `NODE_ENV=development`
- `CHOKIDAR_USEPOLLING=true` (文件監聽)

### 生產環境
- `NODE_ENV=production`
- `PORT=3001` (後端端口)

## 🔒 安全建議

1. 使用非 root 用戶運行容器
2. 定期更新基礎鏡像
3. 限制容器資源使用
4. 使用 secrets 管理敏感信息

## 📊 監控

```bash
# 查看容器資源使用
docker stats

# 查看容器健康狀態
docker-compose ps
```

---

**享受您的橋牌遊戲！** 🃏
