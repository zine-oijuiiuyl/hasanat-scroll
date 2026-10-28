// The learning path: three tracks (Qur'an, Hadith, Dhikr) of units and lessons unlocked one after another,
// exercises made from what each lesson teaches, spaced-repetition memory checks and their rewards.
import "./learn-i18n";
import { QNAMES, QUNITS, HMETA, HUNITS, HSKIP } from "./learn-data";
import { LIB, BY_ID } from "./web-data";
import { surah, hadith, QURAN_ED, hadithEd } from "./content";
import { G, award, changed, save, openView, closeView, setPage, emit, showToast, setReviewOffer } from "./game";
import { getLang, t, meaning, sourceText } from "./i18n";
import { medalText } from "./learn-i18n";
import { fx } from "./fx";

const DAY = 864e5;
// Days until the next check for each memory box; box 5 and up counts as mastered.
const GAP = [0, 1, 3, 7, 14, 30, 60];
export const MASTER = 5;

// ---------- Saved progress ----------
export function L() {
  const l = G.life;
  if (!l.learn) l.learn = { q: 0, h: 0, d: 0, srs: {}, checks: 0, perfect: 0, streak: 0, best: 0, medals: [], hv: 2 };
  // hv 1 put a unit on his life in front of the hadith; hv 2 (Zine, 2026-10-28) makes the track hadith only
  // and removes the Dhikr track, so progress through the life unit and dhikr memory items are dropped.
  if (!l.learn.hv) l.learn.hv = 2;
  if (l.learn.hv === 1) {
    l.learn.h = Math.max(0, l.learn.h - LIFE_LESSONS);
    for (const k of Object.keys(l.learn.srs)) if (k.startsWith("d:")) delete l.learn.srs[k];
    l.learn.hv = 2;
  }
  return l.learn;
}

// ---------- Tracks ----------
const skip = Object.fromEntries(Object.entries(HSKIP).map(([c, a]) => [c, new Set(a)]));
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const DHIKR_UNITS = [
  LIB.filter(d => d.kind === "dhikr" || d.kind === "salawat").map(d => d.id),
  LIB.filter(d => d.kind === "dua").map(d => d.id),
];
// The cards on his life were the Hadith track's first unit until hv 2; only their count is still needed.
const LIFE = LIB.filter(d => d.kind === "seerah").map(d => d.id);
const chunk = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

function withStarts(units) {
  let n = 0;
  for (const u of units) { u.start = n; n += u.lessons.length; }
  return { units, total: n };
}
export const TRACKS = {
  q: withStarts(QUNITS.map(([s, part, lessons]) => ({ track: "q", s, part, lessons }))),
  h: withStarts([...HUNITS.map(([col, sec, part, lessons]) => ({ track: "h", col, sec, part, lessons }))]),
  d: withStarts(DHIKR_UNITS.map((ids, i) => ({ track: "d", i, lessons: chunk(ids, 3) }))),
};
// Same order as the feed's tabs.
export const TRACK_KEYS = ["q", "h"];   // the Dhikr track was removed (Zine, 2026-10-28)
const LIFE_LESSONS = Math.ceil(LIFE.length / 3);

export const surahName = s => QNAMES[s - 1][1];
export function unitTitle(u) {
  const part = u.part ? " · " + t("part", { n: u.part }) : "";
  if (u.track === "q") return surahName(u.s) + (getLang() === "en" ? " · " + QNAMES[u.s - 1][2] : "") + part;
  if (u.life) return t("lifeUnit");
  if (u.track === "h") return t("c_" + u.col) + part;
  return t(u.i ? "dUnit2" : "dUnit1");
}
export function unitSub(u) {
  if (u.track === "q") return QNAMES[u.s - 1][0];
  if (u.life) return "";
  if (u.track === "h") return HMETA[u.col].sections[u.sec] && HMETA[u.col].sections[u.sec] !== HMETA[u.col].name ? HMETA[u.col].sections[u.sec] : "";
  return "";
}

// The item keys a lesson teaches: "q:2:255", "h:bukhari:1", "d:subhanallah".
export function lessonItems(u, i) {
  const l = u.lessons[i];
  if (u.track === "q") return range(l[0], l[1]).map(a => `q:${u.s}:${a}`);
  if (u.life) return l.map(id => "d:" + id);
  if (u.track === "h") return range(l[0], l[1]).filter(n => !skip[u.col].has(n)).map(n => `h:${u.col}:${n}`);
  return l.map(id => "d:" + id);
}
export function lessonLabel(u, i) {
  const l = u.lessons[i];
  if (u.track === "q") return l[0] === l[1] ? t("ayah", { a: l[0] }) : t("ayat", { a: l[0], b: l[1] });
  if (u.life) return l.map(id => BY_ID[id].tr || "").filter(Boolean).join(" · ");
  if (u.track === "h") return l[0] === l[1] ? "#" + l[0] : `#${l[0]}–${l[1]}`;
  return l.map(id => BY_ID[id].tr || "").filter(Boolean).join(" · ");
}
export function unitAt(track, g) {
  const us = TRACKS[track].units;
  let lo = 0, hi = us.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (us[m].start <= g) lo = m; else hi = m - 1; }
  return us[lo];
}

// ---------- Texts ----------
const strip = s => s.replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, "");
const words = s => s.split(/\s+/).filter(Boolean);

// Loads one item with what its exercises need: { key, kind, ar, mean, ref, pool }.
export async function loadItem(key) {
  const lang = getLang();
  const [k, a, b] = key.split(":");
  if (k === "q") {
    const s = +a, n = +b, c = await surah(s, lang);
    // Some ayat recur in a surah with a different ayah after each (ar-Rahman, ash-Shu'ara, al-Qamar).
    // Then every ayah that follows it somewhere is kept out of the wrong answers, and the ayah before is shown too.
    const flat = flatOf(c), same = [];
    flat.forEach((x, i) => { if (x === flat[n - 1]) same.push(i); });
    const follows = new Set(same.map(i => flat[i + 1]));
    return {
      key, kind: "q", ar: c.ar[n - 1], mean: c.tr[n - 1],
      next: c.ar[n] || null, nextKey: c.ar[n] ? `q:${s}:${n + 1}` : null,
      before: same.length > 1 && n > 1 ? c.ar[n - 2] : null,
      ref: `${surahName(s)} ${s}:${n}`, by: (QURAN_ED[lang] || QURAN_ED.en)[1],
      poolAr: c.ar.filter((_, i) => i !== n - 1 && !follows.has(flat[i]) && flat[i] !== flat[n - 1]),
      poolMean: c.tr.filter((_, i) => i !== n - 1),
    };
  }
  if (k === "h") {
    const h = await hadith(a, +b, lang);
    seenHadith.delete(key);
    seenHadith.set(key, h.tr);
    if (seenHadith.size > 60) seenHadith.delete(seenHadith.keys().next().value);
    return { key, kind: "h", ar: h.ar, mean: h.tr, ref: `${t("c_" + a)} ${b}`, by: hadithEd(a, lang) === "eng" && lang !== "en" ? "English" : "" };
  }
  const d = BY_ID[a];
  return {
    key, kind: "d", ar: d.ar, mean: meaning(d), tl: d.tr, ref: sourceText(d),
    poolAr: LIB.filter(x => x.id !== a && x.kind !== "hadith").map(x => x.ar), poolMean: LIB.filter(x => x.id !== a && x.kind !== "hadith" && (x.kind === "seerah") === (d.kind === "seerah")).map(meaning),
  };
}
const seenHadith = new Map();   // the last hadith translations loaded, used as wrong answers
// Each surah's ayat without diacritics, to spot ayat that recur.
const flats = new WeakMap();
const flatOf = c => { let f = flats.get(c); if (!f) flats.set(c, f = c.ar.map(strip)); return f; };

export async function loadItems(keys) { return Promise.all(keys.map(loadItem)); }

// ---------- Exercises ----------
const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [b[i], b[j]] = [b[j], b[i]]; } return b; };
const pick = (a, n) => shuffle(a).slice(0, n);
const cut = (s, n) => s.length > n ? s.slice(0, n).replace(/\s+\S*$/, "") + "…" : s;

// The right answer and up to n wrong ones from the pool, none of them the same as another.
// Draws at random first (pools can be a whole surah's words), then walks the pool if that comes up short.
function options(right, pool, n = 3, norm = x => x) {
  const seen = new Set([norm(right)]), out = [];
  const take = p => { if (p && !seen.has(norm(p))) { seen.add(norm(p)); out.push(p); } };
  for (let tries = 0; out.length < n && tries < n * 8 && pool.length; tries++) take(pool[Math.random() * pool.length | 0]);
  if (out.length < n) for (const p of shuffle(pool)) { if (out.length >= n) break; take(p); }
  return out.length ? shuffle([right, ...out]) : null;
}

// Words too common to make a fair blank (the isnad and the blessings on the Prophet ﷺ).
const COMMON = new Set("صلى عليه وسلم الله لله والله بالله قال قالت فقال رسول رواه عن حدثنا اخبرنا حدثني اخبرني ابن بن ان من في على الى ما لا يا ثم او هو هي سمعت النبي رضي عنه عنها الذي التي".split(" "));
const plain = w => strip(w).replace(/[أإآٱ]/g, "ا").replace(/[،,.:؛]/g, "");

