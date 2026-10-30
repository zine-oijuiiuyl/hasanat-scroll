// Full-screen sheets: session summary, progress and settings, the sins counter, prayer times and the Qibla.
import { stopRecite, setReciteVolume } from "./recite";
import Slider from "@react-native-community/slider";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import { BY_ID, STAGES, BADGES, levelFor, levelProgress, stageProgress, threshold, PR_NAMES, PR_METHODS, prayerDay } from "./web-data";
import {
  G, closeView, keepScrolling, resetSession, openView, openCinematic, tabOf, lifeTaps, stageNow, sTaps, askToRate, rate, rateLater,
  setSetting, swapBuddy, startTour, isCalm, isLearn, setMode, countNow, countToday, countAll, dayKey, wipeEverything, backupText, restoreText, digits, startDebt, removeDebt,
} from "./game";
import { t, levelTitle, stageName, badgeText, num, isRTL, getLang } from "./i18n";
import { BuddyArt } from "./Buddy";
import { Panel, Label, Cap, Bar, Tile, Tiles, Btn, Toggle, Choice, LangPicker, s as u } from "./ui";
import { C, F, GOLD, SHEET_BG } from "./theme";
import { fx, hapTick, scrollSound, setFxSettings } from "./fx";
import { target, setScroller } from "./targets";
import { Lesson, Review, Library, Reader } from "./LearnScreens";
import { askLocation, hhmm, nextPrayer, pName, setPrayerOn, setReminders, updatePrayer } from "./prayer";
import { QiblaCompass } from "./Qibla";
import { SheetMiner } from "./Rock";
import { HeartedPanel } from "./Hearts";
import { WEATHERS } from "./Weather";
import { T } from "./web-data";

