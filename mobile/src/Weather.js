// Gentle, peaceful weather on the feed cards: rain, snow, wind, embers, fireflies, birds and butterflies (Zine, 2026-10-27).
// Each card carries its own weather and scrolls with it, like a video; in "Auto" the next card brings a
// different one. A setting picks one or turns it off. Only the cards next to the current one animate,
// everything runs on the native driver, and the layer never takes touches.
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, Easing, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { T } from "./web-data";
import { G, on, subscribe } from "./game";
import { ambient } from "./fx";

// "heat" (a sun glow) was removed at Zine's request; its translations stay in WT by position.
const ALL = ["rain", "snow", "wind", "embers", "heat", "fireflies", "birds", "butterflies", "storm"];
export const WEATHERS = ALL.filter(k => k !== "heat");
// In Auto the weathers come round in a shuffled order, so two cards in a row never share one.
const ORDER = [...WEATHERS].sort(() => Math.random() - 0.5);

// Translations are mine, like the rest of the app's strings: [Weather, Auto, Off, rain, snow, wind, embers, heat, fireflies, birds, butterflies, storm].
const WT = {
  en: ["Weather", "Auto", "Off", "Rain", "Snow", "Wind", "Embers", "Summer heat", "Fireflies", "Birds", "Butterflies", "Thunderstorm"],
  ar: ["الطقس", "تلقائي", "إيقاف", "مطر", "ثلج", "رياح", "جمر", "حر الصيف", "يراعات", "طيور", "فراشات", "عاصفة رعدية"],
  fr: ["Météo", "Auto", "Désactivée", "Pluie", "Neige", "Vent", "Braises", "Chaleur d'été", "Lucioles", "Oiseaux", "Papillons", "Orage"],
  es: ["Clima", "Auto", "Apagado", "Lluvia", "Nieve", "Viento", "Brasas", "Calor de verano", "Luciérnagas", "Pájaros", "Mariposas", "Tormenta"],
  tr: ["Hava", "Otomatik", "Kapalı", "Yağmur", "Kar", "Rüzgâr", "Kor", "Yaz sıcağı", "Ateş böcekleri", "Kuşlar", "Kelebekler", "Gök gürültülü fırtına"],
  ur: ["موسم", "خودکار", "بند", "بارش", "برف", "ہوا", "انگارے", "گرمی", "جگنو", "پرندے", "تتلیاں", "طوفانِ برق و باراں"],
  id: ["Cuaca", "Otomatis", "Mati", "Hujan", "Salju", "Angin", "Bara", "Panas musim panas", "Kunang-kunang", "Burung", "Kupu-kupu", "Badai petir"],
  bn: ["আবহাওয়া", "স্বয়ংক্রিয়", "বন্ধ", "বৃষ্টি", "তুষার", "বাতাস", "অঙ্গার", "গ্রীষ্মের তাপ", "জোনাকি", "পাখি", "প্রজাপতি", "বজ্রঝড়"],
  ru: ["Погода", "Авто", "Выкл.", "Дождь", "Снег", "Ветер", "Угольки", "Летний зной", "Светлячки", "Птицы", "Бабочки", "Гроза"],
  de: ["Wetter", "Auto", "Aus", "Regen", "Schnee", "Wind", "Glut", "Sommerhitze", "Glühwürmchen", "Vögel", "Schmetterlinge", "Gewitter"],
};
for (const [l, v] of Object.entries(WT)) if (T[l]) {
  Object.assign(T[l].ui, { wxTitle: v[0], wxAuto: v[1], wxOff: v[2] });
  ALL.forEach((k, i) => { T[l].ui["wx_" + k] = v[3 + i]; });
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
  const p = useMemo(() => ({ x: rnd(0, W * 1.25), len: rnd(12, 22), d: rnd(1500, 2200), o: rnd(0.12, 0.26) }), [W]);
  const v = useLoop(p.d);
  const fall = H + 80;
  return (
    <Animated.View style={[s.drop, { left: p.x, height: p.len, opacity: p.o, transform: [
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-60, fall] }) },
      { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, -fall * 0.08] }) },
      { rotate: "4.5deg" },
    ] }]} />
  );
});

const Flake = memo(function Flake({ W, H }) {
  const p = useMemo(() => ({ x: rnd(0, W), r: rnd(2, 5), d: rnd(12000, 20000), sway: rnd(10, 22), o: rnd(0.35, 0.7) }), [W]);
  const v = useLoop(p.d);
  return (
    <Animated.View style={[s.dot, { left: p.x, width: p.r * 2, height: p.r * 2, borderRadius: p.r, backgroundColor: "#ffffff", opacity: p.o, transform: [
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-20, H + 20] }) },
      { translateX: v.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, p.sway, 0, -p.sway, 0] }) },
    ] }]} />
  );
});

