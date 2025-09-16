import React, { useState, useEffect } from 'react';
import './OfflineIndicator.css';

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      console.log('網路已連線');
      setIsOnline(true);
      setShowIndicator(true);
      
      // 清除之前的隱藏計時器
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
      
      // 3秒後隱藏指示器
      const timeout = setTimeout(() => {
        setShowIndicator(false);
      }, 3000);
      setHideTimeout(timeout);
    };

    const handleOffline = () => {
      console.log('網路已離線');
      setIsOnline(false);
      setShowIndicator(true);
      
      // 清除隱藏計時器，因為離線時要持續顯示
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        setHideTimeout(null);
      }
    };

    // 初始狀態檢查
    if (!navigator.onLine) {
      console.log('初始狀態：離線');
      setShowIndicator(true);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [hideTimeout]);

  // 如果沒有顯示指示器，返回 null
  if (!showIndicator) {
    return null;
  }

  return (
    <div className={`offline-indicator ${isOnline ? 'online' : 'offline'}`}>
      <div className="indicator-content">
        <i className={`fas ${isOnline ? 'fa-wifi' : 'fa-wifi-slash'}`}></i>
        <span>
          {isOnline ? '已重新連線' : '目前離線'}
        </span>
      </div>
    </div>
  );
};

export default OfflineIndicator;
