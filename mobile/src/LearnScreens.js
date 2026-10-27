// The learning screens: the path of lessons, a lesson (learn, then exercises), the memory check,
// the library of everything learned and the reader for one lesson.
import { memo, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ActivityIndicator, Animated, Easing, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { G, closeView, openView, stageNow, emit, showToast, subscribe, on } from "./game";
import {
  L, TRACKS, TRACK_KEYS, unitTitle, unitSub, lessonItems, lessonLabel, unitAt, loadItems, lessonExercises, reviewExercises,
  finishLesson, finishReview, setOf, SET, SET_BONUS, dueKeys, dueCount, boxOf, MASTER, masteredCount, learnedCount, MEDALS, medalName, REVIEW_SIZE, setTrack, backToPath,
} from "./learn";
import { BuddyArt } from "./Buddy";
import { Pattern70 } from "./Pattern";
import { Btn, Tile, Tiles, Label, Panel } from "./ui";
import { t, num, isRTL, getLang } from "./i18n";
import { C, F, GOLD, SHEET_BG, tabSpace } from "./theme";
import { fx, hapTick, buzz } from "./fx";

const TRACK_ICON = { q: "📖", h: "📜", d: "📿" };
const TRACK_NAME = { q: "trQ", h: "tabMuh", d: "trD" };
// Unit banner colours, in turn.
const BANNERS = [["#1d7a5f", "#14574a"], ["#2b6cb0", "#1e4e86"], ["#8a5cc7", "#5f3c94"], ["#c7792b", "#93561a"], ["#c2456b", "#8e2f4e"], ["#2a8f9e", "#1c6672"]];
const strip = s => s.replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, "");
const arSize = (s, base = 32) => { const n = s.length; return Math.max(18, n < 40 ? base : n < 120 ? base - 5 : n < 300 ? base - 9 : n < 700 ? base - 12 : base - 14); };

// ---------- Shared pieces ----------
// When one learning screen replaces another (library and reader, lesson and result), the new one
// appears at once; fading it in would let the path underneath show through.
let openScreens = 0;
function Screen({ children, onBack, back = "✕", title, right, scroll = true, page }) {
  const insets = useSafeAreaInsets();
  // The screen being replaced is still mounted while its successor first renders.
  const a = useRef(new Animated.Value(page || openScreens > 0 ? 1 : 0)).current;
  useEffect(() => {
    if (page) return;
    openScreens++;
    Animated.timing(a, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    return () => { openScreens--; };
  }, [a, page]);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }]}>
      <LinearGradient colors={SHEET_BG} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <Pattern70 />
      <View style={[s.head, { paddingTop: insets.top + 8 }]}>
        {onBack ? <Pressable hitSlop={12} onPress={() => { hapTick(); onBack(); }} style={s.x}><Text style={s.xT}>{back}</Text></Pressable> : <View style={{ width: 36 }} />}
        <View style={{ flex: 1 }}>{typeof title === "string" ? <Text style={s.headT} numberOfLines={1}>{title}</Text> : title}</View>
        <View style={{ minWidth: 36, alignItems: "flex-end" }}>{right}</View>
      </View>
      {scroll ? <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40, gap: 18 }}>{children}</ScrollView> : children}
    </Animated.View>
  );
}

function TrackPills({ track, onChange }) {
  return (
    <View style={s.pills}>
      {TRACK_KEYS.map(k => (
        <Pressable key={k} onPress={() => { hapTick(); onChange(k); }} style={[s.pill, k === "h" && { flex: 1.4 }, track === k && s.pillOn]}>
          <Text style={{ fontSize: 15 }}>{TRACK_ICON[k]}</Text>
          <Text style={[s.pillT, track === k && { color: C.ink }]} numberOfLines={1} adjustsFontSizeToFit>{t(TRACK_NAME[k])}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Pulse({ children, on }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!on) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [on, v]);
  return <Animated.View style={on ? { transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }] } : null}>{children}</Animated.View>;
}

// ---------- The path ----------
const BANNER_H = 112, NODE_H = 132, UNIT_PAD = 26;
const SWAY = [0, 46, 70, 46, 0, -46, -70, -46];

const Node = memo(function Node({ g, state, label, onPress, x }) {
  const ring = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (state !== "now") return;
    const loop = Animated.loop(Animated.timing(ring, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [state, ring]);
  const face = state === "done" ? GOLD : state === "now" ? ["#4fd1a5", "#22a07a"] : ["#4a5b58", "#3a4947"];
  const lip = state === "done" ? "#a8700f" : state === "now" ? "#16714f" : "#283432";
  return (
    <View style={[s.nodeWrap, { transform: [{ translateX: x }] }]}>
      {state === "now" ? (
        <Pulse on><View style={s.startTip}><Text style={s.startT}>{t("start")}</Text><View style={s.startTail} /></View></Pulse>
      ) : <View style={{ height: 30 }} />}
      <Pressable onPress={onPress} testID={"node-" + g}>
        {({ pressed }) => (
          <View style={{ width: 74, height: 70, alignItems: "center" }}>
            {state === "now" ? (
              <Animated.View pointerEvents="none" style={[s.ring, {
                opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
                transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] }) }],
              }]} />
            ) : null}
            <View style={[s.lip, { backgroundColor: lip }]} />
            <LinearGradient colors={face} style={[s.node, pressed && { transform: [{ translateY: 5 }] }]}>
              <Text style={[s.nodeI, state === "lock" && { opacity: 0.6 }]}>{state === "done" ? "★" : state === "now" ? "▶" : "🔒"}</Text>
            </LinearGradient>
          </View>
        )}
      </Pressable>
      <Text style={[s.nodeL, state === "lock" && { opacity: 0.45 }]} numberOfLines={1}>{label}</Text>
    </View>
  );
});

