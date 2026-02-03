/**
 * Service Worker für Smart Home PWA
 * Ermöglicht Offline-Nutzung durch Caching
 */

const CACHE_NAME = 'smart-home-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles/style.css',
    '/styles/settings.css',
    '/styles/raeume.css',
    '/styles/circularslider.css',
    '/styles/blind.css',
    '/styles/light.css',
    '/scripts/script.js',
    '/scripts/data.js',
    '/scripts/scene.js',
    '/scripts/sensorik.js',
    '/scripts/light.js',
    '/scripts/blind.js',
    '/scripts/circularslider.js',
    '/scripts/raum.js',
    '/scripts/settings.js',
    '/pages/home.html',
    '/pages/raeume.html',
    '/pages/szenen.html',
    '/pages/sensorik.html',
    '/pages/einstellungen.html',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// Installation: Cache alle wichtigen Dateien
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache geöffnet');
                return cache.addAll(urlsToCache);
            })
            .catch(err => {
                console.log('Cache-Fehler:', err);
            })
    );
    // Sofort aktivieren ohne auf alte Tabs zu warten
    self.skipWaiting();
});

// Aktivierung: Alte Caches löschen
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Alter Cache gelöscht:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Übernehme Kontrolle über alle offenen Tabs
    self.clients.claim();
});

// Fetch: Cache-First Strategie mit Network-Fallback
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache-Hit - response aus Cache zurückgeben
                if (response) {
                    return response;
                }

                // Kein Cache - vom Netzwerk holen
                return fetch(event.request).then(response => {
                    // Prüfe ob gültige Response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Response klonen (Stream kann nur einmal gelesen werden)
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
            .catch(() => {
                // Wenn offline und nicht im Cache, zeige Offline-Fallback
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            })
    );
});
