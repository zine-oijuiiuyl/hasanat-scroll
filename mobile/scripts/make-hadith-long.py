#!/usr/bin/env python3
"""Gives each hadith and hadith dua card the fuller text of its hadith, shown part by part (Zine, 2026-10-30: cards
felt too short). The text and translations come from fawazahmed0/hadith-api (github.com/fawazahmed0/hadith-api,
public domain): the card's words are found in its collection, the chain of narrators is dropped (the text starts at
the companion or at "the Messenger of Allah said"), and the collection's notes at the end are left out.

  --cards  JSON list of {id, ar, src} for the non-Qur'an cards (dumped from the app's library)
Writes src/hadith-long.js. Check the printed texts by eye after a run.
"""
import argparse, json, os, re, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = "https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions"
CACHE = os.path.join(os.environ.get("TMPDIR", "/tmp"), "hadith-api-cache")
COL = [("Sahih al-Bukhari", "bukhari"), ("Bukhari", "bukhari"), ("Sahih Muslim", "muslim"), ("Jami' at-Tirmidhi", "tirmidhi"), ("Sunan Abi Dawud", "abudawud")]
LANGS = {"en": "eng", "fr": "fra", "tr": "tur", "ur": "urd", "id": "ind", "bn": "ben", "ru": "rus"}   # es, de: English
MARK = ["قال رسول الله", "قال النبي", "ان رسول الله", "ان النبي", "سمعت رسول الله", "سمعت النبي", "عن النبي", "عن رسول الله",
        "كان رسول الله", "كان النبي", "قال لي رسول الله", "قال لي النبي", "ان رجلا", "قال للنبي", "اخذ رسول الله", "قلت يا رسول الله",
        "سيل النبي", "سيل رسول الله", "سالت رسول الله", "سالت النبي", "يا رسول الله", "سالت عايشه"]
# Cards whose hadith another card already shows from its start, or whose hadith text mixes in narrators' notes:
START_AT_CARD = {"h_ilm"}
SKIP = {"du_rahmataka"}
STOP = ["قال ابو عيسي", "قال ابو داود", "وفي الباب", "هذا حديث", "قال ابو عبد الله", "وقال ابن", "حدثنا", "اخبرنا", "وحدثنا"]
MAX_WORDS, PART_MIN, PART_MAX = 110, 5, 12

def norm(s):
    s = re.sub(r"[ؐ-ًؚ-ٰٟۖ-ۭـ]", "", s)
    s = re.sub(r"[ٱآأإ]", "ا", s).replace("ى", "ي").replace("ة", "ه").replace("ئ", "ي").replace("ء", "")
    return re.sub(r"[^ا-ي ]", "", s)

def fetch(path):
    p = os.path.join(CACHE, path.replace("/", "_"))
    os.makedirs(CACHE, exist_ok=True)
    if not os.path.exists(p):
        try: urllib.request.urlretrieve(f"{API}/{path}", p)
        except Exception: return None
    return json.load(open(p))

def clean(s):
    s = s.replace("‏", "").replace('"', " ").replace("(", " ").replace(")", " ")
    s = re.sub(r"\s+([.،:,؛])", r"\1", s)
    s = re.sub(r"([.،:])\s*\1+", r"\1", s)
    return re.sub(r"\s+", " ", s).strip()

def matn(text, card, at_card=False):
    toks = clean(text).split()
    nt = [norm(t).strip() for t in toks]
    j = lambda a, b: " ".join(x for x in nt[a:b] if x)
    ck = norm(card).split()
    s = None
    for skip in (0, 1, 2):
        key = " ".join(ck[skip:skip + 3])
        s = next((i for i in range(len(toks)) if j(i, i + 12).startswith(key)), None)
        if s is not None: break
    if s is None: return None
    m0 = None
    for i in range(max(0, s - 60), s + 1):
        if any(j(i, i + 6).startswith(mk) for mk in MARK): m0 = i
    st = s if m0 is None or at_card else m0
    if at_card and s > 0 and nt[s - 1] in ("ومن", "من", "و"): st = s - 1
    for i in range(st - 1, max(-1, st - 6), -1):
        if at_card: break
        if nt[i] == "عن": st = i; break
    en = len(toks)
    for i in range(s + 1, len(toks)):
        if any(j(i, i + 5).startswith(x) for x in STOP): en = i; break
    while en > st and nt[en - 1] in ("قال", "قالت", ""): en -= 1
    if en - st > MAX_WORDS:   # keep the card's words in view, then end at a full stop
        en = max(s + len(ck), st + MAX_WORDS)
        while en < len(toks) and not toks[en - 1].endswith(("." , "،")): en += 1
    out = toks[st:en]
    out = [w for w in out if norm(w).strip() or len(w) > 1]   # drop lone punctuation
    return out

