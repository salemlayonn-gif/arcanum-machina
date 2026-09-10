/* ═══════════════════════════════════════════
   ARCANUM MACHINA — Service Worker
   Bump VERSION on every release, or players keep the old cache.
   ═══════════════════════════════════════════ */
const VERSION = 'am-v1.7.0';

const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/data.js',
  './js/state.js',
  './js/engine.js',
  './js/combat.js',
  './js/exploration.js',
  './js/prestige.js',
  './js/render.js',
  './js/music.js',
  './js/sounds.js',
  './js/saves.js',
  './js/main.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  /* A navigation with no network falls back to the shell we already hold */
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html', { ignoreSearch: true }).then(r => r || caches.match('./')))
    );
    return;
  }

  /* Our own files: cache first, and quietly refresh the copy for next time */
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then(hit => {
        const net = fetch(req).then(res => {
          if (res && res.ok) caches.open(VERSION).then(c => c.put(req, res.clone()));
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  /* Anything else (the web font): network, and never mind if it fails */
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});
