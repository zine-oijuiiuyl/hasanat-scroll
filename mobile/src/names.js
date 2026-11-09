// The 99 Names of Allah as a fifth feed tab (Zine, 2026-11-09): one card per name, in order,
// with the same look as the other tabs.
import { LIB, BY_ID, NEW_T, T } from "./web-data";
import { NAME_ROWS } from "./names-data";

const LANG_COL = { en: 2, fr: 3, es: 4, tr: 5, ur: 6, id: 7, bn: 8, ru: 9, de: 10 };
export const NAMES = NAME_ROWS.map(([ar, tr, en], n) => {
  // Cards in the app's own colours, like the other tabs (Zine, 2026-11-09); the source line shows the count.
  const d = { id: "nm_" + String(n + 1).padStart(2, "0"), ar, tr, en, src: String(n + 1).padStart(2, "0") + " / 99", kind: "name", pal: n, w: 1, i: LIB.length, n };
  LIB.push(d);
  BY_ID[d.id] = d;
  return d;
});
for (const [l, col] of Object.entries(LANG_COL)) {
  if (!NEW_T[l]) NEW_T[l] = {};
  NAMES.forEach((d, n) => { NEW_T[l][d.id] = NAME_ROWS[n][col]; });
}

// Translations are mine, like the rest of the app's strings.
const UI = {
  en: { tabNames: "99 Names", kName: "AL-ASMA' AL-HUSNA · الأسماء الحسنى", nameSay: "Say it slowly, in your heart." },
  ar: { tabNames: "الأسماء الحسنى", kName: "الأسماء الحسنى", nameSay: "قُلها بهدوء، في قلبك." },
  fr: { tabNames: "99 Noms", kName: "LES 99 NOMS · الأسماء الحسنى", nameSay: "Dis-le doucement, dans ton cœur." },
  es: { tabNames: "99 Nombres", kName: "LOS 99 NOMBRES · الأسماء الحسنى", nameSay: "Dilo despacio, en tu corazón." },
  tr: { tabNames: "Esmaül Hüsna", kName: "ESMAÜL HÜSNA · الأسماء الحسنى", nameSay: "Yavaşça, kalbinden söyle." },
  ur: { tabNames: "اسماء الحسنیٰ", kName: "اسماء الحسنیٰ · الأسماء الحسنى", nameSay: "آہستہ سے، دل میں کہیں۔" },
  id: { tabNames: "Asmaul Husna", kName: "ASMAUL HUSNA · الأسماء الحسنى", nameSay: "Ucapkan perlahan, di dalam hatimu." },
  bn: { tabNames: "৯৯ নাম", kName: "আসমাউল হুসনা · الأسماء الحسنى", nameSay: "ধীরে ধীরে, মনে মনে বলো।" },
  ru: { tabNames: "99 имён", kName: "99 ИМЁН АЛЛАХА · الأسماء الحسنى", nameSay: "Произнеси медленно, в своём сердце." },
  de: { tabNames: "99 Namen", kName: "DIE 99 NAMEN · الأسماء الحسنى", nameSay: "Sprich ihn langsam, in deinem Herzen." },
};
for (const [l, v] of Object.entries(UI)) if (T[l]) Object.assign(T[l].ui, v);
