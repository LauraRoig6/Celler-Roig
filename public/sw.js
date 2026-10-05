const CACHE = 'celler-roig-v20';
const ASSETS = ['/', '/manifest.webmanifest'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k.startsWith('celler-roig-')).map(k => caches.delete(k)))),
      self.clients.claim(),
    ])
  );
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  // Las APIs (Neon, búsqueda, sincronización) siempre van a red: nunca servimos una respuesta antigua desde caché.
  if (url.pathname.startsWith('/api/')) return;
  event.respondWith(
    fetch(event.request).then(response => {
      const clone = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, clone));
      return response;
    }).catch(() => caches.match(event.request).then(r => r || caches.match('/')))
  );
});
