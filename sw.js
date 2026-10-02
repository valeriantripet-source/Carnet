// Carnet de musculation : fonctionnement hors ligne
const APP = 'carnet-app-v1';
const FONTS = 'carnet-fonts-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== APP && k !== FONTS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Réponse immédiate depuis le cache, mise à jour en arrière-plan
function staleWhileRevalidate(cacheName, req, fallbackKey){
  return caches.open(cacheName).then(async cache => {
    const hit = await cache.match(req, {ignoreSearch: true}) || (fallbackKey ? await cache.match(fallbackKey) : undefined);
    const net = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    }).catch(() => hit);
    return hit || net;
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin){
    e.respondWith(staleWhileRevalidate(APP, req, req.mode === 'navigate' ? './' : null));
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'){
    e.respondWith(staleWhileRevalidate(FONTS, req, null));
  }
});
