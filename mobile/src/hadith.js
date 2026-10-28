// The feed's fourth tab is "Hadith" (Zine, 2026-10-28): it shows only sayings of the Prophet ﷺ, not the
// cards about his life, which stay in the Learn path's Muhammad ﷺ track. The five hadith that were already
// among the "seerah" cards are marked here, and more well-known hadith are added as kind "hadith".
// Meanings of the new cards are translated below (my translations, like the rest of the app's strings).
import { LIB, BY_ID, T, NEW_T } from "./web-data";

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

// Meanings of the new hadith in the other languages, in the card order above.
const MEAN = {
  ar: ["الأعمال إنما تُقبل وتُوزن بنيّاتها", "الدين قائم على إخلاص النصح والإرادة الطيبة", "من آمن بالله واليوم الآخر فليتكلم بخير أو ليسكت", "لا تغضب", "الطهارة نصف الإيمان", "أفضلكم من يتعلم القرآن ويعلّمه غيره", "الكلمة الطيبة صدقة", "من لا يرحم الناس لا يرحمه الله", "أحب الأعمال إلى الله أدومها ولو كانت قليلة", "المؤمنون كالبناء الواحد يقوّي بعضه بعضًا", "من سلك طريقًا يطلب فيه العلم يسّر الله له طريقًا إلى الجنة", "راقب الله في كل مكان تكون فيه", "يسّروا ولا تعسّروا، وبشّروا ولا تنفّروا", "القوي حقًا هو من يملك نفسه عند الغضب، لا من يغلب الناس بالصراع", "من حسن إسلام المرء أن يترك ما لا يعنيه"],
  fr: ["Les actes ne valent que par les intentions", "La religion, c'est la sincérité et le bon conseil", "Que celui qui croit en Allah et au Jour dernier dise du bien ou se taise", "Ne te mets pas en colère", "La purification est la moitié de la foi", "Le meilleur d'entre vous est celui qui apprend le Coran et l'enseigne", "La bonne parole est une aumône", "Allah ne fait pas miséricorde à celui qui n'est pas miséricordieux envers les gens", "Les œuvres les plus aimées d'Allah sont les plus régulières, même si elles sont petites", "Le croyant est pour le croyant comme un édifice dont les parties se soutiennent", "Quiconque prend un chemin pour chercher la science, Allah lui facilite un chemin vers le Paradis", "Crains Allah où que tu sois", "Facilitez et ne rendez pas difficile ; annoncez la bonne nouvelle et ne faites pas fuir", "Le fort n'est pas le lutteur ; le fort est celui qui se maîtrise dans la colère", "Délaisser ce qui ne le concerne pas fait partie du bon islam de la personne"],
  es: ["Las acciones solo valen según sus intenciones", "La religión es sinceridad y buen consejo", "Quien cree en Allah y en el Último Día, que diga el bien o calle", "No te enojes", "La purificación es la mitad de la fe", "El mejor de vosotros es quien aprende el Corán y lo enseña", "La buena palabra es caridad", "Allah no tiene misericordia de quien no tiene misericordia de la gente", "Las obras más amadas por Allah son las más constantes, aunque sean pocas", "El creyente para el creyente es como un edificio cuyas partes se sostienen", "Quien sigue un camino buscando conocimiento, Allah le facilita un camino al Paraíso", "Teme a Allah dondequiera que estés", "Facilitad y no dificultéis; dad buenas noticias y no ahuyentéis", "El fuerte no es el que vence en la lucha; el fuerte es quien se domina en la ira", "Parte del buen islam de una persona es dejar lo que no le concierne"],
  tr: ["Ameller ancak niyetlere göredir", "Din samimiyet ve iyi niyetli öğüttür", "Allah'a ve ahiret gününe inanan ya hayır söylesin ya da sussun", "Öfkelenme", "Temizlik imanın yarısıdır", "Sizin en hayırlınız Kur'an'ı öğrenen ve öğretendir", "Güzel söz sadakadır", "İnsanlara merhamet etmeyene Allah merhamet etmez", "Allah'a en sevimli amel, az da olsa devamlı olanıdır", "Mümin mümine karşı, parçaları birbirini tutan bir bina gibidir", "Kim ilim aramak için bir yola girerse, Allah ona cennete giden yolu kolaylaştırır", "Nerede olursan ol Allah'tan kork", "Kolaylaştırın, zorlaştırmayın; müjdeleyin, nefret ettirmeyin", "Güçlü kişi güreşte yenen değil, öfke anında kendine hâkim olandır", "Kişinin Müslümanlığının güzelliği, kendisini ilgilendirmeyeni bırakmasındandır"],
  ur: ["اعمال کا دار و مدار نیتوں پر ہے", "دین خیرخواہی کا نام ہے", "جو اللہ اور آخرت کے دن پر ایمان رکھتا ہو وہ اچھی بات کہے یا خاموش رہے", "غصہ نہ کرو", "پاکیزگی آدھا ایمان ہے", "تم میں سب سے بہتر وہ ہے جو قرآن سیکھے اور سکھائے", "اچھی بات صدقہ ہے", "جو لوگوں پر رحم نہیں کرتا اللہ اس پر رحم نہیں کرتا", "اللہ کو سب سے محبوب عمل وہ ہے جو ہمیشہ کیا جائے، چاہے تھوڑا ہو", "مومن مومن کے لیے عمارت کی طرح ہے جس کا ایک حصہ دوسرے کو مضبوط کرتا ہے", "جو علم کی تلاش میں کسی راستے پر چلے، اللہ اس کے لیے جنت کا راستہ آسان کر دیتا ہے", "جہاں بھی ہو اللہ سے ڈرو", "آسانی کرو، سختی نہ کرو؛ خوشخبری دو، نفرت نہ دلاؤ", "طاقتور وہ نہیں جو کشتی میں پچھاڑ دے، طاقتور وہ ہے جو غصے میں خود پر قابو رکھے", "آدمی کے اسلام کی خوبی یہ ہے کہ وہ بے مقصد باتوں کو چھوڑ دے"],
  id: ["Amal itu tergantung niatnya", "Agama adalah ketulusan dan nasihat yang baik", "Siapa yang beriman kepada Allah dan hari akhir, hendaklah berkata baik atau diam", "Jangan marah", "Bersuci adalah separuh iman", "Sebaik-baik kalian adalah yang belajar Al-Qur'an dan mengajarkannya", "Kata-kata yang baik adalah sedekah", "Allah tidak menyayangi orang yang tidak menyayangi manusia", "Amal yang paling dicintai Allah adalah yang paling rutin, walau sedikit", "Mukmin bagi mukmin lainnya seperti bangunan yang saling menguatkan", "Siapa menempuh jalan untuk mencari ilmu, Allah mudahkan baginya jalan ke surga", "Bertakwalah kepada Allah di mana pun kamu berada", "Permudahlah, jangan mempersulit; berilah kabar gembira, jangan membuat orang lari", "Orang kuat bukanlah yang menang bergulat, tetapi yang mampu menahan diri saat marah", "Di antara baiknya Islam seseorang adalah meninggalkan apa yang tidak bermanfaat baginya"],
  bn: ["সব কাজ নিয়তের উপর নির্ভর করে", "দ্বীন হলো আন্তরিকতা ও কল্যাণকামিতা", "যে আল্লাহ ও শেষ দিবসে বিশ্বাস করে, সে যেন ভালো কথা বলে অথবা চুপ থাকে", "রাগ করো না", "পবিত্রতা ঈমানের অর্ধেক", "তোমাদের মধ্যে সর্বোত্তম সে, যে কুরআন শেখে ও শেখায়", "ভালো কথা সদকা", "যে মানুষের প্রতি দয়া করে না, আল্লাহ তার প্রতি দয়া করেন না", "আল্লাহর কাছে সবচেয়ে প্রিয় আমল যা নিয়মিত করা হয়, যদিও তা অল্প হয়", "এক মুমিন আরেক মুমিনের জন্য দালানের মতো, যার এক অংশ অন্য অংশকে শক্ত করে", "যে জ্ঞানের খোঁজে কোনো পথে চলে, আল্লাহ তার জন্য জান্নাতের পথ সহজ করে দেন", "যেখানেই থাকো আল্লাহকে ভয় করো", "সহজ করো, কঠিন করো না; সুসংবাদ দাও, দূরে সরিয়ে দিও না", "কুস্তিতে জয়ী ব্যক্তি শক্তিশালী নয়; শক্তিশালী সে, যে রাগের সময় নিজেকে সামলায়", "অর্থহীন বিষয় ত্যাগ করা মানুষের ইসলামের সৌন্দর্যের অংশ"],
  ru: ["Поистине, дела оцениваются по намерениям", "Религия — это искренность и добрый совет", "Кто верует в Аллаха и Последний день, пусть говорит благое или молчит", "Не гневайся", "Чистота — половина веры", "Лучший из вас тот, кто изучает Коран и обучает ему", "Доброе слово — милостыня", "Аллах не милует того, кто не милует людей", "Самые любимые Аллахом дела — постоянные, даже если они малы", "Верующий для верующего как здание, части которого поддерживают друг друга", "Кто встал на путь поиска знаний, тому Аллах облегчит путь в Рай", "Бойся Аллаха, где бы ты ни был", "Облегчайте, а не усложняйте; радуйте, а не отталкивайте", "Силён не тот, кто побеждает в борьбе, а тот, кто владеет собой в гневе", "Признак хорошего ислама человека — оставлять то, что его не касается"],
  de: ["Die Taten werden nur nach den Absichten beurteilt", "Die Religion ist Aufrichtigkeit und guter Rat", "Wer an Allah und den Jüngsten Tag glaubt, soll Gutes sprechen oder schweigen", "Werde nicht zornig", "Reinheit ist die Hälfte des Glaubens", "Der Beste unter euch ist, wer den Koran lernt und ihn lehrt", "Ein gutes Wort ist Almosen", "Allah erbarmt sich nicht dessen, der sich nicht der Menschen erbarmt", "Die bei Allah beliebtesten Taten sind die beständigsten, auch wenn sie klein sind", "Der Gläubige ist für den Gläubigen wie ein Bauwerk, dessen Teile einander stützen", "Wer einen Weg geht, um Wissen zu suchen, dem erleichtert Allah einen Weg ins Paradies", "Fürchte Allah, wo immer du bist", "Macht es leicht und nicht schwer; verkündet Frohes und schreckt nicht ab", "Stark ist nicht der Ringer; stark ist, wer sich im Zorn beherrscht", "Zum guten Islam eines Menschen gehört, das zu lassen, was ihn nichts angeht"],
};
for (const [l, list] of Object.entries(MEAN)) {
  if (!NEW_T[l]) NEW_T[l] = {};
  NEW.forEach(([id], i) => { if (list[i]) NEW_T[l][id] = list[i]; });
}
