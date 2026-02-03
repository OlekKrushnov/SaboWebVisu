/**
 * Service Worker für Smart Home PWA
 * Ermöglicht Offline-Nutzung durch Caching
 * 
 * WICHTIG: Bei jeder Änderung an der App die Versionsnummer erhöhen!
 * Das zwingt den Browser, den neuen Service Worker zu installieren
 * und den alten Cache zu löschen.
 */

const CACHE_VERSION = 8;  // <-- Bei jeder Änderung erhöhen!
const CACHE_NAME = `smart-home-v${CACHE_VERSION}`;

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
    '/scripts/api.js',
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
    '/icons/icon-512x512.png',
    '/icons/icon.svg',
    '/images/sabo-logo.png',
    '/images/sabo-full.png',
    '/images/logo-raspberrypi.png',
    '/images/logo-beckhoff.png',
    '/manifest.json'
];

// Installation: Cache alle wichtigen Dateien
self.addEventListener('install', event => {
    console.log(`[SW] Installing version ${CACHE_VERSION}`);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Cache geöffnet, Dateien werden gecached...');
                return cache.addAll(urlsToCache);
            })
            .catch(err => {
                console.log('[SW] Cache-Fehler:', err);
            })
    );
    // Sofort aktivieren ohne auf alte Tabs zu warten
    self.skipWaiting();
});

// Aktivierung: Alte Caches löschen
self.addEventListener('activate', event => {
    console.log(`[SW] Activating version ${CACHE_VERSION}`);
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Alter Cache gelöscht:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Übernehme Kontrolle über alle offenen Tabs
    self.clients.claim();
});

/**
 * Fetch-Strategie: Network-First mit Cache-Fallback
 * 
 * - Versucht IMMER zuerst vom Netzwerk zu laden (= immer aktuelle Version)
 * - Speichert erfolgreiche Antworten im Cache
 * - Nutzt Cache nur wenn offline oder Netzwerk fehlschlägt
 */
self.addEventListener('fetch', event => {
    // Externe Requests (z.B. Google Fonts) - Cache-First (ändern sich nie)
    if (!event.request.url.startsWith(self.location.origin)) {
        event.respondWith(
            caches.match(event.request)
                .then(response => response || fetch(event.request))
        );
        return;
    }

    // Eigene App-Dateien - Network-First (immer aktuell)
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Prüfe ob gültige Response
                if (!response || response.status !== 200) {
                    return response;
                }

                // Response klonen und im Cache speichern
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                return response;
            })
            .catch(() => {
                // Netzwerk fehlgeschlagen - aus Cache laden (Offline-Modus)
                return caches.match(event.request)
                    .then(response => {
                        if (response) {
                            return response;
                        }
                        // Fallback für Navigation-Requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});
