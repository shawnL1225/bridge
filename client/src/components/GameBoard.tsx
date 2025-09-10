import React, { useEffect, useRef } from 'react';
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

  // 添加每個玩家的出牌信息
  playerPlayedCards?: { [playerId: string]: Card[] };
  // 添加墩贏家資訊，用於閃光效果
  trickWinner?: { playerId: string; playerName: string } | null;
  // 添加墩完成狀態，用於禁用出牌
  isTrickCompleted: boolean;
  // 添加等待服務器確認狀態
  isWaitingServerConfirm?: boolean;
  // 添加墩數統計
  trickStats?: {
    declarerTeamTricks: number;
    defenderTeamTricks: number;
    trickRecords?: Array<{
      playerId: string;
      trickNumber: number;
      isOurTeam: boolean;
      winnerName: string;
      winningCard: Card;
    }>;
  };
  // 添加合約資訊
  finalContract?: {
    playerId: string;
    playerName: string;
    level: number;
    suit: string;
  } | null;
}

const GameBoard: React.FC<GameBoardProps> = ({
  message,
  players,
  playerId,
  currentPlayer,
  myHand,
  isMyTurn,

  playerPlayedCards,
  trickWinner,
  isTrickCompleted,
  isWaitingServerConfirm,
  trickStats,
  finalContract
}) => {
  const trickRecordsListRef = useRef<HTMLDivElement>(null);

  const getCardColor = (suit: string): string => {
    return suit === '♥' || suit === '♦' ? 'red' : 'black';
  };

  // 當server端trickRecords更新時，自動滾動顯示最新記錄
  useEffect(() => {
    const serverTrickRecords = trickStats?.trickRecords?.filter(record => record.playerId === playerId);
    if (trickRecordsListRef.current && serverTrickRecords && serverTrickRecords.length > 0) {
      const listElement = trickRecordsListRef.current;
      // 在水平佈局中，滾動到最右邊顯示最新記錄
      listElement.scrollLeft = listElement.scrollWidth;
    }
  }, [trickStats?.trickRecords, playerId]);

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
              <div key={player.id} className={`player ${positionClass} ${currentPlayer && player.id === currentPlayer ? 'player-shining' : ''} ${isWinner ? 'winner-player' : ''}`}>
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
              <span className="message-text">{message}</span>
              {/* 當 currentPlayer 為 null 且有出牌時，顯示等待判定狀態 */}
              {!currentPlayer && playerPlayedCards && Object.keys(playerPlayedCards).some(pid => playerPlayedCards[pid]?.length > 0) && (
                <div className="trick-judging-indicator">
                  ⏳ 正在判定墩的贏家...
                </div>
              )}
          </div>
        )}
      </div>

        {/* 墩記錄顯示區域 - GameBoard下方 */}
        {trickStats && trickStats.trickRecords && 
         trickStats.trickRecords.filter(record => record.playerId === playerId).length > 0 && (
            <div className="trick-records-display">
              
              
              {/* 墩數統計 - 僅使用服務器端數據 */}
              {trickStats && finalContract && (
                <div className="trick-summary">
                  {(() => {
                    // 判斷當前玩家是否在莊家隊伍
                    const playerIdx = players.findIndex(player => player.id === playerId);
                    const contractPlayerIdx = players.findIndex(player => player.id === finalContract.playerId);
                    const isDeclarerTeam = playerIdx === contractPlayerIdx || playerIdx === (contractPlayerIdx + 2) % 4;
                    
                    const myTeamTricks = isDeclarerTeam ? trickStats.declarerTeamTricks : trickStats.defenderTeamTricks;
                    const theirTeamTricks = isDeclarerTeam ? trickStats.defenderTeamTricks : trickStats.declarerTeamTricks;
                    
                    return (
                      <>
                        <div className="team-score our-score">
                          我方: {myTeamTricks}墩
                        </div>
                        <div className="team-score their-score">
                          對方: {theirTeamTricks}墩
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
              
              <div className="trick-records-bar">
                <div className="trick-records-title">墩記錄</div>
                <div className="trick-records-list" ref={trickRecordsListRef}>
                  {trickStats.trickRecords
                    .filter(record => record.playerId === playerId)
                    .map((record) => (
                      <div key={record.trickNumber} className="trick-record-item">
                        <span className="trick-number">{record.trickNumber}</span>
                        <span className={`trick-team ${record.isOurTeam ? 'our-team' : 'their-team'}`}>
                          {record.isOurTeam ? 'W' : 'L'}
                        </span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}
         

      {/* 出牌控制區域 - 固定在畫面最下方 */}
      <div className="playing-controls-area">
        {isMyTurn && !isTrickCompleted && !isWaitingServerConfirm && 
          <div className="turn-indicator-3d">輪到您出牌了！</div>
        }
        {isWaitingServerConfirm && (
          <div className="waiting-confirm-indicator">等待服務器確認中...</div>
        )}
        {trickWinner?.playerId === playerId && (
          <div className="winner-message">🎉 您贏得了這一墩！ 🎉</div>
        )}
      </div>
    </>
  );
};

export default GameBoard;