// The liquid bubble scroll sound (Zine, 2026-10-28). Translations are mine, like the rest of the app's strings.
const BUBBLE = { en: "Bubble", ar: "فقاعة", fr: "Bulle", es: "Burbuja", tr: "Baloncuk", ur: "بلبلہ", id: "Gelembung", bn: "বুদবুদ", ru: "Пузырёк", de: "Blase" };
for (const [l, v] of Object.entries(BUBBLE)) if (T[l]) T[l].ui.sndBubble = v;
// The switch that hides the buddy on the scroll page (Zine, 2026-10-28).
const FEED_BUDDY = { en: "Show buddy while scrolling", ar: "إظهار الرفيق أثناء التمرير", fr: "Afficher le compagnon pendant le défilement", es: "Mostrar al compañero al deslizar", tr: "Kaydırırken arkadaşı göster", ur: "اسکرول کرتے وقت ساتھی دکھائیں", id: "Tampilkan teman saat menggulir", bn: "স্ক্রল করার সময় সঙ্গী দেখাও", ru: "Показывать спутника при прокрутке", de: "Begleiter beim Scrollen zeigen" };
for (const [l, v] of Object.entries(FEED_BUDDY)) if (T[l]) T[l].ui.feedBuddy = v;
const CALM_MODE = { en: "Calm mode", ar: "الوضع الهادئ", fr: "Mode calme", es: "Modo tranquilo", tr: "Sakin mod", ur: "پُرسکون موڈ", id: "Mode tenang", bn: "শান্ত মোড", ru: "Спокойный режим", de: "Ruhiger Modus" };
for (const [l, v] of Object.entries(CALM_MODE)) if (T[l]) T[l].ui.calmMode = v;
const HIST = {
 "en": {
  "histTitle": "History",
  "histNow": "Right now",
  "histToday": "Today",
  "histAll": "Since you started",
  "histDays": "Day by day",
  "histEmpty": "Nothing yet. Scroll a few cards and they'll show up here.",
  "histNote": "Every card you scroll to and every tap counts, in both Calm and Game."
 },
 "ar": {
  "histTitle": "السجل",
  "histNow": "الآن",
  "histToday": "اليوم",
  "histAll": "منذ البداية",
  "histDays": "يومًا بيوم",
  "histEmpty": "لا شيء بعد. تصفّح بعض البطاقات وستظهر هنا.",
  "histNote": "كل بطاقة تصل إليها وكل ضغطة تُحسب، في الوضع الهادئ ووضع اللعبة."
 },
 "fr": {
  "histTitle": "Historique",
  "histNow": "En ce moment",
  "histToday": "Aujourd'hui",
  "histAll": "Depuis le début",
  "histDays": "Jour par jour",
  "histEmpty": "Rien pour l'instant. Fais défiler quelques cartes et elles apparaîtront ici.",
  "histNote": "Chaque carte atteinte et chaque appui comptent, en mode Calme comme en mode Jeu."
 },
 "es": {
  "histTitle": "Historial",
  "histNow": "Ahora mismo",
  "histToday": "Hoy",
  "histAll": "Desde el principio",
  "histDays": "Día a día",
  "histEmpty": "Nada todavía. Desliza algunas tarjetas y aparecerán aquí.",
  "histNote": "Cuenta cada tarjeta a la que llegas y cada toque, en Tranquilo y en Juego."
 },
 "tr": {
  "histTitle": "Geçmiş",
  "histNow": "Şu an",
  "histToday": "Bugün",
  "histAll": "Başladığından beri",
  "histDays": "Gün gün",
  "histEmpty": "Henüz bir şey yok. Birkaç kart kaydır, burada görünecek.",
  "histNote": "Kaydırdığın her kart ve her dokunuş sayılır, hem Sakin hem Oyun modunda."
 },
 "ur": {
  "histTitle": "تاریخچہ",
  "histNow": "ابھی",
  "histToday": "آج",
  "histAll": "شروع سے اب تک",
  "histDays": "دن بہ دن",
  "histEmpty": "ابھی کچھ نہیں۔ چند کارڈز اسکرول کریں، وہ یہاں نظر آئیں گے۔",
  "histNote": "ہر کارڈ جس تک آپ پہنچیں اور ہر ٹیپ گنا جاتا ہے، پُرسکون اور کھیل دونوں میں۔"
 },
 "id": {
  "histTitle": "Riwayat",
  "histNow": "Saat ini",
  "histToday": "Hari ini",
  "histAll": "Sejak awal",
  "histDays": "Hari demi hari",
  "histEmpty": "Belum ada. Gulir beberapa kartu dan akan muncul di sini.",
  "histNote": "Setiap kartu yang kamu capai dan setiap ketukan dihitung, di mode Tenang maupun Game."
 },
 "bn": {
  "histTitle": "ইতিহাস",
  "histNow": "এখন",
  "histToday": "আজ",
  "histAll": "শুরু থেকে",
  "histDays": "দিন অনুযায়ী",
  "histEmpty": "এখনো কিছু নেই। কয়েকটা কার্ড স্ক্রল করো, এখানে দেখা যাবে।",
  "histNote": "প্রতিটি কার্ড আর প্রতিটি ট্যাপ গোনা হয়, শান্ত ও খেলা দুই মোডেই।"
 },
 "ru": {
  "histTitle": "История",
  "histNow": "Сейчас",
  "histToday": "Сегодня",
  "histAll": "С самого начала",
  "histDays": "По дням",
  "histEmpty": "Пока пусто. Пролистай несколько карточек, и они появятся здесь.",
  "histNote": "Считается каждая карточка и каждое касание, и в спокойном режиме, и в игровом."
 },
 "de": {
  "histTitle": "Verlauf",
  "histNow": "Gerade",
  "histToday": "Heute",
  "histAll": "Seit dem Start",
  "histDays": "Tag für Tag",
  "histEmpty": "Noch nichts. Scrolle ein paar Karten, dann erscheinen sie hier.",
  "histNote": "Jede Karte, zu der du scrollst, und jedes Tippen zählt, im ruhigen wie im Spielmodus."
 }
};
for (const [l, v] of Object.entries(HIST)) if (T[l]) Object.assign(T[l].ui, v);
const WX_SOUND = { en: "Weather sounds", ar: "أصوات الطقس", fr: "Sons de la météo", es: "Sonidos del clima", tr: "Hava sesleri", ur: "موسم کی آوازیں", id: "Suara cuaca", bn: "আবহাওয়ার শব্দ", ru: "Звуки погоды", de: "Wettergeräusche" };
for (const [l, v] of Object.entries(WX_SOUND)) if (T[l]) T[l].ui.wxSound = v;
import { Ico, IconText } from "./Icons";

const TAB_ORDER = [["dhikr", "tabDhikr"], ["dua", "tabDua"], ["quran", "tabQuran"], ["muh", "tabHadith"]];
const fmtTime = ms => { const x = Math.round(ms / 1000); return x >= 60 ? `${Math.floor(x / 60)}m ${x % 60}s` : `${x}s`; };

// When one sheet replaces another (progress and prayer times, say), the new one appears at once;
// fading it in would let the feed underneath show through. The sheet being replaced is still
// mounted while its successor first renders, so the count tells the two cases apart.
let openSheets = 0;
// Done screens are grey and the settings blue (Zine, 2026-10-28); the rest keep the green.
const GREY_BG = ["#2a2e33", "#353a40", "#1b1e22"], BLUE_BG = ["#0d2747", "#173a66", "#081a31"];
function Sheet({ children, actions, bg = SHEET_BG }) {
  const insets = useSafeAreaInsets();
  const a = useRef(new Animated.Value(openSheets > 0 ? 1 : 0)).current;
  const sv = useRef(null), pos = useRef(0);
  useEffect(() => {
    const me = { get y() { return pos.current; }, scrollTo: y => sv.current && sv.current.scrollTo({ y, animated: true }) };
    setScroller(me);
    return () => setScroller(null);
  }, []);
  useEffect(() => {
    openSheets++;
    Animated.timing(a, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    return () => { openSheets--; };
  }, [a]);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }]}>
      <LinearGradient colors={bg} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <ScrollView ref={sv} onScroll={e => { pos.current = e.nativeEvent.contentOffset.y; }} scrollEventThrottle={32}
        contentContainerStyle={{ paddingTop: insets.top + 28, paddingBottom: insets.bottom + 120, paddingHorizontal: 16 }} keyboardShouldPersistTaps="handled">
        <View style={{ width: "100%", maxWidth: 520, alignSelf: "center", gap: 22 }}>{children}</View>
      </ScrollView>
      <LinearGradient colors={["transparent", bg[2]]} locations={[0, 0.4]} style={[s.actions, { paddingBottom: insets.bottom + 14 }]}>
        {actions}
      </LinearGradient>
    </Animated.View>
  );
}

