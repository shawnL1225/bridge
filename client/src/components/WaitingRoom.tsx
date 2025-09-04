import React from 'react';
import { Player } from '../App';
import './WaitingRoom.css';

interface WaitingRoomProps {
  message: string;
  players: Player[];
  playerId: string;
  isReady: boolean;
  onReady: () => void;
  onCancelReady: () => void;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({
  message,
  players,
  playerId,
  isReady,
  onReady,
  onCancelReady
}) => {
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
        {players.map((player, index) => (
          <div 
            key={player.id} 
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
                <p className="status-text">
                  {player.ready ? '已準備' : '未準備'}
                </p>
              </div>
            </div>
          </div>
        ))}
        
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
                <p className="status-text">等待玩家中
                </p>
              </div>

            </div>
          </div>
        )        )}
      </div>

      <div className="waiting-section">
        <p>等待所有玩家準備...</p>
        {!isReady ? (
          <button onClick={onReady} className="ready-btn">
            準備
          </button>
        ) : (
          <button onClick={onCancelReady} className="cancel-ready-btn">
            取消準備
          </button>
        )}
      </div>
    </div>
  );
};

export default WaitingRoom;
