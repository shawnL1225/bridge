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
  
  // 對每個玩家的手牌進行排序
  hands.forEach(hand => {
    sortCards(hand);
  });
  
  return hands;
}

// 排序卡牌
function sortCards(cards) {
  // 花色優先級：♠(0) < ♥(1) < ♦(2) < ♣(3)
  const suitOrder = { '♠': 0, '♥': 1, '♦': 2, '♣': 3 };
  
  return cards.sort((a, b) => {
    // 先按花色排序
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }
    // 花色相同時，按大小排序（小到大）
    return a.value - b.value;
  });
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
    gameState: 'waiting', // waiting, bidding, playing, finished
    turnOrder: [],
    lastPlayedCard: null,
    lastPlayerId: null,
    // 橋牌相關狀態
    currentTrick: 1,  // 當前墩數
    trickCards: [],   // 當前墩的牌
    trickCount: 0,    // 當前墩已出的牌數
    playerPlayedCards: {}, // 每個玩家的出牌歷史
    // 叫墩相關狀態
    biddingState: {
      currentBidder: 0,       // 當前叫墩玩家索引
      bids: [],               // 所有叫墩記錄 [{playerId, bid, suit}]
      passCount: 0,           // 連續pass次數
      finalContract: null,    // 最終合約 {playerId, playerName, level, suit}
      trumpSuit: null         // 王牌花色
    },
    // 墩數統計
    trickStats: {
      declarerTeamTricks: 0,  // 莊家隊伍拿到的墩數
      defenderTeamTricks: 0,  // 防守隊伍拿到的墩數
      
      trickRecords: []        // 記錄每墩的記錄供客戶端顯示
    }
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

// 檢查出牌是否合法 (橋牌規則：必須跟花色)
function isValidPlay(card, trickCards, playerHand) {
  // 如果是第一張牌，任何牌都合法
  if (trickCards.length === 0) {
    return true;
  }
  
  // 獲取領頭花色 (第一張牌的花色)
  const leadSuit = trickCards[0].card.suit;
  
  // 如果出的牌是領頭花色，合法
  if (card.suit === leadSuit) {
    return true;
  }
  
  // 如果出的牌不是領頭花色，檢查手中是否還有領頭花色的牌
  const hasLeadSuit = playerHand.some(handCard => handCard.suit === leadSuit);
  
  // 如果手中還有領頭花色的牌，但沒有出，則不合法
  if (hasLeadSuit) {
    return false;
  }
  
  // 如果手中沒有領頭花色的牌，可以出任何牌 (墊牌)
  return true;
}

