// מקלט קרוב — Service Worker
// גרסה: 1.0 | מרץ 2026
const CACHE_NAME = 'miklat-v1';
const ASSETS = [
  '/miklat/',
  '/miklat/index.html',
  '/miklat/manifest.json',
  '/miklat/icon.png'
];

// התקנה — שמור את כל הנכסים
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// הפעלה — מחק cache ישן
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// בקשות — תחילה מהרשת, אחר כך מה-cache
self.addEventListener('fetch', (e) => {
  // אזעקות פיקוד העורף — תמיד מהרשת (real-time)
  if (e.request.url.includes('oref.org.il') || 
      e.request.url.includes('esri') ||
      e.request.url.includes('arcgis')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', {status: 503})));
    return;
  }

  // שאר הבקשות — Network First, Cache Fallback
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // עדכן את ה-cache עם הגרסה החדשה
        if (response.ok && e.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        // אין רשת — החזר מה-cache
        return caches.match(e.request).then(cached => {
          if (cached) return cached;
          // דף ראשי — החזר index.html
          if (e.request.destination === 'document') {
            return caches.match('/miklat/index.html');
          }
          return new Response('', {status: 503});
        });
      })
  );
});
