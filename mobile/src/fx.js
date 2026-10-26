// Sounds and haptics. The sounds are the web app's tones rendered to files by scripts/make-sounds.js.
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import * as Haptics from "expo-haptics";

const FILES = {
  // The scroll sounds, one per combo step from 0 to 24.
  dial0: require("../assets/sounds/dial0.wav"),
  dial1: require("../assets/sounds/dial1.wav"),
  dial2: require("../assets/sounds/dial2.wav"),
  dial3: require("../assets/sounds/dial3.wav"),
  dial4: require("../assets/sounds/dial4.wav"),
  dial5: require("../assets/sounds/dial5.wav"),
  dial6: require("../assets/sounds/dial6.wav"),
  dial7: require("../assets/sounds/dial7.wav"),
  dial8: require("../assets/sounds/dial8.wav"),
  dial9: require("../assets/sounds/dial9.wav"),
  dial10: require("../assets/sounds/dial10.wav"),
  dial11: require("../assets/sounds/dial11.wav"),
  dial12: require("../assets/sounds/dial12.wav"),
  dial13: require("../assets/sounds/dial13.wav"),
  dial14: require("../assets/sounds/dial14.wav"),
  dial15: require("../assets/sounds/dial15.wav"),
  dial16: require("../assets/sounds/dial16.wav"),
  dial17: require("../assets/sounds/dial17.wav"),
  dial18: require("../assets/sounds/dial18.wav"),
  dial19: require("../assets/sounds/dial19.wav"),
  dial20: require("../assets/sounds/dial20.wav"),
  dial21: require("../assets/sounds/dial21.wav"),
  dial22: require("../assets/sounds/dial22.wav"),
  dial23: require("../assets/sounds/dial23.wav"),
  dial24: require("../assets/sounds/dial24.wav"),
  chime0: require("../assets/sounds/chime0.wav"),
  chime1: require("../assets/sounds/chime1.wav"),
  chime2: require("../assets/sounds/chime2.wav"),
  chime3: require("../assets/sounds/chime3.wav"),
  chime4: require("../assets/sounds/chime4.wav"),
  chime5: require("../assets/sounds/chime5.wav"),
  chime6: require("../assets/sounds/chime6.wav"),
  chime7: require("../assets/sounds/chime7.wav"),
  chime8: require("../assets/sounds/chime8.wav"),
  chime9: require("../assets/sounds/chime9.wav"),
  chime10: require("../assets/sounds/chime10.wav"),
  chime11: require("../assets/sounds/chime11.wav"),
  chime12: require("../assets/sounds/chime12.wav"),
  chime13: require("../assets/sounds/chime13.wav"),
  chime14: require("../assets/sounds/chime14.wav"),
  chime15: require("../assets/sounds/chime15.wav"),
  chime16: require("../assets/sounds/chime16.wav"),
  chime17: require("../assets/sounds/chime17.wav"),
  chime18: require("../assets/sounds/chime18.wav"),
  chime19: require("../assets/sounds/chime19.wav"),
  chime20: require("../assets/sounds/chime20.wav"),
  chime21: require("../assets/sounds/chime21.wav"),
  chime22: require("../assets/sounds/chime22.wav"),
  chime23: require("../assets/sounds/chime23.wav"),
  chime24: require("../assets/sounds/chime24.wav"),
  glass0: require("../assets/sounds/glass0.wav"),
  glass1: require("../assets/sounds/glass1.wav"),
  glass2: require("../assets/sounds/glass2.wav"),
  glass3: require("../assets/sounds/glass3.wav"),
  glass4: require("../assets/sounds/glass4.wav"),
  glass5: require("../assets/sounds/glass5.wav"),
  glass6: require("../assets/sounds/glass6.wav"),
  glass7: require("../assets/sounds/glass7.wav"),
  glass8: require("../assets/sounds/glass8.wav"),
  glass9: require("../assets/sounds/glass9.wav"),
  glass10: require("../assets/sounds/glass10.wav"),
  glass11: require("../assets/sounds/glass11.wav"),
  glass12: require("../assets/sounds/glass12.wav"),
  glass13: require("../assets/sounds/glass13.wav"),
  glass14: require("../assets/sounds/glass14.wav"),
  glass15: require("../assets/sounds/glass15.wav"),
  glass16: require("../assets/sounds/glass16.wav"),
  glass17: require("../assets/sounds/glass17.wav"),
  glass18: require("../assets/sounds/glass18.wav"),
  glass19: require("../assets/sounds/glass19.wav"),
  glass20: require("../assets/sounds/glass20.wav"),
  glass21: require("../assets/sounds/glass21.wav"),
  glass22: require("../assets/sounds/glass22.wav"),
  glass23: require("../assets/sounds/glass23.wav"),
  glass24: require("../assets/sounds/glass24.wav"),
  seen: require("../assets/sounds/seen.wav"), up: require("../assets/sounds/up.wav"),
  golden: require("../assets/sounds/golden.wav"), party: require("../assets/sounds/party.wav"),
  evolve: require("../assets/sounds/evolve.wav"),
  charge: require("../assets/sounds/charge.wav"), boom: require("../assets/sounds/boom.wav"),
};

let settings = { sound: true, haptics: true, scrollSound: "dial" };
export const setFxSettings = s => { settings = { ...settings, ...s }; };

// Two players per sound, used in turn, so a quick run of cards never cuts off or blocks the next click.
const POOL = 2;
const players = {};
const turn = {};
let ready = false;
export function initSounds() {
  if (ready) return;
  ready = true;
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: "mixWithOthers" }).catch(() => {});
  ["dial0", "dial1", "chime0", "seen", "up", "party"].forEach(poolFor);
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

// The click climbs in pitch as the combo builds.
const step = c => Math.max(0, Math.min(24, c | 0));
export const scrollSound = c => {
  h(Haptics.selectionAsync);
  const kind = ["chime", "glass"].includes(settings.scrollSound) ? settings.scrollSound : "dial";
  play(kind + step(c));
  poolFor(kind + step(c + 1));   // load the next pitch up before it is needed
};
export const hapTick = () => h(Haptics.selectionAsync);
export const buzz = () => h(light);
export const hapOk = () => h(success);

export const fx = {
  seen: () => { play("seen"); h(Haptics.selectionAsync); },
  tap: c => { play("chime" + step(c)); h(light); },
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
