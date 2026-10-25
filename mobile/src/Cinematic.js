// The full-screen scene that plays each time the buddy grows into a new form:
// a charge-up, a flash, the new form bursting in, then its name.
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { G, dismissCinematic } from "./game";
import { BuddyArt } from "./Buddy";
import { t, stageName, stageLine } from "./i18n";
import { cinematicFx } from "./fx";
import { Btn } from "./ui";
import { C, F, GOLD } from "./theme";

// Background top, background bottom and the glow colour for each stage reached.
const LOOK = [
  ["#0b2b26", "#163832", "#ffe9a8"],
  ["#0d3a37", "#1d5b52", "#ffe9a8"],
  ["#0f3b4a", "#1b6b78", "#9be8d8"],
  ["#12306b", "#2b5cb8", "#bfe0ff"],
  ["#2a1a5e", "#5a3aa8", "#e6d4ff"],
  ["#3d2a00", "#a87410", "#fff1b8"],
];

// When each beat starts, in ms.
const T0 = { charge: 500, flash: 2000, reveal: 2060, title: 2700, name: 3100, line: 3600, done: 4600 };

const N = o => ({ useNativeDriver: true, ...o });
const at = (ms, anim) => Animated.sequence([Animated.delay(ms), anim]);
const to = (v, toValue, duration, easing, extra) => Animated.timing(v, N({ toValue, duration, easing, ...extra }));

const rand = (a, b) => a + Math.random() * (b - a);

// The slowly turning sunburst behind the new form.
function Rays({ size, color }) {
  const n = 16;
  const r = size / 2;
  const paths = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, w = Math.PI / n * 0.55;
    const x1 = r + r * Math.cos(a - w), y1 = r + r * Math.sin(a - w);
    const x2 = r + r * Math.cos(a + w), y2 = r + r * Math.sin(a + w);
    paths.push(<Path key={i} d={`M${r} ${r} L${x1} ${y1} L${x2} ${y2} Z`} fill="url(#ray)" />);
  }
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="ray" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity="0.55" />
          <Stop offset="0.6" stopColor={color} stopOpacity="0.12" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      {paths}
    </Svg>
  );
}

function Glow({ size, color }) {
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity="0.9" />
          <Stop offset="0.35" stopColor={color} stopOpacity="0.35" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#glow)" />
    </Svg>
  );
}

// Energy motes that spiral into the buddy while it charges.
function Mote({ color, start }) {
  const p = useRef(new Animated.Value(0)).current;
  const m = useMemo(() => {
    const a = rand(0, Math.PI * 2), r = rand(130, 250), twist = rand(0.5, 1.1);
    return { x: Math.cos(a) * r, y: Math.sin(a) * r, mx: Math.cos(a + twist) * r * 0.45, my: Math.sin(a + twist) * r * 0.45, d: rand(520, 820), delay: rand(0, 700), size: rand(5, 11) };
  }, []);
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([to(p, 1, m.d, Easing.in(Easing.quad)), to(p, 0, 0)]));
    const go = setTimeout(() => loop.start(), start + m.delay);
    return () => { clearTimeout(go); loop.stop(); };
  }, [p, m, start]);
  return (
    <Animated.View style={[s.mote, {
      width: m.size, height: m.size, borderRadius: m.size, backgroundColor: color, shadowColor: color,
      opacity: p.interpolate({ inputRange: [0, 0.2, 0.85, 1], outputRange: [0, 1, 1, 0] }),
      transform: [
        { translateX: p.interpolate({ inputRange: [0, 0.5, 1], outputRange: [m.x, m.mx, 0] }) },
        { translateY: p.interpolate({ inputRange: [0, 0.5, 1], outputRange: [m.y, m.my, 0] }) },
        { scale: p.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }) },
      ],
    }]} />
  );
}

// Stars thrown outward by the burst.
function Spark({ burst, color }) {
  const m = useMemo(() => {
    const a = rand(0, Math.PI * 2), d = rand(110, 240);
    return { x: Math.cos(a) * d, y: Math.sin(a) * d, size: rand(14, 30), spin: rand(-220, 220) };
  }, []);
  return (
    <Animated.Text style={[s.spark, {
      fontSize: m.size, color, textShadowColor: color,
      opacity: burst.interpolate({ inputRange: [0, 0.08, 0.65, 1], outputRange: [0, 1, 1, 0] }),
      transform: [
        { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, m.x] }) },
        { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, m.y] }) },
        { rotate: burst.interpolate({ inputRange: [0, 1], outputRange: ["0deg", m.spin + "deg"] }) },
        { scale: burst.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.2, 1.2, 0.5] }) },
      ],
    }]}>✦</Animated.Text>
  );
}

