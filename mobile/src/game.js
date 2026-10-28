// The game: scoring, combo, levels, badges, buddy growth and moods, the sins counter and sessions.
// Ported from the web app (index.html). State lives here; screens re-render through subscribe().
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LIB, BY_ID, LANGS, RULES, isMilestone, levelFor, stageFor, BADGES, STAGES } from "./web-data";
import "./hadith";
import { t, levelTitle, levelLine, badgeText, stageName, stageLine, setLangRaw, pickLang, getLang, num } from "./i18n";
import { fx, scrollSound, setFxSettings } from "./fx";

// Zine chose a shorter wait for the native app (2026-10-25): normal swipes grow the combo, only flicks under 0.5s don't.
RULES.minDwellMs = 500;
// Zine wanted the buddy's looks to take longer to unlock (2026-10-27). Growth is still level + badges / 2;
// without badges the stages now need about 260, 670, 1,210, 1,860 and 2,610 points (was 60 to 810).
[0, 6, 10, 14, 18, 22].forEach((at, i) => { STAGES[i].at = at; });

export const KEY = "hasanat.lifetime.v2";
export const fresh = () => ({ seen: 0, said: 0, sessions: 0, best: 0, per: {}, streak: 0, bestStreak: 0, lastDay: null, badges: [], golden: 0, sound: true, gender: null, lang: null, debt: null, debtsCleared: 0, haptics: true, scrollSound: "dial", lastSeen: 0, tourDone: undefined, rating: 0, rateLater: 0, hearts: [] });

// ---------- Change notification ----------
const listeners = new Set();
let version = 0;
export const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };
export const getVersion = () => version;
export const changed = () => { version++; listeners.forEach(f => f()); };

// One-off moments (toasts, the buddy hopping, confetti) for the components that show them.
const evl = {};
export const on = (name, fn) => { (evl[name] = evl[name] || new Set()).add(fn); return () => evl[name].delete(fn); };
const emit = (name, ...a) => evl[name] && evl[name].forEach(f => f(...a));

export const G = {
  life: fresh(),
  S: null,
  loaded: false,
  buddyMood: "happy",
  moodCards: 0,
  tab: "dhikr",
  cards: [],
  current: -1,
  undo: null,
  view: null,        // { name: "summary" | "progress" | "debt" | "prayer", ... }
  tourStep: -1,
  toast: null,
  cheer: null,
  cinematic: null,  // { from, to, id } while the growth scene plays
  freed: null,      // { n, id } while the rock of the "Lighten the load" number bursts
  page: "scroll",   // "scroll" (the feed) or "learn" (the learning path), side by side like Instagram's tabs
};

let saveTimer = 0;
export const save = () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => AsyncStorage.setItem(KEY, JSON.stringify(G.life)).catch(() => {}), 150);
};
export const saveNow = () => { clearTimeout(saveTimer); return AsyncStorage.setItem(KEY, JSON.stringify(G.life)).catch(() => {}); };
const syncFx = () => setFxSettings({ sound: G.life.sound, haptics: G.life.haptics, scrollSound: G.life.scrollSound || "dial", weatherSound: G.life.weatherSound !== false });

// ---------- Session ----------
const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
export const sTaps = () => sum(G.S.said);
const sSeen = () => sum(G.S.seen);
export const lifeTaps = () => G.life.said + sTaps();
export const stageNow = () => stageFor(lifeTaps(), G.life.badges.length);
const newSession = () => ({ start: Date.now(), seen: {}, said: {}, combo: 0, bestCombo: 0, golden: 0, last: 0, window: RULES.comboMs, lifted: 0, badges: [], stageStart: stageFor(G.life.said, G.life.badges.length) });

// Returns true when this card grew the combo.
function tick(card) {
  const S = G.S, now = Date.now(), first = !S.last, gap = now - S.last;
  if (first || gap > S.window) S.combo = 0;
  const grew = first || gap >= RULES.minDwellMs;
  if (grew) S.combo++;
  S.bestCombo = Math.max(S.bestCombo, S.combo); S.last = now;
  const d = BY_ID[card.id];
  S.window = Math.min(RULES.comboMaxMs, RULES.comboMs + (d ? d.ar.length : 0) * RULES.comboPerChar);
  return grew;
}

