// 開發模式配置
export const DEV_CONFIG = {

  // ENABLED: process.env.NODE_ENV === 'development',
  ENABLED: false,
  // 當前要測試的遊戲狀態
  GAME_STATE: 'waiting' as 'waiting' | 'bidding' | 'playing' | 'finished',
  
  // 是否跳過大廳直接進入遊戲房間
  SKIP_TO_GAMEROOM: true,
  
  // 模擬玩家名稱
  PLAYER_NAME: '測試玩家',
  
  // 模擬房間 ID
  ROOM_ID: 'test-room'
};

// 開發模式提示信息
export const DEV_MESSAGES = {
  waiting: '等待房間畫面',
  bidding: '叫墩畫面',
  playing: '遊戲進行畫面',
  finished: '遊戲結束畫面'
};
