/* =====================================================================
   दीदी की दुकान | Shakya POS — Immortal Localhost Service Worker
   Serves index.html + all 6 CDN libraries on http://127.0.0.1:8080
   EVEN WHEN PYDROID 3 IS CLOSED OR KILLED BY ANDROID BATTERY SAVER!
   ===================================================================== */
const CACHE_NAME = 'shakya-pos-local-8080-v5';

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js',
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js',
  'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of CORE_ASSETS) {
        try {
          const req = new Request(url, { cache: 'reload' });
          const res = await fetch(req);
          if (res && (res.status === 200 || res.type === 'opaque')) {
            await cache.put(url, res.clone());
            if (url === '/index.html') {
              await cache.put('/', res.clone());
            }
          }
        } catch (err) {
          try { await cache.add(url); } catch (e) {}
        }
      }
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'REFRESH_LOCAL_SHELL') {
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const res = await fetch('/index.html', { cache: 'no-store' });
        if (res && res.status === 200) {
          await cache.put('/index.html', res.clone());
          await cache.put('/', res.clone());
        }
      } catch (e) {}
    });
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const urlObj = new URL(req.url);

  // Never intercept live Firebase Realtime DB, Gemini AI API, or server heartbeat ping
  if (
    urlObj.hostname.includes('firebaseio.com') ||
    urlObj.hostname.includes('googleapis.com') ||
    urlObj.pathname === '/__ping__'
  ) {
    return;
  }

  // HTML Navigation (/ or /index.html, even with ?v=... query string):
  // Try fast local Pydroid server first (1.2s timeout); if Pydroid 3 is asleep/killed,
  // serve the cached index.html from Chrome's Service Worker cache immediately!
  const isHtmlNav =
    req.mode === 'navigate' ||
    urlObj.pathname === '/' ||
    urlObj.pathname.endsWith('/index.html');

  if (isHtmlNav) {
    event.respondWith(
      (async () => {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 1200);
          const freshRes = await fetch(req, { cache: 'no-store', signal: controller.signal });
          clearTimeout(timer);
          if (freshRes && freshRes.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put('/index.html', freshRes.clone());
            cache.put('/', freshRes.clone());
            return freshRes;
          }
        } catch (err) {
          // Pydroid 3 is asleep or closed! Serve from immortal SW cache:
        }
        const cache = await caches.open(CACHE_NAME);
        return (
          (await cache.match('/index.html')) ||
          (await cache.match('/')) ||
          (await cache.match(req, { ignoreSearch: true }))
        );
      })()
    );
    return;
  }

  // Static Assets & CDN Libraries: Cache-First with background refresh
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cachedRes) => {
      const netFetch = fetch(req)
        .then((netRes) => {
          if (netRes && (netRes.status === 200 || netRes.type === 'opaque')) {
            const clone = netRes.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, clone));
          }
          return netRes;
        })
        .catch(() => cachedRes);
      return cachedRes || netFetch;
    })
  );
});
