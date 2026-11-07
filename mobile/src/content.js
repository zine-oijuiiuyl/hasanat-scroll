// Qur'an and hadith texts for the learning path. Downloaded one surah or one hadith at a time from
// fawazahmed0/quran-api and fawazahmed0/hadith-api (public domain), then kept on the phone so the
// library and memory checks work offline.
import { dropText, readText, writeText } from "./textcache";

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
const clean = s => String(s || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/[ \t]+/g, " ").trim();
// Downloads are limited in time and size, and only text from the expected shape is kept (2026-11-03): a slow
// network can't leave a lesson loading forever, and a broken or tampered file is never saved to the phone.
const TIMEOUT_MS = 15000, MAX_BYTES = 2 * 1024 * 1024;
async function fetchText(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const len = +(r.headers.get("content-length") || 0);
    if (len > MAX_BYTES) throw new Error("too big");
    const text = await r.text();
    if (text.length > MAX_BYTES) throw new Error("too big");
    return text;
  } finally { clearTimeout(timer); }
}

async function getJSON(repo, path, name, valid) {
  if (mem.has(name)) return mem.get(name);
  try {
    const saved = await readText(name);
    if (saved != null) {
      const j = JSON.parse(saved);
      if (valid(j)) { mem.set(name, j); return j; }
      await dropText(name);   // a saved copy that isn't right is fetched again
    }
  } catch (_) {
    await dropText(name);
  }
  let last;
  for (const host of HOSTS) {
    try {
      const text = await fetchText(host(repo, path));
      const j = JSON.parse(text);
      if (!valid(j)) throw new Error("unexpected data");
      Promise.resolve().then(() => writeText(name, text)).catch(() => {});
      mem.set(name, j);
      return j;
    } catch (e) { last = e; }
  }
  throw last || new Error("offline");
}

// The shapes the two APIs send: a surah is { chapter: [{ text }] }, a hadith { hadiths: [{ text }] }.
const textList = (list, max) => Array.isArray(list) && list.length > 0 && list.length <= max && list.every(v => v && typeof v.text === "string");
const isSurah = j => !!j && textList(j.chapter, 300);
const isHadith = j => !!j && textList(j.hadiths, 50);

// One surah: { ar: [ayah texts], tr: [translations] }, index 0 = ayah 1.
export async function surah(s, lang) {
  if (!Number.isInteger(s) || s < 1 || s > 114) throw new Error("no such surah");
  const ed = (QURAN_ED[lang] || QURAN_ED.en)[0];
  const [a, t] = await Promise.all([
    getJSON("quran-api", `editions/${QURAN_AR}/${s}.min.json`, `q-${QURAN_AR}-${s}.json`, isSurah),
    getJSON("quran-api", `editions/${ed}/${s}.min.json`, `q-${ed}-${s}.json`, isSurah),
  ]);
  return { ar: a.chapter.map(v => clean(v.text)), tr: t.chapter.map(v => clean(v.text)) };
}

// One hadith: { ar, tr }.
export async function hadith(col, n, lang) {
  // Only known collections and plain numbers go into the address and the saved file's name.
  if (!Object.prototype.hasOwnProperty.call(H_HAS, col) || !Number.isInteger(n) || n < 1 || n > 10000) throw new Error("no such hadith");
  const l = hadithEd(col, lang);
  const [a, t] = await Promise.all([
    getJSON("hadith-api", `editions/ara-${col}/${n}.min.json`, `h-ara-${col}-${n}.json`, isHadith),
    getJSON("hadith-api", `editions/${l}-${col}/${n}.min.json`, `h-${l}-${col}-${n}.json`, isHadith),
  ]);
  let tr = (t.hadiths[0] && t.hadiths[0].text || "").trim();
  if (!tr && l !== "eng") tr = (await getJSON("hadith-api", `editions/eng-${col}/${n}.min.json`, `h-eng-${col}-${n}.json`, isHadith)).hadiths[0].text;
  return { ar: clean(a.hadiths[0].text), tr: clean(tr) };
}
