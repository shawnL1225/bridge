import React, { useState, useRef, useEffect } from 'react';

interface MusicControlProps {
  musicFile?: string;
  volume?: number;
}

const MusicControl: React.FC<MusicControlProps> = ({ 
  musicFile = '/backgroudmusic.mp3',
  volume = 0.6
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(volume);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = currentVolume;
      audio.loop = true;
      
      // 監聽載入進度
      audio.addEventListener('loadstart', () => {
        // 音樂開始載入
      });
      
      audio.addEventListener('canplay', () => {
        // 音樂可以播放
      });
      
      audio.addEventListener('error', (e) => {
        console.log('音樂檔案載入錯誤:', e);
      });

      // 監聽播放狀態變化
      audio.addEventListener('play', () => setIsPlaying(true));
      audio.addEventListener('pause', () => setIsPlaying(false));
      
      // 嘗試自動播放
      const playAudio = async () => {
        try {
          await audio.play();
          setIsPlaying(true);
        } catch (error) {
          console.log('自動播放被瀏覽器阻止，需要用戶互動後才能播放');
          setIsPlaying(false);
        }
      };
      
      playAudio();
    }
  }, [currentVolume]);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (audio) {
      try {
        if (isPlaying) {
          audio.pause();
          setIsPlaying(false);
        } else {
          await audio.play();
          setIsPlaying(true);
        }
      } catch (error) {
        console.log('音樂播放控制失敗:', error);
      }
    }
  };


  const handleAudioError = () => {
    console.log('音樂檔案載入失敗');
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={musicFile}
        onError={handleAudioError}
        preload="auto"
        style={{ display: 'none' }}
      />
      
      <div className="music-control">
        <button 
          className="music-toggle-btn"
          onClick={togglePlayPause}
          title={isPlaying ? '暫停音樂' : '播放音樂'}
        >
          <i className={`fas ${isPlaying ? 'fa-volume-up' : 'fa-volume-mute'}`}></i>
        </button>
      </div>
    </>
  );
};

export default MusicControl;
