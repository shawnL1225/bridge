import React from 'react';
import { Player } from '../App';
import './WaitingRoom.css';

interface WaitingRoomProps {
  players: Player[];
  playerId: string;
  isReady: boolean;
  onReady: () => void;
  onCancelReady: () => void;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({
  players,
  playerId,
  isReady,
  onReady,
  onCancelReady
}) => {
  return (
    <div className="waiting-room">
      <div className="players-container">
        {/* 玩家 1 */}
        {players.length >= 1 && (
          <div className={`player ${players[0].ready ? 'ready' : ''}`}>
            <div className="player-info-container">
              <div className="player-label">
                {players[0].id === playerId ? (
                  <span className="my-label">👤 我</span>
                ) : (
                  <span className="other-label">玩家 1</span>
                )}
              </div>
              
              <h3 className="player-name">
                {players[0].name}
              </h3>
              
              <div className="player-status">
                <p className="status-text">
                  {players[0].ready ? '已準備' : '未準備'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* 玩家 2 */}
        {players.length >= 2 && (
          <div className={`player ${players[1].ready ? 'ready' : ''}`}>
            <div className="player-info-container">
              <div className="player-label">
                {players[1].id === playerId ? (
                  <span className="my-label">👤 我</span>
                ) : (
                  <span className="other-label">玩家 2</span>
                )}
              </div>
              
              <h3 className="player-name">
                {players[1].name}
              </h3>
              
              <div className="player-status">
                <p className="status-text">
                  {players[1].ready ? '已準備' : '未準備'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* 玩家 3 */}
        {players.length >= 3 && (
          <div className={`player ${players[2].ready ? 'ready' : ''}`}>
            <div className="player-info-container">
              <div className="player-label">
                {players[2].id === playerId ? (
                  <span className="my-label">👤 我</span>
                ) : (
                  <span className="other-label">玩家 3</span>
                )}
              </div>
              
              <h3 className="player-name">
                {players[2].name}
              </h3>
              
              <div className="player-status">
                <p className="status-text">
                  {players[2].ready ? '已準備' : '未準備'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* 玩家 4 */}
        {players.length >= 4 && (
          <div className={`player ${players[3].ready ? 'ready' : ''}`}>
            <div className="player-info-container">
              <div className="player-label">
                {players[3].id === playerId ? (
                  <span className="my-label">👤 我</span>
                ) : (
                  <span className="other-label">玩家 4</span>
                )}
              </div>
              
              <h3 className="player-name">
                {players[3].name}
              </h3>
              
              <div className="player-status">
                <p className="status-text">
                  {players[3].ready ? '已準備' : '未準備'}
                </p>
              </div>
            </div>
          </div>
        )}
        
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
