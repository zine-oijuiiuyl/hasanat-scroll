// "Lighten the load" as a picture: the buddy swings a pickaxe at a rock that stands for the number set.
// Every scrolled card is a strike, cracks of light spread as the number falls, and at zero the rock
// bursts apart and the buddy is free.
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, G as SvgG, Line, LinearGradient as SvgLinear, Path, Polygon, RadialGradient, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { G, on, dismissFreed, stageNow } from "./game";
import { BuddyArt } from "./Buddy";
import { t, num } from "./i18n";
import { freedFx } from "./fx";
import { Btn } from "./ui";
import { C, F, GOLD } from "./theme";

const N = o => ({ useNativeDriver: true, ...o });
const to = (v, toValue, duration, easing) => Animated.timing(v, N({ toValue, duration, easing }));
const rand = (a, b) => a + Math.random() * (b - a);

// ---------- The rock (drawn in a 100 × 100 box) ----------
const OUT = [[18, 80], [9, 60], [14, 40], [28, 23], [48, 13], [69, 16], [86, 30], [93, 52], [88, 73], [72, 87], [47, 92], [27, 90]];
const MID = [50, 54];
const OUTLINE = "M" + OUT.map(p => p.join(" ")).join(" L") + " Z";
// Facets that catch the light, for a chiselled look.
const FACETS = [
  ["28 23", "48 13", "52 34", "34 40"],
  ["48 13", "69 16", "64 36", "52 34"],
  ["14 40", "28 23", "34 40", "22 56"],
];
// Cracks, in the order they open as the number falls.
const CRACKS = [
  "M48 13 L46 27 L53 37", "M53 37 L45 49 L49 61", "M53 37 L66 44 L79 41", "M49 61 L37 69 L28 89",
  "M49 61 L61 74 L72 87", "M14 40 L29 46 L45 49", "M86 30 L75 37 L66 44", "M28 23 L35 34 L46 27",
  "M79 41 L92 51", "M37 69 L18 79", "M61 74 L87 72", "M45 49 L33 57 L22 57",
];

export const SinRock = memo(function SinRock({ p = 0, size = 100, glow = 0 }) {
  const open = Math.min(CRACKS.length, Math.floor(p * (CRACKS.length + 1)));
  const light = Math.min(1, glow + p * 0.6);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <SvgLinear id="rk" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#6b6178" />
          <Stop offset="0.55" stopColor="#3f374c" />
          <Stop offset="1" stopColor="#231e2d" />
        </SvgLinear>
        <RadialGradient id="core" cx="50%" cy="54%" r="45%">
          <Stop offset="0" stopColor="#ffe9a8" stopOpacity={0.85 * light} />
          <Stop offset="1" stopColor="#ffe9a8" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Path d="M14 92 Q50 99 90 91" stroke="rgba(0,0,0,0.35)" strokeWidth={6} strokeLinecap="round" fill="none" />
      <Path d={OUTLINE} fill="url(#rk)" stroke="#1a1622" strokeWidth={2.5} strokeLinejoin="round" />
      {FACETS.map((f, i) => <Polygon key={i} points={f.join(" ")} fill="#fff" opacity={0.07 + i * 0.03} />)}
      <Path d={OUTLINE} fill="url(#core)" />
      {CRACKS.slice(0, open).map((d, i) => (
        <SvgG key={i}>
          <Path d={d} stroke="#ffd36b" strokeOpacity={0.35 + 0.4 * light} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Path d={d} stroke="#fff6d6" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </SvgG>
      ))}
    </Svg>
  );
});

// One wedge of the rock, from its middle to two neighbouring edge points; together they make the whole rock.
function Shard({ i, size }) {
  const a = OUT[i], b = OUT[(i + 1) % OUT.length];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Polygon points={`${MID.join(" ")} ${a.join(" ")} ${b.join(" ")}`} fill={i % 3 ? "#4a4258" : "#5d536c"} stroke="#1a1622" strokeWidth={1.5} strokeLinejoin="round" />
      <Line x1={MID[0]} y1={MID[1]} x2={a[0]} y2={a[1]} stroke="#ffd36b" strokeWidth={1.5} />
    </Svg>
  );
}

