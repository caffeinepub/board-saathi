const CACHE_NAME = 'board-saathi-v5';

// Core app shell files to precache
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Generated PNG icons
  '/assets/generated/board-saathi-logo.dim_256x256.png',
  '/assets/generated/board-saathi-icon.dim_512x512.png',
  '/assets/generated/board-saathi-icon-192.dim_192x192.png',
  '/assets/generated/board-saathi-apple-touch.dim_180x180.png',
  '/assets/generated/app-icon.dim_512x512.png',
  '/assets/generated/app-icon-192.dim_192x192.png',
  '/assets/generated/app-icon-512.dim_512x512.png',
  '/assets/generated/app-icon-maskable.dim_512x512.png',
  '/assets/generated/app-icon-maskable-512.dim_512x512.png',
  '/assets/generated/icon-192.dim_192x192.png',
  '/assets/generated/icon-512.dim_512x512.png',
  '/assets/generated/icon-maskable.dim_512x512.png',
  '/assets/generated/pwa-icon-192.dim_192x192.png',
  '/assets/generated/pwa-icon-512.dim_512x512.png',
  '/assets/generated/login-hero.dim_600x400.png',
  // Alarm sounds
  '/assets/sounds/joshsound.mp3',
];

// Install: precache known static assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Failed to precache:', url, err);
          })
        )
      );
    })
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: serve from cache first, fall back to network, then cache new responses
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (ICP canister calls, etc.)
  if (url.origin !== self.location.origin) return;

  // Skip ICP/canister API calls
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Serve from cache; also refresh cache in background for HTML
        if (request.headers.get('accept')?.includes('text/html')) {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);
          // Return cached immediately, update in background
          return cachedResponse;
        }
        return cachedResponse;
      }

      // Not in cache: fetch from network and cache the response
      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
            return networkResponse;
          }

          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            // Cache JS, CSS, images, fonts, and HTML
            const contentType = networkResponse.headers.get('content-type') || '';
            if (
              contentType.includes('javascript') ||
              contentType.includes('css') ||
              contentType.includes('image') ||
              contentType.includes('font') ||
              contentType.includes('html') ||
              contentType.includes('audio') ||
              url.pathname.endsWith('.js') ||
              url.pathname.endsWith('.css') ||
              url.pathname.endsWith('.png') ||
              url.pathname.endsWith('.jpg') ||
              url.pathname.endsWith('.jpeg') ||
              url.pathname.endsWith('.svg') ||
              url.pathname.endsWith('.ico') ||
              url.pathname.endsWith('.woff') ||
              url.pathname.endsWith('.woff2') ||
              url.pathname.endsWith('.ttf') ||
              url.pathname.endsWith('.mp3') ||
              url.pathname.endsWith('.webp')
            ) {
              cache.put(request, responseClone);
            }
          });

          return networkResponse;
        })
        .catch(() => {
          // Offline fallback: return index.html for navigation requests
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
    })
  );
});

// Handle skip waiting message from app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
