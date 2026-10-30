// The mute button on the scroll page (Zine, 2026-10-30): a tap mutes everything (and a second tap brings back what
// was on), a long press shows three small switches, the weather sounds, the scroll sound and the reading aloud.
// Bottom left in calm; in game mode the buddy lives there, so it sits above the heart instead.
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { G, setSetting, isCalm } from "./game";
import { T } from "./web-data";
import { t } from "./i18n";
import { C, F } from "./theme";
import { hapTick } from "./fx";
import { stopRecite } from "./recite";

function Speaker({ off, size = 26, color = "#fff" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 9h4l5-4v14l-5-4H4z" fill={color} />
      {off ? <Path d="M17 9l5 6M22 9l-5 6" /> : <Path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />}
    </Svg>
  );
}

const ROWS = [
  ["muteWx", () => G.life.weatherSound !== false, v => setSetting("weatherSound", v)],
  ["muteScroll", () => !!G.life.sound, v => setSetting("sound", v)],
  ["muteRecite", () => G.life.recite !== false, v => { setSetting("recite", v); if (!v) stopRecite(); }],
];

// Mute all, remembering what was on so the next tap brings exactly that back.
function toggleAll() {
  const L = G.life;
  if (ROWS.some(([, get]) => get())) {
    L.muteWas = { weatherSound: L.weatherSound !== false, sound: !!L.sound, recite: L.recite !== false };
    ROWS.forEach(([, , set]) => set(false));
  } else {
    const w = L.muteWas && (L.muteWas.weatherSound || L.muteWas.sound || L.muteWas.recite) ? L.muteWas : { weatherSound: true, sound: true, recite: true };
    ROWS.forEach(([k, , set]) => set(w[{ muteWx: "weatherSound", muteScroll: "sound", muteRecite: "recite" }[k]]));
  }
}

export default function MuteButton({ bottom }) {
  const [open, setOpen] = useState(false);
  const allOff = ROWS.every(([, get]) => !get());
  const side = isCalm() || G.life.feedBuddy === false ? { left: 40 } : { right: 40 };
  const lift = isCalm() || G.life.feedBuddy === false ? 0 : 70;
  return (
    <>
      {open ? <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} /> : null}
      {open ? (
        <View style={[s.menu, side, { bottom: bottom + lift + 64 }]}>
          {ROWS.map(([k, get, set]) => {
            const onNow = get();
            return (
              <Pressable key={k} testID={k} onPress={() => { hapTick(); set(!onNow); }} style={[s.row, !onNow && s.rowOff]}>
                <Speaker off={!onNow} size={18} color={onNow ? "#fff" : C.inkFaint} />
                <Text style={[s.rowT, !onNow && { color: C.inkFaint }]}>{t(k)}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <Pressable testID="mute" hitSlop={14} onPress={() => { hapTick(); if (open) setOpen(false); else toggleAll(); }}
        onLongPress={() => { hapTick(); setOpen(true); }} delayLongPress={350} style={[s.btn, side, { bottom: bottom + lift }]}>
        <Speaker off={allOff} />
      </Pressable>
    </>
  );
}

const s = StyleSheet.create({
  btn: { position: "absolute", width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.16)" },
  menu: { position: "absolute", gap: 8, padding: 8, borderRadius: 18, backgroundColor: "rgba(10,20,40,0.88)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.1)" },
  rowOff: { backgroundColor: "transparent" },
  rowT: { color: "#fff", fontFamily: F.bold, fontSize: 14 },
});

const UI = {
  en: { muteWx: "Weather", muteScroll: "Scrolling", muteRecite: "Reciting" },
  ar: { muteWx: "الطقس", muteScroll: "التمرير", muteRecite: "التلاوة" },
  fr: { muteWx: "Météo", muteScroll: "Défilement", muteRecite: "Récitation" },
  es: { muteWx: "Clima", muteScroll: "Deslizar", muteRecite: "Recitación" },
  tr: { muteWx: "Hava", muteScroll: "Kaydırma", muteRecite: "Okuma" },
  ur: { muteWx: "موسم", muteScroll: "اسکرول", muteRecite: "تلاوت" },
  id: { muteWx: "Cuaca", muteScroll: "Gulir", muteRecite: "Bacaan" },
  bn: { muteWx: "আবহাওয়া", muteScroll: "স্ক্রল", muteRecite: "তিলাওয়াত" },
  ru: { muteWx: "Погода", muteScroll: "Прокрутка", muteRecite: "Чтение" },
  de: { muteWx: "Wetter", muteScroll: "Scrollen", muteRecite: "Vorlesen" },
};
for (const [l, v] of Object.entries(UI)) if (T[l]) Object.assign(T[l].ui, v);
