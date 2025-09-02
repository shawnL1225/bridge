import React, { useState, useEffect, useRef } from 'react';
import { Player, Card } from '../App';
import './GameRoom.css';

interface GameRoomProps {
  roomId: string;
  playerName: string;
  onLeaveRoom: () => void;
  onRoomError: (errorMsg: string) => void;
}

interface GameMessage {
  type: string;
  roomId?: string;
  playerId?: string;
  players?: Player[];
  hand?: Card[];
  currentPlayer?: string;
  currentPlayerName?: string;
  hands?: Card[][];
  card?: Card;
  nextPlayer?: string;
  remainingCards?: Array<{ playerId: string; count: number }>;
  winner?: { id: string; name: string };
  finalHands?: Card[][];
  error?: string;
  message?: string;
  [key: string]: any;
}

const GameRoom: React.FC<GameRoomProps> = ({
  roomId,
  playerName,
  onLeaveRoom,
  onRoomError
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [myHand, setMyHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [currentPlayer, setCurrentPlayer] = useState<string>('');
  const [playedCards, setPlayedCards] = useState<Card[]>([]);
  const [lastPlayedCard, setLastPlayedCard] = useState<Card | null>(null); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [message, setMessage] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [playerId, setPlayerId] = useState<string>(''); // 內部管理playerId
  
  const wsRef = useRef<WebSocket | null>(null);
  const hasConnectedRef = useRef(false);

  useEffect(() => {
    // 防止重複連線
    if (hasConnectedRef.current) {
      return;
    }
    
    hasConnectedRef.current = true;
    
    // 建立真實的 WebSocket 連線
    const ws = new WebSocket(`ws://localhost:3001`);
    
    ws.onopen = () => {
      console.log('WebSocket 連線成功');
      // 連線成功後立即加入房間
      ws.send(JSON.stringify({
        type: 'join_room',
        roomId: roomId,
        playerName: playerName
      }));
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket 錯誤:', error);
      setMessage('連線錯誤，請檢查網路連線');
    };
    
    ws.onclose = () => {
      console.log('WebSocket 連線關閉');
      setMessage('連線已斷開');
    };
    
    wsRef.current = ws;
    
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [roomId, playerName]);

  // 設定 isMyTurn, message
  useEffect(() => {
    if (currentPlayer && playerId) {
      const newIsMyTurn = currentPlayer === playerId;
      setIsMyTurn(newIsMyTurn);
      
      // 在這裡設定訊息，確保狀態同步
      if (newIsMyTurn) {
        setMessage('輪到您出牌了');
      } else {
        const currentPlayerName = players.find(p => p.id === currentPlayer)?.name || '未知';
        setMessage(`輪到 ${currentPlayerName} 出牌`);
      }
    }
  }, [playerId, currentPlayer, players]);



  const handleServerMessage = React.useCallback((message: GameMessage) => {
    switch (message.type) {
      case 'error':
        const errorMsg = message.message || '發生錯誤';
        setMessage(errorMsg);
        // 如果是房間相關錯誤（如重複名稱、房間已滿），回到大廳
        if (errorMsg.includes('相同名稱') || errorMsg.includes('房間已滿')) {
          onRoomError(errorMsg);
        }
        break;
      case 'room_info': // load room players info
        if (message.players) setPlayers(message.players);
        if (message.playerId) setPlayerId(message.playerId);
        break;
      case 'player_joined': // A new player joined
        if (message.player) {
          setPlayers(prev => {
            const exists = prev.find(p => p.id === message.player!.id);
            if (exists) {
              return prev; // 玩家已存在，不重複添加
            }
            return [...prev, { 
              id: message.player!.id, 
              name: message.player!.name, 
              ready: message.player!.ready 
            }];
          });
          setMessage(`${message.player.name} 加入了房間`);
        }
        break;
      case 'player_ready':
        setPlayers(prev => 
          prev.map(p => 
            p.id === message.playerId ? { ...p, ready: true } : p
          )
        );
        break;
      case 'player_cancel_ready':
        setPlayers(prev => 
          prev.map(p => 
            p.id === message.playerId ? { ...p, ready: false } : p
          )
        );
        break;
      case 'game_started':
        console.log('遊戲開始訊息:', message);
        setGameState('playing');
        
        if (message.hand && message.hand.length > 0 && myHand.length === 0) {
          setMyHand(message.hand);
        }
        
        if (message.currentPlayer) {
          setCurrentPlayer(message.currentPlayer);
        }
        

        break;
      case 'card_played':
        console.log('收到出牌訊息:', {
          message,
          myPlayerId: playerId,
          currentPlayer: message.currentPlayer,
          isMyTurn: message.currentPlayer === playerId
        });
        
        if (message.card) {
          setPlayedCards(prev => [...prev, message.card!]);
          setLastPlayedCard(message.card);
        }
        
        // 更新當前玩家和下一個玩家
        if (message.currentPlayer) {
          setCurrentPlayer(message.currentPlayer);
          // 只有當 currentPlayer 等於自己的 playerId 時，才是自己的回合
          setIsMyTurn(message.currentPlayer === playerId);
          console.log('回合更新:', {
            currentPlayer: message.currentPlayer,
            isMyTurn: message.currentPlayer === playerId
          });
        }
        
        // 更新其他玩家的手牌數量（只更新其他玩家，自己的手牌已經在出牌時更新）
        if (message.remainingCards) {
          setPlayers(prev => 
            prev.map(p => {
              // 跳過自己，因為自己的手牌已經更新
              if (p.id === playerId) return p;
              
              const remainingCard = message.remainingCards!.find((rc: { playerId: string; count: number }) => rc.playerId === p.id);
              return remainingCard ? { ...p, cardCount: remainingCard.count } : p;
            })
          );
        }
        
        // 根據是否輪到自己來設定訊息
        if (isMyTurn) {
          setMessage('輪到您出牌了！');
        } else if (message.card) {
          const playerName = players.find(p => p.id === message.playerId)?.name || '未知玩家';
          setMessage(`${playerName} 出牌：${message.card.suit}${message.card.rank}`);
        }
        break;
      case 'player_left':
        // 當玩家離開房間時，從玩家列表中移除
        if (message.playerId) {
          setPlayers(prev => prev.filter(p => p.id !== message.playerId));
          setMessage(`有玩家離開了房間，剩餘 ${message.remainingPlayers || 0} 名玩家`);
          
          // 如果玩家數量少於4人，重置準備狀態
          if (message.remainingPlayers && message.remainingPlayers < 4) {
            setIsReady(false);
            setPlayers(prev => prev.map(p => ({ ...p, ready: false })));
          }
        }
        break;
      case 'game_reset':
        setGameState('waiting');
        setIsReady(false);
        setMessage(message.message || '遊戲已重置，請重新準備');
        break;
      case 'game_ended':
        setGameState('finished');
        if (message.winner) {
          setMessage(`遊戲結束！獲勝者：${message.winner.name}`);
        }
        break;
      case 'game_ended_disconnect':
        setGameState('finished');
        setMessage(message.message || '遊戲因玩家斷線而結束');
        break;
    }
  }, [playerId, players, currentPlayer, gameState, isMyTurn, myHand.length, onRoomError]);

  // Update handleServerMessage for handling WebSocket messages
  useEffect(() => {
    if (wsRef.current) {
      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleServerMessage(message);
        } catch (error) {
          console.error('解析訊息錯誤:', error);
        }
      };
    }
  }, [handleServerMessage]);

  const handleReady = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'ready' }));
    }
    setIsReady(true);
    
    // 更新本地玩家狀態
    setPlayers(prev => 
      prev.map(p => 
        p.id === playerId ? { ...p, ready: true } : p
      )
    );
  };

  const handleCancelReady = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'cancel_ready' }));
    }
    setIsReady(false);
    
    // 更新本地玩家狀態
    setPlayers(prev => 
      prev.map(p => 
        p.id === playerId ? { ...p, ready: false } : p
      )
    );
  };

  const handlePlayCard = (cardIndex: number) => {
    console.log('handlePlayCard 被調用:', {
      cardIndex,
      isMyTurn,
      gameState,
      myHandLength: myHand.length,
      playerId
    });
    
    if (!isMyTurn || gameState !== 'playing') {
      console.log('出牌被阻止:', { isMyTurn, gameState });
      return;
    }
    
    const card = myHand[cardIndex];
    if (!card) {
      console.log('無效的牌索引:', cardIndex);
      return;
    }
    
    // 立即從手牌中移除出掉的牌
    setMyHand(prev => prev.filter((_, index) => index !== cardIndex));
    
    // 發送出牌訊息
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'play_card',
        cardIndex
      }));
    }
    
    // 等待伺服器回應來更新回合狀態
    setMessage('等待其他玩家出牌...');
  };

  const handleLeaveRoom = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    onLeaveRoom();
  };

  const getCardColor = (suit: string): string => {
    return suit === '♥' || suit === '♦' ? 'red' : 'black';
  };

  return (
    <div className="game-room">
      <div className="room-header">
        <div className="header-left">
          <div className="player-info">
            <div className="player-avatar">👤</div>
            <div className="player-details">
              <h3 className="player-name-display">{playerName}</h3>
            </div>
          </div>
        </div>
        
        <div className="header-center">
          <div className="game-status-banner">
            <div className={`status-indicator ${gameState}`}>
              {gameState === 'waiting' && (
                <>
                  <span className="status-icon">⏳</span>
                  <span className="status-text">等待玩家加入</span>
                </>
              )}
              {gameState === 'playing' && (
                <>
                  <span className="status-icon">🎮</span>
                  <span className="status-text">遊戲進行中</span>
                  {currentPlayer && (
                    <span className="current-turn">
                      輪到：{players.find(p => p.id === currentPlayer)?.name || '未知'}
                    </span>
                  )}
                </>
              )}
              {gameState === 'finished' && (
                <>
                  <span className="status-icon">🏆</span>
                  <span className="status-text">遊戲結束</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div className="room-info" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
            <div className="room-id-display" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
              <span className="room-label" style={{ whiteSpace: 'nowrap' }}>房間號</span>
              <span className="room-number">{roomId}</span>
            </div>
            <div className="player-count" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
              <span className="count-label" style={{ whiteSpace: 'nowrap' }}>玩家</span>
              <span className="count-number">{players.length}/4</span>
            </div>
          </div>
          <button onClick={handleLeaveRoom} className="leave-btn">
            離開房間
          </button>
        </div>
      </div>

      {/* 遊戲訊息橫幅 */}
      {message && (
        <div className="game-message-banner">
          <div className="message-content">
            <span className="message-icon">💬</span>
            <span className="message-text">{message}</span>
          </div>
        </div>
      )}

              <div className="players-container">
                {/* 上方玩家 */}
                {players.length >= 1 && (
                  <div className={`player top ${players[0].id === currentPlayer && gameState === 'playing' ? 'current-player' : ''}`}>
                    <div className="player-info-container">
                      <div className="player-label">
                        {players[0].id === playerId ? (
                          <span className="my-label">👤 我</span>
                        ) : (
                          <span className="other-label">上方玩家</span>
                        )}
                      </div>
                      
                      <h3 className="player-name">
                        {players[0].name}
                      </h3>
                      
                      {gameState === 'waiting' && (
                        <div className="player-status">
                          <p className="status-text">
                            {players[0].ready ? '✅ 已準備' : '⏳ 未準備'}
                          </p>
                        </div>
                      )}
                      
                      {players[0].id === currentPlayer && gameState === 'playing' && (
                        <div className="current-turn-indicator">
                          🎯 當前回合
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* 右方玩家 */}
                {players.length >= 2 && (
                  <div className={`player right ${players[1].id === currentPlayer && gameState === 'playing' ? 'current-player' : ''}`}>
                    <div className="player-info-container">
                      <div className="player-label">
                        {players[1].id === playerId ? (
                          <span className="my-label">👤 我</span>
                        ) : (
                          <span className="other-label">右方玩家</span>
                        )}
                      </div>
                      
                      <h3 className="player-name">
                        {players[1].name}
                      </h3>
                      
                      {gameState === 'waiting' && (
                        <div className="player-status">
                          <p className="status-text">
                            {players[1].ready ? '✅ 已準備' : '⏳ 未準備'}
                          </p>
                        </div>
                      )}
                      
                      {players[1].id === currentPlayer && gameState === 'playing' && (
                        <div className="current-turn-indicator">
                          🎯 當前回合
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* 左方玩家 */}
                {players.length >= 3 && (
                  <div className={`player left ${players[2].id === currentPlayer && gameState === 'playing' ? 'current-player' : ''}`}>
                    <div className="player-info-container">
                      <div className="player-label">
                        {players[2].id === playerId ? (
                          <span className="my-label">👤 我</span>
                        ) : (
                          <span className="other-label">左方玩家</span>
                        )}
                      </div>
                      
                      <h3 className="player-name">
                        {players[2].name}
                      </h3>
                      
                      {gameState === 'waiting' && (
                        <div className="player-status">
                          <p className="status-text">
                            {players[2].ready ? '✅ 已準備' : '⏳ 未準備'}
                          </p>
                        </div>
                      )}
                      
                      {players[2].id === currentPlayer && gameState === 'playing' && (
                        <div className="current-turn-indicator">
                          🎯 當前回合
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* 下方玩家（自己） */}
                {players.length >= 4 && (
                  <div className={`player bottom ${players[3].id === currentPlayer && gameState === 'playing' ? 'current-player' : ''}`}>
                    <div className="player-info-container">
                      <div className="player-label">
                        <span className="my-label">👤 我</span>
                      </div>
                      
                      <h3 className="player-name">
                        {players[3].name}
                      </h3>
                      
                      {gameState === 'waiting' && (
                        <div className="player-status">
                          <p className="status-text">
                            {players[3].ready ? '✅ 已準備' : '⏳ 未準備'}
                          </p>
                        </div>
                      )}
                      
                      {players[3].id === currentPlayer && gameState === 'playing' && (
                        <div className="current-turn-indicator">
                          🎯 當前回合
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* 顯示等待中的玩家格子 */}
                {Array.from({ length: 4 - players.length }, (_, index) => (
                  <div key={`waiting-${index}`} className="player waiting-player">
                    <div className="player-info-container">
                      <div className="player-label">
                        <span className="other-label">等待玩家 {index + 1}</span>
                      </div>
                      <h3 className="waiting-title">等待玩家中</h3>
                      <div className="waiting-indicator">⏳</div>
                    </div>
                  </div>
                ))}
              </div>

      {gameState === 'waiting' && (
        <div className="waiting-section">
          <p>等待所有玩家準備...</p>
          {!isReady ? (
            <button onClick={handleReady} className="ready-btn">
              準備
            </button>
          ) : (
            <button onClick={handleCancelReady} className="cancel-ready-btn">
              取消準備
            </button>
          )}
        </div>
      )}

      {/* 等待狀態時也顯示手牌（如果有的話） */}
      {gameState === 'waiting' && myHand.length > 0 && (
        <div className="first-person-hand">
          <div className="hand-title">我的手牌</div>
          <div className="hand-container">
            {myHand.map((card, index) => (
              <div
                key={index}
                className={`hand-card-3d ${getCardColor(card.suit)}`}
              >
                {card.suit}{card.rank}
              </div>
            ))}
          </div>
        </div>
      )}

      {gameState === 'playing' && (
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
      )}

      {/* 第一視角手牌區域 - 固定在畫面最下方 */}
      {gameState === 'playing' && (
        <div className="first-person-hand">
          <div className="hand-title">我的手牌</div>
          <div className="hand-container">
            {myHand.map((card, index) => (
              <button
                key={index}
                className={`hand-card-3d ${getCardColor(card.suit)} ${isMyTurn ? 'clickable' : ''}`}
                onClick={() => handlePlayCard(index)}
                disabled={!isMyTurn}
              >
                {card.suit}{card.rank}
              </button>
            ))}
          </div>
          {isMyTurn && <div className="turn-indicator-3d">輪到您出牌了！</div>}
        </div>
      )}

      {gameState === 'finished' && (
        <div className="game-ended">
          <h3>遊戲結束</h3>
          <button onClick={handleLeaveRoom} className="back-to-lobby-btn">
            返回大廳
          </button>
        </div>
      )}
    </div>
  );
};

export default GameRoom;
