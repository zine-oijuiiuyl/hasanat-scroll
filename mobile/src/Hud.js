// The top bar: tabs, level, points, Done, the sins counter, the combo and toasts.
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { levelFor, levelProgress } from "./web-data";
import { G, on, sTaps, lifeTaps, stageNow, switchTab, finish, openView } from "./game";
import { t, levelTitle, num } from "./i18n";
import { BuddyArt } from "./Buddy";
import { C, F, GOLD } from "./theme";
import { hapTick } from "./fx";
import { target } from "./targets";
import { Glyph, Icon } from "./Icon";

const TABS = [["dhikr", "tabDhikr"], ["dua", "tabDua"], ["quran", "tabQuran"], ["muh", "tabMuh"]];

function useBump(event) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => on(event, () => {
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }), [event, v]);
  return v.interpolate({ inputRange: [0, 0.4, 1], outputRange: [1, 1.14, 1] });
}

function Combo() {
  const [, force] = useState(0);
  useEffect(() => { const iv = setInterval(() => force(x => x + 1), 100); return () => clearInterval(iv); }, []);
  const S = G.S;
  const left = Math.max(0, 1 - (Date.now() - S.last) / S.window);
  if (left === 0 && S.combo) S.combo = 0;
  if (S.combo < 2) return <View style={{ height: 34 }} />;
  return (
    <View style={s.combo}>
      <Icon name="tasbih" size={18} />
      <Text style={s.comboT}>{t("combo", { n: S.combo })}</Text>
      <View style={s.drain}><View style={[s.drainB, { width: `${left * 100}%` }]} /></View>
    </View>
  );
}

function Toast() {
  const [tt, setT] = useState(G.toast);
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => on("toast", x => {
    setT(x);
    if (x) { a.setValue(0); Animated.spring(a, { toValue: 1, friction: 6, useNativeDriver: true }).start(); }
  }), [a]);
  if (!tt) return null;
  return (
    <Animated.View style={[s.toast, { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }, { scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }]}>
      <Glyph e={tt.icon} size={28} />
      <View style={{ flexShrink: 1 }}>
        <Text style={s.toastB}>{tt.title}</Text>
        {tt.sub ? <Text style={s.toastS}>{tt.sub}</Text> : null}
      </View>
    </Animated.View>
  );
}

function Debt() {
  const scale = useBump("debtTick");
  const d = G.life.debt;
  if (!G.life.gender) return null;
  if (!d) {
    return (
      <Pressable ref={target("debt")} onPress={() => { hapTick(); openView("debt"); }} style={s.debtAdd}>
        <Icon name="scale" size={17} /><Text style={s.debtAddT}>{t("debtTitle")}</Text>
      </Pressable>
    );
  }
  return (
    <Pressable ref={target("debt")} onPress={() => { hapTick(); openView("debt"); }}>
      <Animated.View style={[s.debt, d.done && { borderColor: C.gold2 }, { transform: [{ scale }] }]}>
        <Icon name="scale" size={22} />
        <Text style={s.debtNum}>{d.done ? t("debtDoneChip") : t("debtLeft", { n: num(d.left) })}</Text>
        <View style={s.dBar}><LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: "100%", width: `${(1 - d.left / d.start) * 100}%` }} /></View>
      </Animated.View>
    </Pressable>
  );
}

