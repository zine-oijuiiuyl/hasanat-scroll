// Builds the web app (GitHub Pages, https://zine-oijuiiuyl.github.io/hasanat-scroll/) from this Expo app:
//   node scripts/build-web.js            -> mobile/dist
//   node scripts/build-web.js --deploy   -> also copies it to the repo root, which Pages serves
// The page template, icons and manifest are in public/; the service worker is scripts/sw-template.js.
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = path.join(__dirname, "..");
const dist = path.join(app, "dist");
fs.rmSync(dist, { recursive: true, force: true });
execSync("npx expo export --platform web --clear", { cwd: app, stdio: "inherit" });

const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const rel = f => path.relative(dist, f).split(path.sep).join("/");
const files = walk(dist).map(rel);

// The template asks for relative paths; Expo writes absolute /hasanat-scroll/ ones for its own tags.
let html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
html = html.replace(/<link rel="icon" href="\/hasanat-scroll\/favicon.ico"\s*\/?>/, "");
fs.writeFileSync(path.join(dist, "index.html"), html);

// Offline: the page, the bundle, icons and fonts are fetched at install; sounds and recitations when first played.
const core = ["./", "index.html", "manifest.webmanifest", "sw-register.js", "icon-180.png", "icon-192.png", "icon-512.png",
  ...files.filter(f => f.startsWith("_expo/") && f.endsWith(".js")),
  ...files.filter(f => /\.(ttf|otf|woff2?)$/.test(f) && !/Italic|ExtraLight|Light_/.test(f))];
const version = require("crypto").createHash("sha1").update(files.join("|")).digest("hex").slice(0, 10);
const sw = fs.readFileSync(path.join(__dirname, "sw-template.js"), "utf8")
  .replace("__VERSION__", version).replace("__CORE__", JSON.stringify(core));
fs.writeFileSync(path.join(dist, "sw.js"), sw);
// GitHub Pages would otherwise run Jekyll and drop the _expo folder.
fs.writeFileSync(path.join(dist, ".nojekyll"), "");
console.log(`web build ${version}: ${files.length} files`);

if (process.argv.includes("--deploy")) {
  const root = path.join(app, "..");
  // Clear the previous web build at the repo root (never mobile/, .git, LICENSE or README).
  for (const n of ["_expo", "assets", "index.html", "metadata.json", "sw.js", "sw-register.js", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", ".nojekyll", "fonts"]) {
    fs.rmSync(path.join(root, n), { recursive: true, force: true });
  }
  fs.cpSync(dist, root, { recursive: true });
  console.log("copied to", root);
}
