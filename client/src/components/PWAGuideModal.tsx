import React, { useState, useEffect } from 'react';
import './PWAGuideModal.css';

interface PWAGuideModalProps {
  isVisible: boolean;
  onClose: () => void;
  canInstall: boolean;
}

const PWAGuideModal: React.FC<PWAGuideModalProps> = ({ isVisible, onClose, canInstall }) => {
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 檢測設備類型
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // 監聽 PWA 安裝提示
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // 不直接設置 canInstall，讓 usePWAGuide 來控制
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    
    if (isSafari && isIOS) {
      // Safari iOS 特殊處理：顯示手動安裝指南
      // 不關閉模態框，讓用戶看到手動安裝步驟
      return;
    }
    
    if (deferredPrompt) {
      // 顯示安裝提示
      deferredPrompt.prompt();
      
      // 等待用戶回應
      const { outcome } = await deferredPrompt.userChoice;
      
      // 用戶選擇結果處理
      
      // 清除 deferredPrompt
      setDeferredPrompt(null);
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="pwa-guide-overlay">
      <div className="pwa-guide-modal">
        <div className="pwa-guide-header">
          <div className="pwa-guide-icon">
            <i className="fas fa-mobile-alt"></i>
          </div>
          <h2 className="pwa-guide-title">安裝應用程式</h2>
        </div>

        <div className="pwa-guide-content">
          {/* 直接安裝按鈕 */}
          {canInstall && (
            <div className="pwa-install-section">
              <div className="install-btn-container">
                <button className="install-btn" onClick={handleInstallClick}>
                  <i className="fas fa-download"></i>
                  <span>立即安裝應用程式</span>
                </button>
                <p className="install-note">
                  {isAndroid ? '一鍵安裝，無需手動操作' : '一鍵安裝，獲得更好的遊戲體驗'}
                </p>
              </div>
            </div>
          )}

          {/* 手動安裝指南 - iOS Safari */}
          {!canInstall && (
            <div className="pwa-manual-install">
              <h3>手動安裝指南</h3>
              {isIOS ? (
                <div className="pwa-guide-steps ios-steps">
                  <div className="step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <p>點擊底部的 <i className="fas fa-share"></i> 分享按鈕</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <p>選擇「<i className="fas fa-plus"></i> 加入主畫面」</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <p>點擊「加入」完成安裝</p>
                    </div>
                  </div>
                </div>
              ) : isAndroid ? (
                <div className="pwa-guide-steps android-steps">
                  <div className="step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <p>點擊瀏覽器右上角的 <i className="fas fa-ellipsis-v"></i> 選單</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <p>選擇「<i className="fas fa-plus"></i> 安裝應用程式」</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <p>點擊「安裝」完成安裝</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pwa-guide-steps desktop-steps">
                  <div className="step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <p>點擊瀏覽器地址欄右側的 <i className="fas fa-plus"></i> 安裝圖示</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <p>點擊「安裝」按鈕</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        <div className="pwa-guide-footer">
          <button className="pwa-guide-btn secondary" onClick={onClose}>
            稍後再說
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAGuideModal;