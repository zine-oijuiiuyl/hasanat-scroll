// First-launch tutorial and the language/buddy picker.
import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Easing, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { G, tourSteps, endTour, goTour, pickBuddy, pickMode, changed } from "./game";
import { T } from "./web-data";
import { Ico } from "./Icons";
import { t } from "./i18n";
import { measure, reveal } from "./targets";
import { BuddyArt } from "./Buddy";
import { LangPicker, Btn, s as u } from "./ui";
import { C, F, GOLD } from "./theme";
import Svg, { Path } from "react-native-svg";

// Shows where to touch: a glowing gold dot that slides up for a swipe, or pulses for a tap. It replaced a
// pointing-hand icon that looked like a rude gesture (Zine, 2026-10-28).
function TouchHint({ swipe }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: swipe ? 1100 : 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.delay(swipe ? 250 : 150),
      Animated.timing(a, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [a, swipe]);
  const dot = swipe
    ? { opacity: a.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0] }), transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [50, -50] }) }] }
    : { transform: [{ scale: a.interpolate({ inputRange: [0, 0.25, 0.5, 1], outputRange: [1, 0.8, 1, 1] }) }] };
  const ring = { opacity: a.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.8, 0] }), transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.2] }) }] };
  return (
    <View style={{ width: 90, height: 150, alignItems: "center", justifyContent: "center" }}>
      {swipe ? <Svg width={40} height={22} viewBox="0 0 40 22" style={s.arrow}><Path d="M5 18 L20 5 L35 18" fill="none" stroke="#ffe08a" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" /></Svg> : null}
      <Animated.View style={[s.touch, dot]}>
        {swipe ? null : <Animated.View style={[s.touchRing, ring]} />}
      </Animated.View>
    </View>
  );
}

