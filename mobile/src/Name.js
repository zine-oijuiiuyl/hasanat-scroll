// The person's name, shown on a tag over their buddy, and the field to type it.
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { T } from "./web-data";
import { G, setSetting } from "./game";
import { t } from "./i18n";
import { C, F } from "./theme";

// Translations are mine, like the rest of the app's strings.
const NM = {
  en: ["Your name", "Type your name"],
  ar: ["اسمك", "اكتب اسمك"],
  fr: ["Ton prénom", "Écris ton prénom"],
  es: ["Tu nombre", "Escribe tu nombre"],
  tr: ["Adın", "Adını yaz"],
  ur: ["آپ کا نام", "اپنا نام لکھیں"],
  id: ["Namamu", "Tulis namamu"],
  bn: ["তোমার নাম", "তোমার নাম লেখো"],
  ru: ["Твоё имя", "Напиши своё имя"],
  de: ["Dein Name", "Schreib deinen Namen"],
};
for (const [l, v] of Object.entries(NM)) if (T[l]) { T[l].ui.nameLabel = v[0]; T[l].ui.namePh = v[1]; }

export const MAX_NAME = 20;
export const cleanName = x => x.replace(/\s+/g, " ").trim().slice(0, MAX_NAME);
export const setName = x => setSetting("name", cleanName(x));

// A small tag with the name, or nothing until one is set.
export function NameTag({ size = 13, style }) {
  const name = G.life.name;
  if (!name) return null;
  return (
    <View pointerEvents="none" style={[s.tag, { paddingVertical: size * 0.22, paddingHorizontal: size * 0.75 }, style]}>
      <Text style={[s.tagT, { fontSize: size }]} numberOfLines={1}>{name}</Text>
    </View>
  );
}

// The name as an editable tag, saved as it is typed.
export function NameField({ style }) {
  const [value, setValue] = useState(G.life.name || "");
  return (
    <TextInput
      value={value}
      onChangeText={x => { setValue(x.slice(0, MAX_NAME)); setName(x); }}
      placeholder={"✎ " + t("namePh")}
      placeholderTextColor={C.inkFaint}
      maxLength={MAX_NAME}
      returnKeyType="done"
      autoCorrect={false}
      textAlign="center"
      style={[s.field, style]}
      testID="nameField"
    />
  );
}

const s = StyleSheet.create({
  tag: { alignSelf: "center", maxWidth: 160, borderRadius: 999, backgroundColor: "rgba(10,30,26,0.82)", borderWidth: 1.2, borderColor: C.gold2 },
  tagT: { fontFamily: F.heavy, color: C.ink, textAlign: "center" },
  field: { textAlign: "center", minWidth: 200, maxWidth: 300, paddingVertical: 9, paddingHorizontal: 18, borderRadius: 999, fontFamily: F.heavy, fontSize: 18, color: C.ink, backgroundColor: "rgba(244,239,226,0.1)", borderWidth: 1.5, borderColor: C.gold2 },
});
