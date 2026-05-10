const CACHE_NAME = 'hi-pipe-v1';
const CORE_URLS = ['/', '/index.html'];
const ASSET_RE = /(?:src|href)="([^"]*\/assets\/[^"]+)"/g;

async function cacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(CORE_URLS);

  const response = await fetch('/index.html', { cache: 'no-store' });
  await cache.put('/index.html', response.clone());

  const html = await response.text();
  const assetUrls = [...html.matchAll(ASSET_RE)].map((match) => match[1]);
  await Promise.all(
    assetUrls.map(async (url) => {
      const absoluteUrl = new URL(url, self.location.origin).toString();
      const assetResponse = await fetch(absoluteUrl, { cache: 'no-store' });
      if (assetResponse.ok) {
        await cache.put(absoluteUrl, assetResponse.clone());
      }
    }),
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(cacheAppShell());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(event.request);
      if (response && response.ok && new URL(event.request.url).origin === self.location.origin) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch {
      if (event.request.mode === 'navigate') {
        const fallback = await caches.match('/index.html');
        if (fallback) {
          return fallback;
        }
      }

      throw new Error('Network request failed.');
    }
  })());
});