export function Tour() {
  const i = G.tourStep;
  const [spot, setSpot] = useState(null);
  const steps = tourSteps();
  const step = i >= 0 ? steps[i] : null;
  useEffect(() => {
    let live = true;
    setSpot(null);
    // Measured again after a moment: a sheet that is still sliding in reports a position that is a bit off.
    const place = () => measure(step.target).then(r => { if (live && r) setSpot({ x: r.x - 8, y: r.y - 8, w: r.w + 16, h: r.h + 16 }); });
    let timers = [];
    // Settings further down the sheet are scrolled into view first.
    if (step && step.target) { if (step.target !== "close") reveal(step.target, Dimensions.get("window").height); place(); timers = [setTimeout(place, 500), setTimeout(place, 1000)]; }
    return () => { live = false; timers.forEach(clearTimeout); };
  }, [i, step]);
  const { height: H } = Dimensions.get("window");
  const insets = useSafeAreaInsets();
  if (!step) return null;
  // Steps that wait for you to do something leave the screen touchable; the others block it.
  const block = !!step.next;
  // The button bar at the bottom of a sheet is easy to find without a box, so the tip just sits above it.
  const aboveBar = step.target === "close";
  const top = aboveBar ? { bottom: insets.bottom + 92 } : spot ? (spot.y + spot.h / 2 < H / 2 ? { top: spot.y + spot.h + 14 } : { bottom: H - spot.y + 14 }) : (step.last ? { top: H * 0.34 } : { top: H * 0.16 });
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {block ? <View style={StyleSheet.absoluteFill} /> : null}
      {spot && !aboveBar ? <View pointerEvents="none" style={[s.spot, { left: spot.x, top: spot.y, width: spot.w, height: spot.h }]} /> : null}
      {step.hand ? <View pointerEvents="none" style={[s.hand, { top: "58%" }]}><TouchHint swipe /></View> : null}
      {step.tapHand ? <View pointerEvents="none" style={[s.hand, { top: "57%" }]}><TouchHint /></View> : null}
      <View style={[s.tip, top]}>
        <Text style={s.tipT}>{t(step.k, step.vars && step.vars())}</Text>
        <View style={s.foot}>
          <Text style={s.count}>{i + 1} / {steps.length}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {step.last ? null : <Pressable onPress={endTour} style={s.skip}><Text style={s.skipT}>{t("tutSkip")}</Text></Pressable>}
            {step.next ? (
              <Pressable testID="tourNext" onPress={() => goTour(i + 1)} style={s.next}>
                <LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                <Text style={s.nextT}>{step.last ? t("tutStart") : t("tutNext")}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

// The first question on a new phone: game-like or calm (Zine, 2026-10-28).
const MODE = {
  en: { modeLearn: "Learning", modeLearnS: "Short lessons to learn Qur'an and hadith step by step, with your buddy.", modeTitle: "How do you want to scroll?", modeText: "Pick the experience that suits you. You can change it any time in the settings.", modeGame: "Game-like", modeGameS: "A buddy who grows with you, points, levels, rewards and confetti.", modeCalm: "Calm", modeCalmS: "Just the cards, quiet and simple, with a plain count. No buddy or rewards.", settings: "Settings" },
  ar: { modeLearn: "التعلّم", modeLearnS: "دروس قصيرة لتعلّم القرآن والحديث خطوة بخطوة، مع رفيقك.", modeTitle: "كيف تريد أن تتصفح؟", modeText: "اختر التجربة التي تناسبك. يمكنك تغييرها في أي وقت من الإعدادات.", modeGame: "مثل اللعبة", modeGameS: "رفيق يكبر معك، ونقاط ومستويات ومكافآت واحتفالات.", modeCalm: "هادئ", modeCalmS: "البطاقات فقط، بهدوء وبساطة، مع عدّاد بسيط. بلا رفيق ولا مكافآت.", settings: "الإعدادات" },
  fr: { modeLearn: "Apprentissage", modeLearnS: "De courtes leçons pour apprendre le Coran et les hadiths pas à pas, avec ton compagnon.", modeTitle: "Comment veux-tu faire défiler ?", modeText: "Choisis l'expérience qui te convient. Tu peux la changer à tout moment dans les réglages.", modeGame: "Comme un jeu", modeGameS: "Un compagnon qui grandit avec toi, des points, des niveaux, des récompenses et des confettis.", modeCalm: "Calme", modeCalmS: "Juste les cartes, au calme, avec un simple compteur. Sans compagnon ni récompenses.", settings: "Réglages" },
  es: { modeLearn: "Aprendizaje", modeLearnS: "Lecciones cortas para aprender Corán y hadices paso a paso, con tu compañero.", modeTitle: "¿Cómo quieres deslizar?", modeText: "Elige la experiencia que te va mejor. Puedes cambiarla cuando quieras en los ajustes.", modeGame: "Como un juego", modeGameS: "Un compañero que crece contigo, puntos, niveles, premios y confeti.", modeCalm: "Tranquilo", modeCalmS: "Solo las tarjetas, con calma, y un contador sencillo. Sin compañero ni premios.", settings: "Ajustes" },
  tr: { modeLearn: "Öğrenme", modeLearnS: "Arkadaşınla birlikte Kur'an ve hadisi adım adım öğrenmek için kısa dersler.", modeTitle: "Nasıl kaydırmak istersin?", modeText: "Sana uyan deneyimi seç. Ayarlardan istediğin zaman değiştirebilirsin.", modeGame: "Oyun gibi", modeGameS: "Seninle büyüyen bir arkadaş, puanlar, seviyeler, ödüller ve konfeti.", modeCalm: "Sakin", modeCalmS: "Sadece kartlar, sade ve sakin, basit bir sayaçla. Arkadaş ya da ödül yok.", settings: "Ayarlar" },
  ur: { modeLearn: "سیکھنا", modeLearnS: "اپنے ساتھی کے ساتھ قرآن اور حدیث قدم بہ قدم سیکھنے کے مختصر اسباق۔", modeTitle: "آپ کیسے اسکرول کرنا چاہتے ہیں؟", modeText: "اپنے لیے موزوں تجربہ چنیں۔ آپ اسے کسی بھی وقت ترتیبات میں بدل سکتے ہیں۔", modeGame: "کھیل جیسا", modeGameS: "آپ کے ساتھ بڑھنے والا ساتھی، پوائنٹس، لیول، انعامات اور جشن۔", modeCalm: "پُرسکون", modeCalmS: "صرف کارڈز، سادہ اور پُرسکون، ایک سادہ گنتی کے ساتھ۔ نہ ساتھی، نہ انعامات۔", settings: "ترتیبات" },
  id: { modeLearn: "Belajar", modeLearnS: "Pelajaran singkat untuk belajar Al-Qur'an dan hadis selangkah demi selangkah, bersama temanmu.", modeTitle: "Bagaimana kamu ingin menggulir?", modeText: "Pilih pengalaman yang cocok untukmu. Kamu bisa mengubahnya kapan saja di pengaturan.", modeGame: "Seperti game", modeGameS: "Teman yang tumbuh bersamamu, poin, level, hadiah, dan konfeti.", modeCalm: "Tenang", modeCalmS: "Hanya kartu, tenang dan sederhana, dengan hitungan biasa. Tanpa teman atau hadiah.", settings: "Pengaturan" },
  bn: { modeLearn: "শেখা", modeLearnS: "তোমার সঙ্গীর সাথে ধাপে ধাপে কুরআন ও হাদিস শেখার ছোট ছোট পাঠ।", modeTitle: "তুমি কীভাবে স্ক্রল করতে চাও?", modeText: "তোমার পছন্দের অভিজ্ঞতা বেছে নাও। সেটিংসে যেকোনো সময় বদলাতে পারো।", modeGame: "খেলার মতো", modeGameS: "তোমার সাথে বেড়ে ওঠা সঙ্গী, পয়েন্ট, লেভেল, পুরস্কার আর কনফেটি।", modeCalm: "শান্ত", modeCalmS: "শুধু কার্ড, শান্ত ও সহজ, সাথে একটা সাধারণ গণনা। কোনো সঙ্গী বা পুরস্কার নেই।", settings: "সেটিংস" },
  ru: { modeLearn: "Обучение", modeLearnS: "Короткие уроки, чтобы шаг за шагом учить Коран и хадисы вместе со спутником.", modeTitle: "Как ты хочешь листать?", modeText: "Выбери, что тебе ближе. Это можно изменить в любой момент в настройках.", modeGame: "Как игра", modeGameS: "Спутник, который растёт вместе с тобой, очки, уровни, награды и конфетти.", modeCalm: "Спокойно", modeCalmS: "Только карточки, тихо и просто, с обычным счётчиком. Без спутника и наград.", settings: "Настройки" },
  de: { modeLearn: "Lernen", modeLearnS: "Kurze Lektionen, um Koran und Hadithe Schritt für Schritt zu lernen, mit deinem Begleiter.", modeTitle: "Wie möchtest du scrollen?", modeText: "Wähle, was zu dir passt. Du kannst es jederzeit in den Einstellungen ändern.", modeGame: "Wie ein Spiel", modeGameS: "Ein Begleiter, der mit dir wächst, Punkte, Level, Belohnungen und Konfetti.", modeCalm: "Ruhig", modeCalmS: "Nur die Karten, still und schlicht, mit einem einfachen Zähler. Kein Begleiter, keine Belohnungen.", settings: "Einstellungen" },
};
for (const [l, v] of Object.entries(MODE)) if (T[l]) Object.assign(T[l].ui, v);

// The tutorial lines added with one tutorial per mode (Zine, 2026-10-28).
const TUT = {
 "en": {
  "tutSound": "Turn the scroll sound on or off here, and pick the one you like. Weather sounds have their own switch below.",
  "tutMode": "Switch between Calm, Game-like and Learning here, any time.",
  "tutClose": "Tap “{b}” to go back.",
  "tutSettings": "Tap Settings for sounds, weather, language and to change mode.",
  "tutEndCalm": "That's it! Scroll calmly and enjoy your dhikr.",
  "tutLearn": "This is your learning path. Tap the next lesson to start; each one takes a minute or two.",
  "tutTracks": "Choose what to learn here: Qur'an or hadith.",
  "tutMem": "Memory check brings back what you learned so you don't forget it. The library keeps everything you learned.",
  "tutEndLearn": "That's it! Start your first lesson, bismillah."
 },
 "ar": {
  "tutSound": "من هنا تشغّل صوت التمرير أو توقفه وتختار الصوت الذي يعجبك. لأصوات الطقس مفتاح خاص بها في الأسفل.",
  "tutMode": "من هنا تنتقل بين الوضع الهادئ ووضع اللعبة ووضع التعلّم في أي وقت.",
  "tutClose": "اضغط «{b}» للرجوع.",
  "tutSettings": "اضغط الإعدادات للأصوات والطقس واللغة ولتغيير الوضع.",
  "tutEndCalm": "هذا كل شيء! تصفّح بهدوء واستمتع بأذكارك.",
  "tutLearn": "هذا مسار تعلّمك. اضغط الدرس التالي لتبدأ، وكل درس يستغرق دقيقة أو دقيقتين.",
  "tutTracks": "اختر من هنا ما تتعلّمه: القرآن أو الحديث.",
  "tutMem": "اختبار الذاكرة يعيد عليك ما تعلّمته حتى لا تنساه، والمكتبة تحفظ كل ما تعلّمته.",
  "tutEndLearn": "هذا كل شيء! ابدأ درسك الأول، بسم الله."
 },
 "fr": {
  "tutSound": "Active ou coupe le son du défilement ici, et choisis celui que tu préfères. Les sons de la météo ont leur propre bouton plus bas.",
  "tutMode": "Passe ici entre Calme, Comme un jeu et Apprentissage, à tout moment.",
  "tutClose": "Appuie sur « {b} » pour revenir.",
  "tutSettings": "Appuie sur Réglages pour les sons, la météo, la langue et pour changer de mode.",
  "tutEndCalm": "C'est tout ! Fais défiler au calme et profite de tes dhikr.",
  "tutLearn": "Voici ton parcours. Appuie sur la prochaine leçon pour commencer ; chacune prend une minute ou deux.",
  "tutTracks": "Choisis ici ce que tu apprends : le Coran ou les hadiths.",
  "tutMem": "Le test de mémoire te fait revoir ce que tu as appris pour ne pas l'oublier. La bibliothèque garde tout ce que tu as appris.",
  "tutEndLearn": "C'est tout ! Commence ta première leçon, bismillah."
 },
 "es": {
  "tutSound": "Activa o quita aquí el sonido al deslizar y elige el que te guste. Los sonidos del clima tienen su propio interruptor abajo.",
  "tutMode": "Cambia aquí entre Tranquilo, Como un juego y Aprendizaje cuando quieras.",
  "tutClose": "Toca «{b}» para volver.",
  "tutSettings": "Toca Ajustes para los sonidos, el clima, el idioma y para cambiar de modo.",
  "tutEndCalm": "¡Eso es todo! Desliza con calma y disfruta de tu dhikr.",
  "tutLearn": "Este es tu camino de aprendizaje. Toca la siguiente lección para empezar; cada una dura uno o dos minutos.",
  "tutTracks": "Elige aquí qué aprender: Corán o hadices.",
  "tutMem": "La prueba de memoria te repasa lo que aprendiste para que no lo olvides. La biblioteca guarda todo lo aprendido.",
  "tutEndLearn": "¡Eso es todo! Empieza tu primera lección, bismillah."
 },
 "tr": {
  "tutSound": "Kaydırma sesini buradan açıp kapat ve sevdiğin sesi seç. Hava durumu seslerinin aşağıda kendi düğmesi var.",
  "tutMode": "Sakin, Oyun gibi ve Öğrenme arasında buradan istediğin zaman geçiş yap.",
  "tutClose": "Geri dönmek için “{b}” düğmesine dokun.",
  "tutSettings": "Sesler, hava durumu, dil ve mod değiştirmek için Ayarlar'a dokun.",
  "tutEndCalm": "Hepsi bu! Sakince kaydır ve zikrinin tadını çıkar.",
  "tutLearn": "Bu senin öğrenme yolun. Başlamak için sıradaki derse dokun; her biri bir iki dakika sürer.",
  "tutTracks": "Ne öğreneceğini buradan seç: Kur'an ya da hadis.",
  "tutMem": "Hafıza testi öğrendiklerini unutmaman için tekrar ettirir. Kütüphane öğrendiğin her şeyi saklar.",
  "tutEndLearn": "Hepsi bu! İlk dersine başla, bismillah."
 },
 "ur": {
  "tutSound": "یہاں اسکرول کی آواز آن یا آف کریں اور اپنی پسند کی آواز چنیں۔ موسم کی آوازوں کا الگ بٹن نیچے ہے۔",
  "tutMode": "یہاں کسی بھی وقت پُرسکون، کھیل جیسا اور سیکھنا کے درمیان بدلیں۔",
  "tutClose": "واپس جانے کے لیے «{b}» دبائیں۔",
  "tutSettings": "آوازوں، موسم، زبان اور موڈ بدلنے کے لیے ترتیبات دبائیں۔",
  "tutEndCalm": "بس اتنا ہی! سکون سے اسکرول کریں اور اپنے اذکار سے لطف اٹھائیں۔",
  "tutLearn": "یہ آپ کا سیکھنے کا راستہ ہے۔ شروع کرنے کے لیے اگلا سبق دبائیں؛ ہر سبق ایک دو منٹ کا ہے۔",
  "tutTracks": "یہاں چنیں کہ کیا سیکھنا ہے: قرآن یا حدیث۔",
  "tutMem": "یادداشت کا امتحان سیکھی ہوئی چیزیں دہراتا ہے تاکہ آپ بھولیں نہیں۔ لائبریری میں سب کچھ محفوظ رہتا ہے۔",
  "tutEndLearn": "بس اتنا ہی! اپنا پہلا سبق شروع کریں، بسم اللہ۔"
 },
 "id": {
  "tutSound": "Nyalakan atau matikan suara gulir di sini, lalu pilih yang kamu suka. Suara cuaca punya tombolnya sendiri di bawah.",
  "tutMode": "Pindah di sini antara Tenang, Seperti game, dan Belajar kapan saja.",
  "tutClose": "Ketuk “{b}” untuk kembali.",
  "tutSettings": "Ketuk Pengaturan untuk suara, cuaca, bahasa, dan untuk mengganti mode.",
  "tutEndCalm": "Selesai! Menggulirlah dengan tenang dan nikmati zikirmu.",
  "tutLearn": "Ini jalur belajarmu. Ketuk pelajaran berikutnya untuk mulai; tiap pelajaran satu atau dua menit.",
  "tutTracks": "Pilih di sini apa yang ingin dipelajari: Al-Qur'an atau hadis.",
  "tutMem": "Tes hafalan mengulang yang sudah kamu pelajari agar tidak lupa. Perpustakaan menyimpan semua yang kamu pelajari.",
  "tutEndLearn": "Selesai! Mulai pelajaran pertamamu, bismillah."
 },
 "bn": {
  "tutSound": "এখানে স্ক্রলের শব্দ চালু বা বন্ধ করো আর পছন্দের শব্দ বেছে নাও। আবহাওয়ার শব্দের আলাদা সুইচ নিচে আছে।",
  "tutMode": "এখানে যেকোনো সময় শান্ত, খেলার মতো আর শেখার মধ্যে বদলাও।",
  "tutClose": "ফিরে যেতে “{b}” চাপো।",
  "tutSettings": "শব্দ, আবহাওয়া, ভাষা আর মোড বদলাতে সেটিংস চাপো।",
  "tutEndCalm": "ব্যস! শান্তভাবে স্ক্রল করো আর তোমার যিকির উপভোগ করো।",
  "tutLearn": "এটা তোমার শেখার পথ। শুরু করতে পরের পাঠে চাপো; প্রতিটি এক-দুই মিনিটের।",
  "tutTracks": "এখানে বেছে নাও কী শিখবে: কুরআন না হাদিস।",
  "tutMem": "স্মৃতি পরীক্ষা শেখা জিনিস আবার দেখায় যাতে ভুলে না যাও। লাইব্রেরিতে সব শেখা জিনিস থাকে।",
  "tutEndLearn": "ব্যস! তোমার প্রথম পাঠ শুরু করো, বিসমিল্লাহ।"
 },
 "ru": {
  "tutSound": "Здесь включай и выключай звук прокрутки и выбирай тот, что нравится. У звуков погоды свой переключатель ниже.",
  "tutMode": "Здесь можно в любой момент переключаться между режимами «Спокойно», «Как игра» и «Обучение».",
  "tutClose": "Нажми «{b}», чтобы вернуться.",
  "tutSettings": "Нажми «Настройки», чтобы выбрать звуки, погоду, язык и сменить режим.",
  "tutEndCalm": "Вот и всё! Листай спокойно и наслаждайся зикром.",
  "tutLearn": "Это твой путь обучения. Нажми на следующий урок, чтобы начать; каждый занимает минуту-две.",
  "tutTracks": "Выбери здесь, что учить: Коран или хадисы.",
  "tutMem": "Проверка памяти повторяет выученное, чтобы ты не забыл. В библиотеке хранится всё, что ты выучил.",
  "tutEndLearn": "Вот и всё! Начни первый урок, бисмиллях."
 },
 "de": {
  "tutSound": "Schalte hier den Scroll-Ton ein oder aus und wähle den, der dir gefällt. Die Wettergeräusche haben weiter unten einen eigenen Schalter.",
  "tutMode": "Wechsle hier jederzeit zwischen Ruhig, Wie ein Spiel und Lernen.",
  "tutClose": "Tippe auf „{b}“, um zurückzugehen.",
  "tutSettings": "Tippe auf Einstellungen für Töne, Wetter, Sprache und um den Modus zu wechseln.",
  "tutEndCalm": "Das war's! Scrolle in Ruhe und genieße deinen Dhikr.",
  "tutLearn": "Das ist dein Lernpfad. Tippe auf die nächste Lektion, um zu beginnen; jede dauert ein, zwei Minuten.",
  "tutTracks": "Wähle hier, was du lernen willst: Koran oder Hadith.",
  "tutMem": "Der Gedächtnistest wiederholt, was du gelernt hast, damit du es nicht vergisst. Die Bibliothek bewahrt alles Gelernte auf.",
  "tutEndLearn": "Das war's! Beginne deine erste Lektion, bismillah."
 }
};
for (const [l, v] of Object.entries(TUT)) if (T[l]) Object.assign(T[l].ui, v);

export function Picker() {
  const insets = useSafeAreaInsets();
  // First the language on its own, then the mode, then the buddy (Zine, 2026-10-28).
  if (!G.life.mode && !G.langChosen) return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={["#0b2b26", "#163832", "#051f20"]} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", gap: 22, padding: 20, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
        <Text style={u.arh}>بِسْمِ ٱللَّٰهِ</Text>
        <View style={{ width: "100%", maxWidth: 420 }}><LangPicker /></View>
        <View style={{ width: "100%", maxWidth: 420 }}><Btn primary title={t("cont")} onPress={() => { G.langChosen = true; changed(); }} testID="lang-continue" /></View>
      </ScrollView>
    </View>
  );
  if (!G.life.mode) return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={["#0b2b26", "#163832", "#051f20"]} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", gap: 14, padding: 20, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
        <Text style={u.arh}>بِسْمِ ٱللَّٰهِ</Text>
        <Text style={s.h1}>{t("modeTitle")}</Text>
        <Text style={s.p}>{t("modeText")}</Text>
        <View style={{ width: "100%", maxWidth: 420, gap: 12 }}>
          {[["game", "🎉", "modeGame"], ["calm", "🍃", "modeCalm"], ["learn", "📖", "modeLearn"]].map(([m, e, k]) => (
            <Pressable key={m} testID={"mode-" + m} onPress={() => pickMode(m)} style={({ pressed }) => [s.mode, pressed && { transform: [{ scale: 0.97 }], borderColor: C.gold2 }]}>
              <Ico e={e} size={44} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={s.choiceT}>{t(k)}</Text>
                <Text style={s.modeS}>{t(k + "S")}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={["#0b2b26", "#163832", "#051f20"]} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", gap: 14, padding: 20, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
        <Text style={u.arh}>بِسْمِ ٱللَّٰهِ</Text>
        <Text style={s.h1}>{t("pickTitle")}</Text>
        <Text style={s.p}>{t("pickText")}</Text>
        <View style={s.choices}>
          {[["m", "boy"], ["f", "girl"]].map(([g, k]) => (
            <Pressable key={g} testID={"pick-" + g} onPress={() => pickBuddy(g)} style={({ pressed }) => [s.choice, pressed && { transform: [{ scale: 0.96 }], borderColor: C.gold2 }]}>
              <BuddyArt gender={g} stage={0} width={150} height={129} />
              <Text style={s.choiceT}>{t(k)}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.small}>{t("pickHint")}</Text>
        <Pressable testID="mode-back" onPress={() => pickMode(undefined)} hitSlop={10}><Text style={[s.small, { fontSize: 14 }]}>{"‹  " + t("modeTitle")}</Text></Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  touch: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,224,138,0.9)", borderWidth: 3, borderColor: "#fff6dc", alignItems: "center", justifyContent: "center",
    shadowColor: "#f5b83d", shadowOpacity: 0.9, shadowRadius: 14, shadowOffset: { width: 0, height: 0 } },
  touchRing: { position: "absolute", width: 34, height: 34, borderRadius: 17, borderWidth: 2.5, borderColor: "#ffe08a" },
  arrow: { position: "absolute", top: 0 },
  spot: { position: "absolute", borderRadius: 18, borderWidth: 2, borderColor: C.gold2 },
  hand: { position: "absolute", alignSelf: "center", fontSize: 52 },
  tip: { position: "absolute", left: 16, right: 16, alignSelf: "center", maxWidth: 384, padding: 16, paddingBottom: 14, borderRadius: 22, backgroundColor: "#0f2f2b", borderWidth: 1.5, borderColor: C.gold2 },
  tipT: { fontSize: 16, lineHeight: 22, fontFamily: F.bold, color: C.ink, marginBottom: 12 },
  foot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  count: { fontSize: 12, fontFamily: F.heavy, color: C.inkFaint },
  skip: { height: 38, paddingHorizontal: 14, borderRadius: 999, backgroundColor: "rgba(244,239,226,0.12)", justifyContent: "center" },
  skipT: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  next: { height: 38, paddingHorizontal: 18, borderRadius: 999, justifyContent: "center", overflow: "hidden" },
  nextT: { fontFamily: F.heavy, fontSize: 14, color: "#2a1a00" },
  h1: { fontSize: 28, fontFamily: F.heavy, color: C.ink, textAlign: "center" },
  p: { maxWidth: 400, fontSize: 15, lineHeight: 22, fontFamily: F.ui, color: C.inkSoft, textAlign: "center" },
  choices: { flexDirection: "row", gap: 14, width: "100%", maxWidth: 420 },
  choice: { flex: 1, alignItems: "center", gap: 6, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 24, backgroundColor: "rgba(244,239,226,0.08)", borderWidth: 1.5, borderColor: C.line },
  choiceT: { fontSize: 18, fontFamily: F.heavy, color: C.ink },
  mode: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16, paddingHorizontal: 18, borderRadius: 24, backgroundColor: "rgba(244,239,226,0.08)", borderWidth: 1.5, borderColor: C.line },
  modeS: { fontSize: 13, lineHeight: 18, fontFamily: F.ui, color: C.inkSoft },
  small: { fontSize: 12, fontFamily: F.ui, color: C.inkFaint, textAlign: "center" },
});
