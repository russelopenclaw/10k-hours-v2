/// <reference lib="webworker" />

const CACHE_NAME = 'cadent-v3';

// Static assets to cache on install (app shell)
const APP_SHELL = [
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/cadent-logo.png',
  '/cadent-logo-sm.png',
];

// Routes that should always hit the network
const API_PREFIXES = ['/api/', '/auth/'];

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

  // Network-first for API and auth routes
  if (API_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Network-first for navigation requests (HTML pages)
  // This is critical: Next.js App Router uses RSC flight data
  // on navigations. Serving stale HTML causes infinite spinners in Chrome.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Network-first for RSC flight requests (?_rsc parameter)
  // These are dynamic and must never be served from cache
  if (url.searchParams.has('_rsc')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first for static assets (JS bundles, CSS, images, fonts)
  if (STATIC_EXTENSIONS.some((ext) => url.pathname.endsWith(ext))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Network-first for everything else (dynamic pages, etc.)
  event.respondWith(networkFirstWithOfflineFallback(request));
});

// Cache-first: serve from cache, fallback to network
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

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

    // No cache either — show offline page for navigations
    const offline = await caches.match('/offline.html');
    if (offline) return offline;

    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}