// The lessons of one unit that fall in the set on show, from lesson index `a` up to `b`.
const Unit = memo(function Unit({ u, n, a, b, progress, onNode }) {
  const [c1, c2] = BANNERS[n % BANNERS.length];
  const locked = u.start + a > progress;
  const sub = unitSub(u);
  return (
    <View style={{ paddingBottom: UNIT_PAD }}>
      <LinearGradient colors={locked ? ["#3a4947", "#2c3836"] : [c1, c2]} style={s.banner}>
        <Text style={s.bannerK}>{t("unit", { n: n + 1 })}</Text>
        <Text style={s.bannerT} numberOfLines={1}>{unitTitle(u)}</Text>
        {sub ? <Text style={[s.bannerS, u.track === "q" && s.bannerAr]} numberOfLines={1}>{sub}</Text> : null}
      </LinearGradient>
      {u.lessons.slice(a, b).map((_, j) => {
        const i = a + j, g = u.start + i;
        const state = g < progress ? "done" : g === progress ? "now" : "lock";
        return <Node key={g} g={g} state={state} label={lessonLabel(u, i)} x={SWAY[(n * 3 + i) % SWAY.length]} onPress={() => onNode(g, state)} />;
      })}
    </View>
  );
});

// The Learn page, beside the feed. It stays mounted under the feed, so it re-renders only when
// something it shows changes, and is first drawn a moment after launch or as soon as it is opened.
const pathKey = () => {
  const track = G.life.learnTrack || "q";
  return `${track}|${L()[track]}|${dueCount()}|${masteredCount()}|${learnedCount()}|${getLang()}`;
};
export const LearnPath = memo(function LearnPath() {
  useSyncExternalStore(subscribe, pathKey);
  const [shown, setShown] = useState(G.page === "learn");
  useEffect(() => {
    if (shown) return;
    const id = setTimeout(() => setShown(true), 1500);
    const off = on("page", p => { if (p === "learn") setShown(true); });
    return () => { clearTimeout(id); off(); };
  }, [shown]);
  if (!shown) return <Screen page title={t("learn")} scroll={false} />;
  const track = G.life.learnTrack || "q";
  return <Path track={track} />;
});

// The seven dots over the path: one per lesson of the set, filled as they are done.
function SetBar({ set, progress }) {
  const done = Math.max(0, Math.min(set.to, progress) - set.from), size = set.to - set.from;
  return (
    <View style={s.setBar}>
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={s.setT}>{t("setN", { n: set.n + 1 })} · {t("setProg", { a: done, b: size })}</Text>
        <View style={{ flexDirection: "row", gap: 5, direction: "ltr" }}>
          {Array.from({ length: size }, (_, i) => <View key={i} style={[s.setDot, i < done && s.setDotOn]} />)}
        </View>
      </View>
      <Text style={{ fontSize: 30 }}>🎁</Text>
    </View>
  );
}

// The reward chest at the end of the set.
function Chest({ open, onPress }) {
  return (
    <Pressable onPress={onPress} style={s.chest} testID="chest">
      <Pulse on={!open}><Text style={{ fontSize: 54 }}>{open ? "✨" : "🎁"}</Text></Pulse>
      <Text style={s.chestT}>{t("chestT")}</Text>
      <Text style={s.chestS}>+{SET_BONUS} {t("bonus")}</Text>
    </Pressable>
  );
}

function Path({ track }) {
  const insets = useSafeAreaInsets();
  const progress = L()[track];
  const T = TRACKS[track];
  const due = dueCount();
  const set = setOf(track, progress);
  // The units the set's lessons belong to, with the part of each that falls in the set.
  const parts = useMemo(() => T.units.map((u, n) => ({ u, n, a: Math.max(0, set.from - u.start), b: Math.min(u.lessons.length, set.to - u.start) }))
    .filter(p => p.a < p.b), [T, set.from, set.to]);
  const after = T.total - set.to;
  const onNode = useCallback((g, state) => {
    if (state === "lock") { buzz(); return showToast("🔒", t("locked")); }
    hapTick();
    openView("lesson", { track, g });
  }, [track]);
  return (
    <Screen page title={t("learn")} scroll={false}
      right={<Text style={s.headStat}>👑 {num(masteredCount())}</Text>}>
      <View style={{ paddingHorizontal: 16, gap: 12, paddingBottom: 8 }}>
        <TrackPills track={track} onChange={setTrack} />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable onPress={() => { hapTick(); openView("review", {}); }} style={[s.action, due > 0 && s.actionHot]}>
            <Text style={{ fontSize: 18 }}>🧠</Text>
            <View style={{ flexShrink: 1 }}>
              <Text style={s.actionT} numberOfLines={1}>{t("memCheck")}</Text>
              <Text style={s.actionS} numberOfLines={1}>{due ? t("memDue", { n: num(due) }) : "✓"}</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => { hapTick(); openView("library", { track }); }} style={s.action}>
            <Text style={{ fontSize: 18 }}>📚</Text>
            <View style={{ flexShrink: 1 }}>
              <Text style={s.actionT} numberOfLines={1}>{t("library")}</Text>
              <Text style={s.actionS} numberOfLines={1}>{num(learnedCount())} · {t("learnedN")}</Text>
            </View>
          </Pressable>
        </View>
        <SetBar set={set} progress={progress} />
      </View>
      <ScrollView key={track + set.n} contentContainerStyle={{ paddingBottom: tabSpace(insets) + 60 }}>
        <Text style={s.hint}>{t("learnHint7")}</Text>
        {parts.map(p => <Unit key={p.n} u={p.u} n={p.n} a={p.a} b={p.b} progress={progress} onNode={onNode} />)}
        <Chest open={progress >= set.to} onPress={() => { if (progress < set.to) { buzz(); showToast("🎁", t("chestLocked")); } }} />
        {after > 0 ? <Text style={s.hint}>🔒 {t("moreAfter")}</Text> : null}
        {progress >= T.total ? <Text style={[s.hint, { color: C.gold1 }]}>{t("pathDone")}</Text> : null}
      </ScrollView>
    </Screen>
  );
}

