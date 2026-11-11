// The bar on top of the screen while the adhan plays (adhan.js), with its Stop button.
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { G } from "./game";
import { t } from "./i18n";
import { pName } from "./prayer";
import { stopAdhan } from "./adhan";
import { C, F, GOLD } from "./theme";
import { Ico } from "./Icons";
import { hapTick } from "./fx";

export default function AdhanBar() {
  const insets = useSafeAreaInsets();
  const a = G.adhan;
  if (!a) return null;
  return (
    <View style={[s.wrap, { top: insets.top + 8 }]} pointerEvents="box-none" testID="adhanBar">
      <View style={s.bar}>
        <Ico e="🕌" size={26} />
        <Text style={s.t} numberOfLines={1}>{a.k ? t("adhanNow", { p: pName(a.k) }) : t("adhan")}</Text>
        <Pressable onPress={() => { hapTick(); stopAdhan(); }} style={({ pressed }) => [s.btn, pressed && { opacity: 0.8 }]} testID="adhanStop">
          <LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 999 }]} />
          <Text style={s.btnT}>{t("adhanStop")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { position: "absolute", left: 12, right: 12, alignItems: "center", zIndex: 50, elevation: 50 },
  bar: { flexDirection: "row", alignItems: "center", gap: 10, maxWidth: 460, width: "100%", backgroundColor: "rgba(6,26,24,0.94)", borderColor: C.gold2, borderWidth: 1.5, borderRadius: 999, paddingVertical: 8, paddingLeft: 14, paddingRight: 8 },
  t: { flex: 1, color: C.ink, fontFamily: F.heavy, fontSize: 16 },
  btn: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 9, overflow: "hidden" },
  btnT: { color: "#2a1a00", fontFamily: F.heavy, fontSize: 15 },
});
