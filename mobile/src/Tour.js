// First-launch tutorial and the language/buddy picker.
import { useEffect, useState } from "react";
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { G, TOUR, endTour, goTour, pickBuddy } from "./game";
import { t } from "./i18n";
import { measure } from "./targets";
import { BuddyArt } from "./Buddy";
import { LangPicker, s as u } from "./ui";
import { C, F, GOLD } from "./theme";
import { Ico } from "./Icons";

export function Tour() {
  const i = G.tourStep;
  const [spot, setSpot] = useState(null);
  const step = i >= 0 ? TOUR[i] : null;
  useEffect(() => {
    let live = true;
    setSpot(null);
    // Measured again after a moment: a sheet that is still sliding in reports a position that is a bit off.
    const place = () => measure(step.target).then(r => { if (live && r) setSpot({ x: r.x - 8, y: r.y - 8, w: r.w + 16, h: r.h + 16 }); });
    let timers = [];
    if (step && step.target) { place(); timers = [setTimeout(place, 500), setTimeout(place, 1000)]; }
    return () => { live = false; timers.forEach(clearTimeout); };
  }, [i, step]);
  const { height: H } = Dimensions.get("window");
  const insets = useSafeAreaInsets();
  if (!step) return null;
  // Steps that wait for you to do something leave the screen touchable; the others block it.
  const block = !!step.next;
  // The button bar at the bottom of a sheet is easy to find without a box, so the tip just sits above it.
  const aboveBar = step.target === "close";
  const top = aboveBar ? { bottom: insets.bottom + 92 } : spot ? (spot.y + spot.h / 2 < H / 2 ? { top: spot.y + spot.h + 14 } : { bottom: H - spot.y + 14 }) : (step.last ? { top: H * 0.34 } : { top: H * 0.16 });
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {block ? <View style={StyleSheet.absoluteFill} /> : null}
      {spot && !aboveBar ? <View pointerEvents="none" style={[s.spot, { left: spot.x, top: spot.y, width: spot.w, height: spot.h }]} /> : null}
      {step.hand ? <View pointerEvents="none" style={[s.hand, { top: "62%" }]}><Ico e="👆" size={60} /></View> : null}
      {step.tapHand ? <View pointerEvents="none" style={[s.hand, { top: "57%" }]}><Ico e="👆" size={60} /></View> : null}
      <View style={[s.tip, top]}>
        <Text style={s.tipT}>{t(step.k, step.vars && step.vars())}</Text>
        <View style={s.foot}>
          <Text style={s.count}>{i + 1} / {TOUR.length}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {step.last ? null : <Pressable onPress={endTour} style={s.skip}><Text style={s.skipT}>{t("tutSkip")}</Text></Pressable>}
            {step.next ? (
              <Pressable testID="tourNext" onPress={() => goTour(i + 1)} style={s.next}>
                <LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                <Text style={s.nextT}>{step.last ? t("tutStart") : t("tutNext")}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

export function Picker() {
  const insets = useSafeAreaInsets();
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={["#0b2b26", "#163832", "#051f20"]} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", gap: 14, padding: 20, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
        <View style={{ width: "100%", maxWidth: 420 }}><LangPicker /></View>
        <Text style={u.arh}>بِسْمِ ٱللَّٰهِ</Text>
        <Text style={s.h1}>{t("pickTitle")}</Text>
        <Text style={s.p}>{t("pickText")}</Text>
        <View style={s.choices}>
          {[["m", "boy"], ["f", "girl"]].map(([g, k]) => (
            <Pressable key={g} testID={"pick-" + g} onPress={() => pickBuddy(g)} style={({ pressed }) => [s.choice, pressed && { transform: [{ scale: 0.96 }], borderColor: C.gold2 }]}>
              <BuddyArt gender={g} stage={0} width={150} height={129} />
              <Text style={s.choiceT}>{t(k)}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.small}>{t("pickHint")}</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  spot: { position: "absolute", borderRadius: 18, borderWidth: 2, borderColor: C.gold2 },
  hand: { position: "absolute", alignSelf: "center", fontSize: 52 },
  tip: { position: "absolute", left: 16, right: 16, alignSelf: "center", maxWidth: 384, padding: 16, paddingBottom: 14, borderRadius: 22, backgroundColor: "#0f2f2b", borderWidth: 1.5, borderColor: C.gold2 },
  tipT: { fontSize: 16, lineHeight: 22, fontFamily: F.bold, color: C.ink, marginBottom: 12 },
  foot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  count: { fontSize: 12, fontFamily: F.heavy, color: C.inkFaint },
  skip: { height: 38, paddingHorizontal: 14, borderRadius: 999, backgroundColor: "rgba(244,239,226,0.12)", justifyContent: "center" },
  skipT: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  next: { height: 38, paddingHorizontal: 18, borderRadius: 999, justifyContent: "center", overflow: "hidden" },
  nextT: { fontFamily: F.heavy, fontSize: 14, color: "#2a1a00" },
  h1: { fontSize: 28, fontFamily: F.heavy, color: C.ink, textAlign: "center" },
  p: { maxWidth: 400, fontSize: 15, lineHeight: 22, fontFamily: F.ui, color: C.inkSoft, textAlign: "center" },
  choices: { flexDirection: "row", gap: 14, width: "100%", maxWidth: 420 },
  choice: { flex: 1, alignItems: "center", gap: 6, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 24, backgroundColor: "rgba(244,239,226,0.08)", borderWidth: 1.5, borderColor: C.line },
  choiceT: { fontSize: 18, fontFamily: F.heavy, color: C.ink },
  small: { fontSize: 12, fontFamily: F.ui, color: C.inkFaint, textAlign: "center" },
});
