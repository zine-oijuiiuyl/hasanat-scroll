// The buddy's name, shown on a tag over it: Ahmed for the boy, Fatima for the girl (Zine, 2026-10-26).
import { StyleSheet, Text, View } from "react-native";
import { G, isCalm } from "./game";
import { getLang } from "./i18n";
import { C, F } from "./theme";

const ARABIC_SCRIPT = ["ar", "ur"];
export const buddyName = (gender = G.life.gender) => {
  const ar = ARABIC_SCRIPT.includes(getLang());
  return gender === "f" ? (ar ? "فاطمة" : "Fatima") : (ar ? "أحمد" : "Ahmed");
};

// A small tag with the buddy's name.
export function NameTag({ size = 13, style }) {
  if (!G.life.gender || isCalm()) return null;
  return (
    <View pointerEvents="none" style={[s.tag, { paddingVertical: size * 0.22, paddingHorizontal: size * 0.75 }, style]}>
      <Text style={[s.tagT, { fontSize: size }]} numberOfLines={1}>{buddyName()}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  tag: { alignSelf: "center", maxWidth: 160, borderRadius: 999, backgroundColor: "rgba(10,30,26,0.82)", borderWidth: 1.2, borderColor: C.gold2 },
  tagT: { fontFamily: F.heavy, color: C.ink, textAlign: "center" },
});
