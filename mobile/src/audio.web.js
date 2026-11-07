// Web version of the few expo-audio calls the app makes (fx.js, recite.js).
// iPhone Safari only lets a page make sound after a tap, and plain <audio> elements each need their own
// tap. One Web Audio context, woken by the first tap, can then play every sound at any moment, also
// while scrolling. Files are fetched and decoded once and shared by every player.
import { Asset } from "expo-asset";

let ctx = null;
function audio() {
  if (!ctx) {
    const AC = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }
  }
  return ctx;
}

// Wake the context on the first touches (Safari keeps it suspended until then).
if (typeof window !== "undefined") {
  const wake = () => {
    const c = audio();
    if (!c) return;
    if (c.state !== "running") {
      c.resume().catch(() => {});
      // An empty buffer started inside the tap unlocks older iOS versions.
      try { const s = c.createBufferSource(); s.buffer = c.createBuffer(1, 1, 22050); s.connect(c.destination); s.start(0); } catch (e) {}
    }
  };
  ["pointerdown", "touchend", "keydown", "click"].forEach(ev => window.addEventListener(ev, wake, { capture: true, passive: true }));
  // Back from the background: Safari may have suspended it.
  document.addEventListener("visibilitychange", () => { if (!document.hidden && ctx && ctx.state !== "running") ctx.resume().catch(() => {}); });
}

const buffers = new Map();
function uriOf(src) {
  if (typeof src === "string") return src;
  if (src && typeof src === "object" && src.uri) return src.uri;
  try { return Asset.fromModule(src).uri; } catch (e) { return null; }
}
function load(src) {
  const uri = uriOf(src);
  if (!uri) return Promise.reject(new Error("no file"));
  if (!buffers.has(uri)) {
    const p = fetch(uri)
      .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.arrayBuffer(); })
      .then(b => new Promise((res, rej) => {
        const c = audio();
        if (!c) return rej(new Error("no audio"));
        // Safari's older decodeAudioData only takes callbacks.
        const pr = c.decodeAudioData(b, res, rej);
        if (pr && pr.then) pr.then(res, rej);
      }));
    p.catch(() => buffers.delete(uri));
    buffers.set(uri, p);
  }
  return buffers.get(uri);
}

class WebPlayer {
  constructor(src) {
    this._src = src;
    this._buf = null;
    this._node = null;
    this._gain = null;
    this._vol = 1;
    this._loop = false;
    this._offset = 0;      // seconds into the file where the current run started
    this._startAt = 0;     // context time when it started
    this._want = false;    // play() was called and pause() was not
    this._listeners = new Set();
    this._timer = null;
    this._dead = false;
    load(src).then(b => { this._buf = b; if (this._want && !this._node) this._start(); }, () => {});
  }
  get volume() { return this._vol; }
  set volume(v) {
    this._vol = Math.max(0, Math.min(1, +v || 0));
    if (this._gain) try { this._gain.gain.value = this._vol; } catch (e) {}
  }
  get loop() { return this._loop; }
  set loop(v) { this._loop = !!v; if (this._node) this._node.loop = this._loop; }
  get playing() { return !!this._node; }
  get duration() { return this._buf ? this._buf.duration : 0; }
  get currentTime() {
    if (!this._node || !ctx) return this._offset;
    const t = this._offset + (ctx.currentTime - this._startAt);
    const d = this.duration;
    return this._loop && d ? t % d : Math.min(t, d || t);
  }
  _start() {
    const c = audio();
    if (!c || !this._buf || this._dead) return;
    if (c.state !== "running") c.resume().catch(() => {});
    const node = c.createBufferSource();
    node.buffer = this._buf;
    node.loop = this._loop;
    if (!this._gain) { this._gain = c.createGain(); this._gain.connect(c.destination); }
    this._gain.gain.value = this._vol;
    node.connect(this._gain);
    const off = Math.min(this._offset, Math.max(0, this._buf.duration - 0.001));
    this._startAt = c.currentTime;
    this._offset = off;
    node.onended = () => {
      if (this._node !== node) return;   // stopped on purpose or replaced
      this._node = null;
      this._want = false;
      this._offset = 0;
      this._emit({ didJustFinish: true, playing: false, currentTime: this.duration });
    };
    try { node.start(0, off); } catch (e) { return; }
    this._node = node;
  }
  _stopNode() {
    const n = this._node;
    this._node = null;
    if (n) { try { n.onended = null; n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} }
  }
  play() {
    if (this._dead) return;
    this._want = true;
    if (this._node) return;
    if (this._buf) this._start();
  }
  pause() {
    if (this._node) this._offset = this.currentTime;
    this._want = false;
    this._stopNode();
  }
  seekTo(sec) {
    const was = !!this._node;
    this._stopNode();
    this._offset = Math.max(0, +sec || 0);
    if (was) this._start();
    return Promise.resolve();
  }
  _emit(st) { this._listeners.forEach(fn => { try { fn(st); } catch (e) {} }); }
  addListener(name, fn) {
    if (name !== "playbackStatusUpdate") return { remove() {} };
    this._listeners.add(fn);
    return { remove: () => this._listeners.delete(fn) };
  }
  remove() {
    this._dead = true;
    this._want = false;
    this._stopNode();
    this._listeners.clear();
    if (this._gain) try { this._gain.disconnect(); } catch (e) {}
  }
  release() { this.remove(); }
}

export const createAudioPlayer = src => new WebPlayer(src);
export const setAudioModeAsync = async () => {};
