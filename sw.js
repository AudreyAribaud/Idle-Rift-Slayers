// Version du cache - INCREMENTER à chaque mise à jour !
const CACHE_VERSION = 'rift_slayers-v2';
const CACHE_NAME = CACHE_VERSION;

// Fichiers à mettre en cache
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/game.js',
    '/manifest.json'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Installation...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Mise en cache des fichiers');
                return cache.addAll(FILES_TO_CACHE);
            })
            .then(() => self.skipWaiting()) // Force l'activation immédiate
    );
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activation...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Suppression ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Prend le contrôle immédiatement
    );
});

// Stratégie Network First avec fallback sur cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone la réponse car elle ne peut être utilisée qu'une fois
                const responseClone = response.clone();

                // Met à jour le cache avec la nouvelle version
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });

                return response;
            })
            .catch(() => {
                // Si le réseau échoue, utilise le cache
                return caches.match(event.request);
            })
    );
});

// Message pour forcer la mise à jour
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});