// Renders the quiet looping ambience for each weather (assets/sounds/amb-*.wav). Everything is synthesized,
// so there are no licences to track. Each file loops seamlessly: steady noise is cross-faded end into start,
// and short events (drops, crackles, chirps, chimes) wrap around the loop point.
// Rain, birds and storm (Mixkit) and wind and embers (Pixabay, by SoundReality) are recordings Zine sent
// (2026-10-28), looped and levelled by hand, not made here.
// Run: node scripts/make-ambient.js [names...]   (no names renders all)
const fs = require("fs");
const path = require("path");
const RATE = 16000, LEN = 12, N = RATE * LEN, FADE = RATE;
const out = path.join(__dirname, "..", "assets", "sounds");
const rnd = (a, b) => a + Math.random() * (b - a);
const want = n => process.argv.length < 3 || process.argv.includes(n);

// Steady noise, n + FADE samples long, filtered by fn(sampleIndex, white) and cross-faded into a loop.
function bed(fn) {
  const a = new Float32Array(N + FADE);
  for (let i = 0; i < a.length; i++) a[i] = fn(i, Math.random() * 2 - 1);
  const b = new Float32Array(N);
  for (let i = 0; i < N; i++) b[i] = i < FADE ? a[i] * Math.sqrt(i / FADE) + a[N + i] * Math.sqrt(1 - i / FADE) : a[i];
  return b;
}
const lp = () => { let y = 0; return (x, hz) => (y += (1 - Math.exp(-2 * Math.PI * hz / RATE)) * (x - y)); };
const hp = () => { const l = lp(); return (x, hz) => x - l(x, hz); };
// A slow swell whose period divides the loop, so it lines up at the seam.
const swell = (i, cycles, depth, phase = 0) => 1 - depth / 2 + (depth / 2) * Math.sin(2 * Math.PI * (cycles * i / N + phase));

// Adds a short event at a sample position, wrapping round the end of the loop.
function event(buf, at, len, fn) {
  for (let k = 0; k < len; k++) buf[(at + k) % N] += fn(k / RATE, k);
}
function mix(...parts) {
  const b = new Float32Array(N);
  for (const [p, g] of parts) for (let i = 0; i < N; i++) b[i] += p[i] * g;
  return b;
}
function wav(name, buf, peak) {
  let m = 0;
  for (const x of buf) m = Math.max(m, Math.abs(x));
  const data = Buffer.alloc(N * 2);
  for (let i = 0; i < N; i++) data.writeInt16LE(Math.round((buf[i] / m) * peak * 32767), i * 2);
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVE", 8); h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(data.length, 40);
  fs.writeFileSync(path.join(out, "amb-" + name + ".wav"), Buffer.concat([h, data]));
}

// Breeze: low noise whose brightness and level drift slowly.
function breeze(lo, hi, cycles) {
  const f = lp(), g = lp(), h = hp();
  return bed((i, w) => {
    const c = lo + (hi - lo) * (0.5 + 0.5 * Math.sin(2 * Math.PI * cycles * i / N));
    return h(g(f(w, c), c * 1.4), 60) * swell(i, cycles, 0.6);
  });
}
const sine = (t, hz) => Math.sin(2 * Math.PI * hz * t);

// Snow: a very soft, dark breeze with an occasional faint tinkle.
if (want("snow")) {
  const air = breeze(120, 420, 1);
  const tink = new Float32Array(N);
  for (let k = 0; k < 7; k++) {
    const hz = rnd(2400, 4200);
    event(tink, Math.floor(rnd(0, N)), Math.floor(0.6 * RATE), t => (sine(t, hz) + 0.4 * sine(t, hz * 2.7)) * Math.exp(-t / 0.12));
  }
  wav("snow", mix([air, 1], [tink, 0.05]), 0.45);
}
// Fireflies: night air with two crickets far away.
if (want("fireflies")) {
  const air = breeze(150, 380, 1);
  const crick = new Float32Array(N);
  [[4650, 0.52, 1], [4280, 0.67, 0.7]].forEach(([hz, every, a]) => {
    for (let t0 = rnd(0, every); t0 < LEN; t0 += every * rnd(0.92, 1.08)) {
      for (let p = 0; p < 3; p++) {
        event(crick, Math.floor((t0 + p * 0.032) * RATE), Math.floor(0.018 * RATE), t => sine(t, hz) * a * Math.sin(Math.PI * t / 0.018));
      }
    }
  });
  wav("fireflies", mix([air, 1], [crick, 0.06]), 0.45);
}
// Butterflies: a meadow breeze with soft, low wind chimes. The first version's chimes were too high and loud
// (Zine, 2026-10-28), so they are an octave lower, rounder and much quieter.
if (want("butterflies")) {
  const air = breeze(180, 520, 1);
  const chimes = new Float32Array(N);
  const SCALE = [523.25, 587.33, 659.25, 783.99, 880];
  for (let t0 = rnd(0, 1); t0 < LEN; t0 += rnd(0.9, 2.4)) {
    const hz = SCALE[Math.floor(rnd(0, SCALE.length))], a = rnd(0.5, 1);
    event(chimes, Math.floor(t0 * RATE), Math.floor(2.4 * RATE), t => a * Math.min(1, t / 0.02) * Math.exp(-t / 0.7) * (sine(t, hz) + 0.15 * sine(t, hz * 2)));
  }
  wav("butterflies", mix([air, 1], [chimes, 0.025]), 0.45);
}
