// Sounds and haptics. The sounds are the web app's tones rendered to files by scripts/make-sounds.js.
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import * as Haptics from "expo-haptics";

const FILES = {
  // The scroll sounds. They no longer climb in pitch (Zine, 2026-10-28), so only step 0 is used.
  dial0: require("../assets/sounds/dial0.wav"),
  chime0: require("../assets/sounds/chime0.wav"),
  glass0: require("../assets/sounds/glass0.wav"),
  bubble0: require("../assets/sounds/bubble0.wav"),   // Mixkit "Liquid bubble" (Mixkit free licence), sent by Zine
  seen: require("../assets/sounds/seen.wav"), up: require("../assets/sounds/up.wav"),
  golden: require("../assets/sounds/golden.wav"), party: require("../assets/sounds/party.wav"),
  evolve: require("../assets/sounds/evolve.wav"),
  charge: require("../assets/sounds/charge.wav"), boom: require("../assets/sounds/boom.wav"),
};

let settings = { sound: true, haptics: true, scrollSound: "dial" };
let ambWant = null;
export const setFxSettings = s => { settings = { ...settings, ...s }; ambient(ambWant); };

// Weather ambience (scripts/make-ambient.js): one looping player per weather, faded in and out as the
// cards go by. Quiet on purpose.
const AMB = {
  rain: require("../assets/sounds/amb-rain.wav"),   // rain, birds, storm (Mixkit) and wind, embers (Pixabay, SoundReality): recordings Zine sent
  storm: require("../assets/sounds/amb-storm.wav"), snow: require("../assets/sounds/amb-snow.wav"),
  wind: require("../assets/sounds/amb-wind.wav"), embers: require("../assets/sounds/amb-embers.wav"),
  fireflies: require("../assets/sounds/amb-fireflies.wav"), birds: require("../assets/sounds/amb-birds.wav"),
  butterflies: require("../assets/sounds/amb-butterflies.wav"),
};
const AMB_VOL = { storm: 0.6, rain: 0.55, snow: 0.07, wind: 0.18, embers: 0.9, fireflies: 0.45, birds: 0.6, butterflies: 0.3 };
const amb = {}, fades = {};
let ambNow = null;
function fadeTo(k, to, ms, done) {
  const p = amb[k];
  if (!p) return;
  clearInterval(fades[k]);
  const from = p.volume || 0, steps = Math.max(1, Math.round(ms / 50));
  let n = 0;
  fades[k] = setInterval(() => {
    n++;
    try { p.volume = from + (to - from) * (n / steps); } catch (e) {}
    if (n >= steps) { clearInterval(fades[k]); if (done) try { done(p); } catch (e) {} }
  }, 50);
}
export function ambient(kind) {
  ambWant = kind;
  // Only the "Weather sounds" switch controls these; "Sounds" is for the scroll sound (Zine, 2026-10-28).
  const k = settings.weatherSound !== false && AMB[kind] ? kind : null;
  if (k === ambNow) return;
  if (ambNow) fadeTo(ambNow, 0, 900, p => p.pause());
  ambNow = k;
  if (!k) return;
  try {
    if (!amb[k]) { amb[k] = createAudioPlayer(AMB[k]); amb[k].loop = true; amb[k].volume = 0; }
    amb[k].play();
    fadeTo(k, AMB_VOL[k], 1400);
  } catch (e) {}
}
// iOS stops the players in the background; this starts the current one again on return.
export function resumeAmbient() {
  if (ambNow && amb[ambNow]) try { amb[ambNow].play(); } catch (e) {}
}

// Two players per sound, used in turn, so a quick run of cards never cuts off or blocks the next click.
const POOL = 2;
const players = {};
const turn = {};
let ready = false;
export function initSounds() {
  if (ready) return;
  ready = true;
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: "mixWithOthers" }).catch(() => {});
  ["dial0", "chime0", "seen", "up", "party"].forEach(poolFor);
}
// Players are made the first time a sound is needed, so the 55 sounds don't all load at start.
function poolFor(name) {
  if (!players[name] && FILES[name]) {
    players[name] = [];
    turn[name] = 0;
    for (let i = 0; i < POOL; i++) {
      try { players[name].push(createAudioPlayer(FILES[name])); } catch (e) {}
    }
  }
  return players[name];
}

function play(name) {
  if (!settings.sound) return;
  const pool = poolFor(name);
  if (!pool || !pool.length) return;
  const p = pool[turn[name]++ % pool.length];
  try {
    const go = () => { try { p.play(); } catch (e) {} };
    Promise.resolve(p.seekTo(0)).then(go, go);
  } catch (e) {}
}

const h = fn => { if (settings.haptics) fn().catch(() => {}); };
const later = (ms, fn) => setTimeout(() => h(fn), ms);
const light = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
const medium = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
const success = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// One sound per card, always at the same pitch.
export const SCROLL_SOUNDS = ["dial", "chime", "glass", "bubble"];
export const scrollSound = () => {
  h(Haptics.selectionAsync);
  play((SCROLL_SOUNDS.includes(settings.scrollSound) ? settings.scrollSound : "dial") + "0");
};
export const hapTick = () => h(Haptics.selectionAsync);
export const buzz = () => h(light);
export const hapOk = () => h(success);

export const fx = {
  seen: () => { play("seen"); h(Haptics.selectionAsync); },
  tap: () => { play("chime0"); h(light); },
  up: () => { play("up"); h(medium); later(110, light); },
  golden: () => { play("golden"); h(success); later(160, medium); },
  party: () => { play("party"); h(success); },
  evolve: () => { play("evolve"); h(success); later(180, medium); later(380, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)); },
};

// The rock bursting at zero (Rock.js): three strikes with knocks, a charge, the break, then the fanfare.
export function freedFx() {
  const timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  poolFor("boom"); poolFor("evolve");
  at(250, () => play("charge"));
  [500, 1000].forEach(ms => at(ms, () => h(medium)));
  for (let i = 0; i < 10; i++) at(1150 + i * 30, () => h(light));
  at(1530, () => { play("boom"); h(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)); });
  at(1610, () => h(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)));
  at(1850, () => play("evolve"));
  at(2300, () => h(success));
  return () => timers.forEach(clearTimeout);
}

// The transformation cinematic: a charge-up with haptic ticks that speed up and grow stronger,
// a heavy hit on the flash, then the reveal fanfare. Returns a function that stops it.
export function cinematicFx() {
  const timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  poolFor("boom"); poolFor("evolve");
  at(450, () => play("charge"));
  for (let i = 0; i < 16; i++) {
    const ms = 500 + 1500 * Math.pow(i / 16, .6);
    at(ms, () => h(i < 9 ? light : medium));
  }
  at(2060, () => { play("boom"); h(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)); });
  at(2140, () => h(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)));
  at(2300, () => play("evolve"));
  at(3100, () => h(success));
  return () => timers.forEach(clearTimeout);
}
