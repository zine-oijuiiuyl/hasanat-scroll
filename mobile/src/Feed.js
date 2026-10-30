// The endless vertical feed: one card per screen, snapping like the web app.
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
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
import { cardWords } from "./recite";

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

// `wx` (the weather setting) and `calm` are props only so that a card already on screen redraws when the mode or
// the weather changes; the card is memoised and would otherwise keep its old look until it scrolled away.
const Card = memo(function Card({ card, height, lang, rep, hearted, insetTop, insetBottom, wx, calm }) {
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
  const gold = card.golden && !calm;   // golden cards were drawn before calm mode switched them off
  const colors = gold ? ["#3D2A00", "#8A6110"] : PALETTES[d.pal % PALETTES.length];
  const size = d.ar.length < 20 ? 64 : d.ar.length < 40 ? 46 : 34;
  const src = sourceText(d);
  return (
    <View style={{ height }}>
      <LinearGradient colors={colors} start={{ x: 0.33, y: 0 }} end={{ x: 0.67, y: 1 }} style={[s.card, { paddingTop: insetTop + 130, paddingBottom: insetBottom + 40 }]}>
        <Pattern70 />
        <CardWeather idx={card.idx} height={height} wx={wx} />
        <Text style={[s.kind, gold && { color: C.gold1 }]}>{gold ? t("golden") : kindLabel(d)}</Text>
        <Animated.Text style={[s.ar, { fontSize: size, lineHeight: size * 1.65 }, gold && s.arGold, { transform: [{ scale }] }]} adjustsFontSizeToFit>
          {word < 0 ? d.ar : cardWords(d).map((w, i, all) => (
            <Text key={i} style={i === word ? (gold ? s.wNowGold : s.wNow) : i > word ? s.wNext : null}>{w}{i < all.length - 1 ? " " : ""}</Text>
          ))}
        </Animated.Text>
        <View style={s.meta}>
          <Text style={s.tr}>{d.tr}</Text>
          <Text style={s.en}>{meaning(d)}</Text>
          {src ? <Text style={s.src}>{src}</Text> : null}
          {rep > 0 ? <View style={[s.rep, { flexDirection: "row", alignItems: "center", gap: 5 }]}><Ico e="📿" size={18} /><Text style={s.repT}>×{rep}</Text></View> : null}
        </View>
        <View style={s.counter}>
          <SwipeHint />
          <Text style={s.hint}>{t("swipe")}</Text>
          <Text style={s.tapHint}>{t("tapHint")}</Text>
        </View>
        {/* Tapping repeats the dhikr only in the middle of the card, away from the top bar and the bottom
            (Zine, 2026-10-28). It sits over the text and under the heart. */}
        <Pressable
          testID={"card-" + card.idx}
          onPress={() => { if (G.current === card.idx) { hapTick(); repeatCard(card.idx); } }}
          style={{ position: "absolute", left: 0, right: 0, top: insetTop + 165, bottom: insetBottom + 134 }}
        />
        <HeartButton id={card.id} on={hearted} style={{ bottom: insetBottom + 44, right: 40 }} />
      </LinearGradient>
    </View>
  );
});

export default function Feed({ version, lang }) {
  const [height, setHeight] = useState(0);
  const insets = useSafeAreaInsets();
  const list = useRef(null);
  const tab = G.tab;
  const wx = G.life.weather || "auto", calm = isCalm();
  useEffect(() => { list.current && list.current.scrollToOffset({ offset: 0, animated: false }); }, [tab, G.feedRun]);
  const onScroll = useCallback(e => {
    if (!height) return;
    const idx = Math.round(e.nativeEvent.contentOffset.y / height);
    if (idx >= 0 && idx !== G.current) setCurrent(idx);
  }, [height]);
  useEffect(() => { if (height && G.current < 0) setCurrent(0); }, [height, tab, G.feedRun]);
  const renderItem = useCallback(({ item }) => (
    <Card card={item} height={height} lang={lang} rep={item.rep} hearted={isHearted(item.id)} insetTop={insets.top} insetBottom={tabSpace(insets)} wx={wx} calm={calm} />
  ), [height, lang, insets.top, insets.bottom, wx, calm]);
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
      {height > 0 ? <MuteButton bottom={tabSpace(insets) + 44} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: { flex: 1, alignItems: "center", paddingHorizontal: 24, gap: 18 },
  kind: { marginTop: "auto", fontSize: 11, fontFamily: F.heavy, letterSpacing: 1.8, color: C.inkFaint, textAlign: "center" },
  ar: { fontFamily: F.ar, color: C.ink, textAlign: "center", writingDirection: "rtl", maxWidth: 540, textShadowColor: "rgba(0,0,0,0.28)", textShadowOffset: { width: 0, height: 8 }, textShadowRadius: 28 },
  wNow: { color: GOLD[0], textShadowColor: "rgba(255,200,80,0.9)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 22 },
  wNowGold: { color: "#fff", textShadowColor: "rgba(255,255,255,0.9)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 22 },
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
