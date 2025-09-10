import { Player, Card } from '../App';

// 模擬玩家數據
export const mockPlayers: Player[] = [
  { id: 'player1', name: '測試玩家1', ready: true },
  { id: 'player2', name: '測試玩家2', ready: true },
  { id: 'player3', name: '測試玩家3', ready: true },
  { id: 'player4', name: '測試玩家4', ready: true }
];

// 模擬手牌數據
export const mockHand: Card[] = [
  { suit: '♠', rank: 'A', value: 14 },
  { suit: '♥', rank: 'K', value: 13 },
  { suit: '♦', rank: 'Q', value: 12 },
  { suit: '♣', rank: 'J', value: 11 },
  { suit: '♠', rank: '10', value: 10 }
];

// 模擬叫墩數據
export const mockBids = [
  { playerId: 'player1', playerName: '測試玩家1', level: 1, suit: 'NT', type: 'bid' as const },
  { playerId: 'player2', playerName: '測試玩家2', type: 'pass' as const }
];

// 模擬出牌數據
export const mockPlayedCards: Card[] = [
  { suit: '♠', rank: 'A', value: 14 },
  { suit: '♥', rank: 'K', value: 13 }
];

// 模擬墩記錄數據 - 完整遊戲
export const mockTrickRecordsFull = [
  {
    playerId: 'player1',
    trickNumber: 1,
    isOurTeam: true,
    winnerName: '測試玩家1',
    winningCard: { suit: '♠', rank: 'A', value: 14 }
  },
  {
    playerId: 'player2',
    trickNumber: 2,
    isOurTeam: true,
    winnerName: '測試玩家2',
    winningCard: { suit: '♥', rank: 'K', value: 13 }
  },
  {
    playerId: 'player1',
    trickNumber: 3,
    isOurTeam: true,
    winnerName: '測試玩家1',
    winningCard: { suit: '♦', rank: 'Q', value: 12 }
  },
  {
    playerId: 'player3',
    trickNumber: 4,
    isOurTeam: false,
    winnerName: '測試玩家3',
    winningCard: { suit: '♣', rank: 'J', value: 11 }
  },
  {
    playerId: 'player1',
    trickNumber: 5,
    isOurTeam: true,
    winnerName: '測試玩家1',
    winningCard: { suit: '♠', rank: '10', value: 10 }
  },
  {
    playerId: 'player2',
    trickNumber: 6,
    isOurTeam: true,
    winnerName: '測試玩家2',
    winningCard: { suit: '♥', rank: '9', value: 9 }
  },
  {
    playerId: 'player1',
    trickNumber: 7,
    isOurTeam: true,
    winnerName: '測試玩家1',
    winningCard: { suit: '♦', rank: '8', value: 8 }
  },
  {
    playerId: 'player4',
    trickNumber: 8,
    isOurTeam: false,
    winnerName: '測試玩家4',
    winningCard: { suit: '♣', rank: '7', value: 7 }
  },
  {
    playerId: 'player2',
    trickNumber: 9,
    isOurTeam: true,
    winnerName: '測試玩家2',
    winningCard: { suit: '♠', rank: '6', value: 6 }
  },
  {
    playerId: 'player3',
    trickNumber: 10,
    isOurTeam: false,
    winnerName: '測試玩家3',
    winningCard: { suit: '♥', rank: '5', value: 5 }
  },
  {
    playerId: 'player1',
    trickNumber: 11,
    isOurTeam: true,
    winnerName: '測試玩家1',
    winningCard: { suit: '♦', rank: '4', value: 4 }
  },
  {
    playerId: 'player4',
    trickNumber: 12,
    isOurTeam: false,
    winnerName: '測試玩家4',
    winningCard: { suit: '♣', rank: '3', value: 3 }
  },
  {
    playerId: 'player2',
    trickNumber: 13,
    isOurTeam: true,
    winnerName: '測試玩家2',
    winningCard: { suit: '♠', rank: '2', value: 2 }
  }
];

// 模擬墩記錄數據 - 叫墩階段（顯示之前的遊戲記錄）
export const mockTrickRecordsBidding = [
  {
    playerId: 'player1',
    trickNumber: 1,
    isOurTeam: true,
    winnerName: '測試玩家1',
    winningCard: { suit: '♠', rank: 'A', value: 14 }
  }
];

// 模擬墩記錄數據 - 遊戲進行中
export const mockTrickRecordsPlaying = [
  {
    playerId: 'player1',
    trickNumber: 1,
    isOurTeam: true,
    winnerName: '測試玩家1',
    winningCard: { suit: '♠', rank: 'A', value: 14 }
  },
  {
    playerId: 'player2',
    trickNumber: 2,
    isOurTeam: true,
    winnerName: '測試玩家2',
    winningCard: { suit: '♥', rank: 'K', value: 13 }
  },
  {
    playerId: 'player3',
    trickNumber: 3,
    isOurTeam: false,
    winnerName: '測試玩家3',
    winningCard: { suit: '♦', rank: 'Q', value: 12 }
  }
];

// 模擬遊戲結果數據
export const mockGameResult = {
  result: 'contract_made',
  teams: {
    declarer: {
      tricks: 7,
      won: true,
      players: [
        { id: 'player1', name: '測試玩家1' },
        { id: 'player2', name: '測試玩家2' }
      ]
    },
    defender: {
      tricks: 6,
      won: false,
      players: [
        { id: 'player3', name: '測試玩家3' },
        { id: 'player4', name: '測試玩家4' }
      ]
    }
  }
};

// 根據遊戲狀態獲取對應的模擬數據
export const getMockDataByGameState = (gameState: 'waiting' | 'bidding' | 'playing' | 'finished') => {
  const baseData = {
    players: mockPlayers,
    hand: mockHand,
    currentBidder: 'player1',
    bids: mockBids,
    currentPlayer: 'player1',
    playedCards: mockPlayedCards,
    isMyTurn: true,
    trickStats: {
      declarerTeamTricks: 0,
      defenderTeamTricks: 0,
      trickRecords: []
    },
    gameResult: null
  };

  switch (gameState) {
    case 'waiting':
      return {
        ...baseData,
        trickStats: {
          declarerTeamTricks: 0,
          defenderTeamTricks: 0,
          trickRecords: []
        }
      };

    case 'bidding':
      return {
        ...baseData,
        trickStats: {
          declarerTeamTricks: 1,
          defenderTeamTricks: 0,
          trickRecords: mockTrickRecordsBidding
        }
      };

    case 'playing':
      return {
        ...baseData,
        trickStats: {
          declarerTeamTricks: 2,
          defenderTeamTricks: 1,
          trickRecords: mockTrickRecordsPlaying
        }
      };

    case 'finished':
      return {
        ...baseData,
        trickStats: {
          declarerTeamTricks: 7,
          defenderTeamTricks: 6,
          trickRecords: mockTrickRecordsFull
        },
        gameResult: mockGameResult
      };

    default:
      return {
        ...baseData,
        trickStats: {
          declarerTeamTricks: 0,
          defenderTeamTricks: 0,
          trickRecords: []
        }
      };
  }
};
