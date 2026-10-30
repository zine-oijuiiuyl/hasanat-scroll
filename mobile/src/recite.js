// Hearing the card read aloud (Zine, 2026-10-30). Cards from the Qur'an play a real recitation of the verse
// (Mishary Alafasy, one file per verse); the dhikr, duas and hadith are read by the phone's Arabic voice. A verse
// plays whole, even when the card shows only part of it. On by default, with a switch in the settings.
// The word being read lights up on the card (Zine, 2026-10-30): for a verse, from Quran.com's word timings for this
// recitation; for the phone's voice, from its word-by-word progress. Sent as the "reciteWord" event (card, word).
import * as Speech from "expo-speech";
import { createAudioPlayer } from "expo-audio";
import { G, on, emit, isLearn, picking } from "./game";
import { BY_ID, T } from "./web-data";

const pad = n => String(n).padStart(3, "0");
const EVERYAYAH = (s, a) => `https://everyayah.com/data/Alafasy_128kbps/${pad(s)}${pad(a)}.mp3`;
const API = "https://api.quran.com/api/v4";

// "Ta-Ha 20:25-26" -> [[20, 25], [20, 26]].
function verseKeys(d) {
  const m = /(\d+):(\d+)(?:-(\d+))?/.exec(d.src || "");
  if (!m) return null;
  const s = +m[1], from = +m[2], to = +(m[3] || m[2]);
  const out = [];
  for (let a = from; a <= to && a < from + 10; a++) out.push([s, a]);
  return out;
}

// The card's Arabic split into the words drawn one by one on the card (Feed.js uses the same split).
export const cardWords = d => d.ar.split(/\s+/).filter(Boolean);

// Letters only, so the card's spelling and Quran.com's match: no vowel marks, one kind of alif, no hamza seats.
const norm = w => w
  .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "")
  .replace(/[\u0671\u0622\u0623\u0625]/g, "\u0627").replace(/\u0649/g, "\u064A").replace(/\u0629/g, "\u0647")
  .replace(/\u0624/g, "\u0648").replace(/\u0626/g, "\u064A").replace(/\u0621/g, "")
  .replace(/[^\u0627-\u064A]/g, "");

// One verse's words and when each is said, in ms, plus the audio file those times belong to. Kept for the session.
const timings = {};
function timing(s, a) {
  const k = s + ":" + a;
  if (!timings[k]) timings[k] = Promise.all([
    fetch(`${API}/verses/by_key/${k}?words=true&word_fields=text_uthmani`).then(r => r.json()),
    fetch(`${API}/recitations/7/by_ayah/${k}`).then(r => r.json()),
  ]).then(([v, r]) => {
    const words = ((v.verse && v.verse.words) || []).filter(w => w.char_type_name !== "end").map(w => norm(w.text_uthmani || w.text || ""));
    const f = (r.audio_files || [])[0] || {};
    const segs = (f.segments || []).filter(g => Array.isArray(g) && g.length >= 3).map(g => g.slice(-3).map(Number));
    if (!words.length || !segs.length || !f.url) throw new Error("no timings");
    const base = Math.min(...segs.map(g => g[0]));   // word numbers may start at 0 or 1
    const t = words.map(() => null);
    segs.forEach(([i, st, en]) => { if (t[i - base] === null) t[i - base] = [st, en]; });
    return { words, t, url: /^https?:/.test(f.url) ? f.url : "https://verses.quran.com/" + f.url.replace(/^\/+/, "") };
  }).catch(() => { delete timings[k]; return null; });
  return timings[k];
}

// Which verse word each card word is: the card can be a part of the verse, so find where it starts, then walk on.
function align(card, W) {
  let best = -1, at = 0;
  for (let o = 0; o < W.length; o++) {
    let m = 0;
    for (let i = 0, j = o; i < card.length && j < W.length; i++) { if (!card[i]) continue; if (card[i] === W[j].w) m++; j++; }
    if (m > best) { best = m; at = o; }
  }
  const map = [];
  let j = at;
  card.forEach((c, i) => {
    if (!c) { map[i] = -1; return; }
    let k = j;
    while (k < j + 3 && k < W.length && W[k].w !== c) k++;
    if (k < W.length && W[k].w === c) j = k;
    map[i] = j < W.length ? j : -1;
    j++;
  });
  return map;
}

let player = null, sub = null, timer = null, tick = null, run = 0, lit = null;

// Light word i of card idx (-1: none).
function light(idx, i) {
  if (lit ? lit[0] === idx && lit[1] === i : i < 0) return;
  if (lit && lit[0] !== idx) emit("reciteWord", lit[0], -1);
  lit = i < 0 ? null : [idx, i];
  emit("reciteWord", idx, i);
}

// The reciting volume slider changes a verse that is already playing too.
export function setReciteVolume(v) { if (player) try { player.volume = v; } catch (e) {} }

export function stopRecite() {
  run++;
  clearTimeout(timer);
  clearInterval(tick);
  Speech.stop().catch(() => {});
  if (sub) { try { sub.remove(); } catch (e) {} sub = null; }
  if (player) { try { player.pause(); player.remove(); } catch (e) {} player = null; }
  if (lit) { emit("reciteWord", lit[0], -1); lit = null; }
}

const reciteOn = () => G.life.recite !== false;

