// The feed's fourth tab is "Hadith" (Zine, 2026-10-28): it shows only sayings of the Prophet ﷺ, not the
// cards about his life, which stay in the Learn path's Muhammad ﷺ track. The five hadith that were already
// among the "seerah" cards are marked here, and more well-known hadith are added as kind "hadith".
// Meanings of the new cards are English only for now; other languages fall back to English.
import { LIB, BY_ID, T } from "./web-data";

const OLD = ["m_smile", "m_brother", "m_tongue", "m_akhlaq", "m_farewell"];
OLD.forEach(id => { if (BY_ID[id]) BY_ID[id].hadith = true; });

const NEW = [
  ["h_niyyah", "إِنَّمَا ٱلْأَعْمَالُ بِٱلنِّيَّاتِ", "Innamal-a'malu bin-niyyat", "Actions are only judged by their intentions", "Sahih al-Bukhari 1", 0],
  ["h_nasiha", "ٱلدِّينُ ٱلنَّصِيحَةُ", "Ad-dinu an-nasihah", "The religion is sincere goodwill", "Sahih Muslim 55", 3],
  ["h_khayr", "مَنْ كَانَ يُؤْمِنُ بِٱللَّهِ وَٱلْيَوْمِ ٱلْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ", "Man kana yu'minu billahi wal-yawmil-akhiri falyaqul khayran aw liyasmut", "Whoever believes in Allah and the Last Day, let him speak good or stay silent", "Sahih al-Bukhari 6018", 1],
  ["h_ghadab", "لَا تَغْضَبْ", "La taghdab", "Do not become angry", "Sahih al-Bukhari 6116", 7],
  ["h_tuhur", "ٱلطُّهُورُ شَطْرُ ٱلْإِيمَانِ", "At-tuhuru shatrul-iman", "Purity is half of faith", "Sahih Muslim 223", 8],
  ["h_quran", "خَيْرُكُمْ مَنْ تَعَلَّمَ ٱلْقُرْآنَ وَعَلَّمَهُ", "Khayrukum man ta'allamal-Qur'ana wa 'allamah", "The best of you are those who learn the Qur'an and teach it", "Sahih al-Bukhari 5027", 5],
  ["h_kalima", "ٱلْكَلِمَةُ ٱلطَّيِّبَةُ صَدَقَةٌ", "Al-kalimatut-tayyibatu sadaqah", "A good word is charity", "Sahih al-Bukhari 2989", 4],
  ["h_rahma", "لَا يَرْحَمُ ٱللَّهُ مَنْ لَا يَرْحَمُ ٱلنَّاسَ", "La yarhamullahu man la yarhamun-nas", "Allah does not show mercy to one who does not show mercy to people", "Sahih al-Bukhari 7376", 2],
  ["h_adwam", "أَحَبُّ ٱلْأَعْمَالِ إِلَى ٱللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ", "Ahabbul-a'mali ilallahi adwamuha wa in qall", "The deeds most loved by Allah are the most regular, even if small", "Sahih al-Bukhari 6464", 9],
  ["h_bunyan", "ٱلْمُؤْمِنُ لِلْمُؤْمِنِ كَٱلْبُنْيَانِ يَشُدُّ بَعْضُهُ بَعْضًا", "Al-mu'minu lil-mu'mini kal-bunyani yashuddu ba'duhu ba'da", "A believer to another believer is like a building whose parts support each other", "Sahih al-Bukhari 481", 6],
  ["h_ilm", "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ ٱللَّهُ لَهُ بِهِ طَرِيقًا إِلَى ٱلْجَنَّةِ", "Man salaka tariqan yaltamisu fihi 'ilman sahhalallahu lahu bihi tariqan ilal-jannah", "Whoever takes a path seeking knowledge, Allah makes easy for him a path to Paradise", "Sahih Muslim 2699", 0],
  ["h_taqwa", "ٱتَّقِ ٱللَّهَ حَيْثُمَا كُنْتَ", "Ittaqillaha haythuma kunt", "Be mindful of Allah wherever you are", "Jami' at-Tirmidhi 1987", 3],
  ["h_yassiru", "يَسِّرُوا وَلَا تُعَسِّرُوا، وَبَشِّرُوا وَلَا تُنَفِّرُوا", "Yassiru wa la tu'assiru, wa bashshiru wa la tunaffiru", "Make things easy, not hard; give good news, do not drive people away", "Sahih al-Bukhari 69", 5],
  ["h_shadid", "لَيْسَ ٱلشَّدِيدُ بِٱلصُّرَعَةِ، إِنَّمَا ٱلشَّدِيدُ ٱلَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ ٱلْغَضَبِ", "Laysash-shadidu bis-sur'ah, innamash-shadidul-ladhi yamliku nafsahu 'indal-ghadab", "The strong one is not the wrestler; the strong one controls himself when angry", "Sahih al-Bukhari 6114", 1],
  ["h_yanih", "مِنْ حُسْنِ إِسْلَامِ ٱلْمَرْءِ تَرْكُهُ مَا لَا يَعْنِيهِ", "Min husni islamil-mar'i tarkuhu ma la ya'nih", "Part of a person's good Islam is leaving what does not concern him", "Jami' at-Tirmidhi 2317", 8],
];
for (const [id, ar, tr, en, src, pal] of NEW) {
  if (BY_ID[id]) continue;
  const d = { id, ar, tr, en, src, kind: "hadith", pal, w: 1, hadith: true, i: LIB.length };
  LIB.push(d);
  BY_ID[id] = d;
}

// Tab name and card label. Translations are mine, like the rest of the app's strings.
const NAMES = {
  en: ["Hadith", "HADITH · حديث"], ar: ["حديث", "حديث"], fr: ["Hadith", "HADITH · حديث"], es: ["Hadiz", "HADIZ · حديث"],
  tr: ["Hadis", "HADİS · حديث"], ur: ["حدیث", "حدیث"], id: ["Hadis", "HADIS · حديث"], bn: ["হাদিস", "হাদিস · حديث"],
  ru: ["Хадисы", "ХАДИС · حديث"], de: ["Hadith", "HADITH · حديث"],
};
for (const [l, [tab, kind]] of Object.entries(NAMES)) {
  const ui = T[l] && T[l].ui;
  if (!ui) continue;
  if (ui.tutTabs && ui.tabMuh) ui.tutTabs = ui.tutTabs.split(ui.tabMuh).join(tab);
  ui.tabHadith = tab;
  ui.kHadith = kind;
}
