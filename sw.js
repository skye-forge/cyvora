/**
 * Cyvora Service Worker
 * Basic offline support for static assets
 */

const CACHE_NAME = 'cyvora-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/public/index.html',
  '/public/login.html',
  '/public/register.html',
  '/public/report-incident.html',
  '/public/my-reports.html',
  '/assets/css/tailwind-output.css',
  '/assets/css/site.css',
  '/assets/js/config.js',
  '/assets/js/mock-data.js',
  '/assets/js/api.js',
  '/assets/js/validation.js',
  '/assets/js/i18n.js',
  '/assets/js/templates.js',
  '/assets/js/app.js',
  '/assets/js/site.js',
  'https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600;700;900&family=Work+Sans:wght@500;600&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching core assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then((response) => {
            // Cache new responses for future offline use
            if (response && response.status === 200 && response.type === 'basic') {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return response;
          })
          .catch(() => {
            // Offline fallback
            if (event.request.mode === 'navigate') {
              return caches.match('/public/index.html')
                .then((response) => {
                  if (response) return response;
                  // Ultimate fallback - simple offline message
                  return new Response(
                    '<!DOCTYPE html><html><head><title>Offline - Cyvora</title></head>' +
                    '<body style="font-family: system-ui; padding: 2rem; text-align: center;">' +
                    '<h1>You are offline</h1>' +
                    '<p>Please check your internet connection and try again.</p>' +
                    '<button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #0b3d91; color: white; border: none; border-radius: 6px; cursor: pointer;">Retry</button>' +
                    '</body></html>',
                    { headers: { 'Content-Type': 'text/html' } }
                  );
                });
            }
          });
      })
  );
});
