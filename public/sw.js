const CACHE = 'flexibility-inventur-v1';
const OFFLINE = '/offline.html';

// On install: cache the app shell entry point and offline page
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['/', OFFLINE]))
  );
  self.skipWaiting();
});

// On activate: remove old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;

  // Navigation (HTML): network-first, fall back to cached index, then offline page
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(res => {
          caches.open(CACHE).then(c => c.put(request, res.clone()));
          return res;
        })
        .catch(() =>
          caches.match(request)
            .then(cached => cached || caches.match('/'))
            .then(cached => cached || caches.match(OFFLINE))
        )
    );
    return;
  }

  // Assets (JS, CSS, images, fonts): stale-while-revalidate
  e.respondWith(
    caches.match(request).then(cached => {
      const fresh = fetch(request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(request, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});
