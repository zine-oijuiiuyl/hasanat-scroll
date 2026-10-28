// First-launch tutorial and the language/buddy picker.
import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Easing, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { G, TOUR, endTour, goTour, pickBuddy, pickMode } from "./game";
import { T } from "./web-data";
import { Ico } from "./Icons";
import { t } from "./i18n";
import { measure } from "./targets";
import { BuddyArt } from "./Buddy";
import { LangPicker, s as u } from "./ui";
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
  const step = i >= 0 ? TOUR[i] : null;
  useEffect(() => {
    let live = true;
    setSpot(null);
    // Measured again after a moment: a sheet that is still sliding in reports a position that is a bit off.
    const place = () => measure(step.target).then(r => { if (live && r) setSpot({ x: r.x - 8, y: r.y - 8, w: r.w + 16, h: r.h + 16 }); });
    let timers = [];
    if (step && step.target) { place(); timers = [setTimeout(place, 500), setTimeout(place, 1000)]; }
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
          <Text style={s.count}>{i + 1} / {TOUR.length}</Text>
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
  en: { modeTitle: "How do you want to scroll?", modeText: "Pick the experience that suits you. You can change it any time in the settings.", modeGame: "Game-like", modeGameS: "A buddy who grows with you, points, levels, rewards and confetti.", modeCalm: "Calm", modeCalmS: "Just the cards, quiet and simple. No buddy, points or rewards.", settings: "Settings" },
  ar: { modeTitle: "كيف تريد أن تتصفح؟", modeText: "اختر التجربة التي تناسبك. يمكنك تغييرها في أي وقت من الإعدادات.", modeGame: "مثل اللعبة", modeGameS: "رفيق يكبر معك، ونقاط ومستويات ومكافآت واحتفالات.", modeCalm: "هادئ", modeCalmS: "البطاقات فقط، بهدوء وبساطة. بلا رفيق ولا نقاط ولا مكافآت.", settings: "الإعدادات" },
  fr: { modeTitle: "Comment veux-tu faire défiler ?", modeText: "Choisis l'expérience qui te convient. Tu peux la changer à tout moment dans les réglages.", modeGame: "Comme un jeu", modeGameS: "Un compagnon qui grandit avec toi, des points, des niveaux, des récompenses et des confettis.", modeCalm: "Calme", modeCalmS: "Juste les cartes, au calme. Sans compagnon, points ni récompenses.", settings: "Réglages" },
  es: { modeTitle: "¿Cómo quieres deslizar?", modeText: "Elige la experiencia que te va mejor. Puedes cambiarla cuando quieras en los ajustes.", modeGame: "Como un juego", modeGameS: "Un compañero que crece contigo, puntos, niveles, premios y confeti.", modeCalm: "Tranquilo", modeCalmS: "Solo las tarjetas, con calma. Sin compañero, puntos ni premios.", settings: "Ajustes" },
  tr: { modeTitle: "Nasıl kaydırmak istersin?", modeText: "Sana uyan deneyimi seç. Ayarlardan istediğin zaman değiştirebilirsin.", modeGame: "Oyun gibi", modeGameS: "Seninle büyüyen bir arkadaş, puanlar, seviyeler, ödüller ve konfeti.", modeCalm: "Sakin", modeCalmS: "Sadece kartlar, sade ve sakin. Arkadaş, puan ya da ödül yok.", settings: "Ayarlar" },
  ur: { modeTitle: "آپ کیسے اسکرول کرنا چاہتے ہیں؟", modeText: "اپنے لیے موزوں تجربہ چنیں۔ آپ اسے کسی بھی وقت ترتیبات میں بدل سکتے ہیں۔", modeGame: "کھیل جیسا", modeGameS: "آپ کے ساتھ بڑھنے والا ساتھی، پوائنٹس، لیول، انعامات اور جشن۔", modeCalm: "پُرسکون", modeCalmS: "صرف کارڈز، سادہ اور پُرسکون۔ نہ ساتھی، نہ پوائنٹس، نہ انعامات۔", settings: "ترتیبات" },
  id: { modeTitle: "Bagaimana kamu ingin menggulir?", modeText: "Pilih pengalaman yang cocok untukmu. Kamu bisa mengubahnya kapan saja di pengaturan.", modeGame: "Seperti game", modeGameS: "Teman yang tumbuh bersamamu, poin, level, hadiah, dan konfeti.", modeCalm: "Tenang", modeCalmS: "Hanya kartu, tenang dan sederhana. Tanpa teman, poin, atau hadiah.", settings: "Pengaturan" },
  bn: { modeTitle: "তুমি কীভাবে স্ক্রল করতে চাও?", modeText: "তোমার পছন্দের অভিজ্ঞতা বেছে নাও। সেটিংসে যেকোনো সময় বদলাতে পারো।", modeGame: "খেলার মতো", modeGameS: "তোমার সাথে বেড়ে ওঠা সঙ্গী, পয়েন্ট, লেভেল, পুরস্কার আর কনফেটি।", modeCalm: "শান্ত", modeCalmS: "শুধু কার্ড, শান্ত ও সহজ। কোনো সঙ্গী, পয়েন্ট বা পুরস্কার নেই।", settings: "সেটিংস" },
  ru: { modeTitle: "Как ты хочешь листать?", modeText: "Выбери, что тебе ближе. Это можно изменить в любой момент в настройках.", modeGame: "Как игра", modeGameS: "Спутник, который растёт вместе с тобой, очки, уровни, награды и конфетти.", modeCalm: "Спокойно", modeCalmS: "Только карточки, тихо и просто. Без спутника, очков и наград.", settings: "Настройки" },
  de: { modeTitle: "Wie möchtest du scrollen?", modeText: "Wähle, was zu dir passt. Du kannst es jederzeit in den Einstellungen ändern.", modeGame: "Wie ein Spiel", modeGameS: "Ein Begleiter, der mit dir wächst, Punkte, Level, Belohnungen und Konfetti.", modeCalm: "Ruhig", modeCalmS: "Nur die Karten, still und schlicht. Kein Begleiter, keine Punkte, keine Belohnungen.", settings: "Einstellungen" },
};
for (const [l, v] of Object.entries(MODE)) if (T[l]) Object.assign(T[l].ui, v);

export function Picker() {
  const insets = useSafeAreaInsets();
  if (!G.life.mode) return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={["#0b2b26", "#163832", "#051f20"]} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", gap: 14, padding: 20, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
        <View style={{ width: "100%", maxWidth: 420 }}><LangPicker /></View>
        <Text style={u.arh}>بِسْمِ ٱللَّٰهِ</Text>
        <Text style={s.h1}>{t("modeTitle")}</Text>
        <Text style={s.p}>{t("modeText")}</Text>
        <View style={{ width: "100%", maxWidth: 420, gap: 12 }}>
          {[["game", "🎉", "modeGame"], ["calm", "🍃", "modeCalm"]].map(([m, e, k]) => (
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
        <View style={{ width: "100%", maxWidth: 420 }}><LangPicker /></View>
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