// Play the verse files one after the other, lighting the words as they are said.
async function playVerses(idx, d, keys, me) {
  const tm = await Promise.race([Promise.all(keys.map(([s, a]) => timing(s, a))), new Promise(r => setTimeout(() => r(null), 2500))]);
  if (me !== run) return;
  const ok = tm && tm.every(Boolean);
  const urls = keys.map(([s, a], f) => (ok ? tm[f].url : EVERYAYAH(s, a)));
  const toks = cardWords(d).map(norm);
  let map = null, W = null;
  if (ok) {
    W = [];
    tm.forEach((x, f) => x.words.forEach((w, n) => W.push({ w, f, t: x.t[n] })));
    map = align(toks, W);
  }
  // Without timings, a single verse is lit evenly by the length of each word.
  const lens = toks.map(c => c.length || 0), total = lens.reduce((a, b) => a + b, 0) || 1;
  const step = f => {
    const p = player;
    if (!p || me !== run) return;
    const ms = (p.currentTime || 0) * 1000;
    let cur = -1;
    if (map) {
      let last = -1;
      map.forEach((j, i) => { const x = j >= 0 && W[j]; if (x && x.f === f && x.t) { last = i; if (x.t[0] <= ms) cur = i; } });
      // Past the card's last word, while the reciter goes on with the rest of the verse: nothing lit.
      if (cur >= 0 && cur === last && ms > W[map[cur]].t[1] + 300) cur = -1;
      light(idx, cur);
      return;
    } else if (keys.length === 1 && p.duration > 0) {
      let acc = 0;
      const at = (ms / 1000 / p.duration) * total;
      for (let i = 0; i < lens.length; i++) { if (lens[i] && at >= acc) cur = i; acc += lens[i]; }
    }
    if (cur >= 0) light(idx, cur);
  };
  const playFile = f => {
    if (me !== run) return;
    if (f >= urls.length) { clearInterval(tick); light(idx, -1); return; }
    try {
      player = createAudioPlayer({ uri: urls[f] });
      sub = player.addListener("playbackStatusUpdate", st => {
        if (st.didJustFinish && me === run) {
          try { sub.remove(); player.remove(); } catch (e) {}
          sub = null; player = null;
          playFile(f + 1);
        }
      });
      player.volume = G.life.volRecite ?? 1;
      player.play();
      clearInterval(tick);
      tick = setInterval(() => step(f), 70);
    } catch (e) {}
  };
  playFile(0);
}

// The phone's voice tells where it is in the text; until it does (or if it never does), guess from the length.
function speak(idx, d, me) {
  const words = cardWords(d);
  const starts = [];
  let from = 0;
  words.forEach(w => { const at = d.ar.indexOf(w, from); starts.push(at); from = at + w.length; });
  const lens = words.map(w => norm(w).length || 1), total = lens.reduce((a, b) => a + b, 0);
  let heard = false, t0 = 0;
  const guess = () => {
    if (heard || me !== run) return;
    const at = (Date.now() - t0) / 105;   // about 105 ms a letter at this speed
    let acc = 0, cur = 0;
    for (let i = 0; i < lens.length; i++) { if (at >= acc) cur = i; acc += lens[i]; }
    if (at < total) light(idx, cur);
  };
  Speech.speak(d.ar, {
    language: "ar-SA", rate: 0.85, volume: G.life.volRecite ?? 1,
    onStart: () => { t0 = Date.now(); clearInterval(tick); tick = setInterval(guess, 80); },
    onBoundary: e => {
      if (me !== run || !e) return;
      heard = true;
      const c = e.charIndex ?? -1;
      let cur = -1;
      starts.forEach((st, i) => { if (st <= c) cur = i; });
      if (cur >= 0) light(idx, cur);
    },
    onDone: () => { if (me === run) { clearInterval(tick); light(idx, -1); } },
  });
}

export function recite(d, idx = G.current) {
  stopRecite();
  if (!d || !reciteOn() || picking() || isLearn()) return;
  const me = run;
  const keys = verseKeys(d);
  if (keys) playVerses(idx, d, keys, me);
  else speak(idx, d, me);
}

// Read the card you land on, after a short pause so a quick run of swipes doesn't start each one. The word
// timings start loading at once, so they are usually there when the verse starts.
on("cardIdx", idx => {
  stopRecite();
  if (!reciteOn()) return;
  const me = run;
  const el = G.cards[idx], d = el && BY_ID[el.id];
  const keys = d && verseKeys(d);
  if (keys) keys.forEach(([s, a]) => timing(s, a));
  timer = setTimeout(() => {
    if (me !== run || G.current !== idx) return;
    recite(d, idx);
  }, 600);
});

const UI = {
  en: { recite: "Read the cards aloud" },
  ar: { recite: "قراءة البطاقات بصوت" },
  fr: { recite: "Lire les cartes à voix haute" },
  es: { recite: "Leer las tarjetas en voz alta" },
  tr: { recite: "Kartları sesli oku" },
  ur: { recite: "کارڈز بلند آواز سے پڑھیں" },
  id: { recite: "Bacakan kartu dengan suara" },
  bn: { recite: "কার্ডগুলো জোরে পড়ে শোনাও" },
  ru: { recite: "Читать карточки вслух" },
  de: { recite: "Karten vorlesen" },
};
for (const [l, v] of Object.entries(UI)) if (T[l]) Object.assign(T[l].ui, v);
