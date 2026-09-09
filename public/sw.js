const CACHE_NAME = 'ghanabuild-field-v1';
const APP_SHELL = ['/', '/field-inspections', '/manifest.webmanifest', '/icons/gh-build.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok && (url.pathname.startsWith('/src/') || url.pathname.startsWith('/assets/') || url.pathname === '/')) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('/'))));
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'ghanabuild-inspection-sync') {
    event.waitUntil(self.clients.matchAll().then((clients) => clients.forEach((client) => client.postMessage({ type: 'SYNC_REQUESTED' }))));
  }
});
