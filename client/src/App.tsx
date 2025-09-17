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
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);

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
                  setUpdateAvailable(true);
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

  // 處理更新
  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
  };

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
    <div className={`App ${currentRoom ? 'in-game' : 'in-lobby'}`}>
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
      
      {/* 顯示更新提示 */}
      {updateAvailable && (
        <div className="update-banner">
          <div className="update-content">
            <span className="update-icon">🔄</span>
            <span className="update-text">有新版本可用，請重新載入以獲得最新功能</span>
            <button onClick={handleUpdate} className="update-btn">
              立即更新
            </button>
            <button onClick={() => setUpdateAvailable(false)} className="update-close-btn">
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
      
      {/* 方向提示訊息 */}
      <div className="orientation-message">
        <i className="fas fa-mobile-alt"></i>
        <h2>請旋轉您的設備</h2>
        <p>為了獲得最佳遊戲體驗，請將設備轉為橫向模式</p>
      </div>
    </div>
  );
}

export default App;
