// 環境配置
export const config = {
  // WebSocket 連接配置
  wsUrl: process.env.NODE_ENV === 'production' 
    ? `ws://175.41.231.205:80/ws`  // 生產環境：連接到您的 Lightsail IP
    : `ws://localhost:3001`,  // 開發環境：直接連接到後端
};
