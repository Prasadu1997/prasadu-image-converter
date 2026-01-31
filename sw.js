const CACHE_NAME = 'prasadu-converter-v1';
const urlsToCache = [
  '.',
  'index.html',
  'style.css',
  'script.js',
  'conversion-logo.svg',
  'about.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});