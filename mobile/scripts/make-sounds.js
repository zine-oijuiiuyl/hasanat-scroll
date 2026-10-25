// Renders the web app's Web Audio effects into small WAV files (assets/sounds), since the native app
// plays sound files instead of synthesizing them. Run: node scripts/make-sounds.js
const fs = require("fs");
const path = require("path");
const RATE = 22050;
const out = path.join(__dirname, "..", "assets", "sounds");

function render(len, fn) {
  const n = Math.round(len * RATE), buf = new Float32Array(n);
  fn(buf);
  return buf;
}
// Matches tone(): 10ms attack, exponential decay to silence over dur.
function tone(buf, freq, dur, type, vol, delay) {
  const s = Math.round(delay * RATE), e = Math.min(buf.length, s + Math.round((dur + .02) * RATE));
  for (let i = s; i < e; i++) {
    const t = (i - s) / RATE, ph = (t * freq) % 1;
    const w = type === "triangle" ? 1 - 4 * Math.abs(ph - .5) : Math.sin(2 * Math.PI * ph);
    const g = t < .01 ? vol * t / .01 : vol * Math.pow(.0001 / vol, Math.min(1, (t - .01) / (dur - .01)));
    buf[i] += w * g;
  }
}
// Matches ratchetClick(): band-passed noise burst plus a faint triangle ring.
function click(buf, at, freq, vol) {
  const s = Math.round(at * RATE), n = Math.round(.03 * RATE);
  const w0 = 2 * Math.PI * freq / RATE, Q = 6, alpha = Math.sin(w0) / (2 * Q);
  const b0 = alpha, b2 = -alpha, a0 = 1 + alpha, a1 = -2 * Math.cos(w0), a2 = 1 - alpha;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < Math.round(.035 * RATE) && s + i < buf.length; i++) {
    const x = i < n ? (Math.random() * 2 - 1) * Math.pow(1 - i / n, 4) : 0;
    const y = (b0 * x + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    buf[s + i] += y * vol * Math.pow(.0001 / vol, Math.min(1, i / n)) * 3;
  }
  tone(buf, freq * .62, .05, "triangle", vol * .18, at);
}
// A small glass being tapped: a few inharmonic partials that ring and fade quickly.
function glass(buf, freq, vol) {
  [[1, 1, .28], [2.76, .55, .16], [5.4, .3, .09], [8.93, .15, .05]].forEach(([m, a, d]) => {
    const f = freq * m, e = Math.min(buf.length, Math.round((d + .02) * RATE));
    for (let i = 0; i < e; i++) {
      const t = i / RATE;
      buf[i] += Math.sin(2 * Math.PI * f * t) * vol * a * Math.min(1, t / .002) * Math.exp(-t / (d * .3));
    }
  });
}
function wav(name, buf) {
  const data = Buffer.alloc(buf.length * 2);
  for (let i = 0; i < buf.length; i++) data.writeInt16LE(Math.max(-1, Math.min(1, buf[i])) * 32767 | 0, i * 2);
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVE", 8); h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(data.length, 40);
  fs.writeFileSync(path.join(out, name + ".wav"), Buffer.concat([h, data]));
}

// The scroll sounds climb in pitch with every combo step, like the web app (combo 0 to 24).
for (const f of fs.readdirSync(out)) if (/^(dial|chime|glass)\d+\.wav$/.test(f)) fs.unlinkSync(path.join(out, f));
for (let k = 0; k <= 24; k++) {
  const c = k, j = 1 + c * .035;
  wav("dial" + k, render(.12, b => { click(b, 0, 3400 * j, .5); click(b, .055, 2500 * j, .32); }));
  wav("glass" + k, render(.3, b => glass(b, 1568 * j, .3)));
  wav("chime" + k, render(.13, b => tone(b, 520 + c * 22, .09, "triangle", .1 * 2.5, 0)));
}
const seq = (fs_, dur, type, step) => render(dur + fs_.length * step + .05, b => fs_.forEach((f, i) => tone(b, f, dur, type, .25, i * step)));
wav("seen", render(.1, b => tone(b, 880, .08, "sine", .12, 0)));
wav("up", render(.3, b => { tone(b, 660, .1, "triangle", .3, 0); tone(b, 990, .16, "triangle", .3, .08); }));
wav("golden", seq([784, 988, 1175, 1568], .25, "sine", .07));
wav("party", seq([523, 659, 784, 1047], .3, "triangle", .08));
wav("evolve", seq([392, 523, 659, 784, 1047, 1319], .35, "sine", .09));
console.log("Wrote", fs.readdirSync(out).length, "sounds");
