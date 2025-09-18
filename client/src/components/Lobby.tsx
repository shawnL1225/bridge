import React, { useState } from 'react';
import './Lobby.css';
import PWAGuideModal from './PWAGuideModal';
import { usePWAGuide } from '../hooks/usePWAGuide';

interface LobbyProps {
  onJoinRoom: (roomId: string, playerName: string) => void;
  onRandomMatch: (playerName: string) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onJoinRoom, onRandomMatch }) => {
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  
  // PWA 引導功能
  const { isVisible: showPwaGuide, hideGuide, showGuide, canInstall } = usePWAGuide();

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomId.trim() || !playerName.trim()) {
      alert('請輸入房間號和玩家名字');
      return;
    }

    setIsJoining(true);
    
    setTimeout(() => {
      onJoinRoom(roomId.trim(), playerName.trim());
      setIsJoining(false);
    }, 500);
  };

  const handleRandomMatch = () => {
    if (!playerName.trim()) {
      alert('請先輸入玩家名字');
      return;
    }

    setIsJoining(true);
    
    setTimeout(() => {
      onRandomMatch(playerName.trim());
      setIsJoining(false);
    }, 500);
  };


  return (
    <div className="lobby">
      <div className="lobby-background">
        <div className="casino-pattern"></div>
      </div>
      
      <div className="lobby-container">
        <div className="lobby-header">
          <div className="casino-logo">
            <span className="card-symbol">♠</span>
            <span className="casino-title">CASINO</span>
            <span className="card-symbol">♠</span>
          </div>
          <h1 className="lobby-title">決勝橋牌</h1>
          <p className="lobby-subtitle">加入房間開始遊戲</p>
        </div>
        
        <form onSubmit={handleJoinRoom} className="join-form">
          <div className="form-group">
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="玩家名字"
              maxLength={20}
              required
              className="casino-input"
            />
          </div>
          <div className="form-divider"></div>
          <div className="form-group">
            <div className="input-container">
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="房間號碼"
                maxLength={6}
                required
                className="casino-input"
              />
              <button
                type="submit"
                className="join-btn"
                disabled={isJoining}
              >
                <span className="btn-icon">→</span>
              </button>
            </div>
          </div>
        </form>
        
        <div className="random-match-section">
          <button
            type="button"
            className="random-match-btn"
            onClick={handleRandomMatch}
            disabled={isJoining}
          >
            <span className="btn-icon">🎲</span>
            <span className="btn-text">隨機配對</span>
          </button>
        </div>
        
        <div className="casino-footer">
          <div className="card-symbols">
            <span>♠</span>
            <span>♥</span>
            <span>♦</span>
            <span>♣</span>
          </div>
        </div>
      </div>
      
      {/* 日本商標跑馬燈 */}
      <div className="marquee-container">
        <div className="marquee-track">
          <div className="marquee-content">
            <div className="marquee-text">とうきゅうでんてつ</div>
            <div className="marquee-text">さくらゲームしゅっぱん</div>
            <div className="marquee-text">ふじさんエンターテイメント</div>
            <div className="marquee-text">とうきょうデジタルこうぼう</div>
            <div className="marquee-text">わふうゲームせいさくしょ</div>
            <div className="marquee-text">しんじゅくエンターテイメント</div>
            <div className="marquee-text">きょうとでんとうゲームしゃ</div>
            <div className="marquee-text">おおさかブリッジがいしゃ</div>
            <div className="marquee-text">こうべゲームかいはつ</div>
            <div className="marquee-text">よこはまデジタルエンターテイメント</div>
          </div>
        </div>
      </div>
      
      {/* PWA 引導模態框 */}
      <PWAGuideModal 
        isVisible={showPwaGuide} 
        onClose={hideGuide}
        canInstall={canInstall}
      />
    </div>
  );
};

export default Lobby;
