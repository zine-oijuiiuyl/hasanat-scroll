// Hearing the card read aloud (Zine, 2026-10-30). Cards from the Qur'an play Mishary Alafasy's recitation, cut to
// exactly the words on the card and bundled in the app (scripts/make-recitations.py, src/recite-data.js); the dhikr
// and duas play Hamad Al-Duraihim's reading of Hisn al-Muslim, cut the same way (scripts/make-human-voice.py,
// src/voice-data.js). Zine didn't like the iPhone's voice nor an AI voice (2026-10-31), so cards with no human
// recording (most hadith and seerah cards) stay silent. On by default, with a switch in the settings. Each card loops.
// The word being read lights up on the card (Zine, 2026-10-30), from the word timings that come with each clip.
// Sent as the "reciteWord" event (card, word).
import { createAudioPlayer } from "expo-audio";
import { G, on, emit, isLearn, picking } from "./game";
import { BY_ID, T } from "./web-data";
import { CLIPS } from "./recite-data";
import { VOICE } from "./voice-data";

// The card's Arabic split into the words drawn one by one on the card (Feed.js uses the same split).
export const cardWords = d => d.ar.split(/\s+/).filter(Boolean);

// Whether a card has a recording (the others turn their parts on a timer, Feed.js).
export const hasVoice = id => !!(CLIPS[id] || VOICE[id]);

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
  if (sub) { try { sub.remove(); } catch (e) {} sub = null; }
  if (player) { try { player.pause(); player.remove(); } catch (e) {} player = null; }
  if (lit) { emit("reciteWord", lit[0], -1); lit = null; }
}

const reciteOn = () => G.life.recite !== false;

// Every card is read again and again while you stay on it, with a short rest in between (Zine, 2026-10-30).
const REST = 1500;

// Play the card's clip, lighting each word from its start until the next one starts.
function playClip(idx, c, me) {
  try {
    player = createAudioPlayer(c.file);
    sub = player.addListener("playbackStatusUpdate", st => {
      if (st.didJustFinish && me === run) {
        light(idx, -1);
        timer = setTimeout(() => {
          const p = player;
          if (me !== run || !p) return;
          const go = () => { try { p.play(); } catch (e) {} };
          Promise.resolve(p.seekTo(0)).then(go, go);
        }, REST);
      }
    });
    player.volume = G.life.volRecite ?? 1;
    player.play();
    tick = setInterval(() => {
      const p = player;
      if (!p || me !== run || !p.playing) return;   // resting between two readings
      const ms = (p.currentTime || 0) * 1000;
      let cur = -1;
      c.t.forEach((x, i) => { if (x && x[0] <= ms + 40) cur = i; });
      light(idx, cur);
    }, 50);
  } catch (e) {}
}

export function recite(d, idx = G.current) {
  stopRecite();
  if (!d || !reciteOn() || picking() || isLearn()) return;
  const me = run;
  const c = CLIPS[d.id] || VOICE[d.id];
  if (c) playClip(idx, c, me);
}

// Read the card you land on, after a short pause so a quick run of swipes doesn't start each one.
on("cardIdx", idx => {
  stopRecite();
  if (!reciteOn()) return;
  const me = run;
  timer = setTimeout(() => {
    if (me !== run || G.current !== idx) return;
    const el = G.cards[idx];
    recite(el && BY_ID[el.id], idx);
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
