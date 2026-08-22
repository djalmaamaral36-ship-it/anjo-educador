const CACHE_NAME = 'anjo-cuidador-pwa-v14';
const ASSETS = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/logo-192.png',
  '/logo-512.png',
  '/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Allow graceful failure of individual assets so the PWA still installs perfectly
      return Promise.allSettled(
        ASSETS.map(asset => cache.add(asset).catch(e => console.log('Asset cache failed:', asset, e)))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isNavigation = event.request.mode === 'navigate' || 
                       url.pathname === '/' || 
                       url.pathname === '/index.html';

  if (isNavigation) {
    // NETWORK FIRST: ALWAYS fetch from network if online, fallback to cache if offline
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the latest index.html on successful fetch
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If offline, return cached page
          return caches.match('/index.html', { ignoreSearch: true }) || 
                 caches.match('/', { ignoreSearch: true });
        })
    );
  } else {
    // FOR ASSETS (JS, CSS, Images, Fonts, etc.)
    // Try cache first. If found, return. If not, fetch and cache dynamically!
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((response) => {
          // Do not cache API calls, firestore requests, chrome extensions, etc.
          const isRemoteAPI = url.origin !== self.location.origin || 
                              url.pathname.startsWith('/api') ||
                              url.pathname.includes('firestore');

          if (response.status === 200 && !isRemoteAPI) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        }).catch((err) => {
          console.log('Fetch asset failed:', url.pathname, err);
        });
      })
    );
  }
});
