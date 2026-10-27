// Hearting a card in the feed, and the list of hearted cards on the Done screen.
import { useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { BY_ID, T } from "./web-data";
import { G, toggleHeart } from "./game";
import { t, meaning } from "./i18n";
import { Panel, Label, s as u } from "./ui";
import { C, F } from "./theme";
import { hapTick, hapOk } from "./fx";

// Translations are mine, like the rest of the app's strings.
const HT = {
  en: ["Hearted cards", "Tap ✷ on any card to keep it here."],
  ar: ["البطاقات المفضلة", "اضغط ✷ على أي بطاقة لحفظها هنا."],
  fr: ["Cartes aimées", "Touche ✷ sur une carte pour la garder ici."],
  es: ["Tarjetas favoritas", "Toca ✷ en cualquier tarjeta para guardarla aquí."],
  tr: ["Beğenilen kartlar", "Burada tutmak için bir kartta ✷'ye dokun."],
  ur: ["پسندیدہ کارڈز", "کسی بھی کارڈ پر ✷ دبائیں تاکہ وہ یہاں محفوظ ہو جائے۔"],
  id: ["Kartu yang disukai", "Ketuk ✷ pada kartu mana pun untuk menyimpannya di sini."],
  bn: ["পছন্দের কার্ড", "যেকোনো কার্ডে ✷ চাপো, সেটি এখানে থাকবে।"],
  ru: ["Любимые карточки", "Нажми ✷ на любой карточке, чтобы сохранить её здесь."],
  de: ["Gemerkte Karten", "Tippe auf ✷ bei einer Karte, um sie hier zu behalten."],
};
for (const [l, v] of Object.entries(HT)) if (T[l]) { T[l].ui.hrtTitle = v[0]; T[l].ui.hrtEmpty = v[1]; }

// The "heart" is drawn as a gold eight-point star, the shape in the background pattern, so it fits the
// app instead of looking like Instagram's heart (Zine, 2026-10-27). The names stay "heart" in the code.
const STAR = "M12.00 1.50 L14.37 6.27 L19.42 4.58 L17.73 9.63 L22.50 12.00 L17.73 14.37 L19.42 19.42 L14.37 17.73 L12.00 22.50 L9.63 17.73 L4.58 19.42 L6.27 14.37 L1.50 12.00 L6.27 9.63 L4.58 4.58 L9.63 6.27Z";

export function HeartIcon({ on, size = 30 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffeaa6" /><Stop offset="0.55" stopColor="#f5b83d" /><Stop offset="1" stopColor="#c98a1b" />
        </LinearGradient>
      </Defs>
      <Path d={STAR} fill={on ? "url(#hg)" : "rgba(0,0,0,0.18)"} stroke={on ? "#7a4a0a" : "#f4efe2"} strokeWidth={1.5} strokeLinejoin="round" />
      {on ? <Path d="M9.6 8.4 L11.2 7.4" stroke="#fff6cc" strokeWidth={1.3} strokeLinecap="round" /> : null}
    </Svg>
  );
}

// The heart on a feed card: pops when tapped.
export function HeartButton({ id, on, style }) {
  const pop = useRef(new Animated.Value(0)).current;
  const press = () => {
    const now = toggleHeart(id);
    if (now) {
      hapOk();
      pop.setValue(0);
      Animated.timing(pop, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    } else hapTick();
  };
  const scale = pop.interpolate({ inputRange: [0, 0.35, 0.65, 1], outputRange: [1, 1.45, 0.9, 1] });
  return (
    <Pressable onPress={press} hitSlop={14} testID={"heart-" + id} style={[s.btn, style]} accessibilityRole="button" accessibilityState={{ selected: on }}>
      <Animated.View style={{ transform: [{ scale }] }}><HeartIcon on={on} size={34} /></Animated.View>
    </Pressable>
  );
}

// Every hearted card, newest first, with its heart to take it off the list.
export function HeartedPanel() {
  const list = (G.life.hearts || []).map(id => BY_ID[id]).filter(Boolean);
  return (
    <Panel>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><HeartIcon on size={16} /><Label>{t("hrtTitle")} · {list.length}</Label></View>
      {list.length ? list.map(d => (
        <View key={d.id} style={s.row}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.ar} numberOfLines={2}>{d.ar}</Text>
            <Text style={u.rowT} numberOfLines={1}>{d.tr}</Text>
            <Text style={s.mean} numberOfLines={2}>{meaning(d)}</Text>
          </View>
          <Pressable onPress={() => { hapTick(); toggleHeart(d.id); }} hitSlop={10} testID={"unheart-" + d.id}><HeartIcon on size={26} /></Pressable>
        </View>
      )) : <Text style={[u.note, { textAlign: "left" }]}>{t("hrtEmpty")}</Text>}
    </Panel>
  );
}

const s = StyleSheet.create({
  btn: { position: "absolute", right: 16, width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.16)" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  ar: { fontFamily: F.ar, fontSize: 20, color: C.ink, writingDirection: "rtl", textAlign: "right" },
  mean: { fontSize: 13, fontFamily: F.ui, color: C.inkSoft },
});