const Hero = ({ children }) => <View style={{ alignItems: "center", gap: 6 }}>{children}</View>;

function BadgeGrid({ list, have }) {
  return (
    <View style={s.badges}>
      {list.map(b => {
        const on = have(b);
        return (
          <View key={b.id} style={s.badge}>
            <View style={[s.disc, !on && { opacity: 0.45, backgroundColor: "rgba(244,239,226,0.05)" }]}><Ico e={on ? b.icon : "🔒"} size={32} /></View>
            <Text style={s.badgeB}>{badgeText(b)[0]}</Text>
            <Text style={s.badgeS}>{badgeText(b)[1]}</Text>
          </View>
        );
      })}
    </View>
  );
}

function Rate({ ask, later }) {
  const cur = G.life.rating || 0;
  return (
    <Panel style={{ alignItems: "center" }}>
      <Label>{t("rateTitle")}</Label>
      {ask && !cur ? <Text style={s.rateAsk}>{t("rateAsk")}</Text> : null}
      <View style={{ flexDirection: "row", gap: 6, direction: "ltr" }}>
        {[1, 2, 3, 4, 5].map(n => (
          <Pressable key={n} onPress={() => rate(n)} hitSlop={4}>
            <Text style={[s.star, n <= cur && s.starOn]}>★</Text>
          </Pressable>
        ))}
      </View>
      {cur ? <Text style={s.rateMsg}>{t("rateThanks")}</Text> : null}
      {later && !cur ? <Pressable onPress={rateLater}><Text style={s.rateLater}>{t("rateLater")}</Text></Pressable> : null}
    </Panel>
  );
}

function CountUp({ to, evolved }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!to) { setN(0); return; }
    const steps = Math.min(30, to); let i = 0;
    const iv = setInterval(() => {
      i++; setN(Math.round(to * i / steps));
      if (i % 3 === 0) fx.seen();
      if (i >= steps) { clearInterval(iv); evolved ? fx.evolve() : fx.party(); }
    }, 40);
    return () => clearInterval(iv);
  }, [to, evolved]);
  return <Text style={u.big}>{num(n)}</Text>;
}

