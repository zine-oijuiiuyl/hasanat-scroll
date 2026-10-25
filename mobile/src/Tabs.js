// The feed and the learning path side by side, like Instagram's tabs: swipe sideways or use the bottom bar.
import { memo, useEffect, useRef, useSyncExternalStore } from "react";
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { G, on, setPage, subscribe } from "./game";
import { dueCount } from "./learn";
import { t, getLang } from "./i18n";
import { C, F, GOLD, TAB_H, tabSpace } from "./theme";
import { hapTick } from "./fx";

const PAGES = ["scroll", "learn"];

export function Pager({ children }) {
  const { width, height } = useWindowDimensions();
  const ref = useRef(null);
  const x = useRef(new Animated.Value(PAGES.indexOf(G.page) * width)).current;
  useEffect(() => on("page", p => {
    if (ref.current) ref.current.scrollTo({ x: PAGES.indexOf(p) * width, animated: true });
  }), [width]);
  const settle = e => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (PAGES[i] && PAGES[i] !== G.page) { hapTick(); setPage(PAGES[i]); }
  };
  // Also catch a page that settles without a momentum event (a slow drag, or the web build).
  useEffect(() => {
    const id = x.addListener(({ value }) => {
      const i = Math.round(value / width);
      if (Math.abs(value - i * width) < 1 && PAGES[i] && PAGES[i] !== G.page) setPage(PAGES[i]);
    });
    return () => x.removeListener(id);
  }, [x, width]);
  return (
    <>
      <Animated.ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        bounces={false}
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        contentOffset={{ x: PAGES.indexOf(G.page) * width, y: 0 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x } } }], { useNativeDriver: true })}
        onMomentumScrollEnd={settle}
        style={StyleSheet.absoluteFill}
      >
        {children.map((c, i) => <View key={i} style={{ width, height }}>{c}</View>)}
      </Animated.ScrollView>
      <TabBar x={x} width={width} />
    </>
  );
}

const ScrollIcon = ({ color }) => (
  <Svg width={26} height={26} viewBox="0 0 24 24">
    <Rect x="5" y="2.5" width="14" height="19" rx="3.5" fill="none" stroke={color} strokeWidth={2} />
    <Path d="M9 13.5 L12 10.5 L15 13.5" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const LearnIcon = ({ color }) => (
  <Svg width={26} height={26} viewBox="0 0 24 24">
    <Path d="M12 6.5 C10 5 7 4.5 3.5 5 V18.5 C7 18 10 18.5 12 20 C14 18.5 17 18 20.5 18.5 V5 C17 4.5 14 5 12 6.5 Z" fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    <Path d="M12 6.5 V20" stroke={color} strokeWidth={2} />
  </Svg>
);

// Re-renders only when the page, the number of due memory checks or the language changes.
const barKey = () => `${G.page}|${dueCount()}|${getLang()}`;
const TabBar = memo(function TabBar({ x, width }) {
  useSyncExternalStore(subscribe, barKey);
  const insets = useSafeAreaInsets();
  const due = dueCount();
  const half = width / 2;
  const items = [["scroll", t("scrollTab"), ScrollIcon], ["learn", t("learn"), LearnIcon]];
  return (
    <View style={[s.bar, { height: tabSpace(insets), paddingBottom: tabSpace(insets) - TAB_H }]}>
      {/* The gold line slides under the active tab as the pages move. */}
      <Animated.View pointerEvents="none" style={[s.line, { width: 44, left: half / 2 - 22, transform: [{ translateX: x.interpolate({ inputRange: [0, width], outputRange: [0, half], extrapolate: "clamp" }) }] }]} />
      {items.map(([k, label, Icon], i) => {
        const on = G.page === k;
        const color = on ? C.ink : C.inkFaint;
        return (
          <Pressable key={k} testID={"tab-page-" + k} onPress={() => { hapTick(); setPage(k); }} style={s.item}>
            <View>
              <Icon color={color} />
              {k === "learn" && due ? <View style={s.dot}><Text style={s.dotT}>{due > 99 ? "99+" : due}</Text></View> : null}
            </View>
            <Text style={[s.label, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
});

const s = StyleSheet.create({
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", backgroundColor: "rgba(4,20,18,0.94)", borderTopWidth: 1, borderTopColor: C.line },
  item: { flex: 1, alignItems: "center", justifyContent: "center", gap: 1, paddingTop: 2 },
  label: { fontFamily: F.bold, fontSize: 11 },
  line: { position: "absolute", top: 0, height: 3, borderRadius: 2, backgroundColor: GOLD[1] },
  dot: { position: "absolute", top: -4, right: -12, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: "#ff6b5b", alignItems: "center", justifyContent: "center" },
  dotT: { color: "#fff", fontFamily: F.heavy, fontSize: 10 },
});