// ---------- The pickaxe, swung from the buddy's hand ----------
// Drawn in a square twice the handle's length, with the hand at the centre, so turning the square swings it.
function Pickaxe({ len }) {
  const L = len;
  return (
    <Svg width={L * 2} height={L * 2}>
      <Line x1={L} y1={L + L * 0.12} x2={L} y2={L * 0.12} stroke="#8a5a2b" strokeWidth={L * 0.11} strokeLinecap="round" />
      <Line x1={L} y1={L + L * 0.12} x2={L} y2={L * 0.12} stroke="#b77c43" strokeWidth={L * 0.05} strokeLinecap="round" />
      <Path d={`M${L - L * 0.62} ${L * 0.34} Q${L} ${-L * 0.06} ${L + L * 0.62} ${L * 0.34} L${L + L * 0.5} ${L * 0.2} Q${L} ${L * 0.02} ${L - L * 0.5} ${L * 0.2} Z`}
        fill="#c9d1d9" stroke="#59626b" strokeWidth={L * 0.04} strokeLinejoin="round" />
    </Svg>
  );
}

// Grey chips thrown off the rock by a strike.
function Chips({ hit, size }) {
  const parts = useMemo(() => Array.from({ length: 7 }, () => ({ x: rand(-0.1, 0.55) * size, y: rand(-0.75, -0.2) * size, r: rand(-260, 260), s: rand(0.05, 0.1) * size })), [size]);
  return parts.map((c, i) => (
    <Animated.View key={i} style={{
      position: "absolute", width: c.s, height: c.s, backgroundColor: i % 3 ? "#5d536c" : "#ffd36b", borderRadius: 1.5,
      opacity: hit.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] }),
      transform: [
        { translateX: hit.interpolate({ inputRange: [0, 1], outputRange: [0, c.x] }) },
        { translateY: hit.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, c.y, c.y * 0.4] }) },
        { rotate: hit.interpolate({ inputRange: [0, 1], outputRange: ["0deg", c.r + "deg"] }) },
      ],
    }} />
  ));
}

// A short number for the face of the rock: 1,250 → 1.2K.
const short = n => n >= 1e9 ? (n / 1e9).toFixed(n < 1e10 ? 1 : 0) + "B" : n >= 1e6 ? (n / 1e6).toFixed(n < 1e7 ? 1 : 0) + "M" : n >= 1e4 ? Math.round(n / 1e3) + "K" : num(n);

// The buddy, its pickaxe and the rock, with one strike played each time `strike` is called.
function useStrike() {
  const swing = useRef(new Animated.Value(0)).current;   // 0 raised, 1 on the rock
  const shake = useRef(new Animated.Value(0)).current;
  const hit = useRef(new Animated.Value(0)).current;
  const strike = useMemo(() => () => {
    swing.stopAnimation(); shake.stopAnimation(); hit.stopAnimation();
    Animated.sequence([
      to(swing, -0.25, 110, Easing.out(Easing.quad)),
      to(swing, 1, 110, Easing.in(Easing.quad)),
      Animated.parallel([
        Animated.sequence([to(shake, 1, 40), to(shake, -1, 60), to(shake, 0.5, 50), to(shake, 0, 50)]),
        Animated.sequence([to(hit, 0, 0), to(hit, 1, 520, Easing.out(Easing.quad))]),
        Animated.sequence([Animated.delay(60), to(swing, 0, 260, Easing.out(Easing.back(1.4)))]),
      ]),
    ]).start();
  }, [swing, shake, hit]);
  return { swing, shake, hit, strike };
}