export function Summary({ sm }) {
  const L = G.life;
  const rows = Object.entries(sm.said).map(([id, n]) => ({ d: BY_ID[id], n })).filter(r => r.d && r.n > 0).sort((a, b) => b.n - a.n);
  const max = Math.max(1, ...rows.map(r => r.n));
  const lt = L.said, lv = levelFor(lt);
  const evolved = sm.stageEnd > sm.stageStart;
  return (
    <Sheet bg={GREY_BG} actions={<>
      <Btn title={t("reset")} onPress={() => { hapTick(); resetSession(); }} testID="reset" />
      <Btn title={t("again")} primary style={{ flex: 1 }} onPress={() => keepScrolling(sm)} testID="again" />
    </>}>
      <Hero>
        <Text style={u.arh}>{sm.taps ? "مَا شَاءَ ٱللَّٰهُ" : "بِسْمِ ٱللَّٰهِ"}</Text>
        {L.gender ? <BuddyArt gender={L.gender} stage={sm.stageEnd} width={200} height={172} /> : null}
        <Cap>{sm.taps ? t("complete") : t("start")}</Cap>
        <CountUp to={sm.taps} evolved={evolved} />
        <Cap>{t("ptsSession")}</Cap>
      </Hero>
      {evolved ? <Panel gold><Ico e={sm.stageEnd >= 3 ? "🪽" : "✨"} size={44} /><View style={{ flex: 1 }}><Text style={s.goldB}>{t("grew")}</Text><Text style={s.goldS}>{stageName(sm.stageStart)} → {stageName(sm.stageEnd)}</Text></View></Panel> : null}
      {sm.levelAfter > sm.levelBefore ? <Panel gold><Text style={{ fontSize: 36 }}>⬆️</Text><View style={{ flex: 1 }}><Text style={s.goldB}>{t("lvUp")}</Text><Text style={s.goldS}>{t("lvLine", { n: sm.levelAfter, t: levelTitle(sm.levelAfter) })}</Text></View></Panel> : null}
      <Tiles>
        <Tile icon="✦" v={num(L.said)} k={t("allPts")} /><Tile icon="⏱" v={fmtTime(sm.end - sm.start)} k={t("time")} />
        <Tile icon="⭐" v={sm.golden} k={t("goldenTile")} /><Tile icon="📅" v={L.streak} k={t("streak")} /><Tile icon="📿" v={rows.length} k={t("types")} />
      </Tiles>
      {L.debt ? (
        <Panel>
          <Label>⚖️ {t("debtTitle")}</Label>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
            <Text style={s.strong}>{t("debtLifted", { n: num(sm.lifted || 0) })}</Text>
            <Text style={s.strong}>{L.debt.done ? t("debtDoneChip") : t("debtLeft", { n: num(L.debt.left) })}</Text>
          </View>
          <Bar value={1 - L.debt.left / L.debt.start} />
        </Panel>
      ) : null}
      <HeartedPanel />
      {sm.badges.length ? <Panel><Label>{t("newBadges")}</Label><BadgeGrid list={sm.badges} have={() => true} /></Panel> : null}
      {rows.length ? TAB_ORDER.map(([tb, key]) => {
        const rs = rows.filter(r => tabOf(r.d) === tb);
        return rs.length ? (
          <Panel key={tb}>
            <Label>{t(key)}</Label>
            {rs.map(r => (
              <View key={r.d.id} style={{ gap: 6 }}>
                <View style={u.row}><Text style={u.rowT} numberOfLines={1}>{r.d.tr}</Text><Text style={u.rowA} numberOfLines={1}>{r.d.ar}</Text><Text style={u.rowN}>×{r.n}</Text></View>
                <Bar value={r.n / max} height={6} />
              </View>
            ))}
          </Panel>
        ) : null;
      }) : <Panel><Label>{t("perDhikr")}</Label><Text style={[u.note, { textAlign: "left" }]}>{t("nothing")}</Text></Panel>}
      <Panel>
        <Label>{t("allTime")}</Label>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text style={s.strong}>{t("lvLine", { n: lv, t: levelTitle(lv) })}</Text><Text style={s.strong}>{num(lt)} {t("pointsWord")}</Text></View>
        <Bar value={levelProgress(lt)} />
        <Text style={s.faint}>{t("sessLine", { s: L.sessions, d: L.bestStreak })}</Text>
      </Panel>
      <Label>{t("histTitle")}</Label>
      <HistoryBody now={sm.taps} />
      {askToRate() ? <Rate ask later /> : null}
      <Panel><LangPicker /></Panel>
      <Text style={u.note}>{t("disclaimer")}</Text>
    </Sheet>
  );
}

async function backupProgress() {
  const name = `dhikr-scroll-backup-${new Date().toISOString().slice(0, 10)}.json`;
  try {
    const f = new File(Paths.cache, name);
    if (f.exists) f.delete();
    f.create();
    await f.write(backupText());
    await Sharing.shareAsync(f.uri, { mimeType: "application/json", UTI: "public.json", dialogTitle: name });
  } catch (e) {}
}
async function restoreProgress() {
  try {
    const r = await DocumentPicker.getDocumentAsync({ type: ["application/json", "public.json", "*/*"], copyToCacheDirectory: true });
    if (r.canceled || !r.assets || !r.assets[0]) return;
    restoreText(await new File(r.assets[0].uri).text());
  } catch (e) { restoreText(""); }
}

// ---------- History: what you scored right now, today, since the start, and on each day by the hour ----------
const dayName = key => {
  const [y, m, d] = key.split("-").map(Number);
  try { return new Date(y, m - 1, d).toLocaleDateString(getLang(), { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }
  catch (e) { return key; }
};
const hourName = h => `${String(h).padStart(2, "0")}:00 – ${String((h + 1) % 24).padStart(2, "0")}:00`;

function DayRow({ k, day, open, onToggle }) {
  const hours = Object.entries(day.h).map(([h, n]) => [+h, n]).sort((a, b) => a[0] - b[0]);
  const max = Math.max(1, ...hours.map(x => x[1]));
  return (
    <View style={{ gap: 8 }}>
      <Pressable onPress={() => { hapTick(); onToggle(); }} style={u.row} testID={"day-" + k}>
        <Text style={u.rowT} numberOfLines={1}>{(open ? "▾ " : "▸ ") + (k === dayKey() ? t("histToday") : dayName(k))}</Text>
        <Text style={u.rowN}>{num(day.n)}</Text>
      </Pressable>
      {open ? hours.map(([h, n]) => (
        <View key={h} style={s.hourRow}>
          <Text style={s.hourT}>{hourName(h)}</Text>
          <View style={s.hourBar}><LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: "100%", width: `${(n / max) * 100}%`, borderRadius: 999 }} /></View>
          <Text style={[u.rowN, { minWidth: 40, textAlign: "right" }]}>{num(n)}</Text>
        </View>
      )) : null}
    </View>
  );
}

