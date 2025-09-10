import React, { useState, useEffect, useRef } from 'react';
import { Player, Card } from '../App';
import WaitingRoom from './WaitingRoom';
import GameBoard from './GameBoard';
import BiddingBoard from './BiddingBoard';
import './GameRoom.css';
import { config } from '../config';

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
  const [gameState, setGameState] = useState<'waiting' | 'bidding' | 'playing' | 'finished'>('waiting');
  const [currentPlayer, setCurrentPlayer] = useState<string>('');
  const [playedCards, setPlayedCards] = useState<Card[]>([]);
  const [lastPlayedCard, setLastPlayedCard] = useState<Card | null>(null); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [message, setMessage] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [playerId, setPlayerId] = useState<string>(''); // 內部管理playerId
  
  // 叫墩相關狀態
  const [currentBidder, setCurrentBidder] = useState<string>('');
  const [bids, setBids] = useState<Array<{
    playerId: string;
    playerName: string;
    level?: number;
    suit?: string;
    type: 'bid' | 'pass';
  }>>([]);
  const [finalContract, setFinalContract] = useState<{
    playerId: string;
    playerName: string;
    level: number;
    suit: string;
  } | null>(null);
  const [trumpSuit, setTrumpSuit] = useState<string | null>(null);
  
  // 添加每個玩家的出牌狀態
  const [playerPlayedCards, setPlayerPlayedCards] = useState<{ [playerId: string]: Card[] }>({});
  
  // 添加墩贏家狀態，用於閃光效果
  const [trickWinner, setTrickWinner] = useState<{ playerId: string; playerName: string } | null>(null);
  
  // 添加墩完成狀態，用於防止狂點出牌
  const [isTrickCompleted, setIsTrickCompleted] = useState(false);
  
  // 添加等待服務器確認狀態，防止重複出牌
  const [isWaitingServerConfirm, setIsWaitingServerConfirm] = useState(false);
  
  // 添加墩數統計狀態
  const [trickStats, setTrickStats] = useState<{
    declarerTeamTricks: number;
    defenderTeamTricks: number;
    trickRecords?: Array<{
      playerId: string;
      trickNumber: number;
      isOurTeam: boolean;
      winnerName: string;
      winningCard: Card;
    }>;
  }>({ declarerTeamTricks: 0, defenderTeamTricks: 0 });
  
  // 添加最終遊戲結果狀態
  const [gameResult, setGameResult] = useState<any>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const hasConnectedRef = useRef(false);

  useEffect(() => {
    // 防止重複連線
    if (hasConnectedRef.current) {
      return;
    }
    
    hasConnectedRef.current = true;
    
    // 建立真實的 WebSocket 連線
    const ws = new WebSocket(config.wsUrl);
    
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
        // 重置等待服務器確認狀態（出牌被拒絕時）
        setIsWaitingServerConfirm(false);
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
        
        // 設置王牌和最終合約信息
        if (message.trumpSuit) {
          setTrumpSuit(message.trumpSuit);
        }
        if (message.finalContract) {
          setFinalContract(message.finalContract);
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
        
        // 如果是自己的出牌被確認，移除手牌並重置等待狀態
        if (message.playerId === playerId) {
          // 找到出牌的索引並移除 (這裡需要根據牌的內容匹配，因為cardIndex可能已經改變)
          if (message.card) {
            setMyHand(prev => {
              const cardIndex = prev.findIndex(card => 
                card.suit === message.card!.suit && card.rank === message.card!.rank
              );
              if (cardIndex !== -1) {
                return prev.filter((_, index) => index !== cardIndex);
              }
              return prev;
            });
          }
          setIsWaitingServerConfirm(false);
        }
        
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
          
          // 更新墩數統計（包含server端計算的trickRecords）
          if (message.trickStats) {
            setTrickStats({
              declarerTeamTricks: message.trickStats.declarerTeamTricks,
              defenderTeamTricks: message.trickStats.defenderTeamTricks,
              trickRecords: message.trickStats.trickRecords
            });
          }
          
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
        setMessage(`第 ${message.currentTrick} 墩`);
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
      case 'game_restarted':
        console.log('遊戲重新開始:', message);
        setGameState('waiting');
        setIsReady(false);
        setMessage(message.message || '您已重新開始遊戲，請重新準備');
        setPlayers(message.players || []);
        // 清空所有遊戲相關狀態
        setFinalContract(null);
        setGameResult(null);
        setTrickStats({ declarerTeamTricks: 0, defenderTeamTricks: 0, trickRecords: [] });
        setPlayedCards([]);
        setPlayerPlayedCards({});
        setTrickWinner(null);
        setIsTrickCompleted(false);
        setIsWaitingServerConfirm(false);
        setMyHand([]);
        
        break;
      case 'game_ended':
        setGameState('finished');
        if (message.contractResult) {
          setGameResult(message.contractResult);
          
          // 判斷當前玩家是否獲勝
          const playerIdx = players.findIndex(player => player.id === playerId);
          const declarerTeam = message.contractResult.teams?.declarer?.players || [];
          const isPlayerInDeclarerTeam = declarerTeam.some((player: any) => player.id === playerId);
          const contractMade = message.contractResult.result === 'contract_made';
          const playerWon = (isPlayerInDeclarerTeam && contractMade) || (!isPlayerInDeclarerTeam && !contractMade);
          
          setMessage(playerWon ? '恭喜勝利！' : '下局加油！');
        }
        break;
      case 'game_ended_disconnect':
        setGameState('finished');
        setMessage(message.message || '遊戲因玩家斷線而結束');
        break;
      
      // 叫墩相關訊息處理
      case 'bidding_started':
        console.log('叫墩開始:', message);
        setGameState('bidding');
        // 重置墩數統計（server端會提供新的數據）
        setTrickStats({ declarerTeamTricks: 0, defenderTeamTricks: 0 });
        
        if (message.hand && message.hand.length > 0 && myHand.length === 0) {
          setMyHand(message.hand);
        }
        
        if (message.currentBidder) {
          setCurrentBidder(message.currentBidder);
          setIsMyTurn(message.currentBidder === playerId);
          if (message.currentBidder === playerId) {
            setMessage('輪到您叫墩了');
          } else {
            const currentBidderName = players.find(p => p.id === message.currentBidder)?.name || '未知';
            setMessage(`輪到 ${currentBidderName} 叫墩`);
          }
        }
        
        if (message.bids) {
          setBids(message.bids);
        }
        break;
        
      case 'bid_made':
        console.log('玩家叫墩:', message);
        if (message.bid) {
          setBids(message.bids || []);
          setMessage(`${message.bid.playerName} 叫墩：${message.bid.level}${message.bid.suit === 'NT' ? '無王牌' : message.bid.suit}`);
        }
        
        if (message.currentBidder) {
          setCurrentBidder(message.currentBidder);
          setIsMyTurn(message.currentBidder === playerId);
        }
        break;
        
      case 'bid_passed':
        console.log('玩家pass:', message);
        if (message.passInfo) {
          setBids(message.bids || []);
          setMessage(`${message.passInfo.playerName} Pass`);
        }
        
        if (message.currentBidder) {
          setCurrentBidder(message.currentBidder);
          setIsMyTurn(message.currentBidder === playerId);
        }
        break;
        
      // 移除 bidding_ended 事件處理，因為現在直接開始出牌
        
      case 'bidding_failed':
        console.log('叫墩失敗:', message);
        setMessage(message.message || '所有玩家都pass，重新發牌');
        // 重置叫墩相關狀態
        setBids([]);
        setFinalContract(null);
        setTrumpSuit(null);
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
    // 合併檢查：只要其中一個阻止條件成立就不能出牌
    const cannotPlay = !isMyTurn || gameState !== 'playing' || isTrickCompleted || isWaitingServerConfirm;
    if (cannotPlay) {
      console.log('出牌被阻止:', { isMyTurn, gameState, isTrickCompleted, isWaitingServerConfirm });
      return;
    }
    
    const card = myHand[cardIndex];
    if (!card) {
      console.log('無效的牌索引:', cardIndex);
      return;
    }
    
    // 設置等待服務器確認狀態，防止重複點擊
    setIsWaitingServerConfirm(true);
    
    // 發送出牌訊息
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'play_card',
        cardIndex
      }));
    }
    
    // 等待伺服器回應
    setMessage('出牌中，等待服務器確認...');
  };

  const handleMakeBid = (level: number, suit: string) => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'make_bid',
        level: level,
        suit: suit
      }));
    }
    setMessage('叫墩中，等待服務器確認...');
  };

  const handlePassBid = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'pass_bid'
      }));
    }
    setMessage('Pass，等待服務器確認...');
  };

  const handleLeaveRoom = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    onLeaveRoom();
  };



  return (
    <div className={`game-room ${gameState === 'bidding' ? 'bidding-mode' : ''}`}>
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
                  <span className="status-text">等待玩家</span>
                </>
              )}
              {gameState === 'bidding' && (
                <>
                  <span className="status-text">叫墩階段</span>
                </>
              )}
              {gameState === 'playing' && (
                <>
                  <span className="status-text">遊戲進行中</span>
                </>
              )}
              {gameState === 'finished' && (
                <>
                  <span className="status-text">🏆遊戲結束</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="header-right">
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

       {/* 合約資訊顯示 */}
          {finalContract && (
              <div className="contract-info">
                合約: {finalContract.level}{finalContract.suit} by {finalContract.playerName}
              </div>
          )}

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

      {gameState === 'bidding' && (
        <BiddingBoard
          message={message}
          players={players}
          playerId={playerId}
          currentBidder={currentBidder}
          myHand={myHand}
          bids={bids}
          isMyTurn={isMyTurn}
          onMakeBid={handleMakeBid}
          onPass={handlePassBid}
          finalContract={finalContract}
          trumpSuit={trumpSuit}
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
          isWaitingServerConfirm={isWaitingServerConfirm}
          trickStats={trickStats}
          finalContract={finalContract}
        />
      )}

      {gameState === 'finished' && (
        <div className="game-ended">
          {gameResult ? (
            (() => {
              // 判斷當前玩家是否獲勝
              const declarerTeam = gameResult.teams?.declarer?.players || [];
              const isPlayerInDeclarerTeam = declarerTeam.some((player: any) => player.id === playerId);
              const contractMade = gameResult.result === 'contract_made';
              const playerWon = (isPlayerInDeclarerTeam && contractMade) || (!isPlayerInDeclarerTeam && !contractMade);
              
              return (
                <div className="contract-result">
                  <div className={`result-banner ${playerWon ? 'success' : 'failure'}`}>
                    <h4>{playerWon ? '勝利' : '失敗'}</h4>
                  </div>
              
              <div className="result-details">
                <div className="team-results">
                  <div className="team-info">
                    <h5>莊家隊伍 ({gameResult.teams?.declarer?.tricks || 0} 墩)</h5>
                    <p className="team-target">目標：{finalContract?.level ? 6 + finalContract.level : 0} 墩</p>
                    {gameResult.teams?.declarer?.players?.map((player: any) => (
                      <div key={player.id} className={`team-player ${gameResult.teams?.declarer?.won ? 'winner' : 'loser'}`}>
                        {player.name}
                      </div>
                    ))}
                  </div>
                  
                  <div className="team-info">
                    <h5>防守隊伍 ({gameResult.teams?.defender?.tricks || 0} 墩)</h5>
                    <p className="team-target">目標：{finalContract?.level ? 13 - (6 + finalContract.level) + 1 : 0} 墩</p>
                    {gameResult.teams?.defender?.players?.map((player: any) => (
                      <div key={player.id} className={`team-player ${gameResult.teams?.defender?.won ? 'winner' : 'loser'}`}>
                        {player.name}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* 墩數詳細記錄 */}
                {trickStats?.trickRecords && trickStats.trickRecords.length > 0 && (
                  <div className="trick-records">
                    <h5>墩數詳細記錄</h5>
                    <div className="trick-list">
                      {trickStats.trickRecords
                        .filter(record => record.playerId === playerId)
                        .map((record, index) => (
                          <div key={index} className={`trick-record ${record.isOurTeam ? 'our-team' : 'their-team'}`}>
                            <span>第 {record.trickNumber} 墩：</span>
                            <span className={record.isOurTeam ? 'win' : 'lose'}>
                              {record.isOurTeam ? '勝利' : '失敗'}
                            </span>
                            <span>贏家：{record.winnerName}</span>
                            <span>贏牌：{record.winningCard.suit}{record.winningCard.rank}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
              );
            })()
          ) : (
            <h3>遊戲結束</h3>
          )}
          
          <div className="game-actions">
            <button onClick={() => {
              // 發送重新開始遊戲訊息給 server
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                  type: 'restart_game'
                }));
              }
            }} className="continue-game-btn">
              繼續遊戲
            </button>
            <button onClick={handleLeaveRoom} className="back-to-lobby-btn">
              返回大廳
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameRoom;
