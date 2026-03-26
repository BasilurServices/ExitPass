const CACHE_NAME = 'exitpass-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './request.html',
  './guard.html',
  './guard_list.html',
  './approve.html',
  './verify.html',
  './my_pass.html',
  './css/style.css',
  './js/api.js',
  './js/auth.js',
  './js/config.js',
  './js/ui.js',
  './logo.png',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching Files');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