// The history sits in the Done screen of both modes (Zine, 2026-10-28). `now` is this session's count.
function HistoryBody({ now }) {
  const days = Object.entries(G.life.log || {}).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  const [open, setOpen] = useState(days.length ? days[0][0] : null);
  return (
    <>
      <Tiles>
        <Tile icon="📿" v={num(now)} k={t("histNow")} />
        <Tile icon="📅" v={num(countToday())} k={t("histToday")} />
        <Tile icon="🏆" v={num(countAll())} k={t("histAll")} />
      </Tiles>
      <Panel>
        <Label>{t("histDays")}</Label>
        {days.length ? days.map(([k, day]) => <DayRow key={k} k={k} day={day} open={open === k} onToggle={() => setOpen(open === k ? null : k)} />)
          : <Text style={s.faint}>{t("histEmpty")}</Text>}
      </Panel>
      <Text style={u.note}>{t("histNote")}</Text>
    </>
  );
}

// Calm mode's Done screen: just the counts and the history.
export function History() {
  return (
    <Sheet bg={GREY_BG} actions={<View style={{ flex: 1, maxWidth: 420 }}><Btn title={t("back")} primary onPress={closeView} testID="close" /></View>}>
      <Hero><Label>{t("histTitle")}</Label></Hero>
      <HistoryBody now={countNow()} />
    </Sheet>
  );
}

// Calm, game or learning, as one switch with three sides (Zine, 2026-10-28).
// One volume slider for each sound, the same three as the mute button (Zine, 2026-10-30). The sliders play
// as you drag: the weather and a verse already playing change at once, the scroll sound plays when you let go.
function Volumes() {
  const L = G.life;
  const rows = [
    ["volWx", "muteWx", v => setFxSettings({ volWx: v }), () => {}],
    ["volScroll", "muteScroll", () => {}, () => scrollSound()],
    ["volRecite", "muteRecite", v => setReciteVolume(v), () => {}],
  ];
  return (
    <View style={{ gap: 4 }}>
      <Label>{t("volume")}</Label>
      {rows.map(([k, lab, live, done]) => (
        <View key={k} style={s.volRow}>
          <Text style={s.volT} numberOfLines={1}>{t(lab)}</Text>
          <Slider testID={k} style={{ flex: 1, height: 36 }} minimumValue={0} maximumValue={1} step={0.05}
            value={L[k] ?? 1} minimumTrackTintColor={GOLD[0]} maximumTrackTintColor="rgba(255,255,255,0.25)" thumbTintColor="#fff"
            onValueChange={live} onSlidingComplete={v => { setSetting(k, v); done(); }} />
        </View>
      ))}
    </View>
  );
}

function ModeSwitch() {
  const cur = G.life.mode || "game";
  return (
    <View ref={target("modeSw")} style={s.modeSw}>
      {[["calm", "🍃", "modeCalm"], ["game", "🎉", "modeGame"], ["learn", "📖", "modeLearn"]].map(([m, e, k]) => (
        <Pressable key={m} testID={"modeSw-" + m} onPress={() => { if (m !== cur) { hapTick(); stopRecite(); setMode(m); } }} style={s.modeSide}>
          {m === cur ? <LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 999 }]} /> : null}
          <IconText style={[s.modeT, m === cur && { color: "#2a1a00" }]} size={13} gap={4} numberOfLines={1}>{e + " " + t(k)}</IconText>
        </Pressable>
      ))}
    </View>
  );
}