// Stars that keep twinkling around the new form.
function Twinkle({ w, h, color }) {
  const v = useRef(new Animated.Value(0)).current;
  const m = useMemo(() => ({ x: rand(0.06, 0.94) * w, y: rand(0.08, 0.62) * h, size: rand(10, 20), d: rand(700, 1400), delay: rand(0, 900) }), [w, h]);
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([to(v, 1, m.d, Easing.inOut(Easing.sin)), to(v, 0, m.d, Easing.inOut(Easing.sin))]));
    const go = setTimeout(() => loop.start(), T0.reveal + m.delay);
    return () => { clearTimeout(go); loop.stop(); };
  }, [v, m]);
  return (
    <Animated.Text style={[s.spark, {
      left: m.x, top: m.y, fontSize: m.size, color, textShadowColor: color,
      opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0, 0.95] }),
      transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.15] }) }],
    }]}>✦</Animated.Text>
  );
}

export default function Cinematic() {
  const c = G.cinematic;
  if (!c) return null;
  return <Scene key={c.id} from={c.from} to={c.to} />;
}

function Scene({ from, to: stage }) {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [bgTop, bgBottom, accent] = LOOK[Math.min(stage, LOOK.length - 1)];
  const gender = G.life.gender || "m";
  const bw = Math.min(W * 0.78, 300), bh = bw * 240 / 280;
  const cy = H * 0.38;   // where the buddy's centre sits

  const v = useRef({
    bg: new Animated.Value(0), charge: new Animated.Value(0), shake: new Animated.Value(0),
    flash: new Animated.Value(0), swap: new Animated.Value(0), pop: new Animated.Value(0),
    ring1: new Animated.Value(0), ring2: new Animated.Value(0), burst: new Animated.Value(0),
    rays: new Animated.Value(0), spin: new Animated.Value(0), bob: new Animated.Value(0),
    quake: new Animated.Value(0), punch: new Animated.Value(1),
    title: new Animated.Value(0), name: new Animated.Value(0), line: new Animated.Value(0), done: new Animated.Value(0),
  }).current;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stopFx = cinematicFx();
    const shake = Animated.loop(Animated.sequence([to(v.shake, 1, 38), to(v.shake, -1, 76), to(v.shake, 0, 38)]));
    const spin = Animated.loop(to(v.spin, 1, 24000, Easing.linear));
    const bob = Animated.loop(Animated.sequence([to(v.bob, 1, 1300, Easing.inOut(Easing.sin)), to(v.bob, 0, 1300, Easing.inOut(Easing.sin))]));
    const quake = [12, -10, 8, -6, 4, -2, 0].map(x => to(v.quake, x, 45));
    const main = Animated.parallel([
      to(v.bg, 1, 500, Easing.out(Easing.quad)),
      at(T0.charge, to(v.charge, 1, T0.flash - T0.charge, Easing.in(Easing.quad))),
      at(T0.flash, Animated.sequence([to(v.flash, 1, 70), to(v.flash, 0, 650, Easing.out(Easing.quad))])),
      at(T0.reveal, Animated.parallel([
        to(v.swap, 1, 1),
        Animated.spring(v.pop, N({ toValue: 1, friction: 4, tension: 70 })),
        to(v.ring1, 1, 900, Easing.out(Easing.cubic)),
        at(160, to(v.ring2, 1, 1100, Easing.out(Easing.cubic))),
        to(v.burst, 1, 1200, Easing.out(Easing.cubic)),
        to(v.rays, 1, 700, Easing.out(Easing.quad)),
        Animated.sequence(quake),
        Animated.sequence([to(v.punch, 1.07, 60), Animated.spring(v.punch, N({ toValue: 1, friction: 5 }))]),
      ])),
      at(T0.title, to(v.title, 1, 450, Easing.out(Easing.back(1.6)))),
      at(T0.name, Animated.spring(v.name, N({ toValue: 1, friction: 5, tension: 80 }))),
      at(T0.line, to(v.line, 1, 500, Easing.out(Easing.quad))),
      at(T0.done, to(v.done, 1, 400, Easing.out(Easing.quad))),
    ]);
    const timers = [
      setTimeout(() => shake.start(), T0.charge),
      setTimeout(() => { shake.stop(); v.shake.setValue(0); spin.start(); bob.start(); }, T0.reveal),
      setTimeout(() => setReady(true), T0.done),
    ];
    main.start();
    return () => { stopFx(); main.stop(); shake.stop(); spin.stop(); bob.stop(); timers.forEach(clearTimeout); };
  }, [v]);

  const raySize = Math.hypot(W, H) * 1.3;
  const glowSize = bw * 1.9;
  const accentText = { color: accent, textShadowColor: accent };
  const rise = (val, d = 24) => ({ opacity: val, transform: [{ translateY: val.interpolate({ inputRange: [0, 1], outputRange: [d, 0] }) }] });
  const centre = (w, h) => ({ position: "absolute", left: W / 2 - w / 2, top: cy - h / 2, width: w, height: h });

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={() => { if (ready) dismissCinematic(); }} testID="cinematic">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: v.bg }]}>
        <LinearGradient colors={[bgTop, bgBottom, C.night]} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.25)" }]} />
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: v.quake }, { scale: v.punch }] }]}>
        {/* Sunburst */}
        <Animated.View pointerEvents="none" style={[centre(raySize, raySize), {
          opacity: v.rays,
          transform: [{ rotate: v.spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }, { scale: v.rays.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
        }]}>
          <Rays size={raySize} color={accent} />
        </Animated.View>

        {/* Glow that swells while charging and breathes after */}
        <Animated.View pointerEvents="none" style={[centre(glowSize, glowSize), {
          opacity: Animated.add(v.charge.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.9] }), v.swap.interpolate({ inputRange: [0, 1], outputRange: [0, 0.1] })),
          transform: [{ scale: Animated.add(v.charge.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.15] }), v.bob.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] })) }],
        }]}>
          <Glow size={glowSize} color={accent} />
        </Animated.View>

        {/* Shockwave rings */}
        {[v.ring1, v.ring2].map((r, i) => (
          <Animated.View key={i} pointerEvents="none" style={[centre(bw, bw), s.ring, {
            borderColor: i ? "#fff" : accent,
            opacity: r.interpolate({ inputRange: [0, 0.05, 1], outputRange: [0, 0.95, 0] }),
            transform: [{ scale: r.interpolate({ inputRange: [0, 1], outputRange: [0.3, i ? 3.4 : 2.6] }) }],
          }]} />
        ))}

        {/* Charge-up motes */}
        <Animated.View pointerEvents="none" style={[centre(0, 0), { opacity: v.swap.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
          {Array.from({ length: 28 }, (_, i) => <Mote key={i} color={accent} start={T0.charge} />)}
        </Animated.View>

        {/* The old form, shaking harder as it charges */}
        <Animated.View pointerEvents="none" style={[centre(bw, bh), {
          opacity: v.swap.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          transform: [
            { translateX: Animated.multiply(v.shake, v.charge.interpolate({ inputRange: [0, 1], outputRange: [0.5, 9] })) },
            { translateY: v.charge.interpolate({ inputRange: [0, 1], outputRange: [0, -14] }) },
            { scale: v.charge.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) },
          ],
        }]}>
          <BuddyArt gender={gender} stage={from} mood="happy" width={bw} height={bh} />
        </Animated.View>

        {/* The new form */}
        <Animated.View pointerEvents="none" style={[centre(bw, bh), {
          opacity: v.swap,
          transform: [
            { translateY: Animated.add(v.pop.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }), v.bob.interpolate({ inputRange: [0, 1], outputRange: [0, -8] })) },
            { scale: v.pop.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
          ],
        }]}>
          <BuddyArt gender={gender} stage={stage} mood="happy" width={bw} height={bh} />
        </Animated.View>

        {/* Star burst */}
        <View pointerEvents="none" style={centre(0, 0)}>
          {Array.from({ length: 22 }, (_, i) => <Spark key={i} burst={v.burst} color={i % 3 ? accent : GOLD[0]} />)}
        </View>
      </Animated.View>

      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: v.swap }]}>
        {Array.from({ length: 12 }, (_, i) => <Twinkle key={i} w={W} h={H} color={i % 2 ? accent : "#fff"} />)}
      </Animated.View>

      {/* Words */}
      <View pointerEvents="box-none" style={[s.words, { top: cy + bh / 2 + 26, paddingBottom: insets.bottom + 24 }]}>
        <Animated.Text style={[s.title, rise(v.title)]}>{t("growT")}</Animated.Text>
        <Animated.Text style={[s.name, accentText, {
          opacity: v.name.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1], extrapolate: "clamp" }),
          transform: [{ scale: v.name.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
        }]} adjustsFontSizeToFit numberOfLines={1}>{stageName(stage)}</Animated.Text>
        <Animated.View style={[s.lineBox, rise(v.line, 16)]}>
          <Text style={s.line}>{stageLine(stage)}</Text>
          <Text style={s.mash}>مَا شَاءَ ٱللَّٰهُ</Text>
        </Animated.View>
        <Animated.View style={[s.btnBox, rise(v.done, 20)]} pointerEvents={ready ? "auto" : "none"}>
          <Btn primary title={t("cont")} onPress={dismissCinematic} testID="cinematic-continue" />
        </Animated.View>
      </View>

      {/* The flash */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: "#fff", opacity: v.flash }]} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  mote: { position: "absolute", left: 0, top: 0, shadowOpacity: 1, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  spark: { position: "absolute", left: -8, top: -14, textShadowRadius: 10, textShadowOffset: { width: 0, height: 0 } },
  ring: { borderWidth: 5, borderRadius: 999 },
  words: { position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center", paddingHorizontal: 28, gap: 10 },
  title: { fontFamily: F.heavy, fontSize: 15, letterSpacing: 1.2, color: C.ink, textAlign: "center", textTransform: "uppercase" },
  name: { fontFamily: F.heavy, fontSize: 42, textAlign: "center", textShadowRadius: 22, textShadowOffset: { width: 0, height: 0 }, maxWidth: "100%" },
  lineBox: { alignItems: "center", gap: 6 },
  line: { fontFamily: F.ui, fontSize: 16, lineHeight: 23, color: C.inkSoft, textAlign: "center", maxWidth: 340 },
  mash: { fontFamily: F.ar, fontSize: 24, color: GOLD[0], textAlign: "center", writingDirection: "rtl" },
  btnBox: { marginTop: "auto", maxWidth: 360, width: "100%", alignSelf: "center" },
});
