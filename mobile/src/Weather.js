// Gentle weather over the feed: rain, snow, wind, embers, summer heat and fireflies (Zine, 2026-10-27).
// "Auto" changes the weather every few cards; a setting picks one or turns it off. Everything runs on the
// native driver, and the layer never takes touches.
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, Easing, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { T } from "./web-data";
import { G, on } from "./game";

export const WEATHERS = ["rain", "snow", "wind", "embers", "heat", "fireflies"];
const EVERY = 8;   // cards per weather in Auto

// Translations are mine, like the rest of the app's strings: [Weather, Auto, Off, rain, snow, wind, embers, heat, fireflies].
const WT = {
  en: ["Weather", "Auto", "Off", "Rain", "Snow", "Wind", "Embers", "Summer heat", "Fireflies"],
  ar: ["الطقس", "تلقائي", "إيقاف", "مطر", "ثلج", "رياح", "جمر", "حر الصيف", "يراعات"],
  fr: ["Météo", "Auto", "Désactivée", "Pluie", "Neige", "Vent", "Braises", "Chaleur d'été", "Lucioles"],
  es: ["Clima", "Auto", "Apagado", "Lluvia", "Nieve", "Viento", "Brasas", "Calor de verano", "Luciérnagas"],
  tr: ["Hava", "Otomatik", "Kapalı", "Yağmur", "Kar", "Rüzgâr", "Kor", "Yaz sıcağı", "Ateş böcekleri"],
  ur: ["موسم", "خودکار", "بند", "بارش", "برف", "ہوا", "انگارے", "گرمی", "جگنو"],
  id: ["Cuaca", "Otomatis", "Mati", "Hujan", "Salju", "Angin", "Bara", "Panas musim panas", "Kunang-kunang"],
  bn: ["আবহাওয়া", "স্বয়ংক্রিয়", "বন্ধ", "বৃষ্টি", "তুষার", "বাতাস", "অঙ্গার", "গ্রীষ্মের তাপ", "জোনাকি"],
  ru: ["Погода", "Авто", "Выкл.", "Дождь", "Снег", "Ветер", "Угольки", "Летний зной", "Светлячки"],
  de: ["Wetter", "Auto", "Aus", "Regen", "Schnee", "Wind", "Glut", "Sommerhitze", "Glühwürmchen"],
};
for (const [l, v] of Object.entries(WT)) if (T[l]) {
  Object.assign(T[l].ui, { wxTitle: v[0], wxAuto: v[1], wxOff: v[2] });
  WEATHERS.forEach((k, i) => { T[l].ui["wx_" + k] = v[3 + i]; });
}

const rnd = (a, b) => a + Math.random() * (b - a);

// One looping 0 → 1 value per particle, started at a random point so the particles don't move in step.
function useLoop(duration, linear = true) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let alive = true;
    const run = from => {
      v.setValue(from);
      Animated.timing(v, { toValue: 1, duration: duration * (1 - from), easing: linear ? Easing.linear : Easing.inOut(Easing.sin), useNativeDriver: true })
        .start(({ finished }) => { if (alive && finished) run(0); });
    };
    run(Math.random());
    return () => { alive = false; v.stopAnimation(); };
  }, [v, duration, linear]);
  return v;
}

const Drop = memo(function Drop({ W, H }) {
  const p = useMemo(() => ({ x: rnd(0, W * 1.25), len: rnd(16, 30), d: rnd(650, 1050), o: rnd(0.18, 0.4) }), [W]);
  const v = useLoop(p.d);
  const fall = H + 80;
  return (
    <Animated.View style={[s.drop, { left: p.x, height: p.len, opacity: p.o, transform: [
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-60, fall] }) },
      { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, -fall * 0.2] }) },
      { rotate: "11deg" },
    ] }]} />
  );
});

const Flake = memo(function Flake({ W, H }) {
  const p = useMemo(() => ({ x: rnd(0, W), r: rnd(2.5, 6.5), d: rnd(7000, 13000), sway: rnd(12, 30), o: rnd(0.45, 0.85) }), [W]);
  const v = useLoop(p.d);
  return (
    <Animated.View style={[s.dot, { left: p.x, width: p.r * 2, height: p.r * 2, borderRadius: p.r, backgroundColor: "#ffffff", opacity: p.o, transform: [
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-20, H + 20] }) },
      { translateX: v.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, p.sway, 0, -p.sway, 0] }) },
    ] }]} />
  );
});

const Gust = memo(function Gust({ W, H }) {
  const p = useMemo(() => ({ y: rnd(H * 0.08, H * 0.92), len: rnd(60, 150), d: rnd(1300, 2400), o: rnd(0.1, 0.24) }), [H]);
  const v = useLoop(p.d);
  return (
    <Animated.View style={[s.gust, { top: p.y, width: p.len, opacity: v.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, p.o, p.o, 0] }), transform: [
      { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-p.len, W + p.len] }) },
    ] }]} />
  );
});

const Leaf = memo(function Leaf({ W, H }) {
  const p = useMemo(() => ({ y: rnd(H * 0.1, H * 0.85), d: rnd(3200, 5200), wave: rnd(25, 60), c: ["#7fcf8f", "#f5b83d", "#c9e27a"][Math.floor(rnd(0, 3))] }), [H]);
  const v = useLoop(p.d);
  return (
    <Animated.View style={[s.leaf, { top: p.y, backgroundColor: p.c, transform: [
      { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-30, W + 30] }) },
      { translateY: v.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, -p.wave, 0, p.wave * 0.6, 0] }) },
      { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "720deg"] }) },
    ] }]} />
  );
});