// ---------- Buddy mood: the longer you stay away, the sadder it looks ----------
export const moodFor = h => h >= 72 ? "upset" : h >= 40 ? "sad" : h >= 16 ? "miss" : "happy";
export const MOOD_ICON = { miss: "🥺", sad: "😢", upset: "😭" };
function moodCheerUp() {
  G.buddyMood = "happy";
  celebrate({ key: "moodback" + Date.now(), icon: "🥰", title: t("moodBackT"), sub: t("moodBackS"), confetti: "color", sound: fx.party });
}
function showMood() {
  if (G.buddyMood === "happy" || !G.life.gender || isCalm()) return;
  const M = G.buddyMood[0].toUpperCase() + G.buddyMood.slice(1);
  setTimeout(() => celebrate({ key: "mood-open", icon: MOOD_ICON[G.buddyMood], title: t("mood" + M + "T"), sub: t("mood" + M + "S"), sound: () => {}, still: true }), 900);
}

// ---------- Feed ----------
export const tabOf = d => d.kind === "dua" ? "dua" : d.kind === "seerah" || d.kind === "hadith" ? "muh" : d.kind === "quran" ? "quran" : "dhikr";
let bag = [], lastId = null, nextIdx = 0, lastIdx = -1;
function pick() {
  // The "muh" tab is now Hadith: only sayings of the Prophet ﷺ, not the cards about his life (Zine, 2026-10-28).
  if (!bag.length) bag = LIB.filter(d => tabOf(d) === G.tab && (G.tab !== "muh" || d.hadith)).flatMap(d => Array(d.w).fill(d)).sort(() => Math.random() - .5);
  let d = bag.pop();
  if (d.id === lastId) { const i = bag.findIndex(x => x.id !== lastId); if (i >= 0) { bag.push(d); d = bag.splice(i, 1)[0]; } }
  lastId = d.id;
  return d;
}
function makeCard() {
  const d = pick();
  const golden = !isCalm() && nextIdx > 3 && Math.random() < RULES.goldenChance;
  const idx = nextIdx++;
  return { key: G.tab + ":" + idx, idx, id: d.id, golden, counted: false, rep: 0, repAt: 0 };
}
export function addCards(n) {
  const add = [];
  for (let i = 0; i < n; i++) add.push(makeCard());
  G.cards = G.cards.concat(add);
}
function resetFeed() {
  bag = []; lastId = null; nextIdx = 0; lastIdx = -1; G.current = -1; G.cards = [];
  G.feedRun = (G.feedRun || 0) + 1;   // tells the feed to jump back to the first card
  addCards(30);
}

export function switchTab(name) {
  if (name === G.tab) return;
  G.tab = name; G.life.tab = name; save();
  resetFeed();
  fx.up();
  tourAdvance("tab");
  changed();
}

// Called when the feed settles on a card. Every card passed on the way down scores; the card you open on is free.
export function setCurrent(idx) {
  if (G.current === idx) return;
  G.current = idx;
  emit("cardIdx", idx);
  const el = G.cards[idx];
  if (!el) return;
  if (lastIdx < 0) { lastIdx = idx; el.counted = true; }
  else if (idx > lastIdx) {
    const from = Math.max(lastIdx + 1, idx - 40);
    lastIdx = idx;
    for (let i = from; i <= idx; i++) if (G.cards[i]) scoreCard(G.cards[i], i < idx);
    tourAdvance("scroll");
  }
  if (idx > nextIdx - 8) addCards(20);
  changed();
}

// Tap the dhikr to say it again: +1 point per tap, same rules as a scrolled card.
export function repeatCard(idx) {
  const el = G.cards[idx];
  const now = Date.now();
  if (!el || !(G.life.gender || isCalm()) || now - el.repAt < 280) return;   // ignore a double tap
  el.repAt = now;
  el.rep++;
  scoreCard(el, false, true);
  const n = el.rep;
  if (!isCalm() && [33, 66, 99, 100].includes(n)) { fx.up(); emit("cheerBuddy"); toast("📿", t("repT", { n }), t("repS")); }
  emit("repeat", el.key);
  tourAdvance("repeat");
  changed();
}

const snap = () => ({ lv: levelFor(lifeTaps()), st: stageNow() });

