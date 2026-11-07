// Saved learning texts on the web: the browser's Cache Storage, so the library and memory checks work
// offline too. Falls back to nothing (texts are fetched again) where the browser has no Cache Storage.
const NAME = "hasanat-learn-v1";
const key = name => new URL("/__learn/" + encodeURIComponent(name), self.location.origin).href;
const open = () => (typeof caches !== "undefined" ? caches.open(NAME) : Promise.reject(new Error("no cache")));

export async function readText(name) {
  try {
    const r = await (await open()).match(key(name));
    return r ? await r.text() : null;
  } catch (_) { return null; }
}
export async function writeText(name, text) {
  try { await (await open()).put(key(name), new Response(text, { headers: { "Content-Type": "application/json" } })); } catch (_) {}
}
export async function dropText(name) {
  try { await (await open()).delete(key(name)); } catch (_) {}
}
