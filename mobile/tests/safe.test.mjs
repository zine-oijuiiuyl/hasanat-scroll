// Tests for src/safe.js, the checks on saved progress and backup files. Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeLife, parseBackup, roundCoord, MAX_BACKUP } from "../src/safe.js";

const fresh = () => ({ seen: 0, said: 0, sessions: 0, best: 0, per: {}, streak: 0, bestStreak: 0, lastDay: null, badges: [], golden: 0, sound: true, gender: null, lang: null, debt: null, debtsCleared: 0, haptics: true, scrollSound: "dial", lastSeen: 0, tourDone: undefined, rating: 0, rateLater: 0, hearts: [] });
const opts = { langs: ["en", "ar", "fr"], methods: ["mwl", "isna"], scrollSounds: ["dial", "chime"], tabs: ["dhikr", "dua", "muh", "quran"] };
const clean = raw => sanitizeLife(raw, fresh, opts);

test("real progress comes through unchanged", () => {
  const life = {
    ...fresh(), seen: 120, said: 340, sessions: 9, best: 50, per: { subhanallah: 12, q_kursi: 3 }, streak: 4, bestStreak: 7,
    lastDay: 1761955200000, badges: ["first", "streak3"], golden: 2, gender: "f", lang: "ar", debt: { start: 1000, left: 400, step: 1, done: false },
    lastSeen: 1761990000000, tourDone: true, tourSeen: { game: true }, rating: 5, hearts: ["afw", "h_niyyah"], mode: "calm", tab: "dua",
    weather: "rain", weatherSound: false, recite: true, feedBuddy: false, volWx: 0.4, volScroll: 1, volRecite: 0.7,
    muteWas: { weatherSound: true, sound: false, recite: true }, allTime: 400, log: { "2026-11-01": { n: 30, h: { 9: 10, 21: 20 } } },
    prayer: { lat: 51.5074, lng: -0.1278, method: "isna", hanafi: true, remind: true, before: 10, on: { fajr: false } },
    learn: { q: 3, h: 1, d: 0, srs: { "q:1:1": [2, 1762000000000], "h:bukhari:1": [1, 1762000000000] }, checks: 4, perfect: 2, streak: 1, best: 2, chests: 1, medals: ["m1"], hv: 2 },
    learnTrack: "h",
  };
  const out = clean(JSON.parse(JSON.stringify(life)));
  assert.deepEqual(out.per, life.per);
  assert.deepEqual(out.debt, life.debt);
  assert.deepEqual(out.log, life.log);
  assert.deepEqual(out.learn, life.learn);
  assert.equal(out.prayer.lat, 51.51);
  assert.equal(out.prayer.lng, -0.13);
  for (const k of ["seen", "said", "gender", "lang", "mode", "tab", "weather", "recite", "volWx", "learnTrack", "allTime", "lastDay"]) assert.equal(out[k], life[k], k);
});

test("wrong types fall back to the defaults instead of crashing the app", () => {
  const out = clean({ seen: "lots", said: -5, per: [1, 2], badges: "x", hearts: { a: 1 }, debt: "big", log: 7, gender: "<script>", lang: "xx", scrollSound: 3, volWx: 9, rating: 99, lastDay: {}, learn: "no", prayer: { lat: 500, lng: 0 } });
  assert.equal(out.seen, 0);
  assert.equal(out.said, 0);
  assert.deepEqual(out.per, {});
  assert.deepEqual(out.badges, []);
  assert.deepEqual(out.hearts, []);
  assert.equal(out.debt, null);
  assert.deepEqual(out.log, {});
  assert.equal(out.gender, null);
  assert.equal(out.lang, null);
  assert.equal(out.scrollSound, "dial");
  assert.equal(out.volWx, 1);
  assert.equal(out.rating, 5);
  assert.equal(out.lastDay, null);
  assert.equal(out.learn, undefined);
  assert.equal(out.prayer, undefined);
});

test("prototype keys and odd ids are dropped", () => {
  const out = clean(JSON.parse('{"__proto__": {"polluted": 1}, "per": {"__proto__": 5, "constructor": 3, "ok_id": 2, "../etc": 1}, "learn": {"srs": {"q:1:1": [1, 2], "h:../../x:1": [1, 2]}}}'));
  assert.equal({}.polluted, undefined);
  assert.equal(out.polluted, undefined);
  assert.deepEqual(Object.keys(out.per), ["ok_id"]);
  assert.deepEqual(Object.keys(out.learn.srs), ["q:1:1"]);
});

test("numbers are capped and a finished debt stays finished", () => {
  const out = clean({ said: 1e30, debt: { start: 5e15, left: 9e15, step: 0 } });
  assert.equal(out.said, 1e12);
  assert.deepEqual(out.debt, { start: 1e12, left: 1e12, step: 1, done: false });
  assert.equal(clean({ debt: { start: 10, left: 0, step: 1, done: false } }).debt.done, true);
});

test("backup files", () => {
  assert.equal(parseBackup("", fresh, opts).ok, false);
  assert.equal(parseBackup("not json", fresh, opts).ok, false);
  assert.equal(parseBackup('{"app":"other","life":{}}', fresh, opts).ok, false);
  assert.equal(parseBackup('{"app":"hasanat-scroll","life":[]}', fresh, opts).ok, false);
  assert.equal(parseBackup("x".repeat(MAX_BACKUP + 1), fresh, opts).ok, false);
  const r = parseBackup(JSON.stringify({ app: "hasanat-scroll", v: 2, life: { said: 12, hearts: ["afw"] } }), fresh, opts);
  assert.equal(r.ok, true);
  assert.equal(r.life.said, 12);
  assert.deepEqual(r.life.hearts, ["afw"]);
});

test("random junk never throws", () => {
  const junk = [null, 0, "", "x", [], {}, true, NaN, Infinity, -1, { a: { b: { c: [] } } }];
  const pick = () => junk[Math.floor(Math.random() * junk.length)];
  const keys = ["seen", "per", "debt", "log", "prayer", "learn", "hearts", "badges", "tourSeen", "muteWas", "lastDay", "volWx", "gender"];
  for (let i = 0; i < 2000; i++) {
    const raw = {};
    for (const k of keys) if (Math.random() < 0.5) raw[k] = pick();
    const out = clean(raw);
    assert.ok(Array.isArray(out.hearts) && Array.isArray(out.badges) && typeof out.per === "object");
  }
});

test("coordinates are rounded to about a kilometre", () => {
  assert.equal(roundCoord(21.422487), 21.42);
  assert.equal(roundCoord(-33.86882), -33.87);
});

test("fields from a later version are kept when simple, and bad known fields don't sneak back", () => {
  const out = clean({ newSwitch: true, newCount: 7, newWord: "abc", bigThing: { x: 1 }, gender: "zzz", learn: { q: 1, futureN: 3 } });
  assert.equal(out.newSwitch, true);
  assert.equal(out.newCount, 7);
  assert.equal(out.newWord, "abc");
  assert.equal(out.bigThing, undefined);
  assert.equal(out.gender, null);
  assert.equal(out.learn.futureN, 3);
});
