// Small shared pieces for the full-screen sheets.
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { LANGS } from "./web-data";
import { getLang, t } from "./i18n";
import { setLang } from "./game";
import { C, F, GOLD } from "./theme";
import { hapTick } from "./fx";
import { Ico, IconText, splitIcon } from "./Icons";

export const Panel = ({ gold, style, children }) => <View style={[s.panel, gold && s.panelGold, style]}>{children}</View>;
export const Label = ({ children, style }) => <IconText style={[s.label, style]} row={{ justifyContent: "flex-start" }} size={13}>{children}</IconText>;
export const Cap = ({ children, style }) => <Text style={[s.cap, style]}>{children}</Text>;

export const Bar = ({ value, height = 8 }) => (
  <View style={[s.progress, { height }]}>
    <LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: "100%", width: `${Math.max(0, Math.min(1, value)) * 100}%`, borderRadius: 999 }} />
  </View>
);

export const Tile = ({ icon, v, k }) => (
  <View style={s.tile}>
    <Ico e={icon} size={22} />
    <Text style={s.tileV} numberOfLines={1} adjustsFontSizeToFit>{v}</Text>
    <Text style={s.tileK} numberOfLines={2}>{k}</Text>
  </View>
);
export const Tiles = ({ children }) => <View style={s.tiles}>{children}</View>;

export function Btn({ title, onPress, primary, danger, style, testID }) {
  const [icon, text] = splitIcon(title);
  const label = <Text style={[s.btnT, primary && { color: "#2a1a00" }, danger && { color: "#ffb4a8" }]}>{text}</Text>;
  const inner = icon ? <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><Ico e={icon} size={22} />{label}</View> : label;
  return (
    <Pressable testID={testID} onPress={() => { hapTick(); onPress(); }} style={({ pressed }) => [s.btn, !primary && s.secondary, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }, style]}>
      {primary ? <LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 999 }]} /> : null}
      {inner}
    </Pressable>
  );
}

export const Toggle = ({ label, value, onChange }) => (
  <View style={s.toggle}>
    <Text style={s.toggleT}>{label}</Text>
    <Switch value={!!value} onValueChange={v => { hapTick(); onChange(v); }} trackColor={{ true: C.gold2 }} />
  </View>
);

// A row of choices, used for the language and the other settings that were <select>s on the web.
export function Choice({ label, value, options, onChange }) {
  return (
    <View style={{ gap: 8 }}>
      {label ? <IconText style={s.toggleT} row={{ justifyContent: "flex-start" }} size={14}>{label}</IconText> : null}
      <View style={s.chips}>
        {options.map(([k, name]) => (
          <Pressable key={String(k)} onPress={() => { hapTick(); onChange(k); }} style={[s.chip, value === k && s.chipOn]}>
            <Text style={s.chipT}>{name}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export const LangPicker = () => (
  <Choice label={"🌐 " + t("language")} value={getLang()} options={Object.entries(LANGS).map(([k, v]) => [k, v.name])} onChange={setLang} />
);

export const s = StyleSheet.create({
  panel: { backgroundColor: C.panel, borderRadius: 20, padding: 16, gap: 12 },
  panelGold: { borderWidth: 1.5, borderColor: C.gold2, backgroundColor: "rgba(245,184,61,0.08)", flexDirection: "row", alignItems: "center", gap: 14 },
  label: { fontSize: 11, fontFamily: F.heavy, letterSpacing: 1.5, textTransform: "uppercase", color: C.inkFaint },
  cap: { color: C.inkSoft, fontFamily: F.bold, fontSize: 14, textAlign: "center" },
  progress: { borderRadius: 999, backgroundColor: "rgba(244,239,226,0.1)", overflow: "hidden" },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: { width: "31%", flexGrow: 1, backgroundColor: "rgba(244,239,226,0.08)", borderRadius: 16, paddingVertical: 14, paddingHorizontal: 6, alignItems: "center", gap: 4 },
  tileV: { fontSize: 22, fontFamily: F.heavy, color: C.ink, fontVariant: ["tabular-nums"] },
  tileK: { fontSize: 12, fontFamily: F.ui, color: C.inkFaint, textAlign: "center" },
  btn: { height: 52, borderRadius: 999, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, overflow: "hidden" },
  secondary: { backgroundColor: "rgba(244,239,226,0.15)" },
  btnT: { fontFamily: F.heavy, fontSize: 16, color: C.ink, textAlign: "center" },
  toggle: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  toggleT: { fontFamily: F.bold, fontSize: 15, color: C.ink, flexShrink: 1 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 13, borderRadius: 999, backgroundColor: "rgba(244,239,226,0.1)", borderWidth: 1.5, borderColor: C.line },
  chipOn: { borderColor: C.gold2, backgroundColor: "rgba(245,184,61,0.18)" },
  chipT: { fontFamily: F.heavy, fontSize: 14, color: C.ink },
  row: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  rowT: { flex: 1, fontSize: 14, fontFamily: F.bold, color: C.ink },
  rowA: { fontFamily: F.ar, fontSize: 19, color: C.ink, maxWidth: "45%", writingDirection: "rtl" },
  rowN: { fontFamily: F.heavy, fontSize: 14, color: C.ink, fontVariant: ["tabular-nums"] },
  note: { textAlign: "center", fontSize: 13, fontFamily: F.ui, color: C.inkFaint, lineHeight: 19 },
  arh: { fontFamily: F.ar, fontSize: 44, color: C.gold1, textAlign: "center", lineHeight: 70, writingDirection: "rtl" },
  big: { fontSize: 66, fontFamily: F.heavy, color: C.ink, textAlign: "center", fontVariant: ["tabular-nums"] },
});
