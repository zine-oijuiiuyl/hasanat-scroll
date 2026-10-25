// The endless vertical feed: one card per screen, snapping like the web app.
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, G, Path, Pattern, Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BY_ID, PALETTES } from "./web-data";
import { G, on, repeatCard, setCurrent } from "./game";
import { t, meaning, kindLabel, sourceText } from "./i18n";
import { C, F, GOLD } from "./theme";
import { hapTick } from "./fx";

// The faint tiled pattern behind every card: a square and the same square turned 45 degrees (as on the web app).
const Pattern70 = memo(function Pattern70() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id="geo" width="70" height="70" patternUnits="userSpaceOnUse">
          <G fill="none" stroke="#fff" strokeOpacity={0.09}>
            <Rect x="19" y="19" width="32" height="32" />
            <Rect x="19" y="19" width="32" height="32" rotation="45" origin="35, 35" />
          </G>
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#geo)" />
    </Svg>
  );
});

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

const Card = memo(function Card({ card, height, lang, rep, insetTop, insetBottom }) {
  const d = BY_ID[card.id];
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => on("repeat", key => {
    if (key !== card.key) return;
    pulse.setValue(0);
    Animated.timing(pulse, { toValue: 1, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }), [card.key, pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 0.4, 1], outputRange: [1, 1.045, 1] });
  const colors = card.golden ? ["#3D2A00", "#8A6110"] : PALETTES[d.pal % PALETTES.length];
  const size = d.ar.length < 20 ? 64 : d.ar.length < 40 ? 46 : 34;
  const src = sourceText(d);
  return (
    <Pressable
      testID={"card-" + card.idx}
      onPress={() => { if (G.current === card.idx) { hapTick(); repeatCard(card.idx); } }}
      style={{ height }}
    >
      <LinearGradient colors={colors} start={{ x: 0.33, y: 0 }} end={{ x: 0.67, y: 1 }} style={[s.card, { paddingTop: insetTop + 130, paddingBottom: insetBottom + 40 }]}>
        <Pattern70 />
        <Text style={[s.kind, card.golden && { color: C.gold1 }]}>{card.golden ? t("golden") : kindLabel(d)}</Text>
        <Animated.Text style={[s.ar, { fontSize: size, lineHeight: size * 1.65 }, card.golden && s.arGold, { transform: [{ scale }] }]} adjustsFontSizeToFit>{d.ar}</Animated.Text>
        <View style={s.meta}>
          <Text style={s.tr}>{d.tr}</Text>
          <Text style={s.en}>{meaning(d)}</Text>
          {src ? <Text style={s.src}>{src}</Text> : null}
          {rep > 0 ? <View style={s.rep}><Text style={s.repT}>📿 ×{rep}</Text></View> : null}
        </View>
        <View style={s.counter}>
          <SwipeHint />
          <Text style={s.hint}>{t("swipe")}</Text>
          <Text style={s.tapHint}>{t("tapHint")}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
});

export default function Feed({ version, lang }) {
  const [height, setHeight] = useState(0);
  const insets = useSafeAreaInsets();
  const list = useRef(null);
  const tab = G.tab;
  useEffect(() => { list.current && list.current.scrollToOffset({ offset: 0, animated: false }); }, [tab]);
  const onScroll = useCallback(e => {
    if (!height) return;
    const idx = Math.round(e.nativeEvent.contentOffset.y / height);
    if (idx >= 0 && idx !== G.current) setCurrent(idx);
  }, [height]);
  useEffect(() => { if (height && G.current < 0) setCurrent(0); }, [height, tab]);
  const renderItem = useCallback(({ item }) => (
    <Card card={item} height={height} lang={lang} rep={item.rep} insetTop={insets.top} insetBottom={insets.bottom} />
  ), [height, lang, insets.top, insets.bottom]);
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
    </View>
  );
}

const s = StyleSheet.create({
  card: { flex: 1, alignItems: "center", paddingHorizontal: 24, gap: 18 },
  kind: { marginTop: "auto", fontSize: 11, fontFamily: F.heavy, letterSpacing: 1.8, color: C.inkFaint, textAlign: "center" },
  ar: { fontFamily: F.ar, color: C.ink, textAlign: "center", writingDirection: "rtl", maxWidth: 540, textShadowColor: "rgba(0,0,0,0.28)", textShadowOffset: { width: 0, height: 8 }, textShadowRadius: 28 },
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
