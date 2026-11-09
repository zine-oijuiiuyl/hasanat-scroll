// The endless vertical feed: one card per screen, snapping like the web app.
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Easing, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Circle, Line, Text as SvgText, G as SvgG } from "react-native-svg";
import { Pattern70 } from "./Pattern";
import { CardWeather } from "./Weather";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BY_ID, PALETTES } from "./web-data";
import { G, on, repeatCard, setCurrent, isHearted, isCalm } from "./game";
import { t, meaning, kindLabel, sourceText } from "./i18n";
import { C, F, GOLD, tabSpace } from "./theme";
import { hapTick } from "./fx";
import { HeartButton } from "./Hearts";
import { Ico } from "./Icons";
import MuteButton from "./Mute";
import { cardWords, hasVoice } from "./recite";
import { CLIPS } from "./recite-data";
import { LONG } from "./hadith-long";
import { PLAIN } from "./names";

function SwipeHint() {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [a]);
  return (
    <Animated.View style={{ opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.38] }), transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [6, -6] }) }] }}>
      <Svg width={56} height={56} viewBox="0 0 48 48">
        <Path d="M9 28 L24 13 L39 28" fill="none" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M9 41 L24 26 L39 41" fill="none" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.5} />
      </Svg>
    </Animated.View>
  );
}

// A Qur'an, hadith or hadith-dua card holds a whole passage and shows it a part at a time (Zine, 2026-10-30: cards felt too short).
// While it is read aloud the parts follow the reciter; with reading off they turn on a timer. Either way it loops.
// Each part fades out and the next fades in.
const tidyTr = x => x.replace(/AA/g, "'").replace(/\s+/g, " ").trim();
function usePart(card, P) {
  const [part, setPart] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const shown = useRef(0);
  const go = useCallback(k => {
    if (k < 0 || k === shown.current) return;
    shown.current = k;
    Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      setPart(k);
      Animated.timing(fade, { toValue: 1, duration: 280, useNativeDriver: true }).start();
    });
  }, [fade]);
  useEffect(() => {
    if (!P) return;
    return on("reciteWord", (idx, i) => { if (idx === card.idx && i >= 0) go(P.p.findIndex(([a, b]) => i >= a && i < b)); });
  }, [P, card.idx, go]);
  useEffect(() => {
    if (!P || P.p.length < 2) return;
    let tm;
    const len = k => {
      const [a, b] = P.p[k] || [0, 0], x = P.t && P.t[a], y = P.t && P.t[b - 1];   // hadith cards have no timings
      return Math.max(3500, (x && y ? y[1] - x[0] : (b - a) * 900) + 1500);
    };
    const tick = () => {
      const quiet = G.life.recite === false || !hasVoice(card.id);   // nothing reads this card: turn on a timer
      if (G.current !== card.idx) go(0);
      else if (quiet) go((shown.current + 1) % P.p.length);
      tm = setTimeout(tick, len(shown.current));
    };
    tm = setTimeout(tick, len(0));
    return () => clearTimeout(tm);
  }, [P, card.idx, card.id, go]);
  return [part, fade];
}


