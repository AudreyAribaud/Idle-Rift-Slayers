const CACHE = 'rift_slayers-v1';
self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(cache => cache.addAll([
        '/', '/index.html', '/style.css', '/game.js'
    ])));
});
self.addEventListener('fetch', e => {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});