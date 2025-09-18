import { useState, useEffect } from 'react';

interface PWAGuideState {
  isVisible: boolean;
  canInstall: boolean;
  showGuide: () => void;
  hideGuide: () => void;
}

export const usePWAGuide = (): PWAGuideState => {
  const [isVisible, setIsVisible] = useState(false);
  const [canInstall, setCanInstall] = useState(false);


  useEffect(() => {
    // 一次性解析 userAgent，避免重複解析
    const userAgent = navigator.userAgent.toLowerCase();
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent);


    // 檢測是否為 PWA 模式（一次性檢測，避免重複呼叫）
    const checkPWAStatus = () => {
      // 1. 檢查 display-mode (最可靠的方法)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
      }
      
      // 2. 檢查 iOS Safari 的 standalone 模式
      if ((window.navigator as any).standalone === true) {
        return true;
      }
      
      // 3. Safari 特殊檢測：檢查是否有瀏覽器 UI
      if (isSafari && isIOS) {
        // Safari iOS 的瀏覽器 UI 檢測更複雜，我們使用更保守的方法
        const isStandaloneMode = (window.navigator as any).standalone === true;
        
        // 只依賴 navigator.standalone，不使用瀏覽器 UI 檢測
        if (isStandaloneMode) {
          return true;
        }
      }
      
      // 4. 檢查是否有瀏覽器 UI 元素 (通用檢測) - 暫時禁用，容易誤判
      // const hasBrowserUI = window.outerHeight - window.innerHeight > 100;
      // const screenHeightMatch = window.screen.height === window.innerHeight;
      // if (!hasBrowserUI && screenHeightMatch) {
      //   return true;
      // }
      
      // 5. 檢查 URL 是否包含 PWA 相關參數
      if (window.location.search.includes('pwa=1') || window.location.search.includes('standalone=1')) {
        return true;
      }
      
      // 6. 檢查是否在 iframe 中 (PWA 通常不在 iframe 中)
      if (window !== window.top) {
        return false;
      }
      
      return false;
    };

    // 一次性檢測所有狀態
    const isPWA = checkPWAStatus();

    // 檢測 PWA 安裝支援
    const checkInstallSupport = () => {
      // 如果已經是 PWA，不支援安裝
      if (isPWA) {
        setCanInstall(false);
        return;
      }
      
      // iOS Safari：不支援 beforeinstallprompt，需要手動安裝
      if (isSafari && isIOS) {
        setCanInstall(false); // 設為 false，顯示手動安裝指南
        return;
      }

      // Android Chrome/Edge：支援 beforeinstallprompt，可以一鍵安裝
      if (isAndroid) {
        const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
        setCanInstall(isSupported);
        return;
      }

      // 桌面版：也支援 beforeinstallprompt
      const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
      setCanInstall(isSupported);
    };
    // 執行檢測
    checkInstallSupport();

    // 檢查是否應該顯示引導
    const shouldShowGuide = () => {
      // 如果已經是 PWA，不顯示引導
      if (isPWA) {
        return false;
      }
      
      // 重新檢測手機設備狀態
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      const currentIsMobile = isMobileDevice || isSmallScreen || hasTouch;
      
      // 手機設備：每次都顯示引導（PWA 對手機體驗提升很大）
      if (currentIsMobile) {
        return true;
      }
      
      // 桌面設備：使用智能提醒策略
      const visitCount = parseInt(localStorage.getItem('pwa-visit-count') || '0') + 1;
      localStorage.setItem('pwa-visit-count', visitCount.toString());
      
      // 桌面版顯示條件：
      // 1. 第一次訪問 (visitCount === 1)
      // 2. 每 5 次訪問提醒一次 (visitCount % 5 === 0)
      // 3. 強制顯示參數
      const shouldShowDesktop = visitCount === 1 || visitCount % 5 === 0;
      const forceShow = window.location.search.includes('force-pwa-guide=1');
      
      return shouldShowDesktop || forceShow;
    };

    

    // 延遲顯示引導，讓頁面先載入
    const timer = setTimeout(() => {
      // 檢查 URL 參數，強制顯示引導（用於測試）
      const forceShow = window.location.search.includes('force-pwa-guide=1');
      
      if (shouldShowGuide() || forceShow) {
        setIsVisible(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const showGuide = () => {
    setIsVisible(true);
  };

  const hideGuide = () => {
    setIsVisible(false);
  };

  return {
    isVisible,
    canInstall,
    showGuide,
    hideGuide
  };
};
