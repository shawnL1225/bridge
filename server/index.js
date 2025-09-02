const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// 遊戲狀態管理
const games = new Map();
const players = new Map();

// 撲克牌花色和數字
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// 創建一副撲克牌
function createDeck() {
  const deck = [];
  for (let suit of SUITS) {
    for (let rank of RANKS) {
      deck.push({ suit, rank, value: getCardValue(rank) });
    }
  }
  return deck;
}

// 獲取牌面數值
function getCardValue(rank) {
  if (rank === 'A') return 14;
  if (rank === 'K') return 13;
  if (rank === 'Q') return 12;
  if (rank === 'J') return 11;
  return parseInt(rank);
}

// 洗牌
function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// 發牌
function dealCards(deck, numPlayers) {
  const hands = Array.from({ length: numPlayers }, () => []);
  for (let i = 0; i < deck.length; i++) {
    hands[i % numPlayers].push(deck[i]);
  }
  return hands;
}

// 創建新遊戲
function createGame(roomId) {
  const deck = shuffleDeck(createDeck());
  const hands = dealCards(deck, 4);
  
  const game = {
    id: roomId,
    players: [],
    hands: hands,
    currentPlayer: 0,
    playedCards: [],
    gameState: 'waiting', // waiting, playing, finished
    turnOrder: [],
    lastPlayedCard: null,
    lastPlayerId: null
  };
  
  games.set(roomId, game);
  return game;
}

// 廣播訊息給房間內所有玩家
function broadcastToRoom(roomId, message, excludePlayerId = null) {
  const game = games.get(roomId);
  if (!game) return;
  
  game.players.forEach(player => {
    if (player.id !== excludePlayerId && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify(message));
    }
  });
}

// 檢查出牌是否合法
function isValidPlay(card, lastCard, isFirstPlay) {
  if (isFirstPlay) return true;
  if (!lastCard) return true;
  
  // 這裡可以定義出牌規則，例如：
  // 1. 必須出比上一張大的牌
  // 2. 或者相同花色的牌
  // 目前簡化為可以出任何牌
  return true;
}

// WebSocket 連線處理
wss.on('connection', (ws) => {
  const playerId = uuidv4();
  players.set(playerId, { ws, roomId: null, name: null });
  
  console.log(`新玩家連線: ${playerId}`);
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleMessage(playerId, data);
    } catch (error) {
      console.error('訊息解析錯誤:', error);
    }
  });
  
  ws.on('close', () => {
    handlePlayerDisconnect(playerId);
  });
});

// 處理玩家訊息
function handleMessage(playerId, data) {
  const player = players.get(playerId);
  if (!player) return;
  
  switch (data.type) {
    case 'join_room':
      handleJoinRoom(playerId, data.roomId, data.playerName);
      break;
    case 'play_card':
      handlePlayCard(playerId, data.cardIndex);
      break;
    case 'ready':
      handlePlayerReady(playerId);
      break;
    case 'cancel_ready':
      handlePlayerCancelReady(playerId);
      break;
  }
}

// 處理加入房間
function handleJoinRoom(playerId, roomId, playerName) {
  let game = games.get(roomId);
  
  if (!game) {
    game = createGame(roomId);
  }
  
  if (game.players.length >= 4) {
    // 房間已滿
    const player = players.get(playerId);
    player.ws.send(JSON.stringify({
      type: 'error',
      message: '房間已滿'
    }));
    return;
  }
  
  // 檢查是否有重複的玩家名稱
  const existingPlayer = game.players.find(p => p.name === playerName);
  if (existingPlayer) {
    const player = players.get(playerId);
    player.ws.send(JSON.stringify({
      type: 'error',
      message: '房間內已有相同名稱的玩家'
    }));
    return;
  }
  
  // 加入房間
  const player = players.get(playerId);
  player.roomId = roomId;
  player.name = playerName;
  
  const playerInfo = {
    id: playerId,
    name: playerName,
    ws: player.ws,
    ready: false
  };
  
  game.players.push(playerInfo);
  
  // 發送房間資訊
  player.ws.send(JSON.stringify({
    type: 'room_info',
    roomId: roomId,
    playerId: playerId,
    players: game.players.map(p => ({ id: p.id, name: p.name, ready: p.ready }))
  }));
  
  // 廣播新玩家加入
  broadcastToRoom(roomId, {
    type: 'player_joined',
    player: { id: playerId, name: playerName, ready: false }
  }, playerId);
  
  console.log(`玩家 ${playerName} 加入房間 ${roomId}`);
}

// 處理玩家準備
function handlePlayerReady(playerId) {
  const player = players.get(playerId);
  if (!player || !player.roomId) return;
  
  const game = games.get(player.roomId);
  if (!game) return;
  
  const gamePlayer = game.players.find(p => p.id === playerId);
  if (gamePlayer) {
    gamePlayer.ready = true;
    
    // 檢查是否所有玩家都準備好了
    if (game.players.length === 4 && game.players.every(p => p.ready)) {
      startGame(player.roomId);
    } else {
      // 廣播玩家準備狀態
      broadcastToRoom(player.roomId, {
        type: 'player_ready',
        playerId: playerId
      });
    }
  }
}

// 處理玩家取消準備
function handlePlayerCancelReady(playerId) {
  const player = players.get(playerId);
  if (!player || !player.roomId) return;
  
  const game = games.get(player.roomId);
  if (!game) return;
  
  const gamePlayer = game.players.find(p => p.id === playerId);
  if (gamePlayer) {
    gamePlayer.ready = false;
    
    // 廣播玩家取消準備狀態
    broadcastToRoom(player.roomId, {
      type: 'player_cancel_ready',
      playerId: playerId
    });
  }
}

