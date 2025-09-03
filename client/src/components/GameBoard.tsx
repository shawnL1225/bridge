import React from 'react';
import { Player, Card } from '../App';
import './GameBoard.css';

interface GameBoardProps {
  message: string;
  players: Player[];
  playerId: string;
  currentPlayer: string;
  myHand: Card[];
  playedCards: Card[];
  isMyTurn: boolean;
  onPlayCard: (cardIndex: number) => void;
  // 添加每個玩家的出牌信息
  playerPlayedCards?: { [playerId: string]: Card[] };
}

const GameBoard: React.FC<GameBoardProps> = ({
  message,
  players,
  playerId,
  currentPlayer,
  myHand,
  isMyTurn,
  onPlayCard,
  playerPlayedCards
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

            return (
              <div key={player.id} className={`player ${positionClass} ${player.id === currentPlayer ? 'current-player' : ''}`}>
                {/* 只顯示其他玩家的玩家信息，自己不顯示 */}
                {player.id !== playerId && (
                  <div className="player-info-container">
                    <div className="player-label">
                      <span className="other-label">{positionLabel}</span>
                    </div>

                    <h3 className="player-name">
                      {player.name}
                    </h3>

                    {player.id === currentPlayer && (
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
                        <div key={cardIndex} className={`card played-card ${getCardColor(card.suit)}`}>
                          {card.suit}{card.rank}
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
            </div>
          </div>
        )}
      </div>

      {/* 第一視角手牌區域 - 固定在畫面最下方 */}
      <div className="first-person-hand">
        <div className="hand-title">我的手牌</div>
        <div className="hand-container">
          {myHand.map((card, index) => (
            <button
              key={index}
              className={`hand-card-3d ${getCardColor(card.suit)} ${isMyTurn ? 'clickable' : ''}`}
              onClick={() => onPlayCard(index)}
              disabled={!isMyTurn}
            >
              {card.suit}{card.rank}
            </button>
          ))}
        </div>
        {isMyTurn && <div className="turn-indicator-3d">輪到您出牌了！</div>}
      </div>
    </>
  );
};

export default GameBoard;