function missingWord(text, pool, arabic, keep) {
  const ws = words(text);
  const ok = w => (arabic ? plain(w).length >= 3 && !COMMON.has(plain(w)) : /^[\p{L}'’-]{5,}$/u.test(w.replace(/[.,;:!?"“”()]/g, "")));
  const idx = ws.map((w, i) => ok(w) ? i : -1).filter(i => i >= 0);
  if (!idx.length) return null;
  const i = idx[Math.random() * idx.length | 0];
  const clean = w => arabic ? w : w.replace(/[.,;:!?"“”()]/g, "");
  const right = clean(ws[i]);
  const others = pool.flatMap(words).map(clean).filter(w => ok(w) && w !== right);
  const opts = options(right, others, 3, arabic ? plain : x => x.toLowerCase());
  if (!opts) return null;
  let before = ws.slice(0, i).join(" "), after = ws.slice(i + 1).join(" ");
  if (keep) { before = before.length > keep ? "…" + before.slice(-keep).replace(/^\S*\s/, "") : before; after = cut(after, keep); }
  return { type: "missing", arabic, before, after, right, opts };
}

// Where a hadith is split for "how does it end": past the middle, after a comma or full stop when there is one.
function splitAt(ws) {
  const lo = Math.max(6, Math.ceil(ws.length * 0.45)), hi = Math.floor(ws.length * 0.7);
  for (let k = Math.floor(ws.length * 0.55); k >= lo; k--) if (/[.,;:!?”"’]$/.test(ws[k - 1])) return k;
  for (let k = Math.floor(ws.length * 0.55) + 1; k <= hi; k++) if (/[.,;:!?”"’]$/.test(ws[k - 1])) return k;
  return Math.max(6, Math.floor(ws.length * 0.55));
}
const ending = x => { const ws = words(x); return cut(ws.slice(splitAt(ws)).join(" "), 160); };

// known(key) says whether an item has been taught, so "what comes next" only asks for ayat already learned.
function exercisesFor(it, known) {
  const out = [];
  if (it.kind === "q" || it.kind === "d") {
    const m = options(cut(it.mean, 220), it.poolMean.map(x => cut(x, 220)));
    if (m) out.push({ type: "meaning", prompt: it.ar, right: cut(it.mean, 220), opts: m });
    if (it.next && known(it.nextKey)) {
      const o = options(it.next, it.poolAr, 3, strip);
      if (o) out.push({ type: "next", prompt: it.ar, before: it.before, ref: it.ref, right: it.next, opts: o });
    }
    const ws = words(it.ar);
    if (ws.length >= 3 && ws.length <= 8) out.push({ type: "order", right: ws, tiles: shuffle(ws.map((w, i) => ({ w, i }))) });
    const mw = missingWord(it.ar, it.poolAr, true);
    if (mw) out.push(mw);
  } else {
    const tr = missingWord(it.mean, [...seenHadith.values()].filter(x => x !== it.mean).concat(it.mean), false, 260);
    if (tr) out.push(tr);
    const arTail = words(it.ar).slice(-24).join(" ");
    const mw = missingWord(arTail, [it.ar], true, 200);
    if (mw) out.push(mw);
    const ws = words(it.mean);
    const others = [...seenHadith.values()].filter(x => x !== it.mean && words(x).length > 10);
    if (others.length >= 2 && ws.length > 10) {
      // The prompt is the text right up to the split, so the right answer carries straight on from it.
      const k = splitAt(ws), head = ws.slice(0, k).join(" ");
      const prompt = head.length > 320 ? "…" + head.slice(-320).replace(/^\S*\s/, "") : head;
      const right = ending(it.mean);
      const o = options(right, others.map(ending));
      if (o) out.push({ type: "end", prompt, right, opts: o });
    }
  }
  return out.map(e => ({ ...e, key: it.key, item: it }));
}

// A lesson: two exercises per item, up to eight, in mixed order.
export function lessonExercises(items) {
  const keys = new Set(items.map(it => it.key)), srs = L().srs;
  const per = items.map(it => shuffle(exercisesFor(it, k => keys.has(k) || !!srs[k])));
  const out = [];
  for (let r = 0; r < 2; r++) for (const list of per) if (list[r]) out.push(list[r]);
  return shuffle(out.slice(0, 8));
}
// A memory check: one exercise per item.
export function reviewExercises(items) {
  const srs = L().srs;
  return shuffle(items.map(it => {
    const list = exercisesFor(it, k => !!srs[k]);
    const best = list.filter(e => e.type !== "order");
    return (best.length ? pick(best, 1) : list)[0];
  }).filter(Boolean));
}

// ---------- Memory boxes ----------
export function learned(keys) {
  const srs = L().srs, now = Date.now();
  for (const k of keys) if (!srs[k]) srs[k] = [1, now + GAP[1] * DAY];
  memo = null;
}
export function grade(key, ok) {
  const srs = L().srs, now = Date.now();
  const box = ok ? Math.min(GAP.length - 1, ((srs[key] || [0])[0]) + 1) : 1;
  srs[key] = [box, now + GAP[box] * DAY];
  memo = null;
}
// The tab bar and the path read these on every render, so they are worked out once and kept
// until the memory boxes change or the next item falls due.
let memo = null;
function stats() {
  const srs = L().srs, now = Date.now();
  if (memo && memo.srs === srs && now < memo.until) return memo;
  const due = [];
  let mastered = 0, learnedN = 0, until = Infinity;
  for (const k in srs) {
    const v = srs[k];
    learnedN++;
    if (v[0] >= MASTER) mastered++;
    if (v[1] <= now) due.push([k, v]); else if (v[1] < until) until = v[1];
  }
  due.sort((a, b) => a[1][0] - b[1][0] || a[1][1] - b[1][1]);
  return (memo = { srs, until, due: due.map(([k]) => k), mastered, learned: learnedN });
}
export const dueKeys = () => stats().due;
export const dueCount = () => stats().due.length;
export const boxOf = k => (L().srs[k] || [0])[0];
export const masteredCount = () => stats().mastered;
export const learnedCount = () => stats().learned;

// ---------- Rewards ----------
export const MEDALS = [
  { id: "m5", icon: "🧭", test: s => TRACK_KEYS.some(k => s[k] >= (TRACKS[k].units[0].lessons.length)) },
  { id: "m1", icon: "🧠", test: s => s.perfect >= 1 },
  { id: "m2", icon: "💎", test: s => s.perfect >= 5 },
  { id: "m3", icon: "👑", test: () => masteredCount() >= 10 },
  { id: "m4", icon: "🌟", test: () => masteredCount() >= 100 },
];
export const medalName = id => medalText(getLang(), id);
function checkMedals() {
  const s = L();
  const got = MEDALS.filter(m => !s.medals.includes(m.id) && m.test(s));
  got.forEach((m, i) => {
    s.medals.push(m.id);
    setTimeout(() => { fx.party(); emit("confetti", true); showToast(m.icon, t("medalT", { t: medalName(m.id)[0] }), medalName(m.id)[1]); }, 900 + i * 1900);
  });
  return got;
}

// ---------- Sets of seven ----------
// The path shows one set of seven lessons at a time, so the whole list isn't shown at once (Zine,
// 2026-10-27). Finishing a set opens its reward chest and shows the next set.
export const SET = 7, SET_BONUS = 30;
export function setOf(track, g) {
  const total = TRACKS[track].total;
  const from = Math.floor(Math.min(g, total - 1) / SET) * SET;
  return { n: from / SET, from, to: Math.min(total, from + SET), total };
}

// Finishing a lesson: everything it taught goes into memory, points, and the next lesson unlocks.
export function finishLesson(track, g, keys, correct, total) {
  const s = L();
  const fresh = g >= s[track];
  learned(keys);
  if (fresh) s[track] = g + 1;
  const perfect = correct >= total;
  const setDone = fresh && g + 1 === setOf(track, g).to;
  if (setDone) s.chests = (s.chests || 0) + 1;
  const pts = correct + (fresh ? 5 : 0) + (perfect ? 5 : 0) + (setDone ? SET_BONUS : 0);
  const u = unitAt(track, g);
  const unitDone = fresh && g === u.start + u.lessons.length - 1;
  save();
  award(pts);
  checkMedals();
  return { pts, perfect, unitDone, setDone };
}

// Finishing a memory check.
export function finishReview(results) {
  const s = L();
  results.forEach(r => grade(r.key, r.ok));
  const right = results.filter(r => r.ok).length;
  const perfect = results.length > 0 && right === results.length;
  s.checks++;
  if (perfect) { s.perfect++; s.streak++; s.best = Math.max(s.best, s.streak); } else s.streak = 0;
  const pts = right * 2 + (perfect ? 10 : 0) + (perfect && s.streak > 1 ? Math.min(20, s.streak * 2) : 0);
  save();
  award(pts);
  checkMedals();
  return { pts, perfect, right, streak: s.streak };
}

// The offer to take a memory check after time away.
export const REVIEW_SIZE = 6;
setReviewOffer(() => { if (dueKeys().length) openView("review", { offer: true }); });

// The learning path is the page to the right of the feed; lessons and the library open over it.
export function openLearn(track) {
  if (track) G.life.learnTrack = track;
  if (G.view) closeView();
  setPage("learn");
}
export const backToPath = () => openLearn();
export function setTrack(track) { G.life.learnTrack = track; save(); changed(); }
export { changed };
