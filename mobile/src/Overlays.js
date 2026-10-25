// The buddy in the corner with its speech bubble, the "+1" floaters and confetti.
import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { G, on, stageNow } from "./game";
import { BuddyArt, useBuddyMotion } from "./Buddy";
import { C, F, GOLD, TAB_H } from "./theme";
import { target } from "./targets";

export function BuddyLayer() {
  const insets = useSafeAreaInsets();
  const [style, api] = useBuddyMotion();
  const [cheer, setCheer] = useState(G.cheer);
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = on("hop", api.hop), b = on("cheerBuddy", api.cheer);
    const c = on("cheer", x => {
      setCheer(x);
      if (x) { pop.setValue(0); Animated.spring(pop, { toValue: 1, friction: 6, useNativeDriver: true }).start(); }
    });
    return () => { a(); b(); c(); };
  }, [api, pop]);
  if (!G.life.gender) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View ref={target("buddy")} style={[s.buddy, { bottom: insets.bottom + TAB_H + 14 }, style]}>
        <BuddyArt gender={G.life.gender} stage={stageNow()} mood={G.buddyMood} width={128} height={110} />
      </Animated.View>
      {cheer ? (
        <Animated.View style={[s.cheer, { bottom: insets.bottom + TAB_H + 136, opacity: pop, transform: [{ translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }, { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }]}>
          <View style={s.bubble}>
            <Text style={{ fontSize: 30 }}>{cheer.icon}</Text>
            <View style={{ flexShrink: 1 }}>
              <Text style={s.bubbleB}>{cheer.title}</Text>
              {cheer.sub ? <Text style={s.bubbleS}>{cheer.sub}</Text> : null}
            </View>
          </View>
          <View style={s.tail} />
        </Animated.View>
      ) : null}
    </View>
  );
}

function Floater({ gold, onDone }) {
  const a = useRef(new Animated.Value(0)).current;
  const dx = useRef(Math.random() * 140 - 70).current;
  useEffect(() => { Animated.timing(a, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(onDone); }, [a, onDone]);
  return (
    <Animated.Text style={[s.floater, gold && s.floaterG, {
      opacity: a.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 0.9, 0] }),
      transform: [{ translateX: dx }, { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, -160] }) }, { scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.15] }) }],
    }]}>+1</Animated.Text>
  );
}

export function Floaters() {
  const [items, setItems] = useState([]);
  useEffect(() => on("floater", gold => setItems(x => x.slice(-6).concat({ id: Date.now() + Math.random(), gold }))), []);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: "center" }]}>
      <View style={{ position: "absolute", top: "68%", alignItems: "center", width: "100%" }}>
        {items.map(it => <Floater key={it.id} gold={it.gold} onDone={() => setItems(x => x.filter(y => y.id !== it.id))} />)}
      </View>
    </View>
  );
}

// A burst of paper pieces that fly up and fall, from the middle of the screen or from the buddy.
function Burst({ gold, from, onDone }) {
  const { width: W, height: H } = Dimensions.get("window");
  const a = useRef(new Animated.Value(0)).current;
  const parts = useRef(Array.from({ length: 70 }, () => {
    const fromBuddy = from === "buddy";
    const ang = fromBuddy ? -(0.08 + Math.random() * 0.55) * Math.PI : -Math.random() * Math.PI;
    const sp = 350 + Math.random() * 550;
    const cols = gold ? ["#ffe08a", "#f5b83d", "#c98a1b", "#fff"] : ["#ffe08a", "#ff9f2e", "#7fe0c3", "#5fc6d8", "#ff8fb1", "#fff"];
    return {
      ox: fromBuddy ? 70 : W / 2, oy: fromBuddy ? H - 120 : H * 0.35,
      vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, rot: Math.random() * 720 - 360,
      col: cols[Math.random() * cols.length | 0], w: 6 + Math.random() * 6, h: 8 + Math.random() * 8,
    };
  })).current;
  useEffect(() => { Animated.timing(a, { toValue: 1, duration: 2200, easing: Easing.linear, useNativeDriver: true }).start(onDone); }, [a, onDone]);
  // Position over time with gravity, sampled so Animated can interpolate it on the native thread.
  const T = 2.2, g = 900, steps = [0, 0.1, 0.2, 0.35, 0.5, 0.7, 0.85, 1];
  return parts.map((p, i) => (
    <Animated.View key={i} style={{
      position: "absolute", left: p.ox, top: p.oy, width: p.w, height: p.h, backgroundColor: p.col, borderRadius: 2,
      opacity: a.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] }),
      transform: [
        { translateX: a.interpolate({ inputRange: steps, outputRange: steps.map(k => p.vx * k * T * (1 - k * 0.35)) }) },
        { translateY: a.interpolate({ inputRange: steps, outputRange: steps.map(k => p.vy * k * T + 0.5 * g * (k * T) ** 2 * 0.6) }) },
        { rotate: a.interpolate({ inputRange: [0, 1], outputRange: ["0deg", p.rot + "deg"] }) },
      ],
    }} />
  ));
}

export function Confetti() {
  const [bursts, setBursts] = useState([]);
  useEffect(() => on("confetti", (gold, from) => setBursts(x => x.slice(-2).concat({ id: Date.now() + Math.random(), gold, from }))), []);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {bursts.map(b => <Burst key={b.id} gold={b.gold} from={b.from} onDone={() => setBursts(x => x.filter(y => y.id !== b.id))} />)}
    </View>
  );
}

const s = StyleSheet.create({
  buddy: { position: "absolute", left: 6, width: 128, height: 110 },
  cheer: { position: "absolute", left: 12, width: "78%", maxWidth: 320 },
  bubble: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 22, backgroundColor: "rgba(10,30,26,0.94)", borderWidth: 1.5, borderColor: C.gold2 },
  tail: { position: "absolute", left: 36, bottom: -8, width: 16, height: 16, backgroundColor: "rgba(10,30,26,0.97)", borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: C.gold2, transform: [{ rotate: "45deg" }] },
  bubbleB: { fontSize: 17, fontFamily: F.heavy, color: C.ink },
  bubbleS: { fontSize: 12.5, fontFamily: F.ui, color: C.inkSoft, lineHeight: 17, marginTop: 2 },
  floater: { position: "absolute", fontSize: 30, fontFamily: F.heavy, color: C.ink, textShadowColor: "rgba(0,0,0,0.4)", textShadowRadius: 14, textShadowOffset: { width: 0, height: 4 } },
  floaterG: { fontSize: 40, color: GOLD[1] },
});
