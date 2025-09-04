import React, { useState, useEffect, useRef } from 'react';
import { Player, Card } from '../App';
import WaitingRoom from './WaitingRoom';
import GameBoard from './GameBoard';
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
  
  // 添加每個玩家的出牌狀態
  const [playerPlayedCards, setPlayerPlayedCards] = useState<{ [playerId: string]: Card[] }>({});
  
  // 添加墩贏家狀態，用於閃光效果
  const [trickWinner, setTrickWinner] = useState<{ playerId: string; playerName: string } | null>(null);
  
  // 添加墩完成狀態，用於防止狂點出牌
  const [isTrickCompleted, setIsTrickCompleted] = useState(false);
  
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
  // useEffect(() => {
  //   if (currentPlayer && playerId) {
  //     const newIsMyTurn = currentPlayer === playerId;
  //     setIsMyTurn(newIsMyTurn);
      
  //     // 在這裡設定訊息，確保狀態同步
  //     if (newIsMyTurn) {
  //       setMessage('輪到您出牌了');
  //     } else {
  //       const currentPlayerName = players.find(p => p.id === currentPlayer)?.name || '未知';
  //       setMessage(`輪到 ${currentPlayerName} 出牌`);
  //     }
  //   }
  // }, [playerId, currentPlayer, players]);



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
        console.log('遊戲開始 players:', players);
        console.log('遊戲開始 playerId:', playerId);
        console.log('遊戲開始 isMyTurn:', message.currentPlayer === playerId);
        setGameState('playing');
        
        if (message.hand && message.hand.length > 0 && myHand.length === 0) {
          setMyHand(message.hand);
        }
        
        if (message.currentPlayer) {
          setCurrentPlayer(message.currentPlayer);
          setIsMyTurn(message.currentPlayer === playerId);
          if (message.currentPlayer === playerId) {
            setMessage('輪到您出牌了');
          } else {
            const currentPlayerName = players.find(p => p.id === message.currentPlayer)?.name || '未知';
            setMessage(`輪到 ${currentPlayerName} 出牌`);
          }
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
          
          // 更新出牌玩家的出牌歷史
          if (message.playerId && message.card) {
            const playerId = message.playerId as string;
            setPlayerPlayedCards(prev => ({
              ...prev,
              [playerId]: [...(prev[playerId] || []), message.card!]
            }));
          }
        }
        
        // 更新當前玩家和下一個玩家
        if (message.currentPlayer) {
          setCurrentPlayer(message.currentPlayer);
          // 只有當 currentPlayer 等於自己的 playerId 時，才是自己的回合
          setIsMyTurn(message.currentPlayer === playerId);
        }
        
        // 注意：為了遊戲公平性，不再追蹤或顯示其他玩家的手牌數量
        
        // 設定橋牌相關訊息
        if (message.currentTrick && message.trickCount !== undefined) {
          if (message.currentPlayer === playerId) {
            setMessage(`第 ${message.currentTrick} 墩 (${message.trickCount}/4) - 輪到您出牌！`);
          } else {
            const playerName = players.find(p => p.id === message.currentPlayer)?.name || '未知';
            setMessage(`第 ${message.currentTrick} 墩 (${message.trickCount}/4) - 輪到 ${playerName}`);
          }
        } else if (message.card) {
          const playerName = players.find(p => p.id === message.playerId)?.name || '未知玩家';
          setMessage(`${playerName} 出牌：${message.card.suit}${message.card.rank}`);
        }
        break;
      
      case 'trick_completed':
        console.log('墩完成:', message);
        
        // 立即禁用出牌功能，防止狂點
        setIsTrickCompleted(true);
        
        // 設定墩贏家，觸發閃光效果
        if (message.trickWinner) {
          setTrickWinner({
            playerId: message.trickWinner.playerId,
            playerName: message.trickWinner.playerName
          });
          setMessage(`第 ${message.trickNumber} 墩完成！${message.trickWinner.playerName} 拿下`);
          
          // 只清除閃光效果，不重新啟用出牌（等服務器的 trick_cleared 事件）
          setTimeout(() => {
            setTrickWinner(null);
            setPlayerPlayedCards({});
          }, 3000);
        }
        break;
        
      case 'trick_cleared':
        console.log('墩已清空:', message);
        // 只有收到服務器的 trick_cleared 事件才重新啟用出牌
        setIsTrickCompleted(false);
        
        // 更新當前玩家
        if (message.currentPlayer) {
          setCurrentPlayer(message.currentPlayer);
          setIsMyTurn(message.currentPlayer === playerId);
        }
        
        // 設定新墩開始訊息
        if (message.currentTrick) {
          if (message.currentPlayer === playerId) {
            setMessage(`第 ${message.currentTrick} 墩開始 - 輪到您出牌！`);
          } else {
            const playerName = players.find(p => p.id === message.currentPlayer)?.name || '未知';
            setMessage(`第 ${message.currentTrick} 墩開始 - 輪到 ${playerName}`);
          }
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
    
    if (!isMyTurn || gameState !== 'playing' || isTrickCompleted) {
      console.log('出牌被阻止:', { isMyTurn, gameState, isTrickCompleted });
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
                  <span className="status-text">遊戲進行中</span>
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

      

      {gameState === 'waiting' && (
        <WaitingRoom
          message={message}
          players={players}
          playerId={playerId}
          isReady={isReady}
          onReady={handleReady}
          onCancelReady={handleCancelReady}
        />
      )}

      {gameState === 'playing' && (
        <GameBoard
          message={message}
          players={players}
          playerId={playerId}
          currentPlayer={currentPlayer}
          myHand={myHand}
          playedCards={playedCards}
          isMyTurn={isMyTurn}
          onPlayCard={handlePlayCard}
          playerPlayedCards={playerPlayedCards}
          trickWinner={trickWinner}
          isTrickCompleted={isTrickCompleted}
        />
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