// ---------- The 99 Names (Zine, 2026-11-09) ----------
// A dial of all 99 names, the same drawing on every card, turned so the name on show sits under the gold marker.
const STEP = 360 / 99;
// Each name runs along the radius, like the spokes of a wheel, so all 99 fit around it.
const RadialName = ({ c, r, text, size, fill }) => (
  <SvgText x={c} y={c - r} fontSize={size} fill={fill} textAnchor="middle" alignmentBaseline="middle" transform={`rotate(-90 ${c} ${c - r})`}>{text}</SvgText>
);
const ringR = D => ({ c: D / 2, rName: D / 2 - 26, rTick: D / 2 - 52, size: D < 330 ? 8 : 9 });
const Ring = memo(function Ring({ D }) {
  const { c, rName, rTick, size } = ringR(D);
  return (
    <Svg width={D} height={D}>
      <Circle cx={c} cy={c} r={c - 2} stroke="rgba(232,200,120,0.16)" strokeWidth={1} fill="none" />
      <Circle cx={c} cy={c} r={rTick - 14} stroke="rgba(232,200,120,0.10)" strokeWidth={1} fill="none" />
      <Circle cx={c} cy={c} r={c * 0.42} stroke="rgba(232,200,120,0.08)" strokeWidth={1} fill="rgba(255,255,255,0.015)" />
      <Circle cx={c} cy={c} r={c * 0.3} stroke="rgba(232,200,120,0.06)" strokeWidth={1} fill="none" />
      {PLAIN.map((nm, i) => (
        <SvgG key={i} rotation={i * STEP} originX={c} originY={c}>
          <Line x1={c} y1={c - rTick} x2={c} y2={c - rTick + (i % 11 === 0 ? 10 : 5)} stroke="rgba(244,239,226,0.28)" strokeWidth={1} />
          <RadialName c={c} r={rName} text={nm} size={size} fill="rgba(244,239,226,0.30)" />
        </SvgG>
      ))}
    </Svg>
  );
});
// The name under the marker, in gold, drawn over the dial once it has turned.
function RingTop({ D, n }) {
  const { c, rName, size } = ringR(D);
  return <Svg width={D} height={D} pointerEvents="none"><RadialName c={c} r={rName} text={PLAIN[n]} size={size + 1} fill="#f1cf7a" /></Svg>;
}

