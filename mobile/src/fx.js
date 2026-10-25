// Sounds and haptics. The sounds are the web app's tones rendered to files by scripts/make-sounds.js.
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import * as Haptics from "expo-haptics";

const FILES = {
  dial0: require("../assets/sounds/dial0.wav"), dial1: require("../assets/sounds/dial1.wav"),
  dial2: require("../assets/sounds/dial2.wav"), dial3: require("../assets/sounds/dial3.wav"),
  dial4: require("../assets/sounds/dial4.wav"),
  chime0: require("../assets/sounds/chime0.wav"), chime1: require("../assets/sounds/chime1.wav"),
  chime2: require("../assets/sounds/chime2.wav"), chime3: require("../assets/sounds/chime3.wav"),
  chime4: require("../assets/sounds/chime4.wav"),
  seen: require("../assets/sounds/seen.wav"), up: require("../assets/sounds/up.wav"),
  golden: require("../assets/sounds/golden.wav"), party: require("../assets/sounds/party.wav"),
  evolve: require("../assets/sounds/evolve.wav"),
};

let settings = { sound: true, haptics: true, scrollSound: "dial" };
export const setFxSettings = s => { settings = { ...settings, ...s }; };

const players = {};
let ready = false;
export function initSounds() {
  if (ready) return;
  ready = true;
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: "mixWithOthers" }).catch(() => {});
  for (const [k, src] of Object.entries(FILES)) {
    try { players[k] = createAudioPlayer(src); } catch (e) {}
  }
}

function play(name) {
  if (!settings.sound) return;
  const p = players[name];
  if (!p) return;
  try { p.seekTo(0); p.play(); } catch (e) {}
}

const h = fn => { if (settings.haptics) fn().catch(() => {}); };
const later = (ms, fn) => setTimeout(() => h(fn), ms);
const light = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
const medium = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
const success = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// The click climbs in pitch as the combo builds.
const step = c => Math.min(4, Math.floor(Math.min(c, 24) / 6));
export const scrollSound = c => {
  h(Haptics.selectionAsync);
  if (settings.scrollSound === "off") return;
  play((settings.scrollSound === "chime" ? "chime" : "dial") + step(c));
};
export const hapTick = () => h(Haptics.selectionAsync);
export const buzz = () => h(light);

export const fx = {
  seen: () => { play("seen"); h(Haptics.selectionAsync); },
  tap: c => { play("chime" + step(c)); h(light); },
  up: () => { play("up"); h(medium); later(110, light); },
  golden: () => { play("golden"); h(success); later(160, medium); },
  party: () => { play("party"); h(success); },
  evolve: () => { play("evolve"); h(success); later(180, medium); later(380, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)); },
};
