import React, { useState } from 'react';
import './Lobby.css';

interface LobbyProps {
  onJoinRoom: (roomId: string, playerName: string) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onJoinRoom }) => {
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);

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

  const generateRandomRoomId = () => {
    const randomId = Math.random().toString(36).substr(2, 6).toUpperCase();
    setRoomId(randomId);
  };

  return (
    <div className="lobby">
      <div className="lobby-container">
        <h2>加入遊戲房間</h2>
        <p className="lobby-description">
          輸入房間號和您的名字來開始遊戲
        </p>
        
        <form onSubmit={handleJoinRoom} className="join-form">
          <div className="form-group">
            <label htmlFor="roomId">房間號碼：</label>
            <div className="room-input">
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="輸入房間號"
                maxLength={6}
                required
              />
              <button
                type="button"
                onClick={generateRandomRoomId}
                className="generate-btn"
              >
                隨機生成
              </button>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="playerName">玩家名字：</label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="輸入您的名字"
              maxLength={20}
              required
            />
          </div>
          
          <button
            type="submit"
            className="join-btn"
            disabled={isJoining}
          >
            {isJoining ? '加入中...' : '加入房間'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Lobby;
