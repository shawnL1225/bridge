import React from 'react';
import { Player } from '../App';
import './WaitingRoom.css';

interface WaitingRoomProps {
  message: string;
  players: Player[];
  playerId: string;
  isReady: boolean;
  onReady: () => void;
  onLeaveRoom: () => void;
  onCancelReady: () => void;
  onResortPlayers?: () => void;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({
  message,
  players,
  playerId,
  isReady,
  onReady,
  onLeaveRoom,
  onCancelReady,
  onResortPlayers
}) => {
  // 添加log來確認props變化
  console.log('WaitingRoom渲染 - players:', players.map(p => p.name));
  console.log('WaitingRoom渲染 - players順序:', players.map((p, i) => `${i}: ${p.name}`));
  // 檢查當前玩家是否為index 0（房間創建者）
  const isRoomCreator = players.length > 0 && players[0].id === playerId;
  console.log('isRoomCreator:', isRoomCreator, 'playerId:', playerId, 'firstPlayerId:', players[0]?.id);
  console.log('onResortPlayers存在:', !!onResortPlayers);
  return (
    <div className="waiting-room">
      {message && (
      <div className="broadcast-announcement">
        <span className="broadcast-icon">📢</span>
        <span className="broadcast-label">系統廣播：</span>
        <span className="waiting-message-text">{message}</span>
      </div>
      )}
      <div className="players-container">
        {/* 使用 map 迴圈渲染所有玩家 */}
        {players.map((player, index) => {
          console.log(`渲染玩家 ${index}: ${player.name} (key: ${player.id}-${index})`);
          return (
          <div 
            key={`${player.id}-${index}`} 
            className={`player ${player.ready ? 'player-shining' : ''}`}
          >
            <div className="player-info-container">
              <div className="player-label">
                {player.id === playerId ? (
                  <span className="my-label">👤 我</span>
                ) : (
                  <span className="other-label">玩家 {index + 1}</span>
                )}
              </div>
              
              <h3 className="player-name">
                {player.name}
              </h3>
              
              <div className="player-status">
                <p className="ready-text">
                  {player.ready ? '已準備' : '未準備'}
                </p>
              </div>
            </div>
          </div>
          );
        })}
        
        {/* 顯示等待中的玩家格子 */}
        {Array.from({ length: 4 - players.length }, (_, index) => (
          <div key={`waiting-${index}`} className="player waiting-player">
            <div className="player-info-container">
              <div className="player-label">
              <span className="other-label">玩家 {players.length + index + 1}</span>
              </div>
              <h3 className="player-name">
              ⏳
              </h3>
              <div className="player-status">
                <p className="ready-text">等待玩家中
                </p>
              </div>

            </div>
          </div>
        )        )}
      </div>

      <div className="waiting-section">
        <p>等待所有玩家準備...</p>
        <div className="button-container">
          <div className="main-action">
            {!isReady ? (
              <button onClick={onReady} className="ready-btn">
                <i className="fas fa-check-circle"></i>
                準備
              </button>
            ) : (
              <button onClick={onCancelReady} className="cancel-ready-btn">
                <i className="fas fa-times-circle"></i>
                取消準備
              </button>
            )}
            
            {/* 只有房間創建者可以看到重新排列按鈕 */}
            {isRoomCreator && onResortPlayers && (
              <button onClick={() => {
                console.log('WaitingRoom: 重新排列按鈕被點擊');
                onResortPlayers();
              }} className="resort-btn">
                <i className="fas fa-random"></i>
                玩家順序
              </button>
            )}
          </div>

          <button onClick={onLeaveRoom} className="leave-btn">
            <i className="fas fa-sign-out-alt leave-icon"></i>
            離開房間
          </button>

        </div>
      </div>
    </div>
  );
};

export default WaitingRoom;
