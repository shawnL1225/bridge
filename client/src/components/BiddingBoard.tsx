import React, { useState } from 'react';
import { Player, Card } from '../App';
import './BiddingBoard.css';

interface BiddingBoardProps {
  message: string;
  players: Player[];
  playerId: string;
  currentBidder: string | null;
  myHand: Card[];
  bids: Array<{
    playerId: string;
    playerName: string;
    level?: number;
    suit?: string;
    type: 'bid' | 'pass';
  }>;
  isMyTurn: boolean;
  onMakeBid: (level: number, suit: string) => void;
  onPass: () => void;
  finalContract?: {
    playerId: string;
    playerName: string;
    level: number;
    suit: string;
  } | null;
  trumpSuit?: string | null;
}

const BiddingBoard: React.FC<BiddingBoardProps> = ({
  message,
  players,
  playerId,
  currentBidder,
  myHand,
  bids,
  isMyTurn,
  onMakeBid,
  onPass,
  finalContract,
  trumpSuit
}) => {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [selectedSuit, setSelectedSuit] = useState<string>('♣');

  const suits = [
    { symbol: '♣', name: '梅花', color: 'black' },
    { symbol: '♦', name: '方塊', color: 'red' },
    { symbol: '♥', name: '紅心', color: 'red' },
    { symbol: '♠', name: '黑桃', color: 'black' },
    { symbol: 'NT', name: '無王牌', color: 'blue' }
  ];

  const levels = [1, 2, 3, 4, 5, 6, 7];

  const getCardColor = (suit: string): string => {
    return suit === '♥' || suit === '♦' ? 'red' : 'black';
  };

  // 獲取最後一個有效叫墩
  const getLastValidBid = () => {
    for (let i = bids.length - 1; i >= 0; i--) {
      if (bids[i].type === 'bid') {
        return bids[i];
      }
    }
    return null;
  };

  // 檢查叫墩是否有效
  const isValidBid = (level: number, suit: string) => {
    const lastBid = getLastValidBid();
    if (!lastBid) return true;

    const suitOrder = { 'NT': 4, '♠': 3, '♥': 2, '♦': 1, '♣': 0 };
    
    // 等級更高
    if (level > lastBid.level!) return true;
    
    // 等級相同但花色更高
    if (level === lastBid.level!) {
      return suitOrder[suit as keyof typeof suitOrder] > suitOrder[lastBid.suit! as keyof typeof suitOrder];
    }
    
    return false;
  };

  const handleBid = () => {
    if (isValidBid(selectedLevel, selectedSuit)) {
      onMakeBid(selectedLevel, selectedSuit);
    }
  };

  // 移除最終合約顯示界面，直接進入出牌

  return (
    <div className="bidding-board">
      {/* 動態顯示其他玩家，根據他們在players陣列中的位置 */}
      {(() => {
        const playerIdx = players.findIndex(player => player.id === playerId);

        return players.map((player, index) => {
          // 計算相對位置：(index - playerIdx + 4) % 4
          const relativePosition = (index - playerIdx + 4) % 4;
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
            <div key={player.id} className={`bidding-player ${positionClass} ${currentBidder && player.id === currentBidder ? 'current-bidder' : ''}`}>
              {/* 只顯示其他玩家的玩家信息，自己不顯示 */}
              {player.id !== playerId && (
                <div className="bidding-player-info">
                  <div className="player-label">
                    <span className="other-label">{positionLabel}</span>
                  </div>

                  <h3 className="player-name">
                    {player.name}
                  </h3>

                  {currentBidder && player.id === currentBidder && (
                    <div className="current-turn-indicator">
                      當前
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        });
      })()}

      {/* 叫墩歷史和遊戲訊息 - Grid 中間位置 */}
      <div className="bidding-center">
        <div className="bidding-message">
          <span className="message-text">{message}</span>
        </div>
        
        <div className="bidding-history">
          <h4>Bidding History</h4>
          <div className="bids-list">
            {
              bids.map((bid, index) => (
                <div key={index} className={`bid-item ${bid.type}`}>
                  <span className="bidder-name">{bid.playerName}</span>
                  {bid.type === 'bid' ? (
                    <span className="bid-content">
                      <span className="bid-level">{bid.level}</span>
                      <span className={`bid-suit ${bid.suit === 'NT' ? 'nt' : ''}`}>
                        {bid.suit}
                      </span>
                    </span>
                  ) : (
                    <span className="pass-text">Pass</span>
                  )}
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* 我的手牌和叫墩控制 - 固定在畫面最下方 */}
      <div className="my-bidding-area">
        <div className="hand-container">
          {myHand.map((card, index) => (
            <div
              key={index}
              className={`hand-card ${getCardColor(card.suit)}`}
            >
              {card.suit}{card.rank}
            </div>
          ))}
        </div>

        {isMyTurn && (
          <div className="bidding-controls">
            <div className="bid-selector">
              <div className="level-selector">
                <label>墩數：</label>
                <div className="level-buttons">
                  {levels.map(level => (
                    <button
                      key={level}
                      className={`level-btn ${selectedLevel === level ? 'selected' : ''}`}
                      onClick={() => setSelectedLevel(level)}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="suit-selector">
                <label>花色：</label>
                <div className="suit-buttons">
                  {suits.map(suit => (
                    <button
                      key={suit.symbol}
                      className={`suit-btn ${selectedSuit === suit.symbol ? 'selected' : ''} ${suit.color}`}
                      onClick={() => setSelectedSuit(suit.symbol)}
                      title={suit.name}
                    >
                      {suit.symbol === 'NT' ? 'NT' : suit.symbol}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bid-actions">
              <button
                className={`bid-btn ${isValidBid(selectedLevel, selectedSuit) ? 'valid' : 'invalid'}`}
                onClick={handleBid}
                disabled={!isValidBid(selectedLevel, selectedSuit)}
              >
                叫墩 {selectedLevel}{selectedSuit === 'NT' ? '無王牌' : selectedSuit}
              </button>
              <button
                className="pass-btn"
                onClick={onPass}
              >
                Pass
              </button>
            </div>
          </div>
        )}

        {!isMyTurn && (
          <div className="waiting-turn">
            等待其他玩家叫墩...
          </div>
        )}
      </div>
    </div>
  );
};

export default BiddingBoard;