// ---------- One item, as taught ----------
function ItemCard({ it, fresh }) {
  const big = it.kind === "h" ? 22 : 34;
  return (
    <View style={s.item}>
      {fresh ? <Text style={s.newTag}>{t("newTag")}</Text> : null}
      <Text style={[s.ar, { fontSize: arSize(it.ar, big), lineHeight: arSize(it.ar, big) * 1.9 }]}>{it.ar}</Text>
      {it.tl ? <Text style={s.tl}>{it.tl}</Text> : null}
      <Text style={[s.mean, isRTL() && { writingDirection: "rtl" }]}>{it.mean}</Text>
      <Text style={s.ref}>{it.ref}{it.by ? " · " + t("transBy", { n: it.by }) : ""}</Text>
    </View>
  );
}

function Loading({ error, onRetry }) {
  return (
    <View style={s.center}>
      {error ? (
        <>
          <Text style={{ fontSize: 40 }}>📡</Text>
          <Text style={s.centerT}>{t("offline")}</Text>
          <Btn primary title={t("retry")} onPress={onRetry} style={{ alignSelf: "stretch" }} />
        </>
      ) : (
        <>
          <ActivityIndicator color={C.gold1} size="large" />
          <Text style={s.centerT}>{t("loading")}</Text>
        </>
      )}
    </View>
  );
}

function useItems(keys) {
  const [state, set] = useState({ items: null, error: false });
  const [tries, setTries] = useState(0);
  const key = keys.join("|");
  useEffect(() => {
    let live = true;
    set({ items: null, error: false });
    loadItems(keys).then(items => live && set({ items, error: false }), () => live && set({ items: null, error: true }));
    return () => { live = false; };
  }, [key, tries]);   // eslint-disable-line react-hooks/exhaustive-deps
  return [state, () => setTries(x => x + 1)];
}

