const CACHE_NAME = 'bash-search-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/config.js',
  '/comandos/lista_cmd_bash.txt',
  '/manifest.json',
  '/icons/icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