const Ember = memo(function Ember({ W, H }) {
  const p = useMemo(() => ({ x: rnd(0, W), r: rnd(1.5, 3.8), d: rnd(3500, 6500), rise: rnd(H * 0.35, H * 0.7), sway: rnd(10, 26), c: ["#ffcf6b", "#ff9a3c", "#ff6a2a"][Math.floor(rnd(0, 3))] }), [W, H]);
  const v = useLoop(p.d);
  return (
    <Animated.View style={[s.dot, s.glow, { left: p.x, top: H, width: p.r * 2, height: p.r * 2, borderRadius: p.r, backgroundColor: p.c, shadowColor: p.c,
      opacity: v.interpolate({ inputRange: [0, 0.15, 0.6, 1], outputRange: [0, 1, 0.8, 0] }), transform: [
        { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -p.rise] }) },
        { translateX: v.interpolate({ inputRange: [0, 0.33, 0.66, 1], outputRange: [0, p.sway, -p.sway * 0.5, p.sway * 0.3] }) },
      ] }]} />
  );
});

const Firefly = memo(function Firefly({ W, H }) {
  const p = useMemo(() => ({ x: rnd(0, W), y: rnd(H * 0.15, H * 0.9), d: rnd(5000, 9000), dx: rnd(-40, 40), dy: rnd(-50, 50), r: rnd(2, 3.5) }), [W, H]);
  const v = useLoop(p.d, false);
  return (
    <Animated.View style={[s.dot, s.glow, { left: p.x, top: p.y, width: p.r * 2, height: p.r * 2, borderRadius: p.r, backgroundColor: "#fff1a8", shadowColor: "#ffd35a",
      opacity: v.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: [0.1, 0.9, 0.2, 1, 0.3, 0.1] }), transform: [
        { translateX: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, p.dx, 0] }) },
        { translateY: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, p.dy, 0] }) },
      ] }]} />
  );
});

const Haze = memo(function Haze({ W, H }) {
  const p = useMemo(() => ({ x: rnd(0, W), r: rnd(20, 50), d: rnd(9000, 15000) }), [W]);
  const v = useLoop(p.d);
  return (
    <Animated.View style={[s.dot, { left: p.x, top: H, width: p.r * 2, height: p.r * 2, borderRadius: p.r, backgroundColor: "#ffd27a",
      opacity: v.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [0, 0.07, 0.05, 0] }), transform: [
        { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -H * 0.9] }) },
        { scaleX: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.4, 1] }) },
      ] }]} />
  );
});

function Sun({ W, H }) {
  const v = useLoop(4200, false);
  const R = W * 0.75;
  return (
    <Animated.View style={{ position: "absolute", left: W - R, top: -R * 0.75, width: R * 2, height: R * 2,
      opacity: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.75, 1, 0.75] }),
      transform: [{ scale: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.07, 1] }) }] }}>
      <Svg width={R * 2} height={R * 2}>
        <Defs>
          <RadialGradient id="sun" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#fff3b0" stopOpacity="0.55" />
            <Stop offset="0.25" stopColor="#ffc74a" stopOpacity="0.3" />
            <Stop offset="1" stopColor="#ff9a3c" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={R} cy={R} r={R} fill="url(#sun)" />
      </Svg>
    </Animated.View>
  );
}

const many = (n, El, W, H) => Array.from({ length: n }, (_, i) => <El key={i} W={W} H={H} />);

function Scene({ kind, W, H }) {
  switch (kind) {
    case "rain": return <><View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(10,30,60,0.16)" }]} />{many(42, Drop, W, H)}</>;
    case "snow": return <><LinearGradient colors={["rgba(220,235,255,0.10)", "rgba(220,235,255,0)"]} style={StyleSheet.absoluteFill} />{many(40, Flake, W, H)}</>;
    case "wind": return <>{many(14, Gust, W, H)}{many(7, Leaf, W, H)}</>;
    case "embers": return <><LinearGradient colors={["rgba(255,110,40,0)", "rgba(255,110,40,0.2)"]} start={{ x: 0, y: 0.55 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />{many(28, Ember, W, H)}</>;
    case "heat": return <><LinearGradient colors={["rgba(255,170,60,0.16)", "rgba(255,170,60,0)"]} end={{ x: 0, y: 0.6 }} style={StyleSheet.absoluteFill} /><Sun W={W} H={H} />{many(10, Haze, W, H)}</>;
    case "fireflies": return many(20, Firefly, W, H);
    default: return null;
  }
}

const pickAuto = (idx, start) => WEATHERS[(start + Math.floor(Math.max(0, idx) / EVERY)) % WEATHERS.length];

export default function Weather() {
  const start = useRef(Math.floor(Math.random() * WEATHERS.length)).current;
  const setting = G.life.weather || "auto";
  const [idx, setIdx] = useState(Math.max(0, G.current));
  useEffect(() => on("cardIdx", i => setIdx(i)), []);
  const kind = setting === "off" ? null : setting === "auto" ? pickAuto(idx, start) : setting;
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [kind, fade]);
  const { width: W, height: H } = Dimensions.get("window");
  if (!kind) return null;
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: fade, overflow: "hidden" }]}>
      <Scene key={kind} kind={kind} W={W} H={H} />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  drop: { position: "absolute", top: 0, width: 1.6, borderRadius: 1, backgroundColor: "#d6ecff" },
  dot: { position: "absolute", top: 0 },
  glow: { shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  gust: { position: "absolute", left: 0, height: 1.6, borderRadius: 1, backgroundColor: "#ffffff" },
  leaf: { position: "absolute", left: 0, width: 10, height: 6, borderTopLeftRadius: 8, borderBottomRightRadius: 8, opacity: 0.85 },
});