export function Progress() {
  const L = G.life;
  const p = lifeTaps(), lv = levelFor(p), st = stageNow();
  const [sure, setSure] = useState(false);
  useEffect(() => { if (!sure) return; const x = setTimeout(() => setSure(false), 4000); return () => clearTimeout(x); }, [sure]);
  const calm = isCalm();   // calm mode shows only the settings: no buddy, levels, points or badges
  return (
    <Sheet bg={BLUE_BG} actions={<View ref={target("close")} style={{ flex: 1, maxWidth: 420 }}><Btn title={t("back")} primary onPress={closeView} testID="close" /></View>}>
      {/* The mode switch comes first in every mode (Zine, 2026-10-29). */}
      <ModeSwitch />
      {calm ? null : <>
      <Hero>
        <Label>{t("progress")}</Label>
        <BuddyArt gender={L.gender || "m"} stage={st} width={210} height={180} />
        <Cap>{stageName(st)}</Cap>
        <Text style={u.big}>{lv}</Text>
        <Cap>{t("levelCap", { t: levelTitle(lv) })}</Cap>
        <View style={{ width: "100%", marginTop: 8 }}><Bar value={levelProgress(p)} /></View>
        <Text style={s.faint}>{t("toNext", { n: num(threshold(lv + 1) - p), l: lv + 1 })}</Text>
      </Hero>
      <Panel>
        <Label>{t("journey")}</Label>
        <View style={s.journey}>
          {STAGES.map((_, i) => {
            const got = i <= st;
            return (
              <Pressable key={i} disabled={!got || i === 0} onPress={() => { hapTick(); openCinematic(i - 1, i); }} style={[s.stage, i === st && s.stageNow]}>
                <View style={!got && { opacity: 0.25 }}><BuddyArt gender={L.gender || "m"} stage={i} width={90} height={78} /></View>
                <Text style={s.stageB}>{got ? stageName(i) : "???"}</Text>
              </Pressable>
            );
          })}
        </View>
        {st < STAGES.length - 1
          ? <><Bar value={stageProgress(p, L.badges.length)} /><Text style={s.faint}>{t("reach", { n: stageName(st + 1) })}</Text></>
          : <Text style={s.faint}>{t("fullAngel")}</Text>}
      </Panel>
      <Tiles>
        <Tile icon="✦" v={num(p)} k={t("pointsTile")} /><Tile icon="⬆️" v={t("lv", { n: lv })} k={t("levelTile")} /><Tile icon="📅" v={L.streak} k={t("streak")} />
        <Tile icon="🗂" v={L.sessions} k={t("sessions")} /><Tile icon="🏆" v={num(Math.max(L.best, sTaps()))} k={t("bestSession")} /><Tile icon="⭐" v={L.golden + G.S.golden} k={t("goldenTile")} />
      </Tiles>
      <Panel><Label>{t("badgesH", { a: BADGES.filter(b => L.badges.includes(b.id)).length, b: BADGES.length })}</Label><BadgeGrid list={BADGES} have={b => L.badges.includes(b.id)} /></Panel>
      {TAB_ORDER.map(([tb, key]) => {
        const tp = Object.entries(L.per).filter(([id]) => BY_ID[id] && tabOf(BY_ID[id]) === tb).sort((x, y) => y[1] - x[1]).slice(0, 5);
        return tp.length ? (
          <Panel key={tb}>
            <Label>{t(key)} · {t("mostScrolled")}</Label>
            {tp.map(([id, n]) => <View key={id} style={u.row}><Text style={u.rowT} numberOfLines={1}>{BY_ID[id].tr}</Text><Text style={u.rowN}>{num(n)}</Text></View>)}
          </Panel>
        ) : null;
      })}
      </>}
      <Panel>
        {calm ? <Label>{t("settings")}</Label> : null}
        <Btn title={"🕌 " + t("prTitle")} onPress={() => openView("prayer")} testID="prayerOpen" />
        <Btn title={"🧭 " + t("qbTitle")} onPress={() => openView("qibla")} testID="qiblaOpen" />
        <Btn title={"⚖️ " + (L.debt ? t("debtNew") : t("debtTitle"))} onPress={() => openView("debt")} />
        <LangPicker />
        {/* The sound switch sits on the Scroll sound line, like the Weather one (Zine, 2026-10-28). */}
        <View ref={target("sound")} style={{ gap: 12 }}>
          <Toggle label={t("scrollSnd")} value={L.sound} onChange={v => setSetting("sound", v)} />
          <Choice value={L.scrollSound || "dial"} options={[["dial", t("sndDial")], ["chime", t("sndChime")], ["glass", t("sndGlass")], ["bubble", t("sndBubble")]]}
            onChange={v => { setSetting("scrollSound", v); }} />
        </View>
        <Toggle label={t("recite")} value={L.recite !== false} onChange={v => { setSetting("recite", v); if (!v) stopRecite(); }} />
        <Volumes />
        {/* Weather: a switch to turn it off, the choice of weather, and a switch for its sounds (Zine, 2026-10-28). */}
        <View ref={target("weather")}>
        <Toggle label={t("wxTitle")} value={L.weather !== "off"} onChange={v => setSetting("weather", v ? "auto" : "off")} />
        {L.weather !== "off" ? (
          <>
            <Choice value={WEATHERS.includes(L.weather) ? L.weather : "auto"} options={[["auto", t("wxAuto")], ...WEATHERS.map(k => [k, t("wx_" + k)])]}
              onChange={v => { setSetting("weather", v); }} />
            <Toggle label={t("wxSound")} value={L.weatherSound !== false} onChange={v => setSetting("weatherSound", v)} />
          </>
        ) : null}
        </View>
        <Toggle label={t("haptics")} value={L.haptics} onChange={v => setSetting("haptics", v)} />
        {calm || isLearn() ? null : <Toggle label={t("feedBuddy")} value={L.feedBuddy !== false} onChange={v => setSetting("feedBuddy", v)} />}
        <Btn title={"💾 " + t("backup")} onPress={backupProgress} />
        <Btn title={"📂 " + t("restore")} onPress={restoreProgress} />
        <Btn title={"🧭 " + t("tutAgain")} onPress={() => setTimeout(startTour, 200)} />
        <Btn title={sure ? t("wipeSure") : t("wipe")} danger={!sure} style={sure && { backgroundColor: "#a33a2c" }} onPress={() => { if (!sure) setSure(true); else { setSure(false); wipeEverything(); } }} />
        {calm ? null : <Btn title={L.gender === "f" ? t("swapBoy") : t("swapGirl")} onPress={swapBuddy} />}
      </Panel>
      {/* Rating sits last in every mode (Zine, 2026-10-29). */}
      <Rate />
      <Text style={u.note}>{t("disclaimer")}{"\n"}Recitation: Mishary Alafasy (everyayah.com). Word timings: quran-align by Charles Parker, CC BY 4.0.{"\n"}Expo v1</Text>
    </Sheet>
  );
}

