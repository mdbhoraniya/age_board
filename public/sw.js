// AgeBoard Service Worker — Full Offline Support & PWA Cache
const CACHE_VERSION = 'ageboard-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGES_CACHE = `${CACHE_VERSION}-pages`;

const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/pdf.min.js',
  '/pdf.worker.min.js',
  '/file.svg',
  '/globe.svg',
  '/window.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const staticCache = await caches.open(STATIC_CACHE);

      // Pre-cache core shell & public assets
      await Promise.allSettled(
        PRECACHE_ASSETS.map(async (asset) => {
          try {
            const response = await fetch(asset, { cache: 'reload' });
            if (response.ok) {
              await staticCache.put(asset, response);
            }
          } catch (err) {
            console.warn('[SW] Could not precache asset:', asset, err);
          }
        })
      );

      // Fetch root HTML and discover & cache Next.js static asset bundles
      try {
        const rootResponse = await fetch('/', { cache: 'reload' });
        if (rootResponse.ok) {
          const htmlText = await rootResponse.clone().text();
          await staticCache.put('/', rootResponse);

          // Find all Next.js static scripts and CSS bundles referenced in the HTML
          const assetMatches = htmlText.match(/\/_next\/static\/[a-zA-Z0-9_\-\.\/]+/g) || [];
          const uniqueAssets = Array.from(new Set(assetMatches));

          await Promise.allSettled(
            uniqueAssets.map(async (assetUrl) => {
              try {
                const assetResponse = await fetch(assetUrl);
                if (assetResponse.ok) {
                  await staticCache.put(assetUrl, assetResponse);
                }
              } catch (err) {
                console.warn('[SW] Could not precache bundle:', assetUrl, err);
              }
            })
          );
        }
      } catch (err) {
        console.warn('[SW] Could not discover assets from root HTML:', err);
      }
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== PAGES_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })()
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore non-GET requests and unsupported schemes (e.g. chrome-extension:)
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Bypass Next.js hot-reloading / dev-server internal endpoints
  if (
    url.pathname.includes('/_next/webpack-hmr') ||
    url.pathname.includes('hot-update') ||
    url.pathname.includes('__nextjs')
  ) {
    return;
  }

  // 1. Navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Network-first: fetch fresh page from network
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.ok) {
            const pagesCache = await caches.open(PAGES_CACHE);
            pagesCache.put(request, networkResponse.clone());

            // Also keep '/' updated in static cache
            const staticCache = await caches.open(STATIC_CACHE);
            staticCache.put('/', networkResponse.clone());
          }
          return networkResponse;
        } catch {
          // Offline fallback: try exact page match, then root app shell '/'
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;

          const rootShell = await caches.match('/');
          if (rootShell) return rootShell;

          return new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>AgeBoard - Offline</title></head><body style="font-family:system-ui,sans-serif;text-align:center;padding:50px;"><h2>AgeBoard is offline</h2><p>Please check your internet connection or reload once cached.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        }
      })()
    );
    return;
  }

  // 2. Next.js static assets (_next/static/...)
  // Content-hashed, immutable files — Cache-First with runtime caching
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.ok) {
            const staticCache = await caches.open(STATIC_CACHE);
            staticCache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return new Response(null, { status: 404, statusText: 'Resource not available offline' });
        }
      })()
    );
    return;
  }

  // 3. Other same-origin assets (icons, manifest, pdf.js, svgs)
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) {
          // Stale-while-revalidate: update cache in background when online
          fetch(request)
            .then(async (networkResponse) => {
              if (networkResponse && networkResponse.ok) {
                const staticCache = await caches.open(STATIC_CACHE);
                staticCache.put(request, networkResponse);
              }
            })
            .catch(() => {});
          return cached;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.ok) {
            const staticCache = await caches.open(STATIC_CACHE);
            staticCache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return new Response(null, { status: 404, statusText: 'Resource not available offline' });
        }
      })()
    );
    return;
  }

  // Default network fetch for external resources
  event.respondWith(fetch(request));
});