export default function Hud() {
  const insets = useSafeAreaInsets();
  const scale = useBump("bump");
  const p = lifeTaps(), lv = levelFor(p);
  const L = G.life;
  return (
    <View pointerEvents="box-none" style={[s.hud, { paddingTop: insets.top + 6 }]}>
      <View ref={target("tabs")} style={s.tabs}>
        {TABS.map(([k, label]) => (
          <Pressable key={k} testID={"tab-" + k} onPress={() => { hapTick(); switchTab(k); }} style={[s.tab, G.tab === k && s.tabOn]}>
            <Text style={[s.tabT, G.tab === k && { color: C.ink }]}>{t(label)}</Text>
          </Pressable>
        ))}
      </View>
      <View style={s.bar}>
        <Pressable ref={target("lvl")} testID="level" onPress={() => { hapTick(); openView("progress"); }} style={s.lvl}>
          <View style={{ width: 76, height: 41 }}>{L.gender ? <BuddyArt gender={L.gender} stage={stageNow()} mood={G.buddyMood} crop width={76} height={41} /> : null}</View>
          <View style={s.lvbar}>
            <LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.lvFill, { width: `${levelProgress(p) * 100}%` }]} />
            <Text style={s.lvNum}>{t("lv", { n: lv })}</Text>
          </View>
        </Pressable>
        <Animated.View ref={target("pts")} style={[s.score, { transform: [{ scale }] }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={s.star}>✦</Text>
            <Text style={s.pts}>{num(sTaps())}</Text>
          </View>
          <Text style={s.sub}>{t("pointsSub", { t: levelTitle(lv) })}</Text>
        </Animated.View>
        <View style={{ width: 76, alignItems: "flex-end" }}>
          <Pressable ref={target("done")} testID="done" onPress={() => { hapTick(); openView("summary", { sm: finish() }); }} style={s.done}>
            <Text style={s.doneT}>{t("done")}</Text>
          </Pressable>
        </View>
      </View>
      <Debt />
      <Combo />
      <Toast />
    </View>
  );
}

const s = StyleSheet.create({
  hud: { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: 16, alignItems: "center", gap: 10 },
  tabs: { flexDirection: "row", gap: 14, justifyContent: "center" },
  tab: { paddingTop: 4, paddingBottom: 6, paddingHorizontal: 2, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabOn: { borderBottomColor: C.gold1 },
  tabT: { fontSize: 14, fontFamily: F.heavy, color: "rgba(244,239,226,0.55)", textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } },
  bar: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  lvl: { width: 76, alignItems: "center", gap: 3 },
  lvbar: { width: 62, height: 14, borderRadius: 999, backgroundColor: "rgba(244,239,226,0.18)", overflow: "hidden", justifyContent: "center" },
  lvFill: { position: "absolute", top: 0, bottom: 0, left: 0, opacity: 0.85 },
  lvNum: { textAlign: "center", fontSize: 10, fontFamily: F.heavy, color: C.ink, letterSpacing: 0.4, textShadowColor: "rgba(0,0,0,0.55)", textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 } },
  score: { alignItems: "center", flex: 1 },
  star: { fontSize: 22, color: C.gold2 },
  pts: { fontSize: 36, fontFamily: F.heavy, color: C.ink, fontVariant: ["tabular-nums"] },
  sub: { fontSize: 12, fontFamily: F.bold, color: C.inkSoft, marginTop: 3 },
  done: { paddingVertical: 9, paddingHorizontal: 13, borderRadius: 999, backgroundColor: "rgba(244,239,226,0.16)" },
  doneT: { fontSize: 14, fontFamily: F.heavy, color: C.ink },
  combo: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: C.glass, height: 34 },
  comboT: { fontSize: 14, fontFamily: F.heavy, color: C.ink },
  drain: { width: 70, height: 6, borderRadius: 999, backgroundColor: C.line, overflow: "hidden" },
  drainB: { height: "100%", backgroundColor: C.gold2, borderRadius: 999 },
  toast: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999, backgroundColor: "rgba(10,30,26,0.9)", borderWidth: 1.5, borderColor: C.gold2, maxWidth: "100%" },
  toastB: { fontSize: 15, fontFamily: F.heavy, color: C.ink },
  toastS: { fontSize: 12, fontFamily: F.ui, color: C.inkSoft },
  debt: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9, paddingHorizontal: 16, borderRadius: 999, backgroundColor: C.glass, borderWidth: 1.5, borderColor: C.line },
  debtNum: { fontSize: 18, fontFamily: F.heavy, color: C.ink, fontVariant: ["tabular-nums"] },
  dBar: { width: 64, height: 6, borderRadius: 999, backgroundColor: C.line, overflow: "hidden" },
  debtAdd: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: C.glass, borderWidth: 1.5, borderStyle: "dashed", borderColor: C.gold2 },
  debtAddT: { fontSize: 15, fontFamily: F.heavy, color: C.ink },
});
