// Full-screen sheets: session summary, progress and settings, the sins counter, prayer times and the Qibla.
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
  setSetting, swapBuddy, startTour, wipeEverything, backupText, restoreText, digits, startDebt, removeDebt,
} from "./game";
import { t, levelTitle, stageName, badgeText, num, isRTL } from "./i18n";
import { BuddyArt } from "./Buddy";
import { Panel, Label, Cap, Bar, Tile, Tiles, Btn, Toggle, Choice, LangPicker, s as u } from "./ui";
import { C, F, GOLD, SHEET_BG } from "./theme";
import { fx, hapTick } from "./fx";
import { target } from "./targets";
import { Lesson, Review, Library, Reader } from "./LearnScreens";
import { askLocation, hhmm, nextPrayer, pName, setPrayerOn, setReminders, updatePrayer } from "./prayer";
import { QiblaCompass } from "./Qibla";
import { SheetMiner } from "./Rock";
import { HeartedPanel } from "./Hearts";
import { WEATHERS } from "./Weather";
import { Ico } from "./Icons";

const TAB_ORDER = [["dhikr", "tabDhikr"], ["dua", "tabDua"], ["quran", "tabQuran"], ["muh", "tabMuh"]];
const fmtTime = ms => { const x = Math.round(ms / 1000); return x >= 60 ? `${Math.floor(x / 60)}m ${x % 60}s` : `${x}s`; };

// When one sheet replaces another (progress and prayer times, say), the new one appears at once;
// fading it in would let the feed underneath show through. The sheet being replaced is still
// mounted while its successor first renders, so the count tells the two cases apart.
let openSheets = 0;
function Sheet({ children, actions }) {
  const insets = useSafeAreaInsets();
  const a = useRef(new Animated.Value(openSheets > 0 ? 1 : 0)).current;
  useEffect(() => {
    openSheets++;
    Animated.timing(a, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    return () => { openSheets--; };
  }, [a]);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }]}>
      <LinearGradient colors={SHEET_BG} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 28, paddingBottom: insets.bottom + 120, paddingHorizontal: 16 }} keyboardShouldPersistTaps="handled">
        <View style={{ width: "100%", maxWidth: 520, alignSelf: "center", gap: 22 }}>{children}</View>
      </ScrollView>
      <LinearGradient colors={["transparent", "rgba(5,31,32,0.95)"]} locations={[0, 0.4]} style={[s.actions, { paddingBottom: insets.bottom + 14 }]}>
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
    <Sheet actions={<>
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
        <Tile icon="✦" v={num(L.said)} k={t("allPts")} /><Tile icon="🔥" v={sm.bestCombo} k={t("bestCombo")} /><Tile icon="⏱" v={fmtTime(sm.end - sm.start)} k={t("time")} />
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

export function Progress() {
  const L = G.life;
  const p = lifeTaps(), lv = levelFor(p), st = stageNow();
  const [sure, setSure] = useState(false);
  useEffect(() => { if (!sure) return; const x = setTimeout(() => setSure(false), 4000); return () => clearTimeout(x); }, [sure]);
  return (
    <Sheet actions={<View ref={target("close")} style={{ flex: 1, maxWidth: 420 }}><Btn title={t("back")} primary onPress={closeView} testID="close" /></View>}>
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
      <Panel><Label>{t("badgesH", { a: L.badges.length, b: BADGES.length })}</Label><BadgeGrid list={BADGES} have={b => L.badges.includes(b.id)} /></Panel>
      {TAB_ORDER.map(([tb, key]) => {
        const tp = Object.entries(L.per).filter(([id]) => BY_ID[id] && tabOf(BY_ID[id]) === tb).sort((x, y) => y[1] - x[1]).slice(0, 5);
        return tp.length ? (
          <Panel key={tb}>
            <Label>{t(key)} · {t("mostScrolled")}</Label>
            {tp.map(([id, n]) => <View key={id} style={u.row}><Text style={u.rowT} numberOfLines={1}>{BY_ID[id].tr}</Text><Text style={u.rowN}>{num(n)}</Text></View>)}
          </Panel>
        ) : null;
      })}
      <Rate />
      <Panel>
        <Btn title={"🕌 " + t("prTitle")} onPress={() => openView("prayer")} testID="prayerOpen" />
        <Btn title={"🧭 " + t("qbTitle")} onPress={() => openView("qibla")} testID="qiblaOpen" />
        <Btn title={"⚖️ " + (L.debt ? t("debtNew") : t("debtTitle"))} onPress={() => openView("debt")} />
        <LangPicker />
        <Toggle label={t("sounds")} value={L.sound} onChange={v => setSetting("sound", v)} />
        <Choice label={"🔊 " + t("scrollSnd")} value={L.scrollSound || "dial"} options={[["dial", t("sndDial")], ["chime", t("sndChime")], ["glass", t("sndGlass")]]}
          onChange={v => { setSetting("scrollSound", v); }} />
        <Choice label={t("wxTitle")} value={L.weather || "auto"} options={[["auto", t("wxAuto")], ...WEATHERS.map(k => [k, t("wx_" + k)]), ["off", t("wxOff")]]}
          onChange={v => { setSetting("weather", v); }} />
        <Toggle label={t("haptics")} value={L.haptics} onChange={v => setSetting("haptics", v)} />
        <Btn title={"💾 " + t("backup")} onPress={backupProgress} />
        <Btn title={"📂 " + t("restore")} onPress={restoreProgress} />
        <Btn title={"🧭 " + t("tutAgain")} onPress={() => setTimeout(startTour, 200)} />
        <Btn title={sure ? t("wipeSure") : t("wipe")} danger={!sure} style={sure && { backgroundColor: "#a33a2c" }} onPress={() => { if (!sure) setSure(true); else { setSure(false); wipeEverything(); } }} />
        <Btn title={L.gender === "f" ? t("swapBoy") : t("swapGirl")} onPress={swapBuddy} />
      </Panel>
      <Text style={u.note}>{t("disclaimer")}{"\n"}Expo v1</Text>
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
        {d && !d.done ? <SheetMiner start={d.start} left={d.left} /> : <SheetMiner start={+digits(value) || 0} left={+digits(value) || 0} />}
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