// noBuddy: in the feed the corner buddy is already there, so only the pickaxe and the rock are drawn.
function Miner({ w, rockSize, p, left, gender, stage, strike: s, noBuddy }) {
  const bh = w * 110 / 128;
  const len = w * 0.36;
  // The hand sits right of the buddy's middle; the rock stands just beyond the swing.
  const hand = { x: w * 0.72, y: bh * 0.6 };
  return (
    <View style={{ width: w + rockSize * 0.92, height: Math.max(bh, rockSize) }}>
      <View style={{ position: "absolute", left: w * 0.86, bottom: 0, width: rockSize, height: rockSize }}>
        <Animated.View style={{ transform: [{ translateX: s.shake.interpolate({ inputRange: [-1, 1], outputRange: [-rockSize * 0.05, rockSize * 0.05] }) }] }}>
          <SinRock p={p} size={rockSize} />
          {left != null ? <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", paddingTop: rockSize * 0.08 }]}>
            <Text style={[st.count, { fontSize: Math.max(11, rockSize * 0.19) }]} numberOfLines={1} adjustsFontSizeToFit>{short(left)}</Text>
          </View> : null}
        </Animated.View>
        <View style={{ position: "absolute", left: rockSize * 0.1, top: rockSize * 0.45 }}><Chips hit={s.hit} size={rockSize} /></View>
      </View>
      {noBuddy ? null : <View style={{ position: "absolute", left: 0, bottom: 0 }}>
        <BuddyArt gender={gender} stage={stage} mood="happy" width={w} height={bh} />
      </View>}
      <Animated.View pointerEvents="none" style={{
        position: "absolute", left: hand.x - len, bottom: bh - hand.y - len, width: len * 2, height: len * 2,
        transform: [{ rotate: s.swing.interpolate({ inputRange: [-0.25, 0, 1], outputRange: ["-62deg", "-40deg", "68deg"] }) }],
      }}>
        <Pickaxe len={len} />
      </Animated.View>
    </View>
  );
}

const progress = d => d && d.start ? 1 - d.left / d.start : 0;

// In the feed, beside the corner buddy: one strike per scrolled card while a number is set.
export function FeedMiner() {
  const s = useStrike();
  const [, bump] = useState(0);
  useEffect(() => on("debtTick", () => { bump(x => x + 1); s.strike(); }), [s]);
  const d = G.life.debt;
  if (!d || d.done || !G.life.gender) return null;
  return <Miner w={128} rockSize={62} p={progress(d)} left={d.left} gender={G.life.gender} stage={stageNow()} strike={s} noBuddy />;
}

// In the "Lighten the load" sheet: the buddy keeps striking the rock for the number being set.
export function SheetMiner({ start, left }) {
  const s = useStrike();
  useEffect(() => {
    const id = setInterval(s.strike, 1400);
    const first = setTimeout(s.strike, 400);
    return () => { clearInterval(id); clearTimeout(first); };
  }, [s]);
  const p = start ? 1 - left / start : 0;
  return (
    <View style={{ alignItems: "center", paddingTop: 10 }}>
      <Miner w={150} rockSize={120} p={p} left={left || null} gender={G.life.gender || "m"} stage={stageNow()} strike={s} />
    </View>
  );
}

// ---------- The rock bursting at zero ----------
const T1 = { charge: 300, strike: 1500, burst: 1530, words: 2250, done: 3200 };

export default function RockFree() {
  const f = G.freed;
  if (!f) return null;
  return <Freed key={f.id} n={f.n} />;
}