// ---------- Exercises ----------
function Choices({ ex, chosen, done, onPick, arabic }) {
  return (
    <View style={{ gap: 10 }}>
      {ex.opts.map((o, i) => {
        const right = done && o === ex.right, wrong = done && o === chosen && o !== ex.right;
        return (
          <Pressable key={i} disabled={done} onPress={() => { hapTick(); onPick(o); }}
            style={[s.opt, chosen === o && s.optOn, right && s.optRight, wrong && s.optWrong]}>
            <Text style={[arabic ? s.optAr : s.optT, arabic && { fontSize: arSize(o, 26), lineHeight: arSize(o, 26) * 1.8 }]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Missing({ ex, chosen, done, onPick }) {
  const blank = chosen || "      ";
  const tStyle = ex.arabic ? [s.ar, { fontSize: 26, lineHeight: 50 }] : [s.mean, { fontSize: 18, lineHeight: 28, color: C.ink }];
  return (
    <View style={{ gap: 18 }}>
      <View style={s.item}>
        <Text style={tStyle}>
          {ex.before ? ex.before + " " : ""}
          <Text style={[s.blank, done && (chosen === ex.right ? s.blankRight : s.blankWrong)]}> {blank} </Text>
          {ex.after ? " " + ex.after : ""}
        </Text>
      </View>
      <View style={s.bank}>
        {ex.opts.map((o, i) => (
          <Pressable key={i} disabled={done} onPress={() => { hapTick(); onPick(o); }} style={[s.tile, chosen === o && s.tileOn]}>
            <Text style={ex.arabic ? s.tileAr : s.tileT}>{o}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Order({ ex, chosen, done, onPick }) {
  const picked = chosen || [];
  const used = new Set(picked);
  return (
    <View style={{ gap: 18 }}>
      <View style={[s.answer, done && (orderOk(ex, picked) ? s.optRight : s.optWrong)]}>
        {picked.map(i => (
          <Pressable key={i} disabled={done} onPress={() => { hapTick(); onPick(picked.filter(x => x !== i)); }} style={s.tile}>
            <Text style={s.tileAr}>{ex.tiles.find(x => x.i === i).w}</Text>
          </Pressable>
        ))}
      </View>
      <View style={s.bank}>
        {ex.tiles.map(x => (
          <Pressable key={x.i} disabled={done || used.has(x.i)} onPress={() => { hapTick(); onPick([...picked, x.i]); }} style={[s.tile, used.has(x.i) && s.tileUsed]}>
            <Text style={[s.tileAr, used.has(x.i) && { opacity: 0 }]}>{x.w}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
const orderOk = (ex, picked) => picked.length === ex.right.length && picked.every((i, k) => strip(ex.tiles.find(x => x.i === i).w) === strip(ex.right[k]));
const isRight = (ex, a) => ex.type === "order" ? orderOk(ex, a || []) : a === ex.right;
const ready = (ex, a) => ex.type === "order" ? (a || []).length === ex.right.length : !!a;
const QUESTION = { meaning: "meaningQ", next: "nextQ", missing: "missingQ", order: "orderQ", end: "endQ" };

function Exercise({ ex, answer, done, onAnswer }) {
  return (
    <View style={{ gap: 18 }}>
      <Text style={s.q}>{t(QUESTION[ex.type])}</Text>
      {ex.type === "meaning" || ex.type === "next" ? (
        <View style={[s.item, s.ask]}>
          {/* An ayah that recurs in its surah comes with the one before it, so the next one is clear. */}
          {ex.before ? <Text style={[s.ar, s.before, { fontSize: arSize(ex.before, 22), lineHeight: arSize(ex.before, 22) * 1.8 }]} numberOfLines={3}>{ex.before}</Text> : null}
          <Text style={[s.ar, { fontSize: arSize(ex.prompt, 32), lineHeight: arSize(ex.prompt, 32) * 1.9 }]}>{ex.prompt}</Text>
          {ex.type === "next" ? <Text style={[s.ref, s.refGold]}>{ex.ref}</Text> : null}
        </View>
      ) : null}
      {ex.type === "end" ? <View style={[s.item, s.ask]}><Text style={[s.mean, { color: C.ink }]}>{ex.prompt} …</Text></View> : null}
      {ex.type === "order" ? <Text style={s.hintSmall}>{t("tapWords")}</Text> : null}
      {ex.type === "missing" ? <Missing ex={ex} chosen={answer} done={done} onPick={onAnswer} />
        : ex.type === "order" ? <Order ex={ex} chosen={answer} done={done} onPick={onAnswer} />
        : <Choices ex={ex} chosen={answer} done={done} onPick={onAnswer} arabic={ex.type === "next"} />}
    </View>
  );
}

function Feedback({ ok, ex, streak, onNext }) {
  const insets = useSafeAreaInsets();
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(a, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }).start(); }, [a]);
  const answer = ex.type === "order" ? ex.right.join(" ") : ex.right;
  return (
    <Animated.View style={[s.fb, ok ? s.fbOk : s.fbBad, { paddingBottom: insets.bottom + 16, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [260, 0] }) }] }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text style={{ fontSize: 26 }}>{ok ? "✅" : "💡"}</Text>
        <Text style={[s.fbT, { color: ok ? "#9ff0c4" : "#ffc2b8" }]}>{ok ? t("correct") : t("wrongT")}</Text>
        {ok && streak >= 3 ? <Text style={s.fire}>🔥 ×{streak}</Text> : null}
      </View>
      {!ok ? <Text style={[s.fbA, (ex.type === "next" || ex.type === "order" || (ex.type === "missing" && ex.arabic)) && s.fbAr]} numberOfLines={4}>{answer}</Text> : null}
      <Btn primary title={t("cont")} onPress={onNext} />
    </Animated.View>
  );
}

// Runs a list of exercises. Wrong answers come back once at the end when `retry` is set.
function Quiz({ list, retry, onDone, top }) {
  const insets = useSafeAreaInsets();
  const [queue, setQueue] = useState(() => list.map((e, id) => ({ ...e, id })));
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [checked, setChecked] = useState(null);
  const [streak, setStreak] = useState(0);
  const results = useRef(new Map());   // exercise id -> { key, ok } the first time it was answered
  const ex = queue[i];
  const check = () => {
    const ok = isRight(ex, answer);
    if (!results.current.has(ex.id)) results.current.set(ex.id, { key: ex.key, ok });
    if (ok) { fx.up(); setStreak(x => x + 1); } else { buzz(); setStreak(0); }
    if (!ok && retry && !ex.again) setQueue(q => [...q, { ...ex, again: true }]);
    setChecked({ ok });
  };
  const next = () => {
    hapTick();
    if (i + 1 >= queue.length) {
      return onDone([...results.current.values()]);
    }
    setI(i + 1); setAnswer(null); setChecked(null);
  };
  if (!ex) return null;
  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16 }}>{top(i / queue.length)}</View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 220 }}>
        <Exercise key={i} ex={ex} answer={answer} done={!!checked} onAnswer={setAnswer} />
      </ScrollView>
      {checked ? <Feedback ok={checked.ok} ex={ex} streak={streak} onNext={next} /> : (
        <View style={[s.bottom, { paddingBottom: insets.bottom + 16 }]}>
          <Btn primary title={t("check")} onPress={() => ready(ex, answer) && check()} style={!ready(ex, answer) && { opacity: 0.45 }} />
        </View>
      )}
    </View>
  );
}

function Progress({ v }) {
  return (
    <View style={s.prog}><LinearGradient colors={["#7ee2b8", "#2fbf8a"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${Math.max(4, v * 100)}%`, height: "100%", borderRadius: 999 }} /></View>
  );
}

// ---------- Result ----------
function Result({ title, sub, tiles, stars, onDone, big }) {
  const pop = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }).start();
    if (big) { fx.evolve(); emit("confetti", true); } else { fx.party(); emit("confetti", false); }
  }, [pop, big]);
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140, gap: 18, alignItems: "center" }}>
        <Animated.View style={{ transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }] }}>
          <BuddyArt gender={G.life.gender || "m"} stage={stageNow()} mood="happy" width={220} height={188} />
        </Animated.View>
        {stars != null ? (
          <View style={{ flexDirection: "row", gap: 6, direction: "ltr" }}>
            {[1, 2, 3].map(n => <Text key={n} style={[s.bigStar, n <= stars && s.bigStarOn]}>★</Text>)}
          </View>
        ) : null}
        <Text style={s.resT}>{title}</Text>
        {sub ? <Text style={s.resS}>{sub}</Text> : null}
        <View style={{ alignSelf: "stretch" }}><Tiles>{tiles.map(([icon, v, k]) => <Tile key={k} icon={icon} v={v} k={k} />)}</Tiles></View>
      </ScrollView>
      <View style={[s.bottom, { paddingBottom: insets.bottom + 16 }]}><Btn primary title={t("cont")} onPress={onDone} /></View>
    </View>
  );
}

// ---------- A lesson ----------
export function Lesson({ track, g }) {
  const u = unitAt(track, g), i = g - u.start;
  const keys = useMemo(() => lessonItems(u, i), [u, i]);
  const [{ items, error }, retry] = useItems(keys);
  const [phase, setPhase] = useState("learn");
  const [li, setLi] = useState(0);
  const [res, setRes] = useState(null);
  const fresh = g >= L()[track];
  const exercises = useMemo(() => items ? lessonExercises(items) : [], [items]);
  const back = backToPath;
  const steps = keys.length + exercises.length;
  const title = <Text style={s.headT} numberOfLines={1}>{unitTitle(u)} · {lessonLabel(u, i)}</Text>;
  if (!items) return <Screen onBack={back} title={title} scroll={false}><Loading error={error} onRetry={retry} /></Screen>;
  if (phase === "learn") {
    const it = items[li];
    return (
      <Screen onBack={back} title={title} scroll={false}>
        <View style={{ paddingHorizontal: 16 }}><Progress v={li / steps} /></View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140, gap: 10 }}>
          <ItemCard key={li} it={it} fresh={fresh} />
          <View style={{ alignItems: "center" }}><Pulse on><BuddyArt gender={G.life.gender || "m"} stage={stageNow()} mood="happy" width={130} height={111} /></Pulse></View>
        </ScrollView>
        <BottomBtn title={t("cont")} onPress={() => {
          if (li + 1 < items.length) setLi(li + 1);
          else if (exercises.length) setPhase("quiz");
          else { setRes(finishLesson(track, g, keys, 0, 0)); setPhase("done"); }
        }} />
      </Screen>
    );
  }
  if (phase === "quiz") {
    return (
      <Screen onBack={back} title={title} scroll={false}>
        <Quiz list={exercises} retry top={v => <Progress v={(keys.length + v * exercises.length) / steps} />} onDone={r => {
          const right = r.filter(x => x.ok).length;
          setRes({ ...finishLesson(track, g, keys, right, r.length), right, total: r.length });
          setPhase("done");
        }} />
      </Screen>
    );
  }
  const acc = res.total ? Math.round(res.right / res.total * 100) : 100;
  return (
    <Screen onBack={back} title={title} scroll={false}>
      <Result big={res.unitDone || res.setDone} title={res.setDone ? "🎁 " + t("setDone") : res.unitDone ? t("unitDone") : t("lessonDone")}
        sub={res.setDone ? t("setDoneS", { n: SET_BONUS }) : res.unitDone ? unitTitle(u) : null}
        stars={acc >= 100 ? 3 : acc >= 75 ? 2 : 1}
        tiles={[["✦", "+" + res.pts, t("earned")], ["🎯", acc + "%", t("accuracy")], ["📚", keys.length, t("learnedN")]]}
        onDone={back} />
    </Screen>
  );
}

function BottomBtn({ title, onPress }) {
  const insets = useSafeAreaInsets();
  return <View style={[s.bottom, { paddingBottom: insets.bottom + 16 }]}><Btn primary title={title} onPress={onPress} /></View>;
}

// ---------- The memory check ----------
export function Review({ offer }) {
  const [phase, setPhase] = useState(offer ? "offer" : "go");
  const keys = useMemo(() => dueKeys().slice(0, REVIEW_SIZE), []);
  const [res, setRes] = useState(null);
  const back = () => offer ? closeView() : backToPath();
  if (!keys.length) {
    return (
      <Screen onBack={back} title={t("memCheck")}>
        <View style={[s.center, { paddingTop: 40 }]}>
          <BuddyArt gender={G.life.gender || "m"} stage={stageNow()} mood="happy" width={200} height={171} />
          <Text style={s.centerT}>{L().srs && learnedCount() ? t("nothingDue") : t("libEmpty")}</Text>
        </View>
      </Screen>
    );
  }
  if (phase === "offer") {
    return (
      <Screen onBack={back} title={t("memCheck")}>
        <View style={[s.center, { paddingTop: 30 }]}>
          <Pulse on><BuddyArt gender={G.life.gender || "m"} stage={stageNow()} mood={G.buddyMood} width={220} height={188} /></Pulse>
          <Text style={s.resT}>🧠 {t("memCheck")}</Text>
          <Text style={s.centerT}>{t("reviewIntro")}</Text>
          <Text style={s.resS}>{t("memDue", { n: num(dueCount()) })}</Text>
          <Btn primary title={t("start")} onPress={() => setPhase("go")} style={{ alignSelf: "stretch" }} />
          <Btn title={t("later")} onPress={closeView} style={{ alignSelf: "stretch" }} />
        </View>
      </Screen>
    );
  }
  if (phase === "go") return <ReviewRun keys={keys} back={back} onDone={r => { setRes({ ...finishReview(r), total: r.length }); setPhase("done"); }} />;
  const stars = res.perfect ? 3 : res.right / res.total >= 0.6 ? 2 : 1;
  return (
    <Screen onBack={back} title={t("memCheck")} scroll={false}>
      <Result big={res.perfect} stars={stars} title={res.perfect ? t("perfect") : t("reviewDone")}
        sub={res.streak > 1 ? "🔥 " + t("memStreak", { n: res.streak }) : null}
        tiles={[["✦", "+" + res.pts, t("earned")], ["🎯", `${res.right}/${res.total}`, t("accuracy")], ["👑", num(masteredCount()), t("mastered")]]}
        onDone={back} />
    </Screen>
  );
}

function ReviewRun({ keys, back, onDone }) {
  const [{ items, error }, retry] = useItems(keys);
  const list = useMemo(() => items ? reviewExercises(items) : null, [items]);
  useEffect(() => { if (list && !list.length) onDone([]); }, [list]);   // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Screen onBack={back} title={t("memCheck")} scroll={false}>
      {!list ? <Loading error={error} onRetry={retry} /> : <Quiz list={list} top={v => <Progress v={v} />} onDone={onDone} />}
    </Screen>
  );
}

// ---------- The library ----------
function Dots({ box }) {
  return (
    <View style={{ flexDirection: "row", gap: 3, direction: "ltr" }}>
      {box >= MASTER ? <Text style={{ fontSize: 13 }}>👑</Text> : [1, 2, 3, 4].map(n => <View key={n} style={[s.dot, n <= box && s.dotOn]} />)}
    </View>
  );
}

export function Library({ track }) {
  const st = L();
  const rows = useMemo(() => {
    const out = [], T = TRACKS[track];
    for (const u of T.units) {
      if (u.start >= st[track]) break;
      out.push({ head: true, u, key: "u" + u.start });
      for (let i = 0; i < u.lessons.length && u.start + i < st[track]; i++) {
        const keys = lessonItems(u, i);
        out.push({ u, i, g: u.start + i, key: "l" + (u.start + i), box: Math.min(...keys.map(boxOf)) });
      }
    }
    return out;
  }, [track, st]);
  const header = (
    <View style={{ gap: 16, paddingBottom: 12 }}>
      <TrackPills track={track} onChange={k => openView("library", { track: k })} />
      <Tiles>
        <Tile icon="📚" v={num(learnedCount())} k={t("learnedN")} />
        <Tile icon="👑" v={num(masteredCount())} k={t("mastered")} />
        <Tile icon="🧠" v={num(st.perfect)} k={t("perfect")} />
      </Tiles>
      <Panel>
        <Label>{t("rewards")}</Label>
        <View style={s.medals}>
          {MEDALS.map(m => {
            const on = st.medals.includes(m.id), [name, how] = medalName(m.id);
            return (
              <View key={m.id} style={s.medal}>
                <View style={[s.disc, !on && { opacity: 0.4 }]}><Text style={{ fontSize: 24 }}>{on ? m.icon : "🔒"}</Text></View>
                <Text style={s.medalB}>{name}</Text>
                <Text style={s.medalS}>{how}</Text>
              </View>
            );
          })}
        </View>
      </Panel>
      {!rows.length ? <Text style={s.hint}>{t("libEmpty")}</Text> : null}
    </View>
  );
  return (
    <Screen onBack={backToPath} back="←" title={t("library")} scroll={false}>
      <FlatList
        data={rows}
        keyExtractor={r => r.key}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        ListHeaderComponent={header}
        initialNumToRender={20}
        renderItem={({ item: r }) => r.head ? (
          <View style={s.libHead}>
            <Text style={s.libHeadT}>{TRACK_ICON[track]} {unitTitle(r.u)}</Text>
            {unitSub(r.u) ? <Text style={[s.libHeadS, track === "q" && s.bannerAr]}>{unitSub(r.u)}</Text> : null}
          </View>
        ) : (
          <Pressable onPress={() => { hapTick(); openView("reader", { track, g: r.g }); }} style={({ pressed }) => [s.libRow, pressed && { opacity: 0.7 }]}>
            <Text style={s.libRowT} numberOfLines={1}>{t("lesson", { n: r.i + 1 })} · {lessonLabel(r.u, r.i)}</Text>
            <Dots box={r.box} />
          </Pressable>
        )}
      />
    </Screen>
  );
}

export function Reader({ track, g }) {
  const u = unitAt(track, g), i = g - u.start;
  const keys = useMemo(() => lessonItems(u, i), [u, i]);
  const [{ items, error }, retry] = useItems(keys);
  const back = () => openView("library", { track });
  return (
    <Screen onBack={back} back="←" title={unitTitle(u)} scroll={!!items}>
      {items ? items.map(it => (
        <View key={it.key} style={{ gap: 8 }}>
          <ItemCard it={it} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" }}>
            <Text style={s.ref}>{t("memory")}</Text><Dots box={boxOf(it.key)} />
          </View>
        </View>
      )) : <Loading error={error} onRetry={retry} />}
      {items ? <Btn title={t("practice")} onPress={() => openView("lesson", { track, g })} /> : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 10 },
  x: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(244,239,226,0.12)" },
  xT: { color: C.ink, fontSize: 20, fontFamily: F.heavy, marginTop: -2 },
  headT: { color: C.ink, fontFamily: F.heavy, fontSize: 17, textAlign: "center" },
  headStat: { color: C.gold1, fontFamily: F.heavy, fontSize: 14 },
  pills: { flexDirection: "row", gap: 4, backgroundColor: "rgba(0,0,0,0.18)", padding: 4, borderRadius: 999 },
  pill: { flex: 1, flexDirection: "row", gap: 5, alignItems: "center", justifyContent: "center", paddingVertical: 9, paddingHorizontal: 6, borderRadius: 999 },
  pillOn: { backgroundColor: "rgba(245,184,61,0.22)", borderWidth: 1.5, borderColor: C.gold2 },
  pillT: { flexShrink: 1, fontFamily: F.heavy, fontSize: 13.5, color: C.inkSoft },
  action: { flex: 1, flexDirection: "row", gap: 10, alignItems: "center", padding: 12, borderRadius: 18, backgroundColor: C.panel, borderWidth: 1.5, borderColor: C.line },
  actionHot: { borderColor: "#4fd1a5", backgroundColor: "rgba(79,209,165,0.12)" },
  actionT: { fontFamily: F.heavy, fontSize: 14, color: C.ink },
  actionS: { fontFamily: F.ui, fontSize: 12, color: C.inkSoft },
  setBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  setT: { fontFamily: F.heavy, fontSize: 13, color: C.ink },
  setDot: { flex: 1, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.14)" },
  setDotOn: { backgroundColor: C.gold1 },
  chest: { alignItems: "center", paddingVertical: 10, gap: 2 },
  chestT: { fontFamily: F.heavy, fontSize: 15, color: C.ink, textAlign: "center", paddingHorizontal: 30 },
  chestS: { fontFamily: F.bold, fontSize: 13, color: C.gold1 },
  hint: { textAlign: "center", fontFamily: F.bold, fontSize: 13, color: C.inkFaint, paddingHorizontal: 30, paddingVertical: 14 },
  hintSmall: { fontFamily: F.bold, fontSize: 13, color: C.inkFaint, textAlign: "center" },
  banner: { marginHorizontal: 16, height: BANNER_H - 22, borderRadius: 20, paddingHorizontal: 18, justifyContent: "center", marginBottom: 22, borderBottomWidth: 5, borderBottomColor: "rgba(0,0,0,0.25)" },
  bannerK: { fontFamily: F.heavy, fontSize: 11, letterSpacing: 1.6, color: "rgba(255,255,255,0.75)", textTransform: "uppercase" },
  bannerT: { fontFamily: F.heavy, fontSize: 20, color: "#fff" },
  bannerS: { fontFamily: F.bold, fontSize: 13, color: "rgba(255,255,255,0.8)" },
  bannerAr: { fontFamily: F.ar, fontSize: 16, writingDirection: "rtl" },
  nodeWrap: { height: NODE_H, alignItems: "center", justifyContent: "flex-start" },
  startTip: { backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, alignItems: "center", marginBottom: 6 },
  startT: { fontFamily: F.heavy, fontSize: 12, color: "#16714f", letterSpacing: 1, textTransform: "uppercase" },
  startTail: { position: "absolute", bottom: -5, width: 10, height: 10, backgroundColor: "#fff", transform: [{ rotate: "45deg" }] },
  ring: { position: "absolute", top: -3, width: 74, height: 74, borderRadius: 37, borderWidth: 4, borderColor: "#4fd1a5" },
  lip: { position: "absolute", top: 7, width: 68, height: 62, borderRadius: 34 },
  node: { width: 68, height: 62, borderRadius: 34, alignItems: "center", justifyContent: "center" },
  nodeI: { fontSize: 26, color: "#fff", fontFamily: F.heavy, textShadowColor: "rgba(0,0,0,0.25)", textShadowRadius: 4, textShadowOffset: { width: 0, height: 2 } },
  nodeL: { marginTop: 4, fontFamily: F.bold, fontSize: 11, color: C.inkSoft, maxWidth: 170, textAlign: "center" },
  item: { backgroundColor: C.panel, borderRadius: 22, padding: 20, gap: 14, borderWidth: 1.5, borderColor: C.line },
  newTag: { alignSelf: "center", fontFamily: F.heavy, fontSize: 11, letterSpacing: 1.5, color: "#16714f", backgroundColor: "#7ee2b8", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, overflow: "hidden", textTransform: "uppercase" },
  ar: { fontFamily: F.ar, color: C.ink, textAlign: "center", writingDirection: "rtl" },
  before: { opacity: 0.45 },
  // The card a question asks about, tinted teal so it stands apart from the answers below it.
  ask: { backgroundColor: "rgba(64,186,166,0.17)", borderColor: "rgba(126,226,200,0.30)" },
  tl: { fontFamily: F.bold, fontStyle: "italic", fontSize: 16, color: C.ink, textAlign: "center" },
  mean: { fontFamily: F.ui, fontSize: 16, lineHeight: 24, color: C.inkSoft, textAlign: "center" },
  ref: { fontFamily: F.bold, fontSize: 12, color: C.inkFaint, textAlign: "center" },
  refGold: { color: C.gold2, fontFamily: F.heavy, fontSize: 15, letterSpacing: 0.3, marginTop: 2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24 },
  centerT: { fontFamily: F.bold, fontSize: 16, color: C.inkSoft, textAlign: "center", lineHeight: 23 },
  q: { fontFamily: F.heavy, fontSize: 21, color: C.ink },
  opt: { padding: 14, borderRadius: 16, borderWidth: 2, borderColor: C.line, borderBottomWidth: 4, backgroundColor: "rgba(244,239,226,0.05)" },
  optOn: { borderColor: "#7ec8ff", backgroundColor: "rgba(126,200,255,0.12)" },
  optRight: { borderColor: "#4fd1a5", backgroundColor: "rgba(79,209,165,0.16)" },
  optWrong: { borderColor: "#ff7a6b", backgroundColor: "rgba(255,122,107,0.14)" },
  optT: { fontFamily: F.bold, fontSize: 15, lineHeight: 21, color: C.ink },
  optAr: { fontFamily: F.ar, color: C.ink, textAlign: "center", writingDirection: "rtl" },
  blank: { backgroundColor: "rgba(126,200,255,0.18)", color: "#bfe4ff", textDecorationLine: "underline" },
  blankRight: { backgroundColor: "rgba(79,209,165,0.25)", color: "#bff5dc" },
  blankWrong: { backgroundColor: "rgba(255,122,107,0.25)", color: "#ffd0c9" },
  bank: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" },
  answer: { minHeight: 70, flexDirection: "row-reverse", flexWrap: "wrap", gap: 8, padding: 10, borderRadius: 16, borderWidth: 2, borderColor: C.line, borderStyle: "dashed", justifyContent: "center" },
  tile: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, backgroundColor: "rgba(244,239,226,0.1)", borderWidth: 2, borderBottomWidth: 4, borderColor: C.line },
  tileOn: { borderColor: "#7ec8ff", backgroundColor: "rgba(126,200,255,0.14)" },
  tileUsed: { backgroundColor: "rgba(244,239,226,0.04)", borderColor: "rgba(244,239,226,0.06)" },
  tileAr: { fontFamily: F.ar, fontSize: 22, lineHeight: 40, color: C.ink, writingDirection: "rtl" },
  tileT: { fontFamily: F.bold, fontSize: 16, color: C.ink },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 14, backgroundColor: "rgba(5,31,32,0.94)", borderTopWidth: 1, borderTopColor: C.line },
  fb: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 18, gap: 12, borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  fbOk: { backgroundColor: "#0f4a35" },
  fbBad: { backgroundColor: "#4d1f1b" },
  fbT: { fontFamily: F.heavy, fontSize: 20, flex: 1 },
  fbA: { fontFamily: F.bold, fontSize: 15, color: "#ffe2dc", lineHeight: 21 },
  fbAr: { fontFamily: F.ar, fontSize: 22, lineHeight: 40, textAlign: "center", writingDirection: "rtl" },
  fire: { fontFamily: F.heavy, fontSize: 16, color: GOLD[0] },
  prog: { height: 14, borderRadius: 999, backgroundColor: "rgba(244,239,226,0.14)", overflow: "hidden" },
  resT: { fontFamily: F.heavy, fontSize: 28, color: C.gold1, textAlign: "center" },
  resS: { fontFamily: F.bold, fontSize: 15, color: C.inkSoft, textAlign: "center" },
  bigStar: { fontSize: 44, color: "rgba(244,239,226,0.18)" },
  bigStarOn: { color: GOLD[1], textShadowColor: "rgba(255,200,80,0.6)", textShadowRadius: 14, textShadowOffset: { width: 0, height: 0 } },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(244,239,226,0.18)" },
  dotOn: { backgroundColor: "#4fd1a5" },
  libHead: { paddingTop: 16, paddingBottom: 8, gap: 2 },
  libHeadT: { fontFamily: F.heavy, fontSize: 16, color: C.ink },
  libHeadS: { fontFamily: F.bold, fontSize: 13, color: C.inkFaint },
  libRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 14, backgroundColor: C.panel, marginBottom: 8 },
  libRowT: { flex: 1, fontFamily: F.bold, fontSize: 14, color: C.ink },
  medals: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  medal: { width: 90, alignItems: "center", gap: 3 },
  disc: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(244,239,226,0.12)" },
  medalB: { fontFamily: F.heavy, fontSize: 12, color: C.ink, textAlign: "center" },
  medalS: { fontFamily: F.ui, fontSize: 11, color: C.inkFaint, textAlign: "center", lineHeight: 14 },
});
