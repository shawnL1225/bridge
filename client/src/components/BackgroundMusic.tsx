import React, { useRef, useEffect } from 'react';

interface BackgroundMusicProps {
  musicFile?: string;
  volume?: number;
}

const BackgroundMusic: React.FC<BackgroundMusicProps> = ({ 
  musicFile = '/backgroudmusic_Fall-Coffee-Shop.mp3',
  volume = 0.6
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
      audio.loop = true;
      
      // 監聽載入進度
      audio.addEventListener('loadstart', () => {
        console.log('開始載入音樂檔案...');
      });
      
      audio.addEventListener('canplay', () => {
        console.log('音樂檔案可以播放了');
      });
      
      audio.addEventListener('error', (e) => {
        console.log('音樂檔案載入錯誤:', e);
      });
      
      // 嘗試自動播放
      const playAudio = async () => {
        try {
          await audio.play();
          console.log('背景音樂開始播放');
        } catch (error) {
          console.log('自動播放被瀏覽器阻止，需要用戶互動後才能播放');
          // 監聽用戶第一次互動後播放音樂
          const handleUserInteraction = async () => {
            try {
              await audio.play();
              console.log('背景音樂開始播放');
            } catch (playError) {
              console.log('音樂播放失敗:', playError);
            }
            // 移除事件監聽器
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('keydown', handleUserInteraction);
            document.removeEventListener('touchstart', handleUserInteraction);
          };
          
          document.addEventListener('click', handleUserInteraction);
          document.addEventListener('keydown', handleUserInteraction);
          document.addEventListener('touchstart', handleUserInteraction);
        }
      };
      
      playAudio();
    }
  }, [volume]);

  const handleAudioError = () => {
    console.log('音樂檔案載入失敗');
  };

  return (
    <audio
      ref={audioRef}
      src={musicFile}
      onError={handleAudioError}
      preload="auto"
      style={{ display: 'none' }}
    />
  );
};

export default BackgroundMusic;
