// Renders the quiet looping ambience for each weather (assets/sounds/amb-*.wav). Everything is synthesized,
// so there are no licences to track. Each file loops seamlessly: steady noise is cross-faded end into start,
// and short events (drops, crackles, chirps, chimes) wrap around the loop point.
// Rain, birds and storm are Mixkit recordings Zine sent (2026-10-28), looped by hand, not made here.
// Run: node scripts/make-ambient.js
const fs = require("fs");
const path = require("path");
const RATE = 16000, LEN = 12, N = RATE * LEN, FADE = RATE;
const out = path.join(__dirname, "..", "assets", "sounds");
const rnd = (a, b) => a + Math.random() * (b - a);

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

// Wind: a breeze that swells and falls.
wav("wind", breeze(180, 900, 2), 0.6);
// Snow: a very soft, dark breeze with an occasional faint tinkle.
{
  const air = breeze(120, 420, 1);
  const tink = new Float32Array(N);
  for (let k = 0; k < 7; k++) {
    const hz = rnd(2400, 4200);
    event(tink, Math.floor(rnd(0, N)), Math.floor(0.6 * RATE), t => (sine(t, hz) + 0.4 * sine(t, hz * 2.7)) * Math.exp(-t / 0.12));
  }
  wav("snow", mix([air, 1], [tink, 0.05]), 0.45);
}
// Embers: crackles and pops over a warm low rumble.
{
  const f = lp(), g = lp();
  const rumble = bed((i, w) => g(f(w, 220), 300));
  const crack = new Float32Array(N);
  for (let k = 0; k < LEN * 7; k++) {
    const a = Math.pow(Math.random(), 2), d = rnd(0.001, 0.006), l = lp();
    event(crack, Math.floor(rnd(0, N)), Math.floor(0.04 * RATE), t => l(Math.random() * 2 - 1, 3500) * a * Math.exp(-t / d));
  }
  wav("embers", mix([rumble, 1], [crack, 3.2]), 0.5);
}
// Fireflies: night air with two crickets far away.
{
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
// Butterflies: a meadow breeze with gentle wind chimes.
{
  const air = breeze(180, 520, 1);
  const chimes = new Float32Array(N);
  const SCALE = [1046.5, 1174.7, 1318.5, 1568, 1760, 2093];
  for (let t0 = rnd(0, 1); t0 < LEN; t0 += rnd(0.9, 2.4)) {
    const hz = SCALE[Math.floor(rnd(0, SCALE.length))], a = rnd(0.5, 1);
    event(chimes, Math.floor(t0 * RATE), Math.floor(2.4 * RATE), t => a * Math.min(1, t / 0.004) * Math.exp(-t / 0.7) * (sine(t, hz) + 0.3 * sine(t, hz * 2.76) + 0.12 * sine(t, hz * 5.4)));
  }
  wav("butterflies", mix([air, 1], [chimes, 0.07]), 0.45);
}
