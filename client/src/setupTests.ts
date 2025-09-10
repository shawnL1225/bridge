// 開發環境錯誤處理設定
if (process.env.NODE_ENV === 'development') {
  // 捕獲未處理的 Promise 拒絕
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('未處理的 Promise 拒絕:', event.reason);
    event.preventDefault(); // 防止錯誤頁面
  });

  // 捕獲未處理的錯誤
  window.addEventListener('error', (event) => {
    console.warn('未處理的錯誤:', event.error);
    event.preventDefault(); // 防止錯誤頁面
  });

  // 禁用 React 的錯誤覆蓋層
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || {};
    // @ts-ignore
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__.suppressReactDevtoolsWarnings = true;
  }
}

// 導出空對象使其成為模組
export {};
