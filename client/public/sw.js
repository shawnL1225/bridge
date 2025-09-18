const CACHE_NAME = 'casino-bridge-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/apple-assets/apple-touch-icon.png',
  '/apple-assets/apple-touch-icon-152x152.png',
  '/apple-assets/apple-touch-icon-167x167.png',
  '/apple-assets/apple-touch-icon-180x180.png',
  '/apple-assets/apple-splash-1125-2436.png',
  '/apple-assets/apple-splash-1170-2532.png',
  '/apple-assets/apple-splash-1179-2556.png',
  '/apple-assets/apple-splash-1242-2688.png',
  '/apple-assets/apple-splash-1284-2778.png',
  '/apple-assets/apple-splash-1290-2796.png',
  '/apple-assets/apple-splash-1536-2048.png',
  '/apple-assets/apple-splash-1668-2388.png',
  '/apple-assets/apple-splash-2048-2732.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon.svg',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// 安裝 Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker installation failed:', error);
      })
  );
});

// 攔截網路請求
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果快取中有，就回傳快取的版本
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// 更新 Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