function NameCard({ card, d, height, rep, insetTop, insetBottom, wx, lang }) {
  const W = Dimensions.get("window").width;
  const room = height - insetTop - insetBottom - 380;
  const D = Math.round(Math.max(240, Math.min(W - 24, room, 420)));
  // The dial turns one notch to this name when its card comes into view.
  const turn = useRef(new Animated.Value(G.current === card.idx ? 0 : 1)).current;
  useEffect(() => {
    const go = idx => {
      if (idx !== card.idx) { turn.setValue(1); return; }
      Animated.timing(turn, { toValue: 0, duration: 700, easing: Easing.out(Easing.back(1.6)), useNativeDriver: true }).start();
    };
    return on("cardIdx", go);
  }, [card.idx, turn]);
  const rot = turn.interpolate({ inputRange: [0, 1], outputRange: [-d.n * STEP + "deg", -(d.n - 1) * STEP + "deg"] });
  const mean = lang === "ar" ? "" : meaning(d);
  const size = d.ar.length > 14 ? 34 : d.ar.length > 9 ? 46 : 58;
  return (
    <View style={{ height }}>
      <LinearGradient colors={["#101826", "#070a12", "#05070c"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={[s.card, { paddingTop: insetTop + 150, paddingBottom: insetBottom + 120, gap: 10 }]}>
        <CardWeather idx={card.idx} height={height} wx={wx} />
        <View style={{ width: D, height: D + 14, alignItems: "center", justifyContent: "center" }}>
          <Animated.View style={{ position: "absolute", top: 14, width: D, height: D, transform: [{ rotate: rot }] }}>
            <Ring D={D} />
          </Animated.View>
          {/* The marker over the name on show */}
          <View pointerEvents="none" style={[s.nmDot, { top: 2 }]} />
          <View pointerEvents="none" style={[s.nmLine, { top: 14 + 56, height: 34 }]} />
          <Animated.View pointerEvents="none" style={{ position: "absolute", top: 14, opacity: turn.interpolate({ inputRange: [0, 0.3], outputRange: [1, 0], extrapolate: "clamp" }) }}><RingTop D={D} n={d.n} /></Animated.View>
          <View style={[s.nmGlow, { width: D * 0.6, height: D * 0.6, borderRadius: D * 0.3, top: 14 + D * 0.2 }]} />
          <Text style={[s.nmAr, { fontSize: size, lineHeight: size * 1.7, maxWidth: D * 0.7, marginTop: 14 }]} adjustsFontSizeToFit numberOfLines={2}>{d.ar}</Text>
        </View>
        <Text style={s.nmTr}>{d.tr}</Text>
        {mean ? <Text style={s.nmMean}>{mean}</Text> : null}
        <Text style={s.nmSay}>{t("nameSay")}</Text>
        <Text style={s.nmCount}>{String(d.n + 1).padStart(2, "0")} / 99</Text>
        {rep > 0 ? <View style={[s.rep, { flexDirection: "row", alignItems: "center", gap: 5 }]}><Ico e="📿" size={18} /><Text style={s.repT}>×{rep}</Text></View> : null}
        <Pressable
          testID={"card-" + card.idx}
          onPress={() => { if (G.current === card.idx) { hapTick(); repeatCard(card.idx); } }}
          style={{ position: "absolute", left: 0, right: 0, top: insetTop + 165, bottom: insetBottom + 134 }}
        />
      </LinearGradient>
    </View>
  );
}

// `wx` (the weather setting) and `calm` are props only so that a card already on screen redraws when the mode or
// the weather changes; the card is memoised and would otherwise keep its old look until it scrolled away.
const Card = memo(function Card(p) {
  const d = BY_ID[p.card.id];
  return d.kind === "name" ? <NameCard {...p} d={d} /> : <TextCard {...p} />;
});
function TextCard({ card, height, lang, rep, insetTop, insetBottom, wx, calm }) {
  const d = BY_ID[card.id];
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => on("repeat", key => {
    if (key !== card.key) return;
    pulse.setValue(0);
    Animated.timing(pulse, { toValue: 1, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }), [card.key, pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 0.4, 1], outputRange: [1, 1.045, 1] });
  // The word being read aloud glows gold, the ones still to come wait a little dimmer (Zine, 2026-10-30).
  const [word, setWord] = useState(-1);
  useEffect(() => on("reciteWord", (idx, i) => { if (idx === card.idx) setWord(i); }), [card.idx]);
  const P = CLIPS[card.id] || LONG[card.id];
  const [part, fade] = usePart(card, P);
  const gold = card.golden && !calm;   // golden cards were drawn before calm mode switched them off
  const colors = gold ? ["#3D2A00", "#8A6110"] : PALETTES[d.pal % PALETTES.length];
  // What the card shows now: the whole text, or for a passage the current part with its verses' words around it.
  let words, from = 0, trText = d.tr, meanText = meaning(d), src = sourceText(d);
  if (P) {
    const [a, b] = P.p[Math.min(part, P.p.length - 1)];
    from = a;
    words = P.w.slice(a, b);
    if (P.verses) {
      const vs = [...new Set(P.v.slice(a, b))].map(k => P.verses[k]);
      trText = vs.map(v => tidyTr(v.tr)).join(" ");
      meanText = lang === "ar" ? "" : vs.map(v => v.m[lang] || v.m.en).join(" ");
      src = src.replace(/\d+:\d+(?:-\d+)?/, P.ref);
    } else {
      // A hadith: its meaning in this language a piece per part; without one (es, de, ar) the card's own short meaning.
      trText = "";
      const ms = P.m[lang];
      meanText = ms ? ms[Math.min(part, ms.length - 1)] : meaning(d);
    }
  } else words = cardWords(d);
  const text = words.join(" ");
  const size = text.length < 20 ? 64 : text.length < 40 ? 46 : text.length < 70 ? 34 : 28;
  const w = word - from;
  return (
    <View style={{ height }}>
      <LinearGradient colors={colors} start={{ x: 0.33, y: 0 }} end={{ x: 0.67, y: 1 }} style={[s.card, { paddingTop: insetTop + 130, paddingBottom: insetBottom + 40 }]}>
        <Pattern70 />
        <CardWeather idx={card.idx} height={height} wx={wx} />
        <Text style={[s.kind, gold && { color: C.gold1 }]}>{gold ? t("golden") : kindLabel(d)}</Text>
        <Animated.Text style={[s.ar, { fontSize: size, lineHeight: size * 1.65 }, gold && s.arGold, { opacity: fade, transform: [{ scale }] }]} adjustsFontSizeToFit>
          {word < 0 || w < 0 || w >= words.length ? text : words.map((x, i) => (
            <Text key={i} style={i === w ? (gold ? s.wNowGold : s.wNow) : i > w ? s.wNext : null}>{x}{i < words.length - 1 ? " " : ""}</Text>
          ))}
        </Animated.Text>
        <Animated.View style={[s.meta, { opacity: fade }]}>
          {trText ? <Text style={s.tr}>{trText}</Text> : null}
          {meanText ? <Text style={s.en}>{meanText}</Text> : null}
          {src ? <Text style={s.src}>{src}</Text> : null}
          {rep > 0 ? <View style={[s.rep, { flexDirection: "row", alignItems: "center", gap: 5 }]}><Ico e="📿" size={18} /><Text style={s.repT}>×{rep}</Text></View> : null}
          {P && P.p.length > 1 ? <View style={s.dots}>{P.p.map((_, k) => <View key={k} style={[s.dot, k === part && s.dotOn]} />)}</View> : null}
        </Animated.View>
        <View style={s.counter}>
          <SwipeHint />
          <Text style={s.hint}>{t("swipe")}</Text>
          <Text style={s.tapHint}>{t("tapHint")}</Text>
        </View>
        {/* Tapping repeats the dhikr only in the middle of the card, away from the top bar and the bottom
            (Zine, 2026-10-28). It sits over the text; the heart is drawn over the feed (FixedHeart). */}
        <Pressable
          testID={"card-" + card.idx}
          onPress={() => { if (G.current === card.idx) { hapTick(); repeatCard(card.idx); } }}
          style={{ position: "absolute", left: 0, right: 0, top: insetTop + 165, bottom: insetBottom + 134 }}
        />
      </LinearGradient>
    </View>
  );
}

// The heart stays in its place on the screen while the cards scroll under it (Zine, 2026-11-01), and hearts
// whichever card is showing. Feed redraws it when a heart changes (version), and it follows the current card.
function FixedHeart({ bottom }) {
  const [idx, setIdx] = useState(G.current);
  useEffect(() => on("cardIdx", setIdx), []);
  const el = G.cards[idx];
  if (!el) return null;
  return <HeartButton id={el.id} on={isHearted(el.id)} style={{ bottom, right: 40 }} />;
}

export default function Feed({ version, lang }) {
  const [height, setHeight] = useState(0);
  const insets = useSafeAreaInsets();
  const list = useRef(null);
  const tab = G.tab;
  const wx = G.life.weather || "auto", calm = isCalm();
  const feedRun = G.feedRun, insetTop = insets.top, insetBottom = tabSpace(insets);
  useEffect(() => { if (list.current) list.current.scrollToOffset({ offset: 0, animated: false }); }, [tab, feedRun]);
  const onScroll = useCallback(e => {
    if (!height) return;
    const idx = Math.round(e.nativeEvent.contentOffset.y / height);
    if (idx >= 0 && idx !== G.current) setCurrent(idx);
  }, [height]);
  useEffect(() => { if (height && G.current < 0) setCurrent(0); }, [height, tab, feedRun]);
  const renderItem = useCallback(({ item }) => (
    <Card card={item} height={height} lang={lang} rep={item.rep} insetTop={insetTop} insetBottom={insetBottom} wx={wx} calm={calm} />
  ), [height, lang, insetTop, insetBottom, wx, calm]);
  return (
    <View style={StyleSheet.absoluteFill} onLayout={e => setHeight(e.nativeEvent.layout.height)}>
      {height > 0 && (
        <FlatList
          ref={list}
          testID="feed"
          data={G.cards}
          extraData={version}
          keyExtractor={c => c.key}
          renderItem={renderItem}
          getItemLayout={(_, i) => ({ length: height, offset: height * i, index: i })}
          pagingEnabled
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          windowSize={5}
          initialNumToRender={3}
          maxToRenderPerBatch={4}
          removeClippedSubviews
          bounces={false}
        />
      )}
      {height > 0 ? <FixedHeart bottom={tabSpace(insets) + 44} /> : null}
      {height > 0 ? <MuteButton bottom={tabSpace(insets) + 44} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  nmDot: { position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: "#f1cf7a", shadowColor: "#f1cf7a", shadowOpacity: 0.9, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  nmLine: { position: "absolute", width: 1.5, backgroundColor: "rgba(241,207,122,0.7)" },
  nmGlow: { position: "absolute", backgroundColor: "rgba(241,207,122,0.05)" },
  nmAr: { fontFamily: F.ar, color: "#f7f0de", textAlign: "center", writingDirection: "rtl", textShadowColor: "rgba(241,207,122,0.35)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 18 },
  nmTr: { fontFamily: F.heavy, fontSize: 30, color: "#f7f0de", textAlign: "center", letterSpacing: 0.3 },
  nmMean: { fontFamily: F.heavy, fontSize: 18, color: "#e8c878", textAlign: "center", paddingHorizontal: 20 },
  nmSay: { fontFamily: F.ui, fontStyle: "italic", fontSize: 14, color: "rgba(244,239,226,0.55)", textAlign: "center", marginTop: 6 },
  nmCount: { fontFamily: F.bold, fontSize: 12, letterSpacing: 4, color: "rgba(244,239,226,0.45)" },
  card: { flex: 1, alignItems: "center", paddingHorizontal: 24, gap: 18 },
  kind: { marginTop: "auto", fontSize: 11, fontFamily: F.heavy, letterSpacing: 1.8, color: C.inkFaint, textAlign: "center" },
  ar: { fontFamily: F.ar, color: C.ink, textAlign: "center", writingDirection: "rtl", maxWidth: 540, textShadowColor: "rgba(0,0,0,0.28)", textShadowOffset: { width: 0, height: 8 }, textShadowRadius: 28 },
  wNow: { color: GOLD[0], textShadowColor: "rgba(255,200,80,0.9)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 22 },
  wNowGold: { color: "#fff", textShadowColor: "rgba(255,255,255,0.9)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 22 },
  dots: { flexDirection: "row", gap: 6, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.25)" },
  dotOn: { backgroundColor: GOLD[0], width: 16 },
  wNext: { color: "rgba(255,255,255,0.45)" },
  arGold: { color: C.gold1, textShadowColor: "rgba(255,200,80,0.45)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 18 },
  meta: { gap: 6, alignItems: "center", maxWidth: 540 },
  tr: { fontSize: 19, fontFamily: F.bold, fontStyle: "italic", color: C.ink, textAlign: "center" },
  en: { fontSize: 16, fontFamily: F.ui, color: C.inkSoft, lineHeight: 23, textAlign: "center" },
  src: { fontSize: 12, fontFamily: F.ui, color: C.inkFaint, marginTop: 2, textAlign: "center" },
  rep: { marginTop: 6, paddingVertical: 5, paddingHorizontal: 14, borderRadius: 999, backgroundColor: "rgba(245,184,61,0.18)", borderWidth: 1.5, borderColor: "rgba(245,184,61,0.5)" },
  repT: { color: GOLD[0], fontFamily: F.heavy, fontSize: 15 },
  counter: { marginTop: "auto", alignItems: "center", gap: 10 },
  hint: { fontSize: 13, fontFamily: F.bold, color: C.inkFaint, textAlign: "center", maxWidth: 200 },
  tapHint: { fontSize: 11, fontFamily: F.bold, color: C.inkFaint, opacity: 0.7, textAlign: "center" },
});
