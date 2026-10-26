// The Qibla compass: the direction of the Kaaba worked out from the phone's location, and a dial
// that turns with the phone's compass so the Kaaba mark shows which way to face.
import { memo, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useFrameCallback, useSharedValue } from "react-native-reanimated";
import Svg, { Circle, G as SvgG, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import * as Location from "expo-location";
import { T } from "./web-data";
import { t, num } from "./i18n";
import { C, F } from "./theme";
import { hapOk } from "./fx";

// Translations are mine, like the rest of the app's strings.
const QB = {
  en: ["Qibla direction", "You're facing the Qibla", "Turn left {d}°", "Turn right {d}°", "Qibla {d}° from north · {k} km to the Kaaba", "Share your location to find the Qibla where you are.", "Hold your phone flat, away from metal and magnets. If the needle drifts, move the phone in a figure 8 to calibrate it.", "No compass on this device. Face {d}° clockwise from north."],
  ar: ["اتجاه القبلة", "أنت متجه إلى القبلة", "استدر يسارًا {d}°", "استدر يمينًا {d}°", "القبلة {d}° من الشمال · {k} كم إلى الكعبة", "شارك موقعك لتحديد اتجاه القبلة من مكانك.", "أمسك هاتفك مستويًا وبعيدًا عن المعادن والمغناطيس. إن انحرفت الإبرة فحرّك الهاتف على شكل الرقم 8 لمعايرته.", "لا توجد بوصلة في هذا الجهاز. اتجه {d}° مع عقارب الساعة من الشمال."],
  fr: ["Direction de la Qibla", "Tu es face à la Qibla", "Tourne à gauche de {d}°", "Tourne à droite de {d}°", "Qibla à {d}° du nord · {k} km jusqu'à la Kaaba", "Partage ta position pour trouver la Qibla là où tu es.", "Tiens ton téléphone à plat, loin du métal et des aimants. Si l'aiguille dérive, fais un 8 avec le téléphone pour le calibrer.", "Pas de boussole sur cet appareil. Oriente-toi à {d}° dans le sens horaire depuis le nord."],
  es: ["Dirección de la Qibla", "Estás mirando hacia la Qibla", "Gira a la izquierda {d}°", "Gira a la derecha {d}°", "Qibla a {d}° del norte · {k} km hasta la Kaaba", "Comparte tu ubicación para encontrar la Qibla donde estás.", "Sostén el teléfono en horizontal, lejos de metales e imanes. Si la aguja se desvía, mueve el teléfono haciendo un 8 para calibrarlo.", "Este dispositivo no tiene brújula. Oriéntate {d}° en sentido horario desde el norte."],
  tr: ["Kıble yönü", "Kıbleye dönüksün", "{d}° sola dön", "{d}° sağa dön", "Kıble kuzeyden {d}° · Kâbe'ye {k} km", "Bulunduğun yerden kıbleyi bulmak için konumunu paylaş.", "Telefonunu düz tut, metal ve mıknatıslardan uzak dur. İbre kayarsa kalibrasyon için telefonu 8 çizerek hareket ettir.", "Bu cihazda pusula yok. Kuzeyden saat yönünde {d}° dön."],
  ur: ["قبلہ کی سمت", "آپ کا رخ قبلہ کی طرف ہے", "بائیں {d}° مڑیں", "دائیں {d}° مڑیں", "قبلہ شمال سے {d}° · کعبہ تک {k} کلومیٹر", "اپنی جگہ سے قبلہ معلوم کرنے کے لیے مقام شیئر کریں۔", "فون کو سیدھا رکھیں اور دھات و مقناطیس سے دور رکھیں۔ اگر سوئی ہٹ جائے تو فون کو 8 کی شکل میں گھمائیں۔", "اس آلے میں قطب نما نہیں۔ شمال سے گھڑی کی سمت {d}° رخ کریں۔"],
  id: ["Arah kiblat", "Kamu sudah menghadap kiblat", "Putar ke kiri {d}°", "Putar ke kanan {d}°", "Kiblat {d}° dari utara · {k} km ke Ka'bah", "Bagikan lokasimu untuk menemukan arah kiblat dari tempatmu.", "Pegang ponsel mendatar, jauh dari logam dan magnet. Jika jarum bergeser, gerakkan ponsel membentuk angka 8 untuk kalibrasi.", "Perangkat ini tidak punya kompas. Menghadaplah {d}° searah jarum jam dari utara."],
  bn: ["কিবলার দিক", "তুমি কিবলার দিকে মুখ করে আছ", "বাঁয়ে {d}° ঘোরো", "ডানে {d}° ঘোরো", "কিবলা উত্তর থেকে {d}° · কাবা পর্যন্ত {k} কিমি", "তোমার জায়গা থেকে কিবলা খুঁজতে লোকেশন শেয়ার করো।", "ফোন সমান করে ধরো, ধাতু ও চুম্বক থেকে দূরে। কাঁটা সরে গেলে ক্যালিব্রেট করতে ফোনটি ৮-এর মতো ঘোরাও।", "এই ডিভাইসে কম্পাস নেই। উত্তর থেকে ঘড়ির কাঁটার দিকে {d}° মুখ করো।"],
  ru: ["Направление киблы", "Ты смотришь на киблу", "Повернись влево на {d}°", "Повернись вправо на {d}°", "Кибла: {d}° от севера · {k} км до Каабы", "Поделись местоположением, чтобы найти киблу там, где ты.", "Держи телефон горизонтально, вдали от металла и магнитов. Если стрелка сбивается, поводи телефоном восьмёркой для калибровки.", "На этом устройстве нет компаса. Повернись на {d}° по часовой стрелке от севера."],
  de: ["Qibla-Richtung", "Du schaust zur Qibla", "Dreh dich {d}° nach links", "Dreh dich {d}° nach rechts", "Qibla {d}° von Norden · {k} km bis zur Kaaba", "Teile deinen Standort, um die Qibla von deinem Ort aus zu finden.", "Halte dein Handy flach und fern von Metall und Magneten. Wenn die Nadel abweicht, bewege das Handy in einer 8, um es zu kalibrieren.", "Dieses Gerät hat keinen Kompass. Richte dich {d}° im Uhrzeigersinn von Norden aus."],
};
const KEYS = ["qbTitle", "qbFacing", "qbLeft", "qbRight", "qbInfo", "qbIntro", "qbFlat", "qbNoCompass"];
for (const [l, v] of Object.entries(QB)) if (T[l]) KEYS.forEach((k, i) => { T[l].ui[k] = v[i]; });

// ---------- The direction ----------
const KAABA = [21.422487, 39.826206];
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
// Great-circle bearing from the phone to the Kaaba, in degrees clockwise from true north.
export function qiblaBearing(lat, lng) {
  const [a, b] = [rad(lat), rad(KAABA[0])], dl = rad(KAABA[1] - lng);
  const y = Math.sin(dl) * Math.cos(b);
  const x = Math.cos(a) * Math.sin(b) - Math.sin(a) * Math.cos(b) * Math.cos(dl);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}
export function kaabaKm(lat, lng) {
  const [a, b] = [rad(lat), rad(KAABA[0])], dp = b - a, dl = rad(KAABA[1] - lng);
  const h = Math.sin(dp / 2) ** 2 + Math.cos(a) * Math.cos(b) * Math.sin(dl / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}
// Signed turn from the way the phone points to the Qibla: positive is to the right.
const turnTo = (qibla, heading) => ((qibla - heading + 540) % 360) - 180;

// ---------- The dial ----------
const SIZE = 290, R = SIZE / 2;
const pt = (a, r) => [R + r * Math.sin(rad(a)), R - r * Math.cos(rad(a))];

// Drawn once and only redrawn when it turns green; turning it is done by the native transform.
const Dial = memo(function Dial({ qibla, facing }) {
  const ticks = [];
  for (let a = 0; a < 360; a += 5) {
    const long = a % 30 === 0, [x1, y1] = pt(a, R - 8), [x2, y2] = pt(a, R - (long ? 22 : 15));
    ticks.push(<Line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke={long ? C.ink : C.inkFaint} strokeWidth={long ? 2.2 : 1.2} strokeLinecap="round" />);
  }
  const [kx, ky] = pt(qibla, R - 52);
  const [nx, ny] = pt(qibla, R - 76);
  const gold = facing ? "#7ee2b8" : C.gold2;
  return (
    <Svg width={SIZE} height={SIZE}>
      <Circle cx={R} cy={R} r={R - 2} fill="rgba(4,20,18,0.55)" stroke={facing ? "#4fd1a5" : C.line} strokeWidth={facing ? 4 : 2} />
      {ticks}
      {[["N", 0], ["E", 90], ["S", 180], ["W", 270]].map(([l, a]) => {
        const [x, y] = pt(a, R - 40);
        return <SvgText key={l} x={x} y={y + 6} fontSize={17} fontFamily={F.heavy} fill={l === "N" ? "#ff7a6b" : C.inkSoft} textAnchor="middle">{l}</SvgText>;
      })}
      {/* The needle to the Kaaba */}
      <Line x1={R} y1={R} x2={nx} y2={ny} stroke={gold} strokeWidth={4} strokeLinecap="round" />
      <Circle cx={R} cy={R} r={7} fill={gold} />
      <SvgG transform={`rotate(${qibla} ${kx} ${ky})`}>
        <Rect x={kx - 15} y={ky - 15} width={30} height={30} rx={3} fill="#111" stroke={gold} strokeWidth={2} />
        <Rect x={kx - 15} y={ky - 7} width={30} height={5} fill={gold} />
      </SvgG>
    </Svg>
  );
});

// The arrow at the top shows where the phone points; the dial turns underneath it.
export function QiblaCompass({ lat, lng }) {
  const qibla = qiblaBearing(lat, lng), km = kaabaKm(lat, lng);
  // Whole degrees left to turn, so the text only re-renders when the number changes.
  const [turn, setTurn] = useState(null);
  const [noCompass, setNoCompass] = useState(false);
  // The compass reports a few dozen times a second, unevenly. JS only sets where the dial should be;
  // on the UI thread the dial eases toward it every frame, so it moves at the screen's full rate.
  const target = useSharedValue(0), angle = useSharedValue(0);
  useFrameCallback(f => {
    "worklet";
    const dt = f.timeSincePreviousFrame || 16;
    angle.value += (target.value - angle.value) * (1 - Math.exp(-dt / 70));
  });
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.value}deg` }] }));
  const last = useRef(0), was = useRef(false), events = useRef(0);
  // A hidden meter (long-press the dial) that shows how smooth the screen is and how often the compass reports.
  const [meter, setMeter] = useState(null);

  useEffect(() => {
    let sub = null, alive = true, got = false;
    // No reading after a few seconds means there is no compass to use.
    const wait = setTimeout(() => { if (alive && !got) setNoCompass(true); }, 4000);
    Location.watchHeadingAsync(h => {
      const v = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
      if (!(v >= 0)) return;
      // Turn the short way round, so 359° to 1° doesn't spin the dial backwards.
      const next = last.current + (((-v - last.current) % 360 + 540) % 360 - 180);
      last.current = next;
      target.value = next;
      if (!got) { got = true; angle.value = next; setNoCompass(false); }
      events.current++;
      setTurn(Math.round(turnTo(qibla, v)));
    }).then(s => { if (alive) sub = s; else s.remove(); }, () => alive && setNoCompass(true));
    return () => { alive = false; clearTimeout(wait); if (sub) sub.remove(); };
  }, [qibla]);

  const facing = turn != null && Math.abs(turn) <= 4;
  useEffect(() => {
    if (facing && !was.current) hapOk();
    if (turn != null && Math.abs(turn) > 10) was.current = false; else if (facing) was.current = true;
  }, [facing, turn]);

  useEffect(() => {
    if (!meter) return;
    let frames = 0, raf = 0, alive = true;
    const tick = () => { frames++; if (alive) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    events.current = 0;
    const id = setInterval(() => { setMeter({ fps: frames, per: events.current }); frames = 0; events.current = 0; }, 1000);
    return () => { alive = false; cancelAnimationFrame(raf); clearInterval(id); };
  }, [!!meter]);

  return (
    <View style={s.wrap}>
      <View style={[s.pointer, facing && { borderBottomColor: "#4fd1a5" }]} />
      <Pressable onLongPress={() => setMeter(m => m ? null : { fps: 0, per: 0 })} delayLongPress={600}>
        <Animated.View style={spinStyle} shouldRasterizeIOS renderToHardwareTextureAndroid>
          <Dial qibla={qibla} facing={facing} />
        </Animated.View>
      </Pressable>
      {meter ? <Text style={s.meter}>JS {meter.fps} fps · compass {meter.per}/s</Text> : null}
      <Text style={[s.status, facing && { color: "#9ff0c4" }]}>
        {noCompass ? t("qbNoCompass", { d: Math.round(qibla) })
          : turn == null ? "…"
          : facing ? "✓ " + t("qbFacing")
          : t(turn > 0 ? "qbRight" : "qbLeft", { d: Math.abs(turn) })}
      </Text>
      <Text style={s.info}>{t("qbInfo", { d: Math.round(qibla), k: num(Math.round(km)) })}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: "center", gap: 14 },
  pointer: { width: 0, height: 0, borderLeftWidth: 13, borderRightWidth: 13, borderBottomWidth: 20, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: C.gold1, marginBottom: -6 },
  status: { fontFamily: F.heavy, fontSize: 22, color: C.ink, textAlign: "center" },
  info: { fontFamily: F.bold, fontSize: 14, color: C.gold2, textAlign: "center" },
  meter: { fontFamily: F.bold, fontSize: 12, color: C.inkFaint },
});
