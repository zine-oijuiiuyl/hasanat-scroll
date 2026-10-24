// Keeps the app working offline: try the network first so updates arrive at once, fall back to the cache.
const CACHE = "hasanat-v4";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "fonts/3y9K6as8bTXq_nANBjzKo3IeZx8z6up5BeSl9D4dj_x9PpZBMlGGInHWVyNJtvI.woff2", "fonts/3y9K6as8bTXq_nANBjzKo3IeZx8z6up5BeSl9D4dj_x9PpZBMlGHInHWVyNJtvI.woff2", "fonts/3y9K6as8bTXq_nANBjzKo3IeZx8z6up5BeSl9D4dj_x9PpZBMlGIInHWVyNJ.woff2", "fonts/J7aRnpd8CGxBHpUgtLMS7JNKIjk.woff2", "fonts/J7aRnpd8CGxBHpUrtLMS7JNKIjk.woff2", "fonts/J7aRnpd8CGxBHpUutLMS7JNK.woff2", "fonts/J7acnpd8CGxBHp2VkaY6zp5gGDAbnCA.woff2", "fonts/J7acnpd8CGxBHp2VkaY_zp5gGDAb.woff2", "fonts/J7acnpd8CGxBHp2VkaYxzp5gGDAbnCA.woff2"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request)));
});
