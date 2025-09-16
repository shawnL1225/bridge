import React, { useState, useEffect } from 'react';
import './App.css';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import MusicControl from './components/MusicControl';
import OfflineIndicator from './components/OfflineIndicator';
import './components/MusicControl.css';
import { DEV_CONFIG } from './config/devConfig';

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
  // 開發模式：直接進入 GameRoom 來測試不同畫面
  const DEV_MODE = DEV_CONFIG.ENABLED;
  const SKIP_TO_GAMEROOM = DEV_CONFIG.SKIP_TO_GAMEROOM; // 修改 devConfig.ts 中的 SKIP_TO_GAMEROOM
  
  const [currentRoom, setCurrentRoom] = useState<string | null>(
    DEV_MODE && SKIP_TO_GAMEROOM ? DEV_CONFIG.ROOM_ID : null
  );
  const [playerName, setPlayerName] = useState<string>(
    DEV_MODE && SKIP_TO_GAMEROOM ? DEV_CONFIG.PLAYER_NAME : ''
  );
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 註冊 Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
        .then((registration) => {
          console.log('SW registered successfully: ', registration);
          
          // 檢查更新
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New content is available; please refresh.');
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          console.error('SW registration failed: ', registrationError);
        });
    } else {
      console.log('Service Worker not supported');
    }
  }, []);

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
          <div className="header-controls">
            <MusicControl volume={0.5} />
          </div>
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
      
            {/* 離線狀態指示器 */}
            <OfflineIndicator />
          </div>
        );
      }
      
      export default App;
