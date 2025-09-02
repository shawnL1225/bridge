# ♠️ 撲克發牌系統 ♥️

一個完整的線上四人連線撲克遊戲系統，使用 React + TypeScript + Node.js + WebSocket 技術開發。

## 🎮 遊戲特色

- **四人連線**：支援四個玩家同時遊戲
- **自動發牌**：系統隨機發牌給每位玩家
- **輪流出牌**：玩家依序出單張牌
- **即時通信**：使用 WebSocket 實現實時遊戲同步
- **響應式設計**：支援桌面和手機設備
- **美觀界面**：現代化的 UI 設計

## 🛠️ 技術架構

### 前端 (React + TypeScript)
- **React 18** - 現代化 React 框架
- **TypeScript** - 類型安全的 JavaScript
- **CSS3** - 現代化樣式和動畫效果
- **WebSocket** - 實時通信

### 後端 (Node.js)
- **Express.js** - Web 框架
- **ws** - WebSocket 伺服器
- **UUID** - 唯一標識符生成

## 🚀 快速開始

### 前置需求
- Node.js 16+ 
- npm 或 yarn

### 安裝依賴
```bash
# 安裝所有依賴（前端 + 後端）
npm run install-all
```

### 啟動開發環境
```bash
# 同時啟動前端和後端
npm run dev
```

或者分別啟動：

```bash
# 啟動後端伺服器
npm run server

# 啟動前端開發伺服器
npm run client
```

### 訪問應用
- **前端**：http://localhost:3000
- **後端**：http://localhost:3001
- **健康檢查**：http://localhost:3001/health

## 🎯 遊戲玩法

1. **加入房間**：輸入房間號和玩家名字
2. **等待玩家**：等待其他玩家加入（最多4人）
3. **準備遊戲**：所有玩家點擊「準備」按鈕
4. **開始遊戲**：系統自動發牌，每人13張
5. **輪流出牌**：玩家依序出單張牌
6. **遊戲結束**：最先出完所有牌的玩家獲勝

## 📁 項目結構

```
pokercard/
├── server/                 # 後端伺服器
│   ├── index.js           # 主伺服器文件
│   └── package.json       # 後端依賴
├── client/                 # 前端應用
│   ├── public/            # 靜態文件
│   ├── src/               # 源代碼
│   │   ├── components/    # React 組件
│   │   ├── App.tsx        # 主應用組件
│   │   └── index.tsx      # 入口文件
│   └── package.json       # 前端依賴
├── package.json            # 根依賴
└── README.md              # 項目說明
```

## 🔧 開發說明

### 後端 API
- `POST /` - WebSocket 連線
- `GET /health` - 健康檢查

### WebSocket 訊息格式
```typescript
// 加入房間
{ type: 'join_room', roomId: string, playerName: string }

// 準備遊戲
{ type: 'ready' }

// 出牌
{ type: 'play_card', cardIndex: number }
```

### 遊戲狀態
- `waiting` - 等待玩家準備
- `playing` - 遊戲進行中
- `finished` - 遊戲結束

## 🌐 部署說明

### 生產環境部署
```bash
# 構建前端
cd client && npm run build

# 啟動後端
cd server && npm start
```

### 環境變數
- `PORT` - 伺服器端口（預設：3001）

## 🤝 貢獻指南

1. Fork 本項目
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📝 授權

本項目採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 文件

## 🆘 問題回報

如果您遇到任何問題，請在 GitHub Issues 中回報。

## 🎉 致謝

感謝所有為此項目做出貢獻的開發者！

---

**享受您的撲克遊戲！** 🃏
