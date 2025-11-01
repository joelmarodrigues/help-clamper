/**
 * Service Worker - Progressive Web App (PWA)
 * 
 * A Service Worker is a script that runs in the background, separate from the web page.
 * It enables features like:
 * - Offline functionality
 * - Caching strategies
 * - Background sync
 * - Push notifications
 * 
 * This service worker implements a hybrid caching strategy:
 * - Network-first for dynamic content (HTML, API responses)
 * - Cache-first for static assets (images, CSS, JS)
 * 
 * Learn more: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
 */

/**
 * Cache Configuration
 * 
 * CACHE: Unique cache name with version number
 * - Change version (v1 -> v2) to force cache invalidation
 * - Old caches are automatically deleted during 'activate' event
 * 
 * ASSETS: Files to cache immediately on installation
 * - Core files needed for offline functionality
 * - Must be available for the app to work offline
 */
const CACHE = "vrm-cache-v1";
const ASSETS = [
  "/",                        // Root URL
  "/index.html",             // Main HTML file
  "/manifest.webmanifest",   // PWA manifest
  "/icons/icon-192.png",     // App icon (192x192)
  "/icons/icon-512.png"      // App icon (512x512)
];

/**
 * Install Event
 * 
 * Triggered when the service worker is first installed.
 * This is the perfect time to cache essential assets.
 * 
 * Flow:
 * 1. Service worker is registered
 * 2. Install event fires
 * 3. Open cache storage
 * 4. Add all ASSETS to cache
 * 5. Installation completes
 * 
 * waitUntil: Ensures the service worker doesn't finish installing
 * until all assets are cached.
 */
self.addEventListener("install", (e) => {
  console.log('[Service Worker] Installing...');
  e.waitUntil(
    caches.open(CACHE).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(ASSETS);
    })
  );
});

/**
 * Activate Event
 * 
 * Triggered when the service worker becomes active.
 * Perfect for cleanup tasks like removing old caches.
 * 
 * Flow:
 * 1. New service worker installs
 * 2. Old service worker is replaced
 * 3. Activate event fires
 * 4. Delete outdated caches
 * 5. Service worker takes control
 * 
 * This ensures users always get the latest version of cached content.
 */
self.addEventListener("activate", (e) => {
  console.log('[Service Worker] Activating...');
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        // Delete all caches that don't match current CACHE name
        keys
          .filter(key => key !== CACHE)
          .map(key => {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
});

/**
 * Fetch Event - Caching Strategy
 * 
 * Intercepts all network requests and applies caching logic.
 * 
 * Strategy 1: Network-First (for HTML and JSON)
 * - Try to fetch from network
 * - If successful, update cache with fresh data
 * - If network fails, serve from cache (offline fallback)
 * - Best for dynamic content that changes frequently
 * 
 * Strategy 2: Cache-First (for static assets)
 * - Check cache first
 * - If found, return cached version immediately (fast!)
 * - If not in cache, fetch from network and cache it
 * - Best for images, CSS, JS that rarely change
 * 
 * Why this matters:
 * - Faster load times (serve from cache)
 * - Offline capability (fallback to cache)
 * - Fresh content when online (network-first for dynamic data)
 */
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  // network-first para HTML/JSON; cache-first para estáticos
  const accept = req.headers.get("accept") || "";
  if (accept.includes("text/html") || accept.includes("application/json")) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
  } else {
    e.respondWith(caches.match(req).then(m => m || fetch(req)));
  }
});