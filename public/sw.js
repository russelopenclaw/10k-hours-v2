/// <reference lib="webworker" />

const CACHE_NAME = 'cadent-v4';

// Static assets to cache on install (app shell)
const APP_SHELL = [
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/cadent-logo.png',
  '/cadent-logo-sm.png',
];

// Routes that should always hit the network (never cache)
const NEVER_CACHE_PREFIXES = ['/api/', '/auth/'];

// Maximum time (ms) a cached entry is considered fresh
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

// File extensions that are truly static (cacheable)
const STATIC_EXTENSIONS = [
  '.js', '.mjs', '.css', '.woff2', '.woff', '.ttf', '.otf',
  '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico',
  '.json', '.webmanifest',
];

// Install: cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch((err) => {
        console.warn('SW install: some resources failed to cache', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Purge stale entries from cache (called periodically)
async function purgeStaleEntries() {
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();
  const now = Date.now();
  let purged = 0;
  for (const request of requests) {
    const response = await cache.match(request);
    if (!response) continue;
    const dateHeader = response.headers.get('date');
    if (dateHeader) {
      const age = now - new Date(dateHeader).getTime();
      if (age > CACHE_MAX_AGE) {
        await cache.delete(request);
        purged++;
      }
    }
  }
  if (purged > 0) {
    console.log(`SW: purged ${purged} stale cache entries`);
  }
}

// Fetch handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip Supabase API calls
  if (request.url.includes('supabase.co')) return;

  // NEVER cache API, auth, or RSC responses — always network-only
  // RSC flight responses must never be cached; stale RSC data causes
  // React hydration mismatches and infinite spinners in Chrome.
  if (
    NEVER_CACHE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix)) ||
    url.searchParams.has('_rsc')
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // Network-first for navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Cache-first for static assets (JS bundles, CSS, images, fonts)
  if (STATIC_EXTENSIONS.some((ext) => url.pathname.endsWith(ext))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Network-first for everything else
  event.respondWith(networkFirstWithOfflineFallback(request));
});

// Cache-first: serve from cache, fallback to network
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    // Check if entry is stale
    const dateHeader = cached.headers.get('date');
    if (dateHeader && (Date.now() - new Date(dateHeader).getTime()) > CACHE_MAX_AGE) {
      // Stale — fetch fresh in background, serve stale meanwhile
      const freshResponse = fetch(request).then((response) => {
        if (response.ok) {
          const cache = caches.open(CACHE_NAME);
          cache.then(c => c.put(request, response.clone()));
        }
        return response.clone();
      }).catch(() => cached);
      // Return stale immediately, update cache in background
      return freshResponse.catch(() => cached);
    }
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

// Network-first: try network, fallback to cache
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

// Network-first for navigations: try network, fallback to cache, then offline page
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Network failed — try cache
    const cached = await caches.match(request);
    if (cached) return cached;

    // No cache either — show offline page
    const offline = await caches.match('/offline.html');
    if (offline) return offline;

    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

// Periodic stale entry cleanup (triggered by any fetch)
purgeStaleEntries();