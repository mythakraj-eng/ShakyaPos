const CACHE_NAME = 'shakya-pos-standalone-v22';
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js",
  "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js",
  "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js",
  "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
  "./src/app/app-config.js",
  "./src/app/local-sw-keepalive.js",
  "./src/app/main.js",
  "./src/app/navigation.js",
  "./src/app/state.js",
  "./src/features/billing/bill-calculations.js",
  "./src/features/billing/billing-ui.js",
  "./src/features/billing/billing.js",
  "./src/features/billing/cart.js",
  "./src/features/billing/checkout.js",
  "./src/features/inventory/inventory.js",
  "./src/features/inventory/stock-adjustments.js",
  "./src/features/inventory/stock-import.js",
  "./src/features/customers/customers.js",
  "./src/features/customers/pasand-diary.js",
  "./src/features/khata/khata.js",
  "./src/features/khata/vaada-vasooli.js",
  "./src/features/expenses/expenses.js",
  "./src/features/reports/reports.js",
  "./src/features/mandi/mandi.js",
  "./src/features/scanner/hardware-gun-battery.js",
  "./src/features/scanner/scanner.js",
  "./src/features/printing/tag-printing.js",
  "./src/features/printing/wa-poster.js",
  "./src/features/printing/whatsapp-share.js",
  "./src/features/backup/backup.js",
  "./src/features/settings/settings.js",
  "./src/features/settings/tab-customizer.js",
  "./src/features/settings/theme-engine.js",
  "./src/services/firebase/database.js",
  "./src/services/sync/conflict-resolution.js",
  "./src/services/sync/sync-manager.js",
  "./src/services/storage/atomic-wal.js",
  "./src/services/storage/local-storage.js",
  "./src/services/printing/printer-hub.js",
  "./src/shared/utils/dates.js",
  "./src/shared/utils/ids.js",
  "./src/shared/utils/money.js",
  "./src/shared/validation/validators.js",
  "./src/shared/dom/live-state-bridge.js",
  "./src/shared/constants/shop-constants.js",
  "./src/styles/base.css",
  "./src/styles/components.css",
  "./src/styles/layout.css",
  "./src/styles/features/bill-cart.css",
  "./src/styles/features/bulk-studio.css",
  "./src/styles/features/mandi-khata.css",
  "./src/styles/features/pasand-traffic.css",
  "./src/styles/features/rack-audit.css",
  "./src/styles/features/resilience-shields.css",
  "./src/styles/features/scanner-combo.css",
  "./src/styles/features/tab-customizer.css",
  "./src/styles/features/vaada-vasooli.css",
  "./src/styles/features/wa-poster.css"
];
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const u of CORE_ASSETS) {
        try {
          const req = new Request(u, { cache: 'reload' });
          const res = await fetch(req);
          if (res && (res.status === 200 ||              res.type === 'opaque')) {
            await cache.put(u, res.clone());
            if (u === './index.html') {
              await cache.put('./', res.clone());
            }
          }
        } catch (err) {
          try { await cache.add(u); } catch (e) {}
        }
      }
    })
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((k) => k !== CACHE_NAME ? caches.delete(k) : null)
    )).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const u = req.url || '';
  if (u.includes('firebaseio.com') || u.includes('googleapis.com')
      || u.includes('/__ping__')) return;
  // Stale-While-Revalidate: Instant 0.05s boot from cache even
  // when Pydroid 3 is closed, with silent background refresh!
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached =
      (await cache.match(req, { ignoreSearch: true })) ||
      (req.mode === 'navigate'
        ? ((await cache.match('./index.html')) ||
           (await cache.match('./')))
        : null);
    const netPromise = fetch(req, { cache: 'no-store' })
      .then((res) => {
        if (res && (res.status === 200 || res.type === 'opaque')) {
          cache.put(req, res.clone());
          if (req.mode === 'navigate' || u.endsWith('/index.html')) {
            cache.put('./index.html', res.clone());
          }
        }
        return res;
      }).catch(() => cached);
    return cached || (await netPromise);
  })());
});