const Gust = memo(function Gust({ W, H }) {
  const p = useMemo(() => ({ y: rnd(H * 0.08, H * 0.92), len: rnd(60, 130), d: rnd(3500, 5500), o: rnd(0.06, 0.14) }), [H]);
  const v = useLoop(p.d);
  return (
    <Animated.View style={[s.gust, { top: p.y, width: p.len, opacity: v.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, p.o, p.o, 0] }), transform: [
      { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-p.len, W + p.len] }) },
    ] }]} />
  );
});

const Leaf = memo(function Leaf({ W, H }) {
  const p = useMemo(() => ({ y: rnd(H * 0.1, H * 0.85), d: rnd(7000, 10000), wave: rnd(18, 40), c: ["#7fcf8f", "#f5b83d", "#c9e27a"][Math.floor(rnd(0, 3))] }), [H]);
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
  const p = useMemo(() => ({ x: rnd(0, W), r: rnd(1.5, 3), d: rnd(7000, 11000), rise: rnd(H * 0.35, H * 0.7), sway: rnd(10, 26), c: ["#ffcf6b", "#ff9a3c", "#ff6a2a"][Math.floor(rnd(0, 3))] }), [W, H]);
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
  const p = useMemo(() => ({ x: rnd(0, W), y: rnd(H * 0.15, H * 0.9), d: rnd(9000, 15000), dx: rnd(-30, 30), dy: rnd(-35, 35), r: rnd(2, 3.5) }), [W, H]);
  const v = useLoop(p.d, false);
  return (
    <Animated.View style={[s.dot, s.glow, { left: p.x, top: p.y, width: p.r * 2, height: p.r * 2, borderRadius: p.r, backgroundColor: "#fff1a8", shadowColor: "#ffd35a",
      opacity: v.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: [0.1, 0.7, 0.3, 0.8, 0.35, 0.1] }), transform: [
        { translateX: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, p.dx, 0] }) },
        { translateY: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, p.dy, 0] }) },
      ] }]} />
  );
});

const Bird = memo(function Bird({ W, H }) {
  const p = useMemo(() => ({ y: rnd(H * 0.08, H * 0.6), d: rnd(9000, 15000), flap: rnd(520, 760), wave: rnd(12, 30), sz: rnd(0.7, 1.15), rtl: Math.random() < 0.5 }), [H]);
  const v = useLoop(p.d);
  const f = useLoop(p.flap, false);
  const from = p.rtl ? W + 30 : -30, to = p.rtl ? -30 : W + 30;
  return (
    <Animated.View style={{ position: "absolute", left: 0, top: p.y, transform: [
      { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [from, to] }) },
      { translateY: v.interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: [0, -p.wave, p.wave * 0.4, -p.wave * 0.6] }) },
      { scale: p.sz }, { scaleX: p.rtl ? -1 : 1 },
    ] }}>
      <Animated.View style={{ transform: [{ scaleY: f.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.3, 1] }) }] }}>
        <Svg width={22} height={12} viewBox="0 0 22 12">
          <Path d="M1 4 Q6 0 11 7 Q16 0 21 4" fill="none" stroke="#f4efe2" strokeOpacity={0.75} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
});

const WINGS = [["#ffd36b", "#f5a623"], ["#ffc2d1", "#ff8fab"], ["#9fe6d3", "#3fb69c"], ["#fff6dc", "#e8d9b0"]];
const Butterfly = memo(function Butterfly({ W, H }) {
  const p = useMemo(() => ({ x: rnd(W * 0.1, W * 0.9), y: rnd(H * 0.15, H * 0.85), d: rnd(14000, 22000), flap: rnd(300, 460), dx: rnd(-W * 0.35, W * 0.35), dy: rnd(-H * 0.2, H * 0.2), c: WINGS[Math.floor(rnd(0, WINGS.length))] }), [W, H]);
  const v = useLoop(p.d, false);
  const f = useLoop(p.flap, false);
  return (
    <Animated.View style={{ position: "absolute", left: p.x, top: p.y, opacity: 0.9, transform: [
      { translateX: v.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, p.dx * 0.6, p.dx, p.dx * 0.3, 0] }) },
      { translateY: v.interpolate({ inputRange: [0, 0.2, 0.45, 0.7, 1], outputRange: [0, p.dy * 0.5, -p.dy * 0.3, p.dy, 0] }) },
      { rotate: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: ["-12deg", "14deg", "-12deg"] }) },
    ] }}>
      <Animated.View style={{ transform: [{ scaleX: f.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.2, 1] }) }] }}>
        <Svg width={20} height={18} viewBox="0 0 20 18">
          <Path d="M10 8 C6 1 0 1 1.4 6 C2.4 9 6 9.6 10 8Z M10 8 C14 1 20 1 18.6 6 C17.6 9 14 9.6 10 8Z" fill={p.c[0]} stroke={p.c[1]} strokeWidth={0.8} />
          <Path d="M10 9 C7 10 3.4 12 4.6 15 C5.6 17 8.6 14 10 9Z M10 9 C13 10 16.6 12 15.4 15 C14.4 17 11.4 14 10 9Z" fill={p.c[1]} stroke={p.c[1]} strokeWidth={0.6} />
          <Path d="M10 5 V14" stroke="#3b2a1a" strokeWidth={1.4} strokeLinecap="round" />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
});

