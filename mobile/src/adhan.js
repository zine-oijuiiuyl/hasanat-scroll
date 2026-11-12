// The adhan at prayer time (Zine, 2026-11-11), with a switch and a choice of voice in Prayer times.
// - App open: the full adhan plays in the app at the prayer time, with a Stop button on top of the screen
//   (AdhanBar.js). The reading aloud and the weather sounds wait until it ends.
// - App closed, Android APK: the prayer notification itself rings with the adhan (a notification channel per
//   voice, notify.js; the files are copied into the APK by the expo-notifications plugin in app.json).
// - App closed, iPhone in Expo Go: Expo Go can't carry custom notification sounds, so the notification rings
//   with the normal sound and tapping it opens the app and plays the adhan.
// The recordings are freely licensed, see assets/adhan/CREDITS.md.
import { AppState, Platform } from "react-native";
import { createAudioPlayer } from "./audio";
import { G, changed } from "./game";
import { T, PR_NAMES, prayerDay } from "./web-data";
import { t } from "./i18n";
import { stopRecite } from "./recite";
import { holdAmbient } from "./fx";

export const VOICES = {
  makkah: { file: require("../assets/adhan/adhan_makkah.mp3"), sound: "adhan_makkah.mp3" },
  madinah: { file: require("../assets/adhan/adhan_madinah.mp3"), sound: "adhan_madinah.mp3" },
  melodic: { file: require("../assets/adhan/adhan_melodic.mp3"), sound: "adhan_melodic.mp3" },
};
export const voiceOf = pr => (pr && VOICES[pr.adhanVoice] ? pr.adhanVoice : "makkah");
// On unless switched off: people who set up prayer times before the adhan existed get it too.
export const adhanOn = pr => !!pr && pr.adhan !== false;

let player = null, sub = null, run = 0;

export function stopAdhan() {
  run++;
  if (sub) { try { sub.remove(); } catch (e) {} sub = null; }
  if (player) { try { player.pause(); player.remove(); } catch (e) {} player = null; }
  if (G.adhan) { G.adhan = null; holdAmbient(false); changed(); }
}

// k: the prayer ("fajr", ...), or null for the preview in the settings.
export function playAdhan(k, voice = voiceOf(G.life.prayer)) {
  stopAdhan();
  const v = VOICES[voice];
  if (!v) return;
  const me = run;
  stopRecite();
  holdAmbient(true);
  G.adhan = { k, voice };
  changed();
  try {
    player = createAudioPlayer(v.file);
    sub = player.addListener("playbackStatusUpdate", st => { if (st.didJustFinish && me === run) stopAdhan(); });
    player.volume = 1;
    player.play();
  } catch (e) { stopAdhan(); }
}

// ---------- In the app: a timer to the next prayer while the app is open ----------
let timer = null, lastAt = 0;
const SALAT = [0, 2, 3, 4, 5];   // fajr, dhuhr, asr, maghrib, isha (no adhan at sunrise)

export function nextAdhan(pr, now = Date.now()) {
  if (!adhanOn(pr)) return null;
  for (let off = 0; off < 2; off++) {
    const day = prayerDay(new Date(now + off * 864e5), pr);
    if (!day) return null;
    for (const i of SALAT) {
      const k = PR_NAMES[i], at = day[i].getTime();
      if (at > now && pr.on[k] !== false) return { k, at };
    }
  }
  return null;
}

// Called on every open and whenever the prayer settings change (prayer.js schedulePrayer).
export function armAdhan() {
  clearTimeout(timer);
  const nx = nextAdhan(G.life.prayer);
  if (!nx) return;
  // Timers are capped so a phone that slept doesn't fire hours late; it just checks again.
  const ms = Math.min(nx.at - Date.now(), 30 * 6e4);
  timer = setTimeout(() => {
    if (Date.now() >= nx.at - 1000 && nx.at !== lastAt) {
      lastAt = nx.at;
      // In the background the notification rings instead (on Android with the adhan itself).
      if (adhanOn(G.life.prayer) && (Platform.OS === "web" || AppState.currentState === "active")) playAdhan(nx.k);
    }
    armAdhan();
  }, Math.max(1000, ms));
}
export const disarmAdhan = () => clearTimeout(timer);

