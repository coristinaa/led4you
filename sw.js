// LED4YOU app: keep the app shell available offline (lights are often used where there is no internet)
const CACHE = 'led4you-v11';
const FILES = ['./', 'index.html', 'studio.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'gifs/pack.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n))))); self.clients.claim(); });
// network first so updates arrive, cache as fallback when offline
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
});
