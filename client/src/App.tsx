import React, { useState } from 'react';
import './App.css';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import BackgroundMusic from './components/BackgroundMusic';

export interface Player {
  id: string;
  name: string;
  ready: boolean;
  cardCount?: number;
}

export interface Card {
  suit: string;
  rank: string;
  value: number;
}

export interface GameState {
  id: string;
  players: Player[];
  hands: Card[][];
  currentPlayer: string;
  gameState: 'waiting' | 'playing' | 'finished';
  playedCards: Card[];
  lastPlayedCard: Card | null;
};

function App() {
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleJoinRoom = (roomId: string, name: string) => {
    setCurrentRoom(roomId);
    setPlayerName(name);
    setErrorMessage(''); // 清除之前的錯誤訊息
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    setPlayerName('');
    setErrorMessage(''); // 清除錯誤訊息
  };

  const handleRoomError = (errorMsg: string) => {
    setErrorMessage(errorMsg);
    setCurrentRoom(null);
    setPlayerName('');
  };

  return (
    <div className="App">
      <BackgroundMusic volume={0.5} />
      <header className="App-header">
        <div className="header-content">
          <div className="casino-brand">
            <div className="brand-symbols">
              <span className="symbol">♠</span>
              <span className="symbol">♥</span>
            </div>
            <h1 className="app-title">CASINO BRIDGE</h1>
            <div className="brand-symbols">
              <span className="symbol">♦</span>
              <span className="symbol">♣</span>
            </div>
          </div>
          <div className="header-subtitle">Online Contract Bridge</div>
        </div>
        <div className="header-decoration"></div>
      </header>
      
      {/* 顯示錯誤訊息 */}
      {errorMessage && (
        <div className="error-banner">
          <div className="error-content">
            <span className="error-icon">❌</span>
            <span className="error-text">{errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="error-close-btn">
              ✕
            </button>
          </div>
        </div>
      )}
      
      {!currentRoom ? (
        <Lobby onJoinRoom={handleJoinRoom} />
      ) : (
        <GameRoom
          roomId={currentRoom}
          playerName={playerName}
          onLeaveRoom={handleLeaveRoom}
          onRoomError={handleRoomError}
        />
      )}
    </div>
  );
}

export default App;
