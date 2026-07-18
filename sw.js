/* ============================================================
   KASTHOUSE — Service Worker
   Strategija: Cache First za assete, Network First za HTML
   ============================================================ */

const APP_VERSION = 'v1.0.0';

const CACHE_STATIC  = `kh-static-${APP_VERSION}`;
const CACHE_DYNAMIC = `kh-dynamic-${APP_VERSION}`;
const CACHE_IMAGES  = `kh-images-${APP_VERSION}`;

// Asseti koji se cachiraju odmah pri instalaciji (App Shell)
// VAŽNO: Svaki fajl ovdje mora stvarno postojati — jedan 404 ruši cijelu instalaciju!
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/404.html',
  '/site.webmanifest',
  '/assets/css/style.css',
  '/assets/css/swiper-bundle.min.css',
  '/assets/js/main.js',
  '/assets/js/lang.js',
  '/assets/images/favicon/android-chrome-192x192.png',
  '/assets/images/favicon/android-chrome-512x512.png',
  // Dodaj hero sliku, logotip i sl. kada budeš siguran u putanje
];

// ─── INSTALL ───────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing ${APP_VERSION}`);

  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then((cache) => {
        console.log('[SW] Precaching App Shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting()) // Aktiviraj odmah, ne čekaj
  );
});

// ─── ACTIVATE ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating ${APP_VERSION}`);

  const validCaches = [CACHE_STATIC, CACHE_DYNAMIC, CACHE_IMAGES];

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => !validCaches.includes(name))
            .map((name) => {
              console.log(`[SW] Deleting old cache: ${name}`);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim()) // Preuzmi kontrolu odmah
  );
});

// ─── FETCH ─────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignoriši non-GET zahtjeve i browser-extension zahtjeve
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // Chromium bug workaround for DevTools
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;

  // Ignoriši analytics, external API pozive i Live Server websockets
  if (url.hostname !== self.location.hostname || url.port !== self.location.port) {
    return;
  }

  // ── Strategija po tipu resursa ──────────────────────────

  // HTML stranice → Network First (uvijek svježe, fallback na cache)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request, CACHE_STATIC));
    return;
  }

  // Slike → Cache First (brzo, rijetko se mijenjaju)
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, CACHE_IMAGES));
    return;
  }

  // CSS, JS, Fontovi → Cache First
  if (['style', 'script', 'font'].includes(request.destination)) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  // Sve ostalo → Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request, CACHE_DYNAMIC));
});

// ─── CACHE STRATEGIES ──────────────────────────────────────

/**
 * Network First — pokušaj mrežu, ako ne uspije vrati iz cachea.
 * Uvijek vraća validan Response, nikad undefined.
 */
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    // Cachiramo i non-ok odgovore jer je fetch uspio (npr. 404 s mreže je validan)
    const cache = await caches.open(cacheName);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Network fetch failed for', request.url, error);
    
    // Mreža nije dostupna — pokušaj cache s ignoreSearch (Live Server ponekad dodaje parametre)
    let cachedResponse = await caches.match(request, { ignoreSearch: true });
    
    // Specijalni fallback za navigaciju na root ('/') da pokupi /index.html ako treba
    if (!cachedResponse && request.mode === 'navigate') {
      cachedResponse = await caches.match('/index.html', { ignoreSearch: true }) || await caches.match('/', { ignoreSearch: true });
    }
    
    if (cachedResponse) return cachedResponse;

    // Offline fallback — vrati generički offline odgovor
    return new Response(
      '<html><body style="font-family:sans-serif;text-align:center;padding:60px"><h1>Offline</h1><p>Provjerite internetsku vezu i pokušajte ponovo.</p></body></html>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

/**
 * Cache First — vrati iz cachea, ako nije u cacheu dohvati s mreže.
 * Uvijek vraća validan Response.
 */
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    console.warn('[SW] Cache First — offline i nema cachea za:', request.url);
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

/**
 * Stale While Revalidate — vrati iz cachea odmah, osvježi u pozadini.
 * Uvijek vraća validan Response.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => {
      // Mreža pala — cachedResponse je već vraćen gore
      return cachedResponse || new Response('', { status: 503, statusText: 'Offline' });
    });

  return cachedResponse || fetchPromise;
}