// Tapping the prayer notification on the iPhone (or on Android while the adhan sound has already stopped):
// play the adhan if the prayer started less than 10 minutes ago.
export function adhanFromNotification(data) {
  if (!data || !data.adhan || !adhanOn(G.life.prayer)) return;
  const at = +data.at || 0;
  if (Date.now() - at > 10 * 6e4 || Date.now() < at - 6e4 || at === lastAt && G.adhan) return;
  // On Android the notification itself played the adhan; opening it stops that sound, so start it again here.
  lastAt = at;
  playAdhan(data.k);
}

export const adhanNotifiesItself = () => Platform.OS === "android";

// My translations, not checked by a native speaker.
const UI = {
  en: { adhanTap: "Tap to hear the adhan", adhan: "Adhan at prayer time", adhanVoice: "Adhan voice", adhanMakkah: "Makkah", adhanMadinah: "Madinah", adhanMelodic: "Melodic", adhanListen: "Listen", adhanStop: "Stop", adhanNow: "Adhan · {p}", adhanNoteIos: "On iPhone the adhan plays while the app is open. When it's closed, the reminder rings with the normal sound: tap it to hear the adhan.", adhanNoteAnd: "The prayer notification rings with the adhan, even when the app is closed. Swipe the notification away to stop it.", adhanNoteWeb: "The adhan plays while this page is open.", adhanCredit: "Adhan recordings from Wikimedia Commons: Masjid al-Haram by Seyfula Islam and the Prophet's Mosque by ejaz215 (CC BY 3.0), melodic adhan by Adam-synagda (CC0)." },
  ar: { adhanTap: "اضغط لسماع الأذان", adhan: "الأذان عند وقت الصلاة", adhanVoice: "صوت الأذان", adhanMakkah: "مكة", adhanMadinah: "المدينة", adhanMelodic: "مُلحَّن", adhanListen: "استمع", adhanStop: "إيقاف", adhanNow: "الأذان · {p}", adhanNoteIos: "على الآيفون يُرفع الأذان والتطبيق مفتوح. وإذا كان مغلقًا يرنّ التذكير بالصوت العادي: اضغط عليه لتسمع الأذان.", adhanNoteAnd: "يرنّ إشعار الصلاة بالأذان حتى والتطبيق مغلق. اسحب الإشعار لإيقافه.", adhanNoteWeb: "يُرفع الأذان ما دامت هذه الصفحة مفتوحة.", adhanCredit: "تسجيلات الأذان من ويكيميديا كومنز: المسجد الحرام (Seyfula Islam) والمسجد النبوي (ejaz215) برخصة CC BY 3.0، والأذان الملحّن (Adam-synagda) برخصة CC0." },
  fr: { adhanTap: "Touche pour entendre l'adhan", adhan: "Adhan à l'heure de la prière", adhanVoice: "Voix de l'adhan", adhanMakkah: "La Mecque", adhanMadinah: "Médine", adhanMelodic: "Mélodieux", adhanListen: "Écouter", adhanStop: "Arrêter", adhanNow: "Adhan · {p}", adhanNoteIos: "Sur iPhone, l'adhan se joue quand l'app est ouverte. Quand elle est fermée, le rappel sonne avec le son normal : touche-le pour entendre l'adhan.", adhanNoteAnd: "La notification de prière sonne avec l'adhan, même app fermée. Balaie la notification pour l'arrêter.", adhanNoteWeb: "L'adhan se joue tant que cette page est ouverte.", adhanCredit: "Enregistrements de l'adhan sur Wikimedia Commons : Masjid al-Haram par Seyfula Islam et la Mosquée du Prophète par ejaz215 (CC BY 3.0), adhan mélodieux par Adam-synagda (CC0)." },
  es: { adhanTap: "Toca para oír el adhan", adhan: "Adhan a la hora de la oración", adhanVoice: "Voz del adhan", adhanMakkah: "La Meca", adhanMadinah: "Medina", adhanMelodic: "Melódico", adhanListen: "Escuchar", adhanStop: "Parar", adhanNow: "Adhan · {p}", adhanNoteIos: "En iPhone el adhan suena con la app abierta. Si está cerrada, el aviso suena con el sonido normal: tócalo para oír el adhan.", adhanNoteAnd: "La notificación de oración suena con el adhan, aunque la app esté cerrada. Desliza la notificación para pararlo.", adhanNoteWeb: "El adhan suena mientras esta página esté abierta.", adhanCredit: "Grabaciones del adhan de Wikimedia Commons: Masjid al-Haram por Seyfula Islam y la Mezquita del Profeta por ejaz215 (CC BY 3.0), adhan melódico por Adam-synagda (CC0)." },
  tr: { adhanTap: "Ezanı duymak için dokun", adhan: "Vakitte ezan", adhanVoice: "Ezan sesi", adhanMakkah: "Mekke", adhanMadinah: "Medine", adhanMelodic: "Makamlı", adhanListen: "Dinle", adhanStop: "Durdur", adhanNow: "Ezan · {p}", adhanNoteIos: "iPhone'da ezan uygulama açıkken okunur. Kapalıyken hatırlatıcı normal sesle çalar: ezanı duymak için ona dokun.", adhanNoteAnd: "Namaz bildirimi, uygulama kapalıyken bile ezanla çalar. Durdurmak için bildirimi kaydır.", adhanNoteWeb: "Ezan bu sayfa açık olduğu sürece okunur.", adhanCredit: "Ezan kayıtları Wikimedia Commons'tan: Mescid-i Haram (Seyfula Islam) ve Mescid-i Nebevi (ejaz215), CC BY 3.0; makamlı ezan (Adam-synagda), CC0." },
  ur: { adhanTap: "اذان سننے کے لیے دبائیں", adhan: "نماز کے وقت اذان", adhanVoice: "اذان کی آواز", adhanMakkah: "مکہ", adhanMadinah: "مدینہ", adhanMelodic: "خوش الحان", adhanListen: "سنیں", adhanStop: "روکیں", adhanNow: "اذان · {p}", adhanNoteIos: "آئی فون پر اذان ایپ کھلی ہونے پر بجتی ہے۔ بند ہو تو یاد دہانی عام آواز سے بجتی ہے: اذان سننے کے لیے اسے دبائیں۔", adhanNoteAnd: "نماز کی اطلاع اذان کے ساتھ بجتی ہے، ایپ بند ہو تب بھی۔ روکنے کے لیے اطلاع کو ہٹا دیں۔", adhanNoteWeb: "یہ صفحہ کھلا رہے تو اذان بجتی ہے۔", adhanCredit: "اذان کی ریکارڈنگز ویکیمیڈیا کامنز سے: مسجد الحرام (Seyfula Islam) اور مسجد نبوی (ejaz215)، CC BY 3.0؛ خوش الحان اذان (Adam-synagda)، CC0۔" },
  id: { adhanTap: "Ketuk untuk mendengar azan", adhan: "Azan saat waktu shalat", adhanVoice: "Suara azan", adhanMakkah: "Makkah", adhanMadinah: "Madinah", adhanMelodic: "Merdu", adhanListen: "Dengar", adhanStop: "Hentikan", adhanNow: "Azan · {p}", adhanNoteIos: "Di iPhone azan diputar saat aplikasi terbuka. Saat tertutup, pengingat berbunyi dengan suara biasa: ketuk untuk mendengar azan.", adhanNoteAnd: "Notifikasi shalat berbunyi dengan azan, meski aplikasi tertutup. Geser notifikasi untuk menghentikannya.", adhanNoteWeb: "Azan diputar selama halaman ini terbuka.", adhanCredit: "Rekaman azan dari Wikimedia Commons: Masjidil Haram oleh Seyfula Islam dan Masjid Nabawi oleh ejaz215 (CC BY 3.0), azan merdu oleh Adam-synagda (CC0)." },
  bn: { adhanTap: "আজান শুনতে চাপো", adhan: "নামাজের সময় আজান", adhanVoice: "আজানের কণ্ঠ", adhanMakkah: "মক্কা", adhanMadinah: "মদিনা", adhanMelodic: "সুরেলা", adhanListen: "শোনো", adhanStop: "থামাও", adhanNow: "আজান · {p}", adhanNoteIos: "আইফোনে অ্যাপ খোলা থাকলে আজান বাজে। বন্ধ থাকলে রিমাইন্ডার সাধারণ শব্দে বাজে: আজান শুনতে সেটিতে চাপো।", adhanNoteAnd: "অ্যাপ বন্ধ থাকলেও নামাজের নোটিফিকেশন আজান দিয়ে বাজে। থামাতে নোটিফিকেশন সরিয়ে দাও।", adhanNoteWeb: "এই পেজ খোলা থাকলে আজান বাজে।", adhanCredit: "আজানের রেকর্ডিং উইকিমিডিয়া কমন্স থেকে: মসজিদুল হারাম (Seyfula Islam) ও মসজিদে নববী (ejaz215), CC BY 3.0; সুরেলা আজান (Adam-synagda), CC0।" },
  ru: { adhanTap: "Нажми, чтобы услышать азан", adhan: "Азан во время намаза", adhanVoice: "Голос азана", adhanMakkah: "Мекка", adhanMadinah: "Медина", adhanMelodic: "Мелодичный", adhanListen: "Слушать", adhanStop: "Стоп", adhanNow: "Азан · {p}", adhanNoteIos: "На iPhone азан звучит, когда приложение открыто. Если оно закрыто, напоминание звучит обычным звуком: нажми на него, чтобы услышать азан.", adhanNoteAnd: "Уведомление о намазе звучит азаном, даже когда приложение закрыто. Смахни уведомление, чтобы остановить.", adhanNoteWeb: "Азан звучит, пока эта страница открыта.", adhanCredit: "Записи азана с Wikimedia Commons: Масджид аль-Харам (Seyfula Islam) и Мечеть Пророка (ejaz215), CC BY 3.0; мелодичный азан (Adam-synagda), CC0." },
  de: { adhanTap: "Tippe, um den Adhan zu hören", adhan: "Adhan zur Gebetszeit", adhanVoice: "Stimme des Adhan", adhanMakkah: "Mekka", adhanMadinah: "Medina", adhanMelodic: "Melodisch", adhanListen: "Anhören", adhanStop: "Stopp", adhanNow: "Adhan · {p}", adhanNoteIos: "Auf dem iPhone ertönt der Adhan, solange die App offen ist. Ist sie geschlossen, klingelt die Erinnerung normal: tippe darauf, um den Adhan zu hören.", adhanNoteAnd: "Die Gebetsmitteilung klingelt mit dem Adhan, auch wenn die App geschlossen ist. Wische die Mitteilung weg, um ihn zu stoppen.", adhanNoteWeb: "Der Adhan ertönt, solange diese Seite offen ist.", adhanCredit: "Adhan-Aufnahmen von Wikimedia Commons: Masjid al-Haram von Seyfula Islam und die Prophetenmoschee von ejaz215 (CC BY 3.0), melodischer Adhan von Adam-synagda (CC0)." },
};
for (const [l, v] of Object.entries(UI)) if (T[l]) Object.assign(T[l].ui, v);

export const adhanNote = () => t(Platform.OS === "android" ? "adhanNoteAnd" : Platform.OS === "web" ? "adhanNoteWeb" : "adhanNoteIos");