function Freed({ n }) {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const R = Math.min(W * 0.5, 210);
  const cy = H * 0.36, rockX = W / 2 + R * 0.25;
  const v = useRef({
    bg: new Animated.Value(0), charge: new Animated.Value(0), shake: new Animated.Value(0), flash: new Animated.Value(0),
    gone: new Animated.Value(0), burst: new Animated.Value(0), ring: new Animated.Value(0), free: new Animated.Value(0),
    bob: new Animated.Value(0), words: new Animated.Value(0), done: new Animated.Value(0), swing: new Animated.Value(0),
  }).current;
  const [ready, setReady] = useState(false);
  const shards = useMemo(() => OUT.map((p, i) => {
    const b = OUT[(i + 1) % OUT.length];
    const cx = (MID[0] + p[0] + b[0]) / 3 - 50, cyy = (MID[1] + p[1] + b[1]) / 3 - 50;
    const a = Math.atan2(cyy, cx), d = rand(1.4, 2.4) * R;
    return { i, x: Math.cos(a) * d, y: Math.sin(a) * d - R * 0.4, fall: rand(0.9, 1.5) * R, r: rand(-300, 300) };
  }), [R]);

  useEffect(() => {
    const stopFx = freedFx();
    const shake = Animated.loop(Animated.sequence([to(v.shake, 1, 34), to(v.shake, -1, 68), to(v.shake, 0, 34)]));
    const bob = Animated.loop(Animated.sequence([to(v.bob, 1, 1100, Easing.inOut(Easing.sin)), to(v.bob, 0, 1100, Easing.inOut(Easing.sin))]));
    const at = (ms, a) => Animated.sequence([Animated.delay(ms), a]);
    // Three strikes while the rock charges with light; the last one, landing at T1.strike, breaks it.
    // One sequence, since two animations on the same value would stop each other (and the whole scene).
    const raise = () => to(v.swing, -0.25, 110, Easing.out(Easing.quad)), hit = () => to(v.swing, 1, 110, Easing.in(Easing.quad));
    const swings = Animated.sequence([
      Animated.delay(T1.strike - 220 - 2 * 500),
      raise(), hit(), to(v.swing, 0, 280, Easing.out(Easing.quad)),
      raise(), hit(), to(v.swing, 0, 280, Easing.out(Easing.quad)),
      raise(), hit(),
    ]);
    const main = Animated.parallel([
      to(v.bg, 1, 400, Easing.out(Easing.quad)),
      at(T1.charge, to(v.charge, 1, T1.strike - T1.charge, Easing.in(Easing.quad))),
      swings,
      at(T1.burst, Animated.parallel([
        Animated.sequence([to(v.flash, 1, 60), to(v.flash, 0, 600, Easing.out(Easing.quad))]),
        to(v.gone, 1, 1),
        to(v.burst, 1, 1400, Easing.out(Easing.cubic)),
        to(v.ring, 1, 900, Easing.out(Easing.cubic)),
        Animated.sequence([Animated.delay(350), Animated.spring(v.free, N({ toValue: 1, friction: 5, tension: 50 }))]),
      ])),
      at(T1.words, to(v.words, 1, 500, Easing.out(Easing.back(1.5)))),
      at(T1.done, to(v.done, 1, 400, Easing.out(Easing.quad))),
    ]);
    const timers = [
      setTimeout(() => shake.start(), T1.charge),
      setTimeout(() => { shake.stop(); v.shake.setValue(0); bob.start(); }, T1.burst),
      setTimeout(() => setReady(true), T1.done),
    ];
    main.start();
    return () => { stopFx(); main.stop(); shake.stop(); bob.stop(); timers.forEach(clearTimeout); };
  }, [v]);

  const gender = G.life.gender || "m", stage = stageNow();
  const bw = Math.min(W * 0.5, 210), bh = bw * 110 / 128, small = 0.62;
  const box = (w, h, x = W / 2, y = cy) => ({ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h });
  const rise = (val, d = 22) => ({ opacity: val, transform: [{ translateY: val.interpolate({ inputRange: [0, 1], outputRange: [d, 0] }) }] });
  // Where the buddy stands to strike: on the ground, just left of the rock.
  const startX = rockX - R * 0.4 - (bw * small) / 2, startY = cy + R / 2 - (bh * small) / 2;
  const hx = startX - (bw * small) / 2 + 0.72 * bw * small, hy = startY - (bh * small) / 2 + 0.6 * bh * small;
  const len = Math.max(R * 0.3, Math.min(R * 0.5, rockX - R * 0.4 - hx + R * 0.08));

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={() => { if (ready) dismissFreed(); }} testID="freed">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: v.bg }]}>
        <LinearGradient colors={["#1d1530", "#2a2042", C.night]} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Light from inside the rock, then where it was */}
      <Animated.View pointerEvents="none" style={[box(R * 3.2, R * 3.2, rockX), {
        opacity: Animated.add(v.charge.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }), v.gone.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] })),
        transform: [{ scale: Animated.add(v.charge.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.9] }), v.bob.interpolate({ inputRange: [0, 1], outputRange: [0, 0.06] })) }],
      }]}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="fg" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#ffe9a8" stopOpacity="0.95" />
              <Stop offset="0.4" stopColor="#ffd36b" stopOpacity="0.3" />
              <Stop offset="1" stopColor="#ffd36b" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={50} cy={50} r={50} fill="url(#fg)" />
        </Svg>
      </Animated.View>

      <Animated.View pointerEvents="none" style={[box(R, R, rockX), st.ring, {
        opacity: v.ring.interpolate({ inputRange: [0, 0.05, 1], outputRange: [0, 0.9, 0] }),
        transform: [{ scale: v.ring.interpolate({ inputRange: [0, 1], outputRange: [0.4, 3.2] }) }],
      }]} />

      {/* The whole rock, glowing and shaking harder until the last strike */}
      <Animated.View pointerEvents="none" style={[box(R, R, rockX), {
        opacity: v.gone.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
        transform: [
          { translateX: Animated.multiply(v.shake, v.charge.interpolate({ inputRange: [0, 1], outputRange: [1, 9] })) },
          { scale: v.charge.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) },
        ],
      }]}>
        <SinRock p={1} size={R} glow={0.6} />
      </Animated.View>

      {/* The pieces flying apart */}
      {shards.map(sh => (
        <Animated.View key={sh.i} pointerEvents="none" style={[box(R, R, rockX), {
          opacity: Animated.multiply(v.gone, v.burst.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] })),
          transform: [
            { translateX: v.burst.interpolate({ inputRange: [0, 1], outputRange: [0, sh.x] }) },
            { translateY: v.burst.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, sh.y * 0.7, sh.y + sh.fall] }) },
            { rotate: v.burst.interpolate({ inputRange: [0, 1], outputRange: ["0deg", sh.r + "deg"] }) },
            { scale: v.burst.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] }) },
          ],
        }]}>
          <Shard i={sh.i} size={R} />
        </Animated.View>
      ))}

      {/* The buddy: strikes from the left, then steps into the light, free */}
      <Animated.View pointerEvents="none" style={[box(bw, bh), {
        transform: [
          { translateX: v.free.interpolate({ inputRange: [0, 1], outputRange: [startX - W / 2, 0] }) },
          { translateY: Animated.add(v.free.interpolate({ inputRange: [0, 1], outputRange: [startY - cy, 0] }), v.bob.interpolate({ inputRange: [0, 1], outputRange: [0, -10] })) },
          { scale: v.free.interpolate({ inputRange: [0, 1], outputRange: [small, 1] }) },
        ],
      }]}>
        <BuddyArt gender={gender} stage={stage} mood="happy" width={bw} height={bh} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[box(len * 2, len * 2, hx, hy), {
        opacity: v.free.interpolate({ inputRange: [0, 0.3], outputRange: [1, 0], extrapolate: "clamp" }),
        transform: [{ rotate: v.swing.interpolate({ inputRange: [-0.25, 0, 1], outputRange: ["-62deg", "-40deg", "68deg"] }) }],
      }]}>
        <Pickaxe len={len} />
      </Animated.View>

      <View pointerEvents="box-none" style={[st.words, { top: cy + R * 0.62, paddingBottom: insets.bottom + 24 }]}>
        <Animated.Text style={[st.title, rise(v.words)]}>{t("debtDoneT")}</Animated.Text>
        <Animated.Text style={[st.n, rise(v.words, 14)]}>{num(n)} → 0</Animated.Text>
        <Animated.View style={[{ alignItems: "center", gap: 6 }, rise(v.words, 12)]}>
          <Text style={st.ar}>ٱلْحَمْدُ لِلَّٰهِ</Text>
          <Text style={st.line}>{t("debtDoneS")}</Text>
        </Animated.View>
        <Animated.View style={[st.btnBox, rise(v.done, 20)]} pointerEvents={ready ? "auto" : "none"}>
          <Btn primary title={t("cont")} onPress={dismissFreed} testID="freed-continue" />
        </Animated.View>
      </View>

      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: "#fff", opacity: v.flash }]} />
    </Pressable>
  );
}

const st = StyleSheet.create({
  count: { fontFamily: F.heavy, color: "#fff6d6", textShadowColor: "rgba(0,0,0,0.6)", textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },
  ring: { borderWidth: 5, borderRadius: 999, borderColor: "#ffe9a8" },
  words: { position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center", paddingHorizontal: 28, gap: 10 },
  title: { fontFamily: F.heavy, fontSize: 34, color: GOLD[0], textAlign: "center", textShadowColor: "rgba(255,200,80,0.5)", textShadowRadius: 18, textShadowOffset: { width: 0, height: 0 } },
  n: { fontFamily: F.heavy, fontSize: 18, color: C.inkSoft, textAlign: "center" },
  ar: { fontFamily: F.ar, fontSize: 26, color: GOLD[0], textAlign: "center", writingDirection: "rtl" },
  line: { fontFamily: F.ui, fontSize: 15, lineHeight: 22, color: C.inkSoft, textAlign: "center", maxWidth: 340 },
  btnBox: { marginTop: "auto", maxWidth: 360, width: "100%", alignSelf: "center" },
});