// 判斷墩的贏家（考慮王牌）
function getTrickWinner(trickCards, trumpSuit = null) {
  if (trickCards.length !== 4) {
    throw new Error('墩必須有4張牌才能判斷贏家');
  }
  
  function getCardRankValue(card) {
    if (card.rank === 'A') return 14;
    if (card.rank === 'K') return 13;
    if (card.rank === 'Q') return 12;
    if (card.rank === 'J') return 11;
    // 2-10 直接轉成數字
    const num = parseInt(card.rank, 10);
    if (!isNaN(num)) return num;
    // 若有其他花色或異常，預設最小
    return 0;
  }

  const leadSuit = trickCards[0].card.suit;
  
  // 如果有王牌且不是NT（無王牌），先檢查王牌
  if (trumpSuit && trumpSuit !== 'NT') {
    const trumpCards = trickCards.filter(tc => tc.card.suit === trumpSuit);
    if (trumpCards.length > 0) {
      // 有王牌時，最大的王牌獲勝
      let winner = trumpCards[0];
      for (let i = 1; i < trumpCards.length; i++) {
        if (getCardRankValue(trumpCards[i].card) > getCardRankValue(winner.card)) {
          winner = trumpCards[i];
        }
      }
      return winner;
    }
  }
  
  // 沒有王牌或是NT，按領頭花色判斷
  const followingSuitCards = trickCards.filter(tc => tc.card.suit === leadSuit);
  
  let winner = followingSuitCards[0];
  for (let i = 1; i < followingSuitCards.length; i++) {
    if (getCardRankValue(followingSuitCards[i].card) > getCardRankValue(winner.card)) {
      winner = followingSuitCards[i];
    }
  }
  
  return winner;
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
    case 'make_bid':
      handleMakeBid(playerId, data.level, data.suit);
      break;
    case 'pass_bid':
      handlePassBid(playerId);
      break;
    case 'restart_game':
      handleRestartGame(playerId);
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


// 開始遊戲（進入叫墩階段）
function startGame(roomId) {
  const game = games.get(roomId);
  if (!game) return;
  
  // 重置遊戲狀態
  resetGameState(game);
  
  game.gameState = 'bidding';
  game.turnOrder = [
    game.players[0].id,
    game.players[1].id,
    game.players[2].id,
    game.players[3].id
  ];
  
  // 為每個玩家發送叫墩開始訊息和手牌
  game.players.forEach((player, index) => {
    player.ws.send(JSON.stringify({
      type: 'bidding_started',
      currentBidder: game.turnOrder[0],
      currentBidderName: game.players[0].name,
      hand: game.hands[index],  // 發送手牌供叫墩參考
      bids: game.biddingState.bids
    }));
  });
  
  console.log(`房間 ${roomId} 開始叫墩，叫墩順序：`, game.turnOrder);
}

// 處理叫墩
function handleMakeBid(playerId, level, suit) {
  const player = players.get(playerId);
  if (!player || !player.roomId) return;
  
  const game = games.get(player.roomId);
  if (!game || game.gameState !== 'bidding') return;
  
  // 檢查是否輪到該玩家叫墩
  if (game.turnOrder[game.biddingState.currentBidder] !== playerId) {
    player.ws.send(JSON.stringify({
      type: 'error',
      message: '還沒輪到您叫墩'
    }));
    return;
  }
  
  // 驗證叫墩是否有效（必須比上一個叫墩更高）
  const lastBid = getLastValidBid(game.biddingState.bids);
  if (!isValidBid(level, suit, lastBid)) {
    player.ws.send(JSON.stringify({
      type: 'error',
      message: '叫墩必須比上一個叫墩更高'
    }));
    return;
  }
  
  // 記錄叫墩
  const bidInfo = {
    playerId,
    playerName: player.name,
    level: parseInt(level),
    suit,
    type: 'bid'
  };
  
  game.biddingState.bids.push(bidInfo);
  game.biddingState.passCount = 0; // 重置pass計數
  
  // 移動到下一個玩家
  game.biddingState.currentBidder = (game.biddingState.currentBidder + 1) % 4;
  const nextBidderId = game.turnOrder[game.biddingState.currentBidder];
  
  // 廣播叫墩結果
  broadcastToRoom(player.roomId, {
    type: 'bid_made',
    bid: bidInfo,
    bids: game.biddingState.bids,
    currentBidder: nextBidderId,
    currentBidderName: game.players.find(p => p.id === nextBidderId)?.name
  });
  
  console.log(`玩家 ${player.name} 叫墩: ${level}${suit}`);
}

// 處理pass叫墩
function handlePassBid(playerId) {
  const player = players.get(playerId);
  if (!player || !player.roomId) return;
  
  const game = games.get(player.roomId);
  if (!game || game.gameState !== 'bidding') return;
  
  // 檢查是否輪到該玩家叫墩
  if (game.turnOrder[game.biddingState.currentBidder] !== playerId) {
    player.ws.send(JSON.stringify({
      type: 'error',
      message: '還沒輪到您叫墩'
    }));
    return;
  }
  
  // 記錄pass
  const passInfo = {
    playerId,
    playerName: player.name,
    type: 'pass'
  };
  
  game.biddingState.bids.push(passInfo);
  game.biddingState.passCount++;
  
  // 檢查是否連續三個pass
  if (game.biddingState.passCount >= 3 && getLastValidBid(game.biddingState.bids)) {
    // 叫墩結束，確定最終合約
    const finalContract = getLastValidBid(game.biddingState.bids);
    game.biddingState.finalContract = finalContract;
    game.biddingState.trumpSuit = finalContract.suit;
    
    // 直接開始出牌，不需要等待
    startPlayingPhase(player.roomId, finalContract.playerId);
    
    console.log(`房間 ${player.roomId} 叫墩結束，最終合約: ${finalContract.level}${finalContract.suit} by ${finalContract.playerName}`);
    
  } else if (game.biddingState.passCount >= 4) {
    // 四個人都pass，重新發牌
    broadcastToRoom(player.roomId, {
      type: 'bidding_failed',
      message: '所有玩家都pass，將重新發牌'
    });
    
    // 重新開始遊戲
    setTimeout(() => {
      restartGame(player.roomId);
    }, 3000);
    
  } else {
    // 移動到下一個玩家
    game.biddingState.currentBidder = (game.biddingState.currentBidder + 1) % 4;
    const nextBidderId = game.turnOrder[game.biddingState.currentBidder];
    
    // 廣播pass結果
    broadcastToRoom(player.roomId, {
      type: 'bid_passed',
      passInfo,
      bids: game.biddingState.bids,
      currentBidder: nextBidderId,
      currentBidderName: game.players.find(p => p.id === nextBidderId)?.name,
      passCount: game.biddingState.passCount
    });
  }
  
  console.log(`玩家 ${player.name} pass`);
}

// 獲取最後一個有效叫墩
function getLastValidBid(bids) {
  for (let i = bids.length - 1; i >= 0; i--) {
    if (bids[i].type === 'bid') {
      return bids[i];
    }
  }
  return null;
}

// 驗證叫墩是否有效
function isValidBid(level, suit, lastBid) {
  if (!lastBid) return true; // 第一個叫墩總是有效
  
  const suitOrder = { 'NT': 4, '♠': 3, '♥': 2, '♦': 1, '♣': 0 }; // NT = No Trump (無王牌)
  const newLevel = parseInt(level);
  
  // 等級更高
  if (newLevel > lastBid.level) return true;
  
  // 等級相同但花色更高
  if (newLevel === lastBid.level) {
    return suitOrder[suit] > suitOrder[lastBid.suit];
  }
  
  return false;
}

// 開始出牌階段
function startPlayingPhase(roomId, contractPlayerId) {
  const game = games.get(roomId);
  if (!game) return;
  
  game.gameState = 'playing';
  
  // 找到合約玩家的索引
  const contractPlayerIndex = game.players.findIndex(p => p.id === contractPlayerId);
  
  // 從喊到王牌的前一個玩家開始出牌
  const firstPlayerIndex = (contractPlayerIndex - 1 + 4) % 4;
  game.currentPlayer = firstPlayerIndex;
  
  // 廣播出牌開始
  game.players.forEach(player => {
    player.ws.send(JSON.stringify({
      type: 'game_started',
      currentPlayer: game.players[firstPlayerIndex].id,
      currentPlayerName: game.players[firstPlayerIndex].name,
      trumpSuit: game.biddingState.trumpSuit,
      finalContract: game.biddingState.finalContract
    }));
  });
  
  console.log(`房間 ${roomId} 開始出牌，王牌: ${game.biddingState.trumpSuit}，從 ${game.players[firstPlayerIndex].name} 開始（合約玩家 ${game.players[contractPlayerIndex].name} 的前一個）`);
}

// 處理出牌
function handlePlayCard(playerId, cardIndex) {
  const player = players.get(playerId);
  if (!player || !player.roomId) return;
  
  const game = games.get(player.roomId);
  if (!game || game.gameState !== 'playing') return;
  
  const playerIndex = game.players.findIndex(p => p.id === playerId);
  const hand = game.hands[playerIndex];
  const card = hand[cardIndex];

  // 檢查是否輪到該玩家
  if (game.turnOrder[game.currentPlayer] !== playerId) {
    player.ws.send(JSON.stringify({
      type: 'error',
      message: '還沒輪到您出牌'
    }));
    return;
  }
  
  if (cardIndex < 0 || cardIndex >= hand.length) {
    player.ws.send(JSON.stringify({
      type: 'error',
      message: '無效的牌'
    }));
    return;
  }
  
  // 橋牌規則檢查：必須跟花色
  if (!isValidPlay(card, game.trickCards, hand)) {
    const leadSuit = game.trickCards.length > 0 ? game.trickCards[0].card.suit : null;
    const errorMsg = leadSuit ? 
      `必須跟花色 ${leadSuit}，除非您沒有該花色的牌` : 
      '出牌不符合規則';
    
    player.ws.send(JSON.stringify({
      type: 'error',
      message: errorMsg
    }));
    return;
  }
  
  // 出牌
  hand.splice(cardIndex, 1);
  
  // 記錄到整局出牌歷史
  game.playedCards.push(card);
  game.lastPlayedCard = card;
  game.lastPlayerId = playerId;
  
  // 橋牌邏輯：將牌加入當前墩
  game.trickCards.push({ card, playerId });
  game.trickCount++;
  
  // 更新每個玩家的出牌歷史
  if (!game.playerPlayedCards[playerId]) {
    game.playerPlayedCards[playerId] = [];
  }
  game.playerPlayedCards[playerId].push(card);
  
  // 廣播出牌訊息
  let nextPlayerForBroadcast = null;
  
  if (game.trickCount < 4) {
    // 墩還沒完成，移動到下一個玩家
    game.currentPlayer = (game.currentPlayer + 1) % 4;
    nextPlayerForBroadcast = game.turnOrder[game.currentPlayer];
  } else {
    // 墩完成了，下一個玩家由贏家決定，暫時不設定
    nextPlayerForBroadcast = null;
  }

  broadcastToRoom(player.roomId, {
    type: 'card_played',
    playerId: playerId,
    card: card,
    currentPlayer: nextPlayerForBroadcast,
    currentTrick: game.currentTrick,
    trickCount: game.trickCount,
    playerPlayedCards: game.playerPlayedCards
  });

  // 如果完成一墩，額外廣播墩完成訊息
  if (game.trickCount === 4) {
    console.log(`第 ${game.currentTrick} 墩完成`);
    
    const trickWinner = getTrickWinner(game.trickCards, game.biddingState.trumpSuit);
    const winnerPlayer = game.players.find(p => p.id === trickWinner.playerId);

    // 統計墩數 - 判斷贏家屬於哪個隊伍
    const winnerPlayerIndex = game.players.findIndex(p => p.id === trickWinner.playerId);
    const contractPlayerIndex = game.players.findIndex(p => p.id === game.biddingState.finalContract?.playerId);
    
    // 判斷贏家是否是莊家隊伍（莊家和對家）
    const isDeclarerTeam = winnerPlayerIndex === contractPlayerIndex || 
                          winnerPlayerIndex === (contractPlayerIndex + 2) % 4;
    
    if (isDeclarerTeam) {
      game.trickStats.declarerTeamTricks++;
    } else {
      game.trickStats.defenderTeamTricks++;
    }
    

    
    // 為每個玩家生成 trickRecord
    game.players.forEach((player) => {
      const playerIndex = game.players.findIndex(p => p.id === player.id);
      const contractPlayerIndex = game.players.findIndex(p => p.id === game.biddingState.finalContract?.playerId);
      const isPlayerDeclarerTeam = playerIndex === contractPlayerIndex || 
                                   playerIndex === (contractPlayerIndex + 2) % 4;
      
      // 判斷這個墩對於該玩家來說是勝利還是失敗
      const isOurTeamWin = isDeclarerTeam === isPlayerDeclarerTeam;
      
      game.trickStats.trickRecords.push({
        playerId: player.id,
        trickNumber: game.currentTrick,
        isOurTeam: isOurTeamWin,
        winnerName: winnerPlayer?.name,
        winningCard: trickWinner.card
      });
    });

    // 廣播墩完成訊息，包含贏家資訊和墩數統計
    broadcastToRoom(player.roomId, {
      type: 'trick_completed',
      trickNumber: game.currentTrick,
      trickCards: game.trickCards,
      playerPlayedCards: game.playerPlayedCards,
      trickWinner: {
        playerId: trickWinner.playerId,
        playerName: winnerPlayer?.name,
        winningCard: trickWinner.card
      },
      trickStats: {
        declarerTeamTricks: game.trickStats.declarerTeamTricks,
        defenderTeamTricks: game.trickStats.defenderTeamTricks,
        trickRecords: game.trickStats.trickRecords
      }
    });
    
    // 檢查遊戲是否應該結束（達成勝負條件）
    if (checkGameEndCondition(game)) {
      setTimeout(() => {
        endGame(player.roomId);
      }, 5000);
    } else {
      setTimeout(() => {
        clearTrickAndStartNext(player.roomId, trickWinner.playerId);
      }, 5000);
    }
  }
  
  // 理論上不應該執行到這裡 - 遊戲應該在達成勝負條件時就結束
  if (hand.length === 0 && game.players.every((p, index) => game.hands[index].length === 0)) {
    console.error(`錯誤：所有手牌都出完但遊戲未結束！房間: ${player.roomId}`);
    console.error('墩數統計:', game.trickStats);
    console.error('合約:', game.biddingState.finalContract);
    
    // 強制結束遊戲並報告錯誤
    endGame(player.roomId);
    return;
  }
  
  console.log(`玩家 ${player.name} 出牌: ${card.suit}${card.rank}，第 ${game.currentTrick} 墩 (${game.trickCount}/4)`);
}

// 清空當前墩並開始下一墩
function clearTrickAndStartNext(roomId, winnerId) {
  const game = games.get(roomId);
  if (!game) return;
  if (!winnerId) return;

  game.trickCards = [];
  game.trickCount = 0;
  game.currentTrick++;
  
  const winnerIndex = game.turnOrder.findIndex(id => id === winnerId);
  if (winnerIndex !== -1) {
    game.currentPlayer = winnerIndex;  // 設定為索引，不是玩家ID
  }

  // 廣播清空訊息和下一墩開始
  broadcastToRoom(roomId, {
    type: 'trick_cleared',
    currentTrick: game.currentTrick,
    currentPlayer: winnerId,
    playerPlayedCards: {}
  });
  
  console.log(`房間 ${roomId} 開始第 ${game.currentTrick} 墩，贏家 ${winnerId} 先出`);
}

// 檢查遊戲結束條件
function checkGameEndCondition(game) {
  const finalContract = game.biddingState.finalContract;
  if (!finalContract) return false;

  const declarerRequiredTricks = 6 + finalContract.level;  // 莊家隊伍需要的墩數
  const defenderRequiredTricks = 13 - declarerRequiredTricks + 1;  // 防守隊伍需要的墩數（阻止莊家）
  const declarerTeamTricks = game.trickStats.declarerTeamTricks;
  const defenderTeamTricks = game.trickStats.defenderTeamTricks;

  // 條件1：莊家隊伍達成合約
  if (declarerTeamTricks >= declarerRequiredTricks) {
    console.log(`遊戲結束：莊家隊伍達成合約 (${declarerTeamTricks}/${declarerRequiredTricks})`);
    return true;
  }

  // 條件2：防守隊伍達成目標（阻止莊家合約）
  if (defenderTeamTricks >= defenderRequiredTricks) {
    console.log(`遊戲結束：防守隊伍達成目標 (${defenderTeamTricks}/${defenderRequiredTricks})`);
    return true;
  }

  return false;
}

// 結束遊戲
function endGame(roomId) {
  const game = games.get(roomId);
  if (!game) return;
  
  game.gameState = 'finished';
  
  // 計算合約結果
  const contractResult = calculateContractResult(game);
  
  broadcastToRoom(roomId, {
    type: 'game_ended',
    contractResult: contractResult,
    finalHands: game.hands
  });
  
  console.log(`房間 ${roomId} 遊戲結束，合約結果:`, contractResult);
}

// 計算合約輸贏結果
function calculateContractResult(game) {
  const finalContract = game.biddingState.finalContract;
  if (!finalContract) {
    return {
      result: 'no_contract',
      message: '沒有合約',
      declarerTeamTricks: game.trickStats.declarerTeamTricks,
      defenderTeamTricks: game.trickStats.defenderTeamTricks
    };
  }

  const requiredTricks = 6 + finalContract.level; // 基本 6 墩 + 合約等級
  const actualTricks = game.trickStats.declarerTeamTricks;
  const contractMade = actualTricks >= requiredTricks;
  
  // 找到莊家隊伍的玩家
  const declarerIndex = game.players.findIndex(p => p.id === finalContract.playerId);
  const partnerIndex = (declarerIndex + 2) % 4;
  const declarerTeam = [game.players[declarerIndex], game.players[partnerIndex]];
  
  // 防守隊伍
  const defenderTeam = game.players.filter((p, index) => index !== declarerIndex && index !== partnerIndex);
  
  let undertricks = 0;
  const totalTricksPlayed = game.trickStats.declarerTeamTricks + game.trickStats.defenderTeamTricks;
  const isEarlyEnd = totalTricksPlayed < 13;
  
  if (!contractMade) {
    undertricks = requiredTricks - actualTricks;
  }
  
  return {
    result: contractMade ? 'contract_made' : 'contract_failed',
    stats: {
      required: requiredTricks,
      actual: actualTricks,
      undertricks: undertricks
    },
    teams: {
      declarer: {
        players: declarerTeam.map(p => ({ id: p.id, name: p.name })),
        tricks: game.trickStats.declarerTeamTricks,
        won: contractMade
      },
      defender: {
        players: defenderTeam.map(p => ({ id: p.id, name: p.name })),
        tricks: game.trickStats.defenderTeamTricks,
        won: !contractMade
      }
    },


  };
}


// 處理重新開始遊戲
function handleRestartGame(playerId) {
  const player = players.get(playerId);
  if (!player || !player.roomId) return;
  
  const game = games.get(player.roomId);
  if (!game) return;

  if (game.gameState !== 'waiting') {
    resetGameState(game);
    console.log(`房間 ${player.roomId} 遊戲狀態重置`);
  }

  // 只對該 playerId 玩家發送重新開始訊息和新手牌
  const playerIndex = game.players.findIndex(p => p.id === playerId);
  if (playerIndex !== -1) {
    const playerObj = game.players[playerIndex];
    playerObj.ws.send(JSON.stringify({
      type: 'game_restarted',
      message: '遊戲已重新開始，請重新準備',
      players: game.players.map(p => ({ id: p.id, name: p.name, ready: p.ready })),
      hand: game.hands[playerIndex]  // 發送該玩家的新手牌
    }));
  }
  
}

function resetGameState(game) {
  game.gameState = 'waiting';

  // 重新發牌
  const deck = shuffleDeck(createDeck());
  game.hands = dealCards(deck, 4);

  // 重置基本遊戲狀態
  game.currentPlayer = 0;
  game.turnOrder = [];
  game.playedCards = [];
  game.lastPlayedCard = null;
  game.lastPlayerId = null;
  game.currentTrick = 1;
  game.trickCards = [];
  game.trickCount = 0;
  game.playerPlayedCards = {};

  // 重置所有玩家的準備狀態
  game.players.forEach(player => {
    player.ready = false;
  });
  // 重置叫墩狀態
  game.biddingState = {
    currentBidder: 0,
    bids: [],
    passCount: 0,
    finalContract: null,
    trumpSuit: null
  };
  
  // 重置墩數統計
  game.trickStats = {
    declarerTeamTricks: 0,
    defenderTeamTricks: 0,
    trickRecords: []
  };
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
