// Keeps the web app working offline (written into dist/sw.js by scripts/build-web.js).
// The page is fetched from the network first so updates arrive at once; the bundle, fonts and sounds have
// a content hash in their names, so once cached they are served from the cache.
const CACHE = "hasanat-e1c7e710dd";
const CORE = ["./","index.html","manifest.webmanifest","sw-register.js","icon-180.png","icon-192.png","icon-512.png","_expo/static/js/web/index-a2b92ad37a38e2abff4b25847b3fd8fe.js","assets/node_modules/@expo-google-fonts/amiri/400Regular/Amiri_400Regular.5801fed976868a25cb76c6969c7d46bd.ttf","assets/node_modules/@expo-google-fonts/amiri/700Bold/Amiri_700Bold.4e6fcae427f9ae65c36f6a77f7f370e5.ttf","assets/node_modules/@expo-google-fonts/bricolage-grotesque/300Light/BricolageGrotesque_300Light.a1f1439e622b6998c9b639bbf0a23f01.ttf","assets/node_modules/@expo-google-fonts/bricolage-grotesque/400Regular/BricolageGrotesque_400Regular.6586800789b30b19bbaeb349ca5d240a.ttf","assets/node_modules/@expo-google-fonts/bricolage-grotesque/500Medium/BricolageGrotesque_500Medium.1363130c7bdf956d164cb7e605619849.ttf","assets/node_modules/@expo-google-fonts/bricolage-grotesque/600SemiBold/BricolageGrotesque_600SemiBold.e5b5fc505484ff3ca24da73cba67c660.ttf","assets/node_modules/@expo-google-fonts/bricolage-grotesque/700Bold/BricolageGrotesque_700Bold.2f7de7a336f650f9cee5ed919cc3b003.ttf","assets/node_modules/@expo-google-fonts/bricolage-grotesque/800ExtraBold/BricolageGrotesque_800ExtraBold.5bfb4fa1f8907c768231d97bc27e8df9.ttf"];
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
