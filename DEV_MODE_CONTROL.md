# 開發模式控制指南

## 🚀 快速啟用/關閉

### 方法一：修改配置文件（最簡單）

在 `client/src/config/devConfig.ts` 第 4 行：

```typescript
export const DEV_CONFIG = {
  // 🔥 快速開關：設為 false 完全關閉開發模式
  ENABLED: true, // 設為 false 關閉開發模式，true 啟用
};
```

**啟用開發模式**：`ENABLED: true`
**關閉開發模式**：`ENABLED: false`

## 📋 開發模式功能

### 啟用時會：
- ✅ 跳過大廳直接進入遊戲房間
- ✅ 顯示模擬數據（玩家、手牌、墩記錄等）
- ✅ 右上角顯示開發模式提示
- ✅ 根據設定的遊戲狀態顯示對應畫面

### 關閉時會：
- ✅ 正常從大廳開始遊戲流程
- ✅ 連接真實的 WebSocket 伺服器
- ✅ 使用真實的遊戲數據
- ✅ 隱藏所有開發模式提示

## 🎮 開發模式設定選項

```typescript
export const DEV_CONFIG = {
  // 主開關
  ENABLED: true,
  
  // 要測試的畫面
  GAME_STATE: 'finished', // 'waiting' | 'bidding' | 'playing' | 'finished'
  
  // 是否跳過大廳
  SKIP_TO_GAMEROOM: true,
  
  // 模擬玩家名稱
  PLAYER_NAME: '測試玩家',
  
  // 模擬房間 ID
  ROOM_ID: 'test-room'
};
```

## 🔄 常用切換場景

### 1. 測試特定畫面
```typescript
ENABLED: true,
GAME_STATE: 'finished', // 切換到要測試的畫面
```

### 2. 測試完整流程
```typescript
ENABLED: false, // 關閉開發模式
```

### 3. 測試大廳到遊戲的流程
```typescript
ENABLED: true,
SKIP_TO_GAMEROOM: false, // 不跳過大廳
```

## ⚠️ 注意事項

1. **生產環境**：開發模式只在開發環境生效，生產環境會自動關閉
2. **數據隔離**：開發模式使用模擬數據，不會影響真實遊戲
3. **伺服器連接**：開發模式下不會連接真實的 WebSocket 伺服器
4. **熱重載**：修改配置後會自動重新載入頁面

## 🛠️ 進階設定

### 環境變數方式
```bash
# 啟用開發模式
DEV_MODE=true npm start

# 關閉開發模式
DEV_MODE=false npm start
```

### 條件啟用
```typescript
export const DEV_CONFIG = {
  // 只在特定條件下啟用
  ENABLED: process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost',
};
```