const DEBT_PRESETS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

export function Debt() {
  const d = G.life.debt;
  const [value, setValue] = useState(d && !d.done ? num(d.start) : "");
  const input = useRef(null);
  const go = () => {
    const n = Math.min(1e12, +digits(value) || 0);
    if (n < 1) { input.current && input.current.focus(); return; }
    closeView(); startDebt(n, 1);
  };
  return (
    <Sheet actions={<><Btn title={t("back")} onPress={closeView} /><Btn title={t("debtStart")} primary style={{ flex: 1 }} onPress={go} /></>}>
      <Hero>
        <Label>{t("debtTitle")}</Label>
        {isCalm() ? null : d && !d.done ? <SheetMiner start={d.start} left={d.left} /> : <SheetMiner start={+digits(value) || 0} left={+digits(value) || 0} />}
        <Text style={[u.note, { fontSize: 15, color: C.inkSoft }]}>{t("debtIntro")}</Text>
      </Hero>
      {d && !d.done ? <Panel><Label>{t("debtLeft", { n: num(d.left) })}</Label><Bar value={1 - d.left / d.start} /></Panel> : null}
      <Panel>
        <Label>{t("debtAmount")}</Label>
        <TextInput
          ref={input}
          style={s.numIn}
          value={value}
          onChangeText={x => { const n = digits(x); setValue(n ? num(Math.min(1e12, +n)) : ""); }}
          keyboardType="number-pad"
          placeholder="1,000,000"
          placeholderTextColor={C.inkFaint}
        />
        <View style={u.chips}>{DEBT_PRESETS.map(n => <Pressable key={n} style={u.chip} onPress={() => setValue(num(n))}><Text style={u.chipT}>{num(n)}</Text></Pressable>)}</View>
      </Panel>
      <Text style={u.note}>{t("debtNote")}</Text>
      {d ? <Btn title={t("debtRemove")} onPress={() => { removeDebt(); closeView(); }} /> : null}
      <Panel><LangPicker /></Panel>
    </Sheet>
  );
}

export function Prayer() {
  const pr = G.life.prayer;
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const day = pr && prayerDay(new Date(), pr), nx = pr && nextPrayer(pr);
  return (
    <Sheet actions={<View style={{ flex: 1, maxWidth: 420 }}><Btn title={t("back")} primary onPress={() => openView("progress")} /></View>}>
      <Hero>
        <Label>🕌 {t("prTitle")}</Label>
        {nx ? <><Text style={[u.big, { fontSize: 44 }]}>{hhmm(nx.at)}</Text><Cap>{t("prNext", { p: pName(nx.k) })}</Cap></> : <Cap>{t("prIntro")}</Cap>}
      </Hero>
      {msg ? <Panel gold><Text style={[s.strong, { flex: 1 }]}>{msg}</Text></Panel> : null}
      <Panel>
        <Btn primary title={"📍 " + (busy ? t("prLocating") : pr ? t("prUpdate") : t("prLoc"))} onPress={async () => { if (busy) return; setBusy(true); setMsg(await askLocation()); setBusy(false); }} />
        {pr ? <Text style={s.faint}>{t("prAt", { c: pr.lat.toFixed(2) + ", " + pr.lng.toFixed(2) })}</Text> : null}
      </Panel>
      {pr ? <>
        <Panel>{PR_NAMES.map((k, i) => <View key={k} style={u.row}><Text style={u.rowT}>{pName(k)}</Text><Text style={u.rowN}>{day ? hhmm(day[i]) : "—"}</Text></View>)}</Panel>
        <Panel>
          <Choice label={t("prMethod")} value={pr.method} options={Object.entries(PR_METHODS).map(([k, m]) => [k, m.n])} onChange={v => updatePrayer({ method: v })} />
          <Toggle label={t("prHanafi")} value={pr.hanafi} onChange={v => updatePrayer({ hanafi: v })} />
        </Panel>
        <Panel>
          <Toggle label={t("prRem")} value={pr.remind} onChange={async v => setMsg(await setReminders(v))} />
          {pr.remind ? <>
            <Choice label={t("prBefore")} value={pr.before || 0} options={[0, 5, 10, 15, 30].map(n => [n, n ? t("prMin", { n }) : t("prOnTime")])} onChange={v => updatePrayer({ before: v })} />
            {[0, 2, 3, 4, 5].map(i => <Toggle key={i} label={pName(PR_NAMES[i])} value={pr.on[PR_NAMES[i]] !== false} onChange={v => setPrayerOn(PR_NAMES[i], v)} />)}
          </> : null}
        </Panel>
      </> : null}
      <Text style={u.note}>{t("prDisc")}</Text>
    </Sheet>
  );
}

