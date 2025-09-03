import React from 'react';
import { Player, Card } from '../App';
import './GameBoard.css';

interface GameBoardProps {
  players: Player[];
  playerId: string;
  currentPlayer: string;
  myHand: Card[];
  playedCards: Card[];
  isMyTurn: boolean;
  onPlayCard: (cardIndex: number) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
  players,
  playerId,
  currentPlayer,
  myHand,
  playedCards,
  isMyTurn,
  onPlayCard
}) => {
  const getCardColor = (suit: string): string => {
    return suit === '♥' || suit === '♦' ? 'red' : 'black';
  };

  return (
    <>
      <div className="players-container">
        {/* 動態顯示其他玩家，根據他們在players陣列中的位置 */}
        {(() => {
          const playerIdx = players.findIndex(player => player.id === playerId);
          
          return players.map((player, index) => {
            // 跳過自己
            if (player.id === playerId) return null;
            
            // 計算相對位置：(index - playerIdx + 4) % 4
            // 0=自己, 1=左, 2=上, 3=右
            const relativePosition = (index - playerIdx + 4) % 4;
            // 調整位置分配以符合遊戲順序：自己>左>上>右
            let positionClass = '';
            let positionLabel = '';
            
            if (relativePosition === 1) {
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
                <div className="player-info-container">
                  <div className="player-label">
                    <span className="other-label">{positionLabel}</span>
                  </div>
                  
                  <h3 className="player-name">
                    {player.name}
                  </h3>
                  
                  {player.id === currentPlayer && (
                    <div className="current-turn-indicator">
                      🎯 當前回合
                    </div>
                  )}
                </div>
              </div>
            );
          });
        })()}
      </div>

      <div className="game-section">
        <div className="played-cards">
          <h3>已出的牌</h3>
          <div className="cards-display">
            {playedCards.map((card, index) => (
              <div key={index} className={`card played-card ${getCardColor(card.suit)}`}>
                {card.suit}{card.rank}
              </div>
            ))}
          </div>
        </div>
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