def parts_of(words):
    out, a = [], 0
    for i, w in enumerate(words):
        n = i - a + 1
        stop = w.endswith((".", "،", ":", "؛"))
        left = len(words) - i - 1   # never leave a last part of one or two words
        if i + 1 == len(words) or (n >= PART_MAX and left >= 3) or (stop and n >= PART_MIN and left >= 3):
            out.append([a, i + 1]); a = i + 1
    return out

def split_meaning(m, parts, words):
    """Shares a translation out over the parts, at sentence and clause breaks, in step with the Arabic."""
    bits = [b for b in re.split(r"(?<=[.;:!?,،])\s+", m.strip()) if b]
    total_ar = sum(len(w) for w in words)
    ends = []
    acc = 0
    for a, b in parts: acc += sum(len(w) for w in words[a:b]); ends.append(acc / total_ar)
    total = sum(len(b) for b in bits) or 1
    out, k, acc = [[] for _ in parts], 0, 0
    for b in bits:
        mid = (acc + len(b) / 2) / total
        while k < len(parts) - 1 and mid > ends[k]: k += 1
        out[k].append(b); acc += len(b)
    return [" ".join(x) for x in out]

def tidy_meaning(m):
    m = re.sub(r"\s*\[?\(?Abu ['‘’]?[EI]sa said.*$", "", m, flags=re.S)
    m = re.sub(r"\s*Abu Dawud said.*$", "", m, flags=re.S)
    m = re.sub(r"\s*\(See Hadith[^)]*\)?", "", m)
    return re.sub(r"\s+", " ", m).strip()

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--cards", required=True); a = ap.parse_args()
    cards = json.load(open(a.cards))
    whole = {}
    data = {}
    for c in cards:
        hit = next(((col, int(m[1])) for name, col in COL for m in [re.search(re.escape(name) + r" (\d+)", c["src"] or "")] if m), None)
        if not hit or c["id"] in SKIP: continue
        col, num = hit
        if col not in whole: whole[col] = fetch(f"ara-{col}.min.json")["hadiths"]
        key = " ".join(norm(c["ar"]).split()[:4])
        hits = [x for x in whole[col] if key in " ".join(norm(x["text"]).split())]
        if not hits:
            key = " ".join(norm(c["ar"]).split()[1:4])
            hits = [x for x in whole[col] if key in " ".join(norm(x["text"]).split())]
        if not hits: print("NOT FOUND", c["id"], c["src"], file=sys.stderr); continue
        hits.sort(key=lambda x: (x["hadithnumber"] != num and str(x.get("arabicnumber", "")).split(".")[0] != str(num), abs(x["hadithnumber"] - num)))
        h = hits[0]
        words = matn(h["text"], c["ar"], c["id"] in START_AT_CARD)
        if not words or len(words) <= len(c["ar"].split()):
            print("KEPT SHORT", c["id"], file=sys.stderr); continue
        parts = parts_of(words)
        m = {}
        # A card that starts inside its hadith keeps its own short meaning: the translations cover the whole hadith.
        for l, ed in ({} if c["id"] in START_AT_CARD else LANGS).items():
            x = fetch(f"{ed}-{col}/{h['hadithnumber']}.json")
            if x and x["hadiths"] and x["hadiths"][0]["text"].strip():
                m[l] = split_meaning(tidy_meaning(x["hadiths"][0]["text"]), parts, words)
        data[c["id"]] = {"src": f"{col} {h['hadithnumber']}", "w": words, "p": parts, "m": m}
        print(f"== {c['id']} ({col} {h['hadithnumber']}) {len(words)} words, {len(parts)} parts\n   {' '.join(words)}\n   EN: {' | '.join(m.get('en', []))}\n")
    with open(os.path.join(ROOT, "src", "hadith-long.js"), "w") as f:
        f.write("// Made by scripts/make-hadith-long.py: the fuller text of each hadith card's hadith (w: its words, p: the parts\n")
        f.write("// shown one after the other, [first, after last] word) and its meaning in each language, one piece per part (m).\n")
        f.write("// Texts and translations from fawazahmed0/hadith-api (public domain).\n")
        f.write("export const LONG = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")

main()