function scoreCard(el, quiet, repeat) {
  if (!repeat) {
    if (el.counted) return;
    el.counted = true;
  }
  if (isCalm()) {
    // Calm: no points, buddy or show. "Lighten the load" still goes down, with the rock alone (Zine, 2026-10-28).
    G.life.lastSeen = Date.now(); save();
    // No rock in calm either (Zine, 2026-10-28): reaching zero is a quiet note at the top.
    if (lowerDebt()) { fx.up(); toast("⚖️", t("debtDoneT"), t("debtDoneS")); } else scrollSound();
    return;
  }
  if (!G.life.gender) return;
  const S = G.S, id = el.id, golden = !repeat && el.golden;   // repeating a card never counts as a golden find
  const before = snap();
  S.said[id] = (S.said[id] || 0) + 1;
  if (golden) S.golden++;
  const grew = tick(el);
  G.life.lastSeen = Date.now(); save();
  if (G.buddyMood !== "happy" && ++G.moodCards >= 3) { G.moodCards = 0; moodCheerUp(); }
  const cleared = lowerDebt();
  if (!quiet) { emit("floater", golden); emit("hop"); }

  let big = false;
  if (quiet) big = true;   // skipped cards still count, but only the card you land on gets the show
  else if (golden) { fx.golden(); emit("confetti", true); emit("cheerBuddy"); toast("⭐", t("goldenT"), t("goldenS")); big = true; }
  const pts = sTaps();
  if (!quiet && isMilestone(pts)) { fx.party(); emit("confetti", false); emit("cheerBuddy"); toast("🎉", t("mileT", { n: pts }), t("mileS")); big = true; }
  if (cleared) { openFreed(G.life.debt.start); big = true; }
  if (afterChange(before)) big = true;
  if (!big) scrollSound();
  emit("bump");
}

// Checks level, badges and buddy growth after anything changed. Returns how many celebrations it queued.
function afterChange(before) {
  let n = 0;
  const lv = levelFor(lifeTaps());
  if (lv > before.lv) {
    celebrate({ key: "lv" + lv, icon: "⬆️", title: t("lvT", { n: lv, t: levelTitle(lv) }), sub: levelLine(), confetti: "gold", sound: fx.party }); n++;
  }
  checkBadges(false).forEach(b => { celebrate({ key: "badge" + b.id, icon: b.icon, title: t("badgeT", { t: badgeText(b)[0] }), sub: badgeText(b)[1], confetti: "color", sound: fx.party }); n++; });
  const st = stageNow();
  if (st > before.st) {
    openCinematic(before.st, st); n++;
  }
  return n;
}

function ctx(final) {
  const { life, S } = G;
  return {
    sess: sTaps(), combo: S.bestCombo, golden: life.golden + (final ? 0 : S.golden),
    life: life.said + (final ? 0 : sTaps()), streak: life.streak, level: levelFor(life.said + (final ? 0 : sTaps())),
    stage: stageFor(life.said + (final ? 0 : sTaps()), life.badges.length), cleared: life.debtsCleared,
  };
}
function checkBadges(final) {
  const c = ctx(final);
  const got = BADGES.filter(b => !G.life.badges.includes(b.id) && b.test(c));
  if (got.length) { G.life.badges.push(...got.map(b => b.id)); G.S.badges.push(...got); save(); }
  return got;
}

// ---------- Toasts and the buddy's speech bubble ----------
const toasts = []; let toastTimer = 0;
export function toast(icon, title, sub) {
  if ((G.toast && G.toast.title === title) || toasts.some(x => x.title === title)) return;
  toasts.push({ icon, title, sub, id: Date.now() + Math.random() });
  if (!G.toast) nextToast();
}
function nextToast() {
  clearTimeout(toastTimer);
  G.toast = toasts.shift() || null;
  emit("toast", G.toast);
  if (G.toast) toastTimer = setTimeout(nextToast, 1800);
}

const cheers = []; let cheerTimer = 0;
function celebrate(c) {
  if (isCalm()) return;
  if ((G.cheer && G.cheer.key === c.key) || cheers.some(x => x.key === c.key)) return;
  cheers.push(c);
  if (!G.cheer) nextCheer();
}
function nextCheer() {
  clearTimeout(cheerTimer);
  const c = cheers.shift() || null;
  G.cheer = c;
  emit("cheer", c);
  if (!c) return;
  if (!c.still) emit("cheerBuddy", c.evolve);
  if (c.confetti) emit("confetti", c.confetti === "gold", "buddy");
  c.sound();
  cheerTimer = setTimeout(nextCheer, c.evolve ? 4800 : 3600);
}
// ---------- The growth scene, played for every new form (Cinematic.js) ----------
export function openCinematic(from, to) {
  G.cinematic = { from, to, id: Date.now() };
  changed();
  setTimeout(() => emit("confetti", true), 2100);
  setTimeout(() => emit("confetti", false), 2700);
}
export function dismissCinematic() {
  if (!G.cinematic) return;
  G.cinematic = null;
  changed();
  setTimeout(() => emit("cheerBuddy", true), 250);
}
// ---------- The rock bursting when the "Lighten the load" number reaches zero (Rock.js) ----------
export function openFreed(n) {
  G.freed = { n, id: Date.now() };
  changed();
  setTimeout(() => emit("confetti", true), 1600);
}
export function dismissFreed() {
  if (!G.freed) return;
  G.freed = null;
  changed();
  setTimeout(() => { emit("cheerBuddy", true); emit("confetti", true, "buddy"); }, 250);
}
// ---------- Points from the learning path (learn.js) ----------
// Counted with the session like scrolled cards, under their own key so the per-dhikr list ignores them.
export function award(n) {
  if (!n) return;
  const before = snap();
  G.S.said.learn = (G.S.said.learn || 0) + n;
  G.life.lastSeen = Date.now(); save();
  afterChange(before);
  emit("floater", true); emit("bump"); emit("hop");
  changed();
}
export { emit, toast as showToast };

function clearCheers() { cheers.length = 0; nextCheer(); }

// ---------- "Lighten the load": a number you set that each scrolled card lowers ----------
export const digits = str => String(str).replace(/[٠-٩۰-۹০-৯]/g, ch => {
  const c = ch.charCodeAt(0);
  return String(c >= 0x09E6 ? c - 0x09E6 : c >= 0x06F0 ? c - 0x06F0 : c - 0x0660);
}).replace(/\D/g, "");

function lowerDebt() {
  const d = G.life.debt;
  if (!d || d.done || d.left <= 0) return false;
  const cut = Math.min(d.step, d.left);
  d.left -= cut; G.S.lifted += cut;
  const cleared = d.left === 0;
  if (cleared) { d.done = true; G.life.debtsCleared++; }
  save();
  emit("debtTick");
  return cleared;
}
export function startDebt(n, step) {
  G.life.debt = { start: n, left: n, step, done: false };
  save(); fx.party(); emit("cheerBuddy");
  toast("⚖️", t("debtTitle"), t("debtLeft", { n: num(n) }));
  changed();
}
export function removeDebt() { G.life.debt = null; save(); changed(); }

// ---------- Ending a session ----------
export function finish() {
  const { life } = G, s = G.S, taps = sum(s.said), seenN = sum(s.seen);
  const levelBefore = levelFor(life.said);
  // Kept so "Keep scrolling" can pick the session back up with its score.
  if (taps > 0 || seenN > 0) G.undo = { life: JSON.parse(JSON.stringify(life)), S: s };
  if (taps > 0 || seenN > 0) {
    life.seen += seenN; life.said += taps; life.sessions++;
    life.best = Math.max(life.best, taps); life.golden += s.golden;
    for (const [k, v] of Object.entries(s.said)) life.per[k] = (life.per[k] || 0) + v;
    if (taps > 0) {
      const day = new Date(); day.setHours(0, 0, 0, 0);
      if (life.lastDay) {
        const gap = Math.round((day - new Date(life.lastDay)) / 864e5);
        if (gap === 1) life.streak++; else if (gap > 1) life.streak = 1;
      } else life.streak = 1;
      life.bestStreak = Math.max(life.bestStreak, life.streak);
      life.lastDay = day.getTime();
    }
    checkBadges(true);
    save();
  }
  const summary = { ...s, taps, seenN, end: Date.now(), levelBefore, levelAfter: levelFor(life.said), stageEnd: stageFor(life.said, life.badges.length) };
  G.S = newSession();
  clearCheers();
  changed();
  return summary;
}
export const hasSession = () => sTaps() + sSeen() > 0;

// "Reset" on the summary: clear the hearted cards, drop the chance to resume and rebuild the feed from a
// fresh first card. The summary stays open (Zine, 2026-10-26).
export function resetSession() {
  G.undo = null;
  G.S = newSession();
  G.life.hearts = [];
  resetFeed();
  // Show the summary of the new, empty session, so every number on the screen resets at once.
  G.view = { name: "summary", sm: finish() };
  save(); changed();
}

// "Keep scrolling" on the summary brings the session and its score back.
export function keepScrolling(sm) {
  const { undo } = G;
  if (undo && sm && undo.S.start === sm.start) {
    const l = G.life;
    const keep = { rating: l.rating, rateLater: l.rateLater, hearts: l.hearts, lang: l.lang, sound: l.sound, haptics: l.haptics, scrollSound: l.scrollSound, weather: l.weather, weatherSound: l.weatherSound, feedBuddy: l.feedBuddy };
    G.life = Object.assign(undo.life, keep);
    G.S = undo.S; G.S.last = 0; save();
  }
  G.undo = null;
  closeView();
}

// ---------- Screens ----------
export function openView(name, extra) {
  G.view = { name, ...extra };
  if (name === "progress") tourAdvance("open");
  changed();
}
export function setPage(p) {
  if (G.page === p) return;
  G.page = p;
  emit("page", p);
  changed();
}
export function closeView() {
  const was = G.view;
  G.view = null;
  if (was) tourAdvance("close");
  changed();
}

// ---------- Settings ----------
export function setLang(l) {
  if (!LANGS[l]) return;
  setLangRaw(l); G.life.lang = l; save(); changed();
}
export function setSetting(k, v) { G.life[k] = v; save(); syncFx(); changed(); }
// The first question: game-like (buddy, points, rewards) or calm (only the cards). Zine, 2026-10-28.
export const isCalm = () => G.life.mode === "calm";
export function pickMode(m) {
  G.life.mode = m; G.life.lang = getLang();
  if (m === "calm") { G.life.tourDone = true; G.page = "scroll"; emit("page", "scroll"); clearCheers(); }
  save(); changed();
}
export function setMode(calm) {
  G.view = null;
  pickMode(calm ? "calm" : "game");
  if (!calm && G.life.gender) { fx.party(); emit("confetti", false); }
}
export function pickBuddy(g) {
  G.life.gender = g; G.life.lang = getLang(); G.life.tourDone = false; save();
  fx.party(); emit("confetti", false); emit("cheerBuddy");
  changed();
  setTimeout(startTour, 1700);
}
export function swapBuddy() { G.life.gender = G.life.gender === "f" ? "m" : "f"; save(); changed(); }
export function rate(n) { G.life.rating = n; save(); fx.up(); if (n >= 4) { fx.party(); emit("confetti", n === 5); } changed(); }
export function rateLater() { G.life.rateLater = Date.now(); save(); changed(); }
export const askToRate = () => !G.life.rating && G.life.sessions >= 3 && Date.now() - (G.life.rateLater || 0) > 7 * 864e5;

// Hearted cards, newest first. Reset on the summary clears them; wiping progress keeps them.
export const isHearted = id => (G.life.hearts || []).includes(id);
export function toggleHeart(id) {
  const h = (G.life.hearts || []).filter(x => x !== id);
  G.life.hearts = h.length === (G.life.hearts || []).length ? [id, ...h] : h;
  save(); changed();
  return G.life.hearts[0] === id;
}

// Back to zero. The buddy, language, sound choices and hearted cards stay, since those are settings, not progress.
export function wipeEverything() {
  const l = G.life;
  const keep = { mode: l.mode, gender: l.gender, lang: l.lang, sound: l.sound, haptics: l.haptics, scrollSound: l.scrollSound, weather: l.weather, weatherSound: l.weatherSound, feedBuddy: l.feedBuddy, tourDone: l.tourDone, rating: l.rating, prayer: l.prayer, tab: l.tab, hearts: l.hearts };
  G.life = Object.assign(fresh(), keep);
  G.buddyMood = "happy";
  G.S = newSession(); G.undo = null; clearCheers();
  save(); changed();
  toast("🌱", t("wiped"), "");
}

// ---------- Backup ----------
export function backupText() {
  // Include the points from the session in progress.
  const snapLife = JSON.parse(JSON.stringify(G.life));
  snapLife.said += sTaps();
  for (const [k, v] of Object.entries(G.S.said)) snapLife.per[k] = (snapLife.per[k] || 0) + v;
  return JSON.stringify({ app: "hasanat-scroll", v: 2, life: snapLife }, null, 1);
}
export function restoreText(text) {
  try {
    const data = JSON.parse(text);
    if (!data || data.app !== "hasanat-scroll" || typeof data.life !== "object") throw 0;
    G.life = Object.assign(fresh(), data.life);
    if (G.life.gender && G.life.tourDone === undefined) G.life.tourDone = true;
    G.buddyMood = "happy";
    G.S = newSession(); G.undo = null;   // the backup already holds the session in progress
    if (LANGS[G.life.lang]) setLangRaw(G.life.lang);
    save(); syncFx(); changed();
    toast("💾", t("restored"), "");
    return true;
  } catch (e) {
    toast("⚠️", t("badFile"), "");
    return false;
  }
}

// ---------- Interactive tutorial: do each thing yourself, it moves on when you have ----------
export const TOUR = [
  { k: "tutSwipe", wait: "scroll", hand: true },
  { k: "tutPoints", target: "pts", next: true },
  { k: "tutTabs", target: "tabs", next: true },
  { k: "tutRepeat", wait: "repeat", tapHand: true },
  { k: "tutBuddy", target: "buddy", next: true },
  { k: "tutLevel", target: "lvl", wait: "open" },
  { k: "tutBack", target: "close", wait: "close", vars: () => ({ b: t("back") }), delay: 700 },
  { k: "tutSins", target: "debt", next: true },
  { k: "tutDone", target: "done", next: true, vars: () => ({ b: t("done") }) },
  { k: "tutEnd", next: true, last: true },
];
let tourTimer = 0;
export function startTour() { closeView(); G.tourStep = 0; changed(); }
export function endTour() { clearTimeout(tourTimer); G.tourStep = -1; G.life.tourDone = true; save(); changed(); }
export function goTour(i) {
  clearTimeout(tourTimer);
  if (i >= TOUR.length) return endTour();
  G.tourStep = -2;   // hidden for a moment between steps
  changed();
  tourTimer = setTimeout(() => { G.tourStep = i; changed(); }, TOUR[i].delay || 250);
}
let tourWaiting = -1;
function tourAdvance(ev) {
  const i = G.tourStep;
  if (i >= 0 && TOUR[i].wait === ev && tourWaiting !== i) { tourWaiting = i; goTour(i + 1); setTimeout(() => { tourWaiting = -1; }, 300); }
}

// ---------- App lifecycle ----------
// Leaving the app ends the session; the summary waits for the return.
let pending = null;
// After this long away, the app offers a memory check of what is due (learn.js).
const AWAY_MS = 8 * 36e5;
let offerReview = () => {};
export const setReviewOffer = fn => { offerReview = fn; };
export function onBackground() {
  if (hasSession()) pending = finish();
  saveNow();
}
export function onForeground() {
  if (pending) { const sm = pending; pending = null; openView("summary", { sm }); }
  const l = G.life;
  if (l.lastSeen && Date.now() - l.lastSeen > AWAY_MS && !G.view && G.tourStep < 0 && l.gender) offerReview();
  if (l.lastSeen) {
    const m = moodFor((Date.now() - l.lastSeen) / 36e5);
    if (m !== "happy" && G.buddyMood === "happy") { G.buddyMood = m; G.moodCards = 0; changed(); showMood(); }
  }
}

export async function load() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) G.life = Object.assign(fresh(), JSON.parse(raw));
  } catch (e) {}
  const l = G.life;
  setLangRaw(LANGS[l.lang] ? l.lang : pickLang());
  if (!["dial", "chime", "glass", "bubble"].includes(l.scrollSound)) l.scrollSound = "dial";   // silent, pop and wind were removed
  if (l.gender && l.tourDone === undefined) { l.tourDone = true; save(); }   // people who were here before the tutorial existed
  G.tab = ["dhikr", "dua", "muh", "quran"].includes(l.tab) ? l.tab : "dhikr";
  G.buddyMood = l.lastSeen ? moodFor((Date.now() - l.lastSeen) / 36e5) : "happy";
  G.S = newSession();
  syncFx();
  resetFeed();
  G.loaded = true;
  changed();
  showMood();
  if (l.lastSeen && Date.now() - l.lastSeen > AWAY_MS && l.gender) setTimeout(() => { if (!G.view && G.tourStep < 0) offerReview(); }, 2500);
}

export { STAGES, BADGES };
