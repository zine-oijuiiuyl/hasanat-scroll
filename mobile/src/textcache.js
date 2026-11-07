// Saved learning texts. On the phone they are files in the app's documents folder (textcache.web.js: the browser).
import { Directory, File, Paths } from "expo-file-system";

let dir = null;
function store() {
  if (!dir) {
    dir = new Directory(Paths.document, "learn");
    try { if (!dir.exists) dir.create({ idempotent: true }); } catch (_) {}
  }
  return dir;
}
const file = name => new File(store(), name);

export async function readText(name) {
  const f = file(name);
  return f.exists ? await f.text() : null;
}
export async function writeText(name, text) { await file(name).write(text); }
export async function dropText(name) {
  try { const f = file(name); if (f.exists) f.delete(); } catch (_) {}
}