// Lightning: every few seconds the sky flickers twice and a thin bolt shows for a moment.
function Lightning({ W, H }) {
  const flash = useRef(new Animated.Value(0)).current;
  const [bolt, setBolt] = useState(null);
  useEffect(() => {
    let timer, alive = true;
    const strike = () => {
      if (!alive) return;
      const x = rnd(W * 0.15, W * 0.85);
      let d = `M${x.toFixed(0)} 0`, cx = x, cy = 0;
      while (cy < H * 0.42) { cx += rnd(-26, 26); cy += rnd(18, 42); d += ` L${cx.toFixed(0)} ${cy.toFixed(0)}`; }
      setBolt(d);
      flash.setValue(0);
      Animated.sequence([
        Animated.timing(flash, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(flash, { toValue: 0.2, duration: 90, useNativeDriver: true }),
        Animated.timing(flash, { toValue: 0.8, duration: 60, useNativeDriver: true }),
        Animated.timing(flash, { toValue: 0, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
      timer = setTimeout(strike, rnd(4500, 10000));
    };
    timer = setTimeout(strike, rnd(1200, 4000));
    return () => { alive = false; clearTimeout(timer); };
  }, [W, H, flash]);
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: flash }]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(225,230,255,0.22)" }]} />
      {bolt ? (
        <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
          <Path d={bolt} fill="none" stroke="#c9d4ff" strokeOpacity={0.5} strokeWidth={6} strokeLinejoin="round" />
          <Path d={bolt} fill="none" stroke="#ffffff" strokeWidth={1.8} strokeLinejoin="round" />
        </Svg>
      ) : null}
    </Animated.View>
  );
}

const many = (n, El, W, H) => Array.from({ length: n }, (_, i) => <El key={i} W={W} H={H} />);

function Scene({ kind, W, H }) {
  switch (kind) {
    case "storm": return <><View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(8,14,40,0.22)" }]} />{many(30, Drop, W, H)}<Lightning W={W} H={H} /></>;
    case "rain": return <><View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(10,30,60,0.08)" }]} />{many(26, Drop, W, H)}</>;
    case "snow": return <><LinearGradient colors={["rgba(220,235,255,0.10)", "rgba(220,235,255,0)"]} style={StyleSheet.absoluteFill} />{many(28, Flake, W, H)}</>;
    case "wind": return <>{many(7, Gust, W, H)}{many(5, Leaf, W, H)}</>;
    case "embers": return <><LinearGradient colors={["rgba(255,110,40,0)", "rgba(255,110,40,0.12)"]} start={{ x: 0, y: 0.55 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />{many(16, Ember, W, H)}</>;
    case "fireflies": return many(14, Firefly, W, H);
    case "birds": return many(6, Bird, W, H);
    case "butterflies": return many(6, Butterfly, W, H);
    default: return null;
  }
}

const settingNow = () => WEATHERS.includes(G.life.weather) || G.life.weather === "off" ? G.life.weather : "auto";
const kindFor = idx => { const st = settingNow(); return st === "off" ? null : st === "auto" ? ORDER[idx % ORDER.length] : st; };

// The ambience follows the card on screen, only while the feed is showing.
const syncSound = () => ambient(G.page === "scroll" && !G.view && G.current >= 0 ? kindFor(G.current) : null);
on("cardIdx", syncSound);
on("page", syncSound);
subscribe(syncSound);

export function CardWeather({ idx, height }) {
  const setting = settingNow();
  const [near, setNear] = useState(Math.abs(idx - Math.max(0, G.current)) <= 1);
  useEffect(() => on("cardIdx", i => setNear(Math.abs(idx - i) <= 1)), [idx]);
  const kind = setting === "off" ? null : setting === "auto" ? ORDER[idx % ORDER.length] : setting;
  if (!kind || !near || !height) return null;
  const W = Dimensions.get("window").width;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}>
      <Scene kind={kind} W={W} H={height} />
    </View>
  );
}

const s = StyleSheet.create({
  drop: { position: "absolute", top: 0, width: 1.6, borderRadius: 1, backgroundColor: "#d6ecff" },
  dot: { position: "absolute", top: 0 },
  glow: { shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  gust: { position: "absolute", left: 0, height: 1.6, borderRadius: 1, backgroundColor: "#ffffff" },
  leaf: { position: "absolute", left: 0, width: 10, height: 6, borderTopLeftRadius: 8, borderBottomRightRadius: 8, opacity: 0.85 },
});
