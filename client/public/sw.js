self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

// Passive fetch listener to satisfy PWA installability requirements
self.addEventListener("fetch", (e) => {
  e.respondWith(fetch(e.request));
});
