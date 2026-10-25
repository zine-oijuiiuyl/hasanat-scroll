// Qur'an and hadith texts for the learning path. Downloaded one surah or one hadith at a time from
// fawazahmed0/quran-api and fawazahmed0/hadith-api (public domain), then kept on the phone so the
// library and memory checks work offline.
import { Directory, File, Paths } from "expo-file-system";

const HOSTS = [
  (repo, path) => `https://cdn.jsdelivr.net/gh/fawazahmed0/${repo}@1/${path}`,
  (repo, path) => `https://raw.githubusercontent.com/fawazahmed0/${repo}/1/${path}`,
];

// The translation shown under each ayah. Arabic speakers get Tafsir al-Muyassar instead.
export const QURAN_ED = {
  en: ["eng-rowwadtranslati", "Rowwad Translation Center"],
  ar: ["ara-kingfahadquranc", "التفسير الميسر"],
  fr: ["fra-muhammadhameedu", "Muhammad Hamidullah"],
  es: ["spa-islamicfoundati1", "Islamic Foundation"],
  tr: ["tur-diyanetisleri", "Diyanet İşleri"],
  ur: ["urd-muhammadjunagar", "محمد جوناگڑھی"],
  id: ["ind-indonesianislam", "Kementerian Agama RI"],
  bn: ["ben-abubakrzakaria", "আবু বকর জাকারিয়া"],
  ru: ["rus-elmirkuliev", "Эльмир Кулиев"],
  de: ["deu-frankbubenheima", "Bubenheim & Elyas"],
};
const QURAN_AR = "ara-quranuthmanihaf";

// Which hadith translations exist; the rest fall back to English.
const H_LANG = { fr: "fra", id: "ind", ru: "rus", tr: "tur", ur: "urd", bn: "ben" };
const H_HAS = {
  bukhari: ["fra", "ind", "rus", "tur", "urd", "ben"],
  muslim: ["fra", "ind", "rus", "tur", "urd", "ben"],
  nawawi: ["fra", "tur", "ben"],
  qudsi: ["fra"],
};
export const hadithEd = (col, lang) => {
  const l = H_LANG[lang];
  return l && H_HAS[col].includes(l) ? l : "eng";
};

const mem = new Map();
// Some texts carry HTML line breaks and tags.
const clean = s => (s || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/[ \t]+/g, " ").trim();
let dir = null;
function store() {
  if (!dir) {
    dir = new Directory(Paths.document, "learn");
    try { if (!dir.exists) dir.create({ idempotent: true }); } catch (e) {}
  }
  return dir;
}

async function getJSON(repo, path, name) {
  if (mem.has(name)) return mem.get(name);
  let f = null;
  try {
    f = new File(store(), name);
    if (f.exists) { const j = JSON.parse(await f.text()); mem.set(name, j); return j; }
  } catch (e) {}
  let last;
  for (const host of HOSTS) {
    try {
      const r = await fetch(host(repo, path));
      if (!r.ok) throw new Error("HTTP " + r.status);
      const text = await r.text();
      const j = JSON.parse(text);
      try { if (f) Promise.resolve(f.write(text)).catch(() => {}); } catch (e) {}
      mem.set(name, j);
      return j;
    } catch (e) { last = e; }
  }
  throw last || new Error("offline");
}

// One surah: { ar: [ayah texts], tr: [translations] }, index 0 = ayah 1.
export async function surah(s, lang) {
  const ed = (QURAN_ED[lang] || QURAN_ED.en)[0];
  const [a, t] = await Promise.all([
    getJSON("quran-api", `editions/${QURAN_AR}/${s}.min.json`, `q-${QURAN_AR}-${s}.json`),
    getJSON("quran-api", `editions/${ed}/${s}.min.json`, `q-${ed}-${s}.json`),
  ]);
  return { ar: a.chapter.map(v => clean(v.text)), tr: t.chapter.map(v => clean(v.text)) };
}

// One hadith: { ar, tr }.
export async function hadith(col, n, lang) {
  const l = hadithEd(col, lang);
  const [a, t] = await Promise.all([
    getJSON("hadith-api", `editions/ara-${col}/${n}.min.json`, `h-ara-${col}-${n}.json`),
    getJSON("hadith-api", `editions/${l}-${col}/${n}.min.json`, `h-${l}-${col}-${n}.json`),
  ]);
  let tr = (t.hadiths[0] && t.hadiths[0].text || "").trim();
  if (!tr && l !== "eng") tr = (await getJSON("hadith-api", `editions/eng-${col}/${n}.min.json`, `h-eng-${col}-${n}.json`)).hadiths[0].text;
  return { ar: clean(a.hadiths[0].text), tr: clean(tr) };
}