// 開始遊戲
function startGame(roomId) {
  const game = games.get(roomId);
  if (!game) return;
  
  game.gameState = 'playing';
  game.currentPlayer = 0;
  game.turnOrder = game.players.map(p => p.id);
  
  // 為每個玩家發送對應的手牌
  game.players.forEach((player, index) => {
    player.ws.send(JSON.stringify({
      type: 'game_started',
      currentPlayer: game.turnOrder[0],
      currentPlayerName: game.players[0].name,
      hand: game.hands[index]  // 直接發送對應的手牌
    }));
  });
  
  console.log(`房間 ${roomId} 遊戲開始`);
}

// 處理出牌
function handlePlayCard(playerId, cardIndex) {
  const player = players.get(playerId);
  if (!player || !player.roomId) return;
  
  const game = games.get(player.roomId);
  if (!game || game.gameState !== 'playing') return;
  
  // 檢查是否輪到該玩家
  if (game.turnOrder[game.currentPlayer] !== playerId) {
    player.ws.send(JSON.stringify({
      type: 'error',
      message: '還沒輪到您出牌'
    }));
    return;
  }
  
  const playerIndex = game.players.findIndex(p => p.id === playerId);
  const hand = game.hands[playerIndex];
  
  if (cardIndex < 0 || cardIndex >= hand.length) {
    player.ws.send(JSON.stringify({
      type: 'error',
      message: '無效的牌'
    }));
    return;
  }
  
  const card = hand[cardIndex];
  const isFirstPlay = game.playedCards.length === 0;
  
  if (!isValidPlay(card, game.lastPlayedCard, isFirstPlay)) {
    player.ws.send(JSON.stringify({
      type: 'error',
      message: '出牌不符合規則'
    }));
    return;
  }
  
  // 出牌
  hand.splice(cardIndex, 1);
  game.playedCards.push(card);
  game.lastPlayedCard = card;
  game.lastPlayerId = playerId;
  
  // 檢查遊戲是否結束
  if (hand.length === 0) {
    endGame(player.roomId, playerId);
    return;
  }
  
  // 下一回合
  game.currentPlayer = (game.currentPlayer + 1) % 4;
  
  // 廣播出牌訊息
  broadcastToRoom(player.roomId, {
    type: 'card_played',
    playerId: playerId,
    card: card,
    currentPlayer: game.turnOrder[game.currentPlayer],
    remainingCards: game.players.map(p => ({
      playerId: p.id,
      count: game.hands[game.players.indexOf(p)].length
    }))
  });
  
  console.log(`玩家 ${player.name} 出牌: ${card.suit}${card.rank}`);
}

// 結束遊戲
function endGame(roomId, winnerId) {
  const game = games.get(roomId);
  if (!game) return;
  
  game.gameState = 'finished';
  
  const winner = game.players.find(p => p.id === winnerId);
  
  broadcastToRoom(roomId, {
    type: 'game_ended',
    winner: { id: winnerId, name: winner.name },
    finalHands: game.hands
  });
  
  console.log(`房間 ${roomId} 遊戲結束，獲勝者: ${winner.name}`);
}

// 因玩家斷線而結束遊戲
function endGameDueToDisconnect(roomId, disconnectedPlayerId) {
  const game = games.get(roomId);
  if (!game) return;
  
  game.gameState = 'finished';
  
  const disconnectedPlayer = game.players.find(p => p.id === disconnectedPlayerId);
  const playerName = disconnectedPlayer ? disconnectedPlayer.name : '未知玩家';
  
  broadcastToRoom(roomId, {
    type: 'game_ended_disconnect',
    message: `遊戲因玩家 ${playerName} 斷線而結束`,
    disconnectedPlayer: { id: disconnectedPlayerId, name: playerName },
    remainingPlayers: game.players.map(p => ({ id: p.id, name: p.name }))
  });
  
  console.log(`房間 ${roomId} 遊戲因玩家 ${playerName} 斷線而結束`);
}

// 處理玩家斷線
function handlePlayerDisconnect(playerId) {
  const player = players.get(playerId);
  if (!player) return;
  
  if (player.roomId) {
    const game = games.get(player.roomId);
    if (game) {
      // 從遊戲中移除玩家
      game.players = game.players.filter(p => p.id !== playerId);
      
      if (game.players.length === 0) {
        // 房間空了，刪除遊戲
        games.delete(player.roomId);
        console.log(`房間 ${player.roomId} 已空，遊戲已刪除`);
      } else if (game.gameState === 'playing') {
        // 如果遊戲正在進行中，有玩家斷線就結束遊戲
        endGameDueToDisconnect(player.roomId, playerId);
      } else {
        // 遊戲還沒開始，廣播玩家離開
        broadcastToRoom(player.roomId, {
          type: 'player_left',
          playerId: playerId,
          remainingPlayers: game.players.length
        });
        
        // 如果玩家數量少於4人，重置所有玩家的準備狀態
        if (game.players.length < 4) {
          game.players.forEach(p => p.ready = false);
          broadcastToRoom(player.roomId, {
            type: 'game_reset',
            message: '有玩家離開，遊戲已重置，請重新準備'
          });
        }
      }
    }
  }
  
  players.delete(playerId);
  console.log(`玩家斷線: ${playerId}`);
}

// 健康檢查端點
app.get('/health', (req, res) => {
  res.json({ status: 'ok', games: games.size, players: players.size });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`撲克遊戲伺服器運行在端口 ${PORT}`);
});
