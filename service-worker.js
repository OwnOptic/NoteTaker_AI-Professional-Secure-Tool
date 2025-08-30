const CACHE_NAME = 'notetaker-ai-cache-v9'; // Bump version to ensure update

// Only cache the absolute minimum required for the app shell to load.
// Everything else will be cached dynamically by the fetch handler.
const urlsToCache = [
  '/',
  '/index.html',
  '/index.css',
  '/manifest.json',
  '/index.tsx', // The main entry point for the app's logic
  'https://github.com/OwnOptic/Website-storage/blob/main/NoteTaker.png?raw=true' // App icon
];

self.addEventListener('install', event => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Use individual add calls to be more resilient than addAll
        const promises = urlsToCache.map(url => {
            return cache.add(url).catch(err => {
                console.warn(`Failed to cache ${url} during install:`, err);
            });
        });
        return Promise.all(promises);
      }).catch(error => {
        console.error('Failed to cache during install:', error);
      })
  );
});

self.addEventListener('fetch', event => {
  // We only want to handle GET requests.
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    // Strategy: Network falling back to Cache
    // 1. Try to fetch from the network.
    fetch(event.request)
      .then(networkResponse => {
        // If the fetch is successful, clone the response and cache it for future offline use.
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });
        // Return the fresh response from the network.
        return networkResponse;
      })
      .catch(() => {
        // 2. If the network fetch fails (e.g., user is offline), try to match the request in the cache.
        return caches.match(event.request)
          .then(cachedResponse => {
            // If we have a match in the cache, return it.
            // This allows the app to work offline.
            // If not in cache, the request will fail, which is expected for uncached resources offline.
            return cachedResponse || Promise.reject('Resource not available in cache');
          });
      })
  );
});


self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Delete old caches
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all open clients immediately
  );
});