import { getLocales } from "expo-localization";
import { T, LANGS, NEW_T } from "./web-data";

// "Glass" scroll sound label, added for the native app.
const GLASS = { en: "Glass", ar: "زجاج", fr: "Verre", es: "Cristal", tr: "Cam", ur: "شیشہ", id: "Kaca", bn: "কাচ", ru: "Стекло", de: "Glas" };
// "Continue" on the growth scene.
const CONT = { en: "Continue", ar: "متابعة", fr: "Continuer", es: "Continuar", tr: "Devam", ur: "جاری رکھیں", id: "Lanjut", bn: "চালিয়ে যাও", ru: "Продолжить", de: "Weiter" };
for (const k of Object.keys(GLASS)) if (T[k]) { T[k].ui.sndGlass = GLASS[k]; T[k].ui.cont = CONT[k]; }
// Optional donation button on the Done screen (src/support.js).
const SUPPORT = {
  en: ["Support the app", "Free, with no ads. If it helps you, you can support it.", "Support", "The link is coming soon, in sha Allah."],
  ar: ["ادعم التطبيق", "مجاني وبلا إعلانات. إن نفعك يمكنك دعمه.", "ادعم", "الرابط قريبًا إن شاء الله."],
  fr: ["Soutenir l'appli", "Gratuite et sans pub. Si elle t'aide, tu peux la soutenir.", "Soutenir", "Le lien arrive bientôt, in sha Allah."],
  es: ["Apoya la app", "Gratis y sin anuncios. Si te ayuda, puedes apoyarla.", "Apoyar", "El enlace llegará pronto, in sha Allah."],
  tr: ["Uygulamayı destekle", "Ücretsiz ve reklamsız. Faydalı olduysa destek olabilirsin.", "Destekle", "Bağlantı yakında geliyor, inşallah."],
  ur: ["ایپ کی مدد کریں", "مفت اور اشتہارات کے بغیر۔ اگر فائدہ ہو تو مدد کر سکتے ہیں۔", "مدد کریں", "لنک جلد آ رہا ہے، ان شاء اللہ۔"],
  id: ["Dukung aplikasi", "Gratis tanpa iklan. Jika bermanfaat, kamu bisa mendukungnya.", "Dukung", "Tautannya segera hadir, insya Allah."],
  bn: ["অ্যাপটিকে সমর্থন করুন", "বিনামূল্যে, কোনো বিজ্ঞাপন নেই। উপকারী হলে সমর্থন করতে পারেন।", "সমর্থন", "লিংক শীঘ্রই আসছে, ইনশাআল্লাহ।"],
  ru: ["Поддержать приложение", "Бесплатно и без рекламы. Если оно помогает, можно поддержать.", "Поддержать", "Ссылка скоро будет, ин ша Аллах."],
  de: ["App unterstützen", "Kostenlos und ohne Werbung. Wenn sie dir hilft, kannst du sie unterstützen.", "Unterstützen", "Der Link kommt bald, in scha Allah."],
};
for (const k of Object.keys(SUPPORT)) if (T[k]) [T[k].ui.supTitle, T[k].ui.supLine, T[k].ui.supBtn, T[k].ui.supSoon] = SUPPORT[k];

let lang = "en";
export const getLang = () => lang;
export const setLangRaw = l => { if (LANGS[l]) lang = l; };
export const isRTL = () => LANGS[lang].dir === "rtl";

// Falls back to the phone's language, then English.
export const pickLang = () => {
  try {
    const b = (getLocales()[0]?.languageCode || "en").toLowerCase();
    return LANGS[b] ? b : "en";
  } catch (e) {
    return "en";
  }
};

const TR = () => T[lang] || T.en;
const tpl = (s, v) => v ? s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "") : s;
export const t = (k, v) => tpl(T[lang].ui[k] ?? T.en.ui[k] ?? k, v);
export const levelTitle = l => (TR().levels || T.en.levels)[Math.min(l - 1, 10)];
export const stageName = i => (TR().stages || T.en.stages)[i][0];
export const stageLine = i => (TR().stages || T.en.stages)[i][1];
export const levelLine = () => { const L = TR().lines || T.en.lines; return L[Math.random() * L.length | 0]; };
export const badgeText = b => (TR().badges || T.en.badges)[b.i];
// The English meaning lives in LIB; other languages override it by index.
export const meaning = d => (NEW_T[lang] && NEW_T[lang][d.id]) || (TR().dhikr && TR().dhikr[d.i]) || d.en;
export const kindLabel = d => t({ dhikr: "kDhikr", dua: "kDua", quran: "kQuran", salawat: "kSalawat", seerah: d.hadith ? "kHadith" : "kSeerah", hadith: "kHadith" }[d.kind]);
export const sourceText = d => d.srcKey ? t(d.srcKey) + " · " + d.src : (d.src || "");
export const num = n => Number(n).toLocaleString("en-US");
