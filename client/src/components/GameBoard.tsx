import React from 'react';
import { Player, Card } from '../App';
import './GameBoard.css';

interface GameBoardProps {
  message: string;
  players: Player[];
  playerId: string;
  currentPlayer: string | null;  // 允許為 null（墩完成時）
  myHand: Card[];
  playedCards: Card[];
  isMyTurn: boolean;
  onPlayCard: (cardIndex: number) => void;
  // 添加每個玩家的出牌信息
  playerPlayedCards?: { [playerId: string]: Card[] };
  // 添加墩贏家資訊，用於閃光效果
  trickWinner?: { playerId: string; playerName: string } | null;
  // 添加墩完成狀態，用於禁用出牌
  isTrickCompleted: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({
  message,
  players,
  playerId,
  currentPlayer,
  myHand,
  isMyTurn,
  onPlayCard,
  playerPlayedCards,
  trickWinner,
  isTrickCompleted
}) => {
  const getCardColor = (suit: string): string => {
    return suit === '♥' || suit === '♦' ? 'red' : 'black';
  };

  return (
    <>
            <div className="game-board">
        {/* 動態顯示其他玩家，根據他們在players陣列中的位置 */}
        {(() => {
          const playerIdx = players.findIndex(player => player.id === playerId);

          return players.map((player, index) => {
            // 計算相對位置：(index - playerIdx + 4) % 4
            // 0=自己, 1=左, 2=上, 3=右
            const relativePosition = (index - playerIdx + 4) % 4;
            // 調整位置分配以符合遊戲順序：自己>左>上>右
            let positionClass = '';
            let positionLabel = '';
            if (relativePosition === 0) {
              positionClass = 'bottom';
              positionLabel = '自己';
            } else if (relativePosition === 1) {
              positionClass = 'left';
              positionLabel = '左方玩家';
            } else if (relativePosition === 2) {
              positionClass = 'top';
              positionLabel = '上方玩家';
            } else if (relativePosition === 3) {
              positionClass = 'right';
              positionLabel = '右方玩家';
            }

            // 檢查是否為贏家
            const isWinner = trickWinner?.playerId === player.id;

            return (
              <div key={player.id} className={`player ${positionClass} ${currentPlayer && player.id === currentPlayer ? 'current-player' : ''} ${isWinner ? 'winner-player' : ''}`}>
                {/* 只顯示其他玩家的玩家信息，自己不顯示 */}
                {player.id !== playerId && (
                  <div className={`player-info-container ${isWinner ? 'winner-info-glow' : ''}`}>
                    <div className="player-label">
                      <span className="other-label">{positionLabel}</span>
                    </div>

                    <h3 className={`player-name ${isWinner ? 'winner-name-glow' : ''}`}>
                      {player.name}
                    </h3>

                    {currentPlayer && player.id === currentPlayer && (
                      <div className="current-turn-indicator">
                        當前
                      </div>
                    )}
                  </div>
                )}

                {/* 玩家出牌區域 - 所有玩家都顯示 */}
                <div className="player-played-cards">
                  {playerPlayedCards && playerPlayedCards[player.id] && playerPlayedCards[player.id].length > 0 && (
                    <div className="cards-display">
                      {playerPlayedCards[player.id].map((card: Card, cardIndex: number) => (
                        <div 
                          key={cardIndex} 
                          className={`card played-card ${getCardColor(card.suit)} ${isWinner ? 'winner-played-card-glow' : ''}`}
                        >
                          {isWinner && (
                            <>
                              <span className="sparkle sparkle-1">✨</span>
                              <span className="sparkle sparkle-2">✨</span>
                              <span className="sparkle sparkle-3">✨</span>
                              <span className="sparkle sparkle-4">✨</span>
                            </>
                          )}
                          <span className="card-content">
                            {card.suit}{card.rank}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          });
        })()}

        {/* 遊戲訊息顯示區域 - Grid 中間位置 */}
        {message && (
          <div className="game-message-center">
            <div className="message-content">
              <span className="message-text">{message}</span>
              {/* 當 currentPlayer 為 null 且有出牌時，顯示等待判定狀態 */}
              {!currentPlayer && playerPlayedCards && Object.keys(playerPlayedCards).some(pid => playerPlayedCards[pid]?.length > 0) && (
                <div className="trick-judging-indicator">
                  ⏳ 正在判定墩的贏家...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 第一視角手牌區域 - 固定在畫面最下方 */}
      <div className="first-person-hand">
        <div className="hand-title">我的手牌</div>
        <div className={`hand-container ${trickWinner?.playerId === playerId ? 'winner-glow' : ''}`}>
          {myHand.map((card, index) => (
            <button
              key={index}
              className={`hand-card-3d ${getCardColor(card.suit)} ${isMyTurn && !isTrickCompleted ? 'clickable' : ''} ${trickWinner?.playerId === playerId ? 'winner-card-glow' : ''}`}
              onClick={() => onPlayCard(index)}
              disabled={!isMyTurn || isTrickCompleted}
            >
              {card.suit}{card.rank}
            </button>
          ))}
        </div>
        {isMyTurn && !isTrickCompleted && <div className="turn-indicator-3d">輪到您出牌了！</div>}
        {trickWinner?.playerId === playerId && (
          <div className="winner-message">🎉 您贏得了這一墩！ 🎉</div>
        )}
      </div>
    </>
  );
};

export default GameBoard;
