// Cleans the saved progress before the app uses it (2026-11-03). Progress comes from the phone's storage and from
// backup files people restore, and a backup file can come from anyone: without this, a file with a wrong type in
// one field (a number where a list should be, a huge string, a "__proto__" key) could stop the app from opening,
// or keep crashing it. Every field is checked against what the app writes; anything else is dropped or set back
// to its default. Pure functions with no app imports, so they can be tested on their own (tests/safe.test.mjs).

const MAX_N = 1e12;                 // the largest count kept (the "Lighten the load" number goes up to this)
const MAX_KEYS = 5000;              // entries kept in any one map (cards, days, memory items)
const ID = /^[a-z0-9_:-]{1,64}$/i;  // card, badge and memory-item ids
const DAY = /^\d{4}-\d{2}-\d{2}$/;

const isObj = v => v !== null && typeof v === "object" && !Array.isArray(v);
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
// A count: a whole number from 0 to `max`, or `def`.
export const int = (v, def = 0, max = MAX_N) => (typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(0, Math.floor(v))) : def);
const num = (v, lo, hi, def) => (typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi ? v : def);
const bool = (v, def) => (typeof v === "boolean" ? v : def);
const oneOf = (v, list, def) => (list.includes(v) ? v : def);
// A plain object with only safe keys, made without a prototype chain to pollute.
function map(v, keyOk, val, max = MAX_KEYS) {
  const out = {};
  if (!isObj(v)) return out;
  let n = 0;
  for (const k of Object.keys(v)) {
    if (n >= max) break;
    if (k === "__proto__" || k === "constructor" || k === "prototype" || !keyOk(k)) continue;
    const x = val(v[k]);
    if (x !== undefined) { out[k] = x; n++; }
  }
  return out;
}
const ids = (v, max = MAX_KEYS) => (Array.isArray(v) ? [...new Set(v.filter(x => typeof x === "string" && ID.test(x)))].slice(0, max) : []);

function debt(v) {
  if (!isObj(v)) return null;
  const start = int(v.start, 0);
  if (start < 1) return null;
  const left = Math.min(start, int(v.left, start));
  return { start, left, step: Math.max(1, int(v.step, 1)), done: left === 0 };
}

// Location is kept to about a kilometre: plenty for prayer times and the Qibla, and less to give away when a
// backup file is shared.
export const roundCoord = x => Math.round(x * 100) / 100;
function prayer(v, methods) {
  if (!isObj(v)) return undefined;
  const lat = num(v.lat, -90, 90, NaN), lng = num(v.lng, -180, 180, NaN);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return undefined;
  return {
    lat: roundCoord(lat), lng: roundCoord(lng),
    method: oneOf(v.method, methods, methods[0]),
    hanafi: v.hanafi === true, remind: v.remind === true,
    before: int(v.before, 0, 120),
    on: map(v.on, k => /^[a-z]{3,8}$/.test(k), x => (typeof x === "boolean" ? x : undefined), 10),
    // The adhan (adhan.js): on unless switched off, and which voice.
    adhan: v.adhan !== false,
    adhanVoice: oneOf(v.adhanVoice, ["makkah", "madinah", "melodic"], "makkah"),
  };
}

// Fields this file doesn't know yet (added by a later version of the app) are kept when they are plain
// numbers, switches or short words, so no progress is lost; anything bigger is dropped.
function extras(raw, out, max = 50) {
  let n = 0;
  for (const k of Object.keys(raw)) {
    if (n >= max) break;
    if (own(out, k) || k === "__proto__" || k === "constructor" || k === "prototype" || !/^[a-zA-Z][a-zA-Z0-9_]{0,40}$/.test(k)) continue;
    const v = raw[k];
    if (typeof v === "boolean") out[k] = v;
    else if (typeof v === "number" && Number.isFinite(v)) out[k] = Math.max(-MAX_N, Math.min(MAX_N, v));
    else if (typeof v === "string" && v.length <= 64 && /^[\w .:-]*$/.test(v)) out[k] = v;
    else continue;
    n++;
  }
  return out;
}

function learn(v) {
  if (!isObj(v)) return undefined;
  return extras(v, {
    q: int(v.q), h: int(v.h), d: int(v.d),
    srs: map(v.srs, k => ID.test(k), x => (Array.isArray(x) && x.length === 2 ? [int(x[0], 0, 20), int(x[1], 0, 9e15)] : undefined), 20000),
    checks: int(v.checks), perfect: int(v.perfect), streak: int(v.streak), best: int(v.best), chests: int(v.chests),
    medals: ids(v.medals, 100),
    hv: int(v.hv, 2, 10) || 2,
  });
}

const log = v => map(v, k => DAY.test(k), d => (isObj(d) ? { n: int(d.n), h: map(d.h, k => /^\d{1,2}$/.test(k) && +k < 24, x => int(x), 24) } : undefined), 4000);