// The Qibla compass. It uses the location saved for prayer times, or asks for it.
export function Qibla() {
  const pr = G.life.prayer;
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const locate = async () => { if (busy) return; setBusy(true); setMsg(await askLocation()); setBusy(false); };
  return (
    <Sheet actions={<View style={{ flex: 1, maxWidth: 420 }}><Btn title={t("back")} primary onPress={() => openView("progress")} /></View>}>
      <Hero><Label>🧭 {t("qbTitle")}</Label>{pr ? null : <Cap>{t("qbIntro")}</Cap>}</Hero>
      {msg ? <Panel gold><Text style={[s.strong, { flex: 1 }]}>{msg}</Text></Panel> : null}
      {pr ? <QiblaCompass lat={pr.lat} lng={pr.lng} /> : null}
      <Panel>
        <Btn primary={!pr} title={"📍 " + (busy ? t("prLocating") : pr ? t("prUpdate") : t("prLoc"))} onPress={locate} />
        {pr ? <Text style={s.faint}>{t("prAt", { c: pr.lat.toFixed(2) + ", " + pr.lng.toFixed(2) })}</Text> : null}
      </Panel>
      <Text style={u.note}>{t("qbFlat")}</Text>
    </Sheet>
  );
}

export default function Sheets() {
  const v = G.view;
  if (!v) return null;
  if (v.name === "summary") return <Summary key={v.sm.start} sm={v.sm} />;
  if (v.name === "progress") return <Progress />;
  if (v.name === "history") return <History />;
  if (v.name === "debt") return <Debt />;
  if (v.name === "prayer") return <Prayer />;
  if (v.name === "qibla") return <Qibla />;
  if (v.name === "lesson") return <Lesson key={v.track + v.g} track={v.track} g={v.g} />;
  if (v.name === "review") return <Review offer={!!v.offer} />;
  if (v.name === "library") return <Library track={v.track} />;
  if (v.name === "reader") return <Reader key={v.track + v.g} track={v.track} g={v.g} />;
  return null;
}

const s = StyleSheet.create({
  volRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  volT: { width: 90, color: C.inkSoft, fontFamily: F.bold, fontSize: 14 },
  hourRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingLeft: 18 },
  hourT: { width: 104, fontSize: 12, fontFamily: F.bold, color: C.inkSoft, fontVariant: ["tabular-nums"] },
  hourBar: { flex: 1, height: 8, borderRadius: 999, backgroundColor: "rgba(244,239,226,0.1)", overflow: "hidden" },
  modeSw: { flexDirection: "row", padding: 4, borderRadius: 999, backgroundColor: "rgba(244,239,226,0.1)", borderWidth: 1.5, borderColor: C.line },
  modeSide: { flex: 1, height: 44, paddingHorizontal: 4, borderRadius: 999, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  modeT: { fontSize: 13, fontFamily: F.heavy, color: C.ink },
  actions: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", gap: 12, justifyContent: "center", paddingTop: 16, paddingHorizontal: 16 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 14, justifyContent: "flex-start" },
  badge: { width: 88, alignItems: "center", gap: 4 },
  disc: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(244,239,226,0.12)" },
  badgeB: { fontSize: 12, fontFamily: F.heavy, color: C.ink, textAlign: "center" },
  badgeS: { fontSize: 11, fontFamily: F.ui, color: C.inkFaint, textAlign: "center", lineHeight: 14 },
  goldB: { fontSize: 19, fontFamily: F.heavy, color: C.ink },
  goldS: { fontFamily: F.ui, color: C.inkSoft },
  strong: { fontFamily: F.heavy, color: C.ink, fontSize: 15 },
  faint: { fontSize: 12, fontFamily: F.ui, color: C.inkFaint, textAlign: "center" },
  journey: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" },
  stage: { width: "31%", alignItems: "center", gap: 4, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 14 },
  stageNow: { backgroundColor: "rgba(245,184,61,0.14)", borderWidth: 1.5, borderColor: C.gold2 },
  stageB: { fontSize: 11, fontFamily: F.heavy, color: C.ink, textAlign: "center" },
  rateAsk: { fontSize: 14, fontFamily: F.ui, color: C.inkSoft, textAlign: "center" },
  star: { fontSize: 40, color: "rgba(244,239,226,0.22)", paddingHorizontal: 4 },
  starOn: { color: C.gold2 },
  rateMsg: { fontSize: 14, fontFamily: F.heavy, color: C.gold1 },
  rateLater: { fontSize: 13, fontFamily: F.ui, color: C.inkFaint, textDecorationLine: "underline", padding: 6 },
  numIn: { padding: 14, borderRadius: 16, fontFamily: F.heavy, fontSize: 30, textAlign: "center", color: C.ink, backgroundColor: "rgba(244,239,226,0.1)", borderWidth: 1.5, borderColor: C.line },
});
