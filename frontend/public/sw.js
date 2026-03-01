// ─── Board Saathi Service Worker ───────────────────────────────────────────
// Bump this version string whenever you want to force a full cache refresh.
const CACHE_VERSION = 'board-saathi-v7';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// All known static assets to precache during install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  // DEV-branded icons
  '/assets/generated/favicon.dim_32x32.png',
  '/assets/generated/app-icon-192.dim_192x192.png',
  '/assets/generated/app-icon-512.dim_512x512.png',
  '/assets/generated/app-icon-maskable.dim_512x512.png',
  // Legacy icons (backward compat)
  '/assets/generated/board-saathi-logo.dim_256x256.png',
  '/assets/generated/board-saathi-icon.dim_512x512.png',
  '/assets/generated/board-saathi-icon-192.dim_192x192.png',
  '/assets/generated/board-saathi-apple-touch.dim_180x180.png',
  '/assets/generated/app-icon.dim_512x512.png',
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

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns true for requests that should use cache-first strategy */
function isStaticAsset(url) {
  const ext = url.pathname.split('.').pop()?.toLowerCase();
  const staticExts = new Set([
    'js', 'css', 'png', 'jpg', 'jpeg', 'svg', 'ico',
    'webp', 'woff', 'woff2', 'ttf', 'otf', 'mp3', 'wav',
    'json',
  ]);
  // Treat Vite-hashed assets (/_assets/ or /assets/) as static
  if (url.pathname.startsWith('/assets/')) return true;
  if (staticExts.has(ext)) return true;
  return false;
}

/** Returns true for HTML navigation requests */
function isNavigationRequest(request) {
  return (
    request.mode === 'navigate' ||
    request.headers.get('accept')?.includes('text/html')
  );
}

// ─── Install ────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        Promise.allSettled(
          PRECACHE_URLS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn('[SW] Failed to precache:', url, err.message);
            })
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ───────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  const validCaches = new Set([STATIC_CACHE, DYNAMIC_CACHE]);

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => !validCaches.has(name))
            .map((name) => {
              console.log('[SW] Deleting stale cache:', name);
              return caches.delete(name);
            })
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ──────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (ICP canister calls, CDN, etc.)
  if (url.origin !== self.location.origin) return;

  // Skip ICP/canister API calls — always network
  if (url.pathname.startsWith('/api/')) return;

  // ── Strategy 1: Cache-first for static assets ──────────────────────────
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ── Strategy 2: Network-first for navigation / HTML ────────────────────
  if (isNavigationRequest(request)) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // ── Strategy 3: Network-first for everything else ──────────────────────
  event.respondWith(networkFirst(request));
});

// ─── Strategy implementations ───────────────────────────────────────────────

/**
 * Cache-first: serve from cache; on miss fetch from network and cache result.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Return a minimal offline response for non-navigational static assets
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

/**
 * Network-first for navigation: try network, fall back to cached page,
 * and finally serve /offline.html if nothing is cached.
 */
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Try the specific cached page first
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fall back to cached index.html (SPA shell)
    const indexCached = await caches.match('/index.html');
    if (indexCached) return indexCached;

    // Last resort: offline fallback page
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) return offlinePage;

    return new Response('<h1>You are offline</h1>', {
      status: 503,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

/**
 * Network-first for dynamic data: try network, fall back to cache.
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

// ─── Message handler ────────────────────────────────────────────────────────

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