// `raw` is whatever was parsed; `fresh` makes the defaults; `opts` lists what the app knows:
// { langs: [...], methods: [...], scrollSounds: [...], tabs: [...] }.
const HANDLED = ["seen", "said", "sessions", "best", "streak", "bestStreak", "golden", "debtsCleared", "allTime", "rateLater", "lastSeen", "lastDay", "rating",
  "gender", "lang", "scrollSound", "mode", "tab", "weather", "learnTrack", "sound", "haptics", "tourDone", "weatherSound", "recite", "feedBuddy",
  "volWx", "volScroll", "volRecite", "tourSeen", "muteWas", "per", "badges", "hearts", "debt", "log", "prayer", "learn"];

export function sanitizeLife(raw, fresh, opts) {
  const d = fresh(), d0 = fresh();
  if (!isObj(raw)) return d;
  const o = opts || {};
  const out = d;
  // Counts
  for (const k of ["seen", "said", "sessions", "best", "streak", "bestStreak", "golden", "debtsCleared", "allTime", "rateLater"]) {
    if (own(raw, k)) out[k] = int(raw[k], d[k] ?? 0);
  }
  if (out.allTime === undefined) delete out.allTime;   // load() fills it in from "said" the first time
  out.lastSeen = int(raw.lastSeen, 0, 9e15);
  // The last day with a session: a time in ms (older versions may have saved a date string).
  const ld = raw.lastDay;
  out.lastDay = (typeof ld === "number" && Number.isFinite(ld) && ld > 0) || (typeof ld === "string" && ld.length <= 40 && !Number.isNaN(Date.parse(ld))) ? ld : null;
  out.rating = int(raw.rating, 0, 5);
  // Choices
  out.gender = oneOf(raw.gender, ["m", "f"], null);
  out.lang = oneOf(raw.lang, o.langs || [], null);
  out.scrollSound = oneOf(raw.scrollSound, o.scrollSounds || ["dial"], "dial");
  if (own(raw, "mode")) { const m = oneOf(raw.mode, ["game", "calm", "learn"], undefined); if (m) out.mode = m; }
  if (own(raw, "tab")) { const t = oneOf(raw.tab, o.tabs || [], undefined); if (t) out.tab = t; }
  if (typeof raw.weather === "string" && /^[a-z]{2,12}$/.test(raw.weather)) out.weather = raw.weather;   // Weather.js falls back to "auto" for unknown ones
  if (own(raw, "learnTrack")) { const t = oneOf(raw.learnTrack, ["q", "h", "d"], undefined); if (t) out.learnTrack = t; }
  // Switches
  out.sound = bool(raw.sound, d.sound);
  out.haptics = bool(raw.haptics, d.haptics);
  out.tourDone = bool(raw.tourDone, undefined);
  for (const k of ["weatherSound", "recite", "feedBuddy"]) if (typeof raw[k] === "boolean") out[k] = raw[k];
  for (const k of ["volWx", "volScroll", "volRecite"]) if (own(raw, k)) out[k] = num(raw[k], 0, 1, 1);
  if (isObj(raw.tourSeen)) out.tourSeen = map(raw.tourSeen, k => ["game", "calm", "learn"].includes(k), x => (x === true ? true : undefined), 3);
  if (isObj(raw.muteWas)) out.muteWas = { weatherSound: raw.muteWas.weatherSound !== false, sound: raw.muteWas.sound === true, recite: raw.muteWas.recite !== false };
  // Lists and maps
  out.per = map(raw.per, k => ID.test(k), x => int(x, undefined));
  out.badges = ids(raw.badges, 200);
  out.hearts = ids(raw.hearts);
  out.debt = debt(raw.debt);
  if (own(raw, "log")) out.log = log(raw.log);
  const pr = prayer(raw.prayer, o.methods && o.methods.length ? o.methods : ["mwl"]);
  if (pr) out.prayer = pr;
  const ln = learn(raw.learn);
  if (ln) out.learn = ln;
  // Keys the checks above looked at but left out on purpose (a bad value) must not come back as "extras".
  for (const k of HANDLED) if (!own(out, k)) out[k] = undefined;
  extras(raw, out);
  for (const k of HANDLED) if (out[k] === undefined && !own(d0, k)) delete out[k];
  return out;
}

// Parses a backup file's text: { ok: true, life } or { ok: false }. Files over 5 MB are refused before parsing.
export const MAX_BACKUP = 5 * 1024 * 1024;
export function parseBackup(text, fresh, opts) {
  if (typeof text !== "string" || !text || text.length > MAX_BACKUP) return { ok: false };
  let data;
  try { data = JSON.parse(text); } catch (_) { return { ok: false }; }
  if (!isObj(data) || data.app !== "hasanat-scroll" || !isObj(data.life)) return { ok: false };
  return { ok: true, life: sanitizeLife(data.life, fresh, opts) };
}
