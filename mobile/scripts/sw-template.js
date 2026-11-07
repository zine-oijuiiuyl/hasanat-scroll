// Keeps the web app working offline (written into dist/sw.js by scripts/build-web.js).
// The page is fetched from the network first so updates arrive at once; the bundle, fonts and sounds have
// a content hash in their names, so once cached they are served from the cache.
const CACHE = "hasanat-__VERSION__";
const CORE = __CORE__;
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {})); self.skipWaiting(); });
self.addEventListener("activate", e => {
  // Old app caches go; the learning texts (hasanat-learn-*) stay.
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && !k.startsWith("hasanat-learn")).map(k => caches.delete(k)))));
  self.clients.claim();
});
const hashed = p => /\/(_expo|assets)\//.test(p);
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Only this site's own files are cached; anything else goes straight to the network.
  if (url.origin !== self.location.origin) return;
  // Range requests (audio seeking) are left to the browser.
  if (req.headers.has("range")) return;
  if (hashed(url.pathname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return r;
    })));
    return;
  }
  e.respondWith(fetch(req).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return r;
  }).catch(() => caches.match(req).then(hit => hit || (req.mode === "navigate" ? caches.match("./") : undefined))));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window" }).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow("./")));
});
