const CACHE_NAME = 'audit-lbc-foret-v3-29-0';
const FILES = [
  './',
  './index.html',
  './style.css?v=3.29.0',
  './app.js?v=3.29.0',
  './manifest.json',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/cu-logo-fullcolour.png',
  './assets/cu-logo-whitetext.png',
  './assets/cu-logo-black.png',
  './assets/cu-logo-white.png',
  './assets/projets_lbc.csv'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => key !== CACHE_NAME ? caches.delete(key) : null)))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
