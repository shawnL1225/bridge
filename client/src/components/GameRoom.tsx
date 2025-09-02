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
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleServerMessage(message);
      } catch (error) {
        console.error('解析訊息錯誤:', error);
      }
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

  // 監聽 playerId 和 currentPlayer 的變化，自動設定 isMyTurn
  useEffect(() => {
    console.log('useEffect 觸發 - playerId 或 currentPlayer 改變:', {
      playerId,
      currentPlayer,
      players: players
    });
    
    if (currentPlayer && playerId) {
      const newIsMyTurn = currentPlayer === playerId;
      setIsMyTurn(newIsMyTurn);
      
      // 在這裡設定訊息，確保狀態同步
      if (newIsMyTurn) {
        setMessage('遊戲開始！輪到您出牌了');
      } else {
        const currentPlayerName = players.find(p => p.id === currentPlayer)?.name || '未知';
        setMessage(`遊戲開始！輪到 ${currentPlayerName} 出牌`);
      }
      
      console.log('狀態同步後設定回合:', {
        currentPlayer,
        playerId,
        isMyTurn: newIsMyTurn
      });
    }
  }, [playerId, currentPlayer, players]);

  const handleServerMessage = (message: GameMessage) => {
    switch (message.type) {
      case 'error':
        const errorMsg = message.message || '發生錯誤';
        setMessage(errorMsg);
        // 如果是房間相關錯誤（如重複名稱、房間已滿），回到大廳
        if (errorMsg.includes('相同名稱') || errorMsg.includes('房間已滿')) {
          onRoomError(errorMsg);
        }
        break;
      case 'room_joined':
        if (message.players) setPlayers(message.players);
        if (message.playerId) setPlayerId(message.playerId);
        
        // 記錄 playerId 與 players 狀態
        console.log('room_joined: playerId =', message.playerId, 'players =', message.players);
        break;
      case 'player_joined':
        // 當新玩家加入房間時，更新玩家列表
        if (message.player) {
          setPlayers(prev => {
            // 檢查玩家是否已經存在
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
        
        // 檢查是否收到手牌，避免重複設置
        if (message.hand && message.hand.length > 0 && myHand.length === 0) {
          console.log('遊戲開始時收到手牌:', message.hand);
          setMyHand(message.hand);
          console.log('手牌已更新:', message.hand);
        }
        
        if (message.currentPlayer) {
          setCurrentPlayer(message.currentPlayer);
          // 移除這裡的訊息設定，讓 useEffect 處理
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
        
        // 更新其他玩家的手牌數量
        if (message.remainingCards) {
          setPlayers(prev => 
            prev.map(p => {
              const remainingCard = message.remainingCards!.find((rc: { playerId: string; count: number }) => rc.playerId === p.id);
              return remainingCard ? { ...p, cardCount: remainingCard.count } : p;
            })
          );
          
          // 更新自己的手牌數量
          const myRemainingCard = message.remainingCards.find((rc: { playerId: string; count: number }) => rc.playerId === playerId);
          if (myRemainingCard) {
            setMyHand(prev => prev.slice(0, myRemainingCard.count));
          }
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
  };

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
          {/* 顯示已加入的玩家 */}
          {players.map((player, index) => (
            <div key={player.id} className={`player ${player.id === playerId ? 'current-player' : 'other-player'}`}>
              {/* 玩家標籤 */}
              <div className="player-label">
                {player.id === playerId ? (
                  <span className="my-label">👤 我</span>
                ) : (
                  <span className="other-label">玩家 {index + 1}</span>
                )}
              </div>
              
              {/* 玩家名稱 */}
              <h3 className={`player-name ${player.id === playerId ? 'my-name' : ''}`}>
                {player.name}
              </h3>
              
              {/* 玩家狀態 */}
              <div className="player-status">
                <p className={`status-text ${player.ready ? 'ready-status' : 'not-ready-status'}`}>
                  {player.ready ? '✅ 已準備' : '⏳ 未準備'}
                </p>
              </div>
              
              {/* 遊戲中顯示剩餘牌數 */}
              {gameState === 'playing' && (
                <div className="card-count">
                  <p>🃏 剩餘牌數：{player.cardCount || 13}</p>
                </div>
              )}
              
              {/* 當前回合指示器 */}
              {player.id === currentPlayer && gameState === 'playing' && (
                <div className="current-turn-indicator">
                  🎯 當前回合
                </div>
              )}
            </div>
          ))}
          
          {/* 顯示等待中的玩家格子 */}
          {Array.from({ length: 4 - players.length }, (_, index) => (
            <div key={`waiting-${index}`} className="player waiting-player">
              <div className="player-label">
              <span className="other-label">玩家 {players.length + index + 1}</span>
              </div>
              <h3 className="waiting-title">等待玩家中</h3>
              <div className="waiting-indicator">⏳</div>
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

          <div className="my-hand">
            <h3>我的手牌</h3>
            <div className="cards-display">
              {myHand.map((card, index) => (
                <button
                  key={index}
                  className={`card hand-card ${getCardColor(card.suit)} ${isMyTurn ? 'clickable' : ''}`}
                  onClick={() => handlePlayCard(index)}
                  disabled={!isMyTurn}
                >
                  {card.suit}{card.rank}
                </button>
              ))}
            </div>
                          {isMyTurn && <p className="turn-indicator">輪到您出牌了！</p>}
          </div>
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
