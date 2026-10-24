// Service worker: keeps the app working without internet. The build prepends
// VERSION and PRECACHE (every file of that build), see vite.config.ts.
/* global VERSION, PRECACHE */

const CACHE = `goal-prep-planner-${VERSION}`;
const FONTS = 'goal-prep-planner-fonts';
const FONT_ORIGINS = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];
// On a slow connection, open the saved copy instead of waiting.
const NETWORK_TIMEOUT_MS = 3000;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== FONTS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (FONT_ORIGINS.includes(url.origin)) {
    event.respondWith(fromCacheThenRefresh(request));
    return;
  }
  if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;

  if (request.mode === 'navigate') {
    // Fresh page when online, so updates arrive; the saved one otherwise.
    event.respondWith(withTimeout(fetch(request)).catch(() => caches.match('./')));
    return;
  }
  event.respondWith(caches.match(request).then((hit) => hit ?? fetch(request)));
});

function withTimeout(promise) {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('timeout')), NETWORK_TIMEOUT_MS);
    promise.then(resolve, reject);
  });
}

async function fromCacheThenRefresh(request) {
  const cache = await caches.open(FONTS);
  const hit = await cache.match(request);
  const refresh = fetch(request)
    .then((res) => {
      if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
      return res;
    })
    .catch(() => hit ?? Response.error());
  return hit ?? refresh;
}
