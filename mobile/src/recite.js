// Hearing the card read aloud (Zine, 2026-10-30). Cards from the Qur'an play a real recitation of the verse
// (Mishary Alafasy, streamed from everyayah.com, one file per verse); the dhikr, duas and hadith are read by the
// phone's Arabic voice. A verse plays whole, even when the card shows only part of it. On by default, with a
// switch in the settings.
import * as Speech from "expo-speech";
import { createAudioPlayer } from "expo-audio";
import { G, on, isLearn, picking } from "./game";
import { BY_ID, T } from "./web-data";

const VERSE_URL = (s, a) => `https://everyayah.com/data/Alafasy_128kbps/${String(s).padStart(3, "0")}${String(a).padStart(3, "0")}.mp3`;

// "Ta-Ha 20:25-26" -> the two verse files, in order.
function verses(d) {
  const m = /(\d+):(\d+)(?:-(\d+))?/.exec(d.src || "");
  if (!m) return null;
  const s = +m[1], from = +m[2], to = +(m[3] || m[2]);
  const out = [];
  for (let a = from; a <= to && a < from + 10; a++) out.push(VERSE_URL(s, a));
  return out;
}

let player = null, sub = null, timer = null, run = 0;

// The reciting volume slider changes a verse that is already playing too.
export function setReciteVolume(v) { if (player) try { player.volume = v; } catch (e) {} }

export function stopRecite() {
  run++;
  clearTimeout(timer);
  Speech.stop().catch(() => {});
  if (sub) { try { sub.remove(); } catch (e) {} sub = null; }
  if (player) { try { player.pause(); player.remove(); } catch (e) {} player = null; }
}

const reciteOn = () => G.life.recite !== false;

function playUrls(urls, me) {
  if (me !== run || !urls.length) return;
  try {
    player = createAudioPlayer({ uri: urls[0] });
    sub = player.addListener("playbackStatusUpdate", st => {
      if (st.didJustFinish && me === run) {
        try { sub.remove(); player.remove(); } catch (e) {}
        sub = null; player = null;
        playUrls(urls.slice(1), me);
      }
    });
    player.volume = G.life.volRecite ?? 1;
    player.play();
  } catch (e) {}
}

export function recite(d) {
  stopRecite();
  if (!d || !reciteOn() || picking() || isLearn()) return;
  const me = run;
  const urls = verses(d);
  if (urls) playUrls(urls, me);
  else Speech.speak(d.ar, { language: "ar-SA", rate: 0.85, volume: G.life.volRecite ?? 1 });
}

// Read the card you land on, after a short pause so a quick run of swipes doesn't start each one.
on("cardIdx", idx => {
  stopRecite();
  if (!reciteOn()) return;
  const me = run;
  timer = setTimeout(() => {
    if (me !== run || G.current !== idx) return;
    const el = G.cards[idx];
    recite(el && BY_ID[el.id]);
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
