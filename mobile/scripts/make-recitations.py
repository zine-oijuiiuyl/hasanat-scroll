#!/usr/bin/env python3
"""Gives each Qur'an card a whole passage, shown in parts, with Mishary Alafasy's recitation of it and the time of
every word, so the app can light each word as it is said (Zine, 2026-10-30: cards felt too short).

Inputs (not in the repo):
  --cards   JSON list of {id, ar, src} for the cards whose source names a verse (dumped from the app's library)
  --align   Alafasy_128kbps.json from https://github.com/cpfair/quran-align (release 2016-11-24, CC BY 4.0):
            for every verse, [first word, word after the last, start ms, end ms] segments
  --text    dist/quran.json from the quran-json npm package (Uthmani text, whose words the segments count); its
            quran_transliteration.json and quran_<lang>.json next to it are read too
Audio is downloaded from everyayah.com (Alafasy_128kbps, one mp3 per verse). Writes assets/recite/<id>.mp3 and
src/recite-data.js.
"""
import argparse, json, os, re, subprocess, sys, tempfile, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PAD_START, PAD_END = 120, 350   # ms of air kept before the first word and after the last

def norm(w):
    w = re.sub(r"[ؐ-ًؚ-ٰٟۖ-ۭـ]", "", w)
    w = re.sub(r"[ٱآأإ]", "ا", w)
    w = w.replace("ى", "ي").replace("ة", "ه").replace("ؤ", "و").replace("ئ", "ي").replace("ء", "")
    return re.sub(r"[^ا-ي]", "", w)

def align(card, verse):
    """Index into verse for each card word (-1 for a mark that is not a word)."""
    best, at = -1, 0
    for o in range(len(verse)):
        m, j = 0, o
        for c in card:
            if not c: continue
            if j < len(verse) and c == verse[j]: m += 1
            j += 1
        if m > best: best, at = m, o
    out, j = [], at
    for c in card:
        if not c: out.append(-1); continue
        k = j
        while k < j + 3 and k < len(verse) and verse[k] != c: k += 1
        if k < len(verse) and verse[k] == c: j = k
        out.append(j if j < len(verse) else -1)
        j += 1
    return out, best

LANGS = ["en", "fr", "es", "tr", "ur", "id", "bn", "ru"]   # QuranEnc translations in quran-json; de falls back to en
MIN_WORDS, MAX_EXTRA = 14, 4   # a short verse brings the next ones with it, up to this many words / extra verses
PART_MIN, PART_MAX = 6, 12     # words in one part shown on the card at a time

def passage(s, fr, to, text):
    """The verses a card shows: its own, then the next ones while it is still short (never past the surah)."""
    n = lambda a, b: sum(len(text[(s, v)].split()) for v in range(a, b + 1))
    while n(fr, to) < MIN_WORDS and (s, to + 1) in text and to - fr < MAX_EXTRA: to += 1
    return fr, to

def parts_of(words, verse_of):
    """Splits the passage into parts: short verses go together, long ones break at a pause mark (or at PART_MAX)."""
    out, a = [], 0
    pause = lambda w: re.search(r"[ۖ-ۜ]$", w) is not None
    for i in range(len(words)):
        n = i - a + 1
        end_verse = i + 1 == len(words) or verse_of[i + 1] != verse_of[i]
        nxt_len = 0
        if end_verse and i + 1 < len(words):
            v = verse_of[i + 1]; nxt_len = sum(1 for x in verse_of if x == v)
        if i + 1 == len(words) or n >= PART_MAX \
           or (end_verse and (n >= PART_MIN or n + nxt_len > PART_MAX)) \
           or (pause(words[i]) and n >= PART_MIN and len(words) - i - 1 >= 3):
            out.append([a, i + 1]); a = i + 1
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cards", required=True); ap.add_argument("--align", required=True); ap.add_argument("--text", required=True)
    a = ap.parse_args()
    cards = json.load(open(a.cards))
    segs = {(x["surah"], x["ayah"]): x["segments"] for x in json.load(open(a.align))}
    dist = os.path.dirname(a.text)
    text = {(s["id"], v["id"]): v["text"] for s in json.load(open(a.text)) for v in s["verses"]}
    translit = {(s["id"], v["id"]): v["transliteration"] for s in json.load(open(os.path.join(dist, "quran_transliteration.json"))) for v in s["verses"]}
    trans = {l: {(s["id"], v["id"]): v["translation"] for s in json.load(open(os.path.join(dist, f"quran_{l}.json"))) for v in s["verses"]} for l in LANGS}
    outdir = os.path.join(ROOT, "assets", "recite"); os.makedirs(outdir, exist_ok=True)
    tmp = tempfile.mkdtemp()
    data = {}
    for c in cards:
        m = re.search(r"(\d+):(\d+)(?:-(\d+))?", c["src"])
        s, fr, to = int(m[1]), int(m[2]), int(m[3] or m[2])
        fr, to = passage(s, fr, to, text)
        words, times, verse_of, files, offset = [], [], [], [], 0
        for k, ay in enumerate(range(fr, to + 1)):
            mp3 = os.path.join(tmp, f"{s:03d}{ay:03d}.mp3")
            if not os.path.exists(mp3):
                urllib.request.urlretrieve(f"https://everyayah.com/data/Alafasy_128kbps/{s:03d}{ay:03d}.mp3", mp3)
            dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3]).decode()) * 1000
            vw = text[(s, ay)].split()
            t = [None] * len(vw)
            for w0, w1, st, en in segs[(s, ay)]:
                n = max(1, w1 - w0)
                for q in range(n):
                    if 0 <= w0 + q < len(t) and t[w0 + q] is None:
                        t[w0 + q] = [offset + st + (en - st) * q / n, offset + st + (en - st) * (q + 1) / n]
            words += vw; times += t; verse_of += [k] * len(vw)
            files.append(mp3); offset += dur
        known = [x for x in times if x]
        start = max(0, known[0][0] - PAD_START)
        end = min(offset, known[-1][1] + PAD_END)
        out = os.path.join(outdir, c["id"] + ".mp3")
        inputs = sum([["-i", f] for f in files], [])
        cat = "".join(f"[{i}:a]" for i in range(len(files))) + f"concat=n={len(files)}:v=0:a=1[a];[a]atrim=start={start/1000:.3f}:end={end/1000:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.05,afade=t=out:st={max(0,(end-start)/1000-0.15):.3f}:d=0.15[o]"
        subprocess.check_call(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", cat, "-map", "[o]", "-ac", "1", "-b:a", "64k", out])
        verses = [{"tr": translit[(s, ay)], "m": {l: trans[l][(s, ay)] for l in LANGS}} for ay in range(fr, to + 1)]
        data[c["id"]] = {
            "ref": f"{s}:{fr}" + (f"-{to}" if to > fr else ""),
            "w": words, "t": [[round(x[0] - start), round(x[1] - start)] if x else None for x in times],
            "v": verse_of, "p": parts_of(words, verse_of), "verses": verses,
        }
        print(f"{c['id']:14s} {s}:{fr}-{to} {len(words):3d} words {len(data[c['id']]['p'])} parts {(end-start)/1000:5.1f}s")
    with open(os.path.join(ROOT, "src", "recite-data.js"), "w") as f:
        f.write("// Made by scripts/make-recitations.py. For each Qur'an card: the passage it shows (its verse, or a few verses\n")
        f.write("// when that is short), Mishary Alafasy's recitation of it (everyayah.com), when each word starts and ends in\n")
        f.write("// the clip in ms (w, t), which verse each word is in (v), the parts shown one after the other ([first, after\n")
        f.write("// last] word), and each verse's transliteration (Tanzil) and meaning (QuranEnc, via the quran-json package).\n")
        f.write("// Word timings from quran-align by Charles Parker (CC BY 4.0).\n")
        f.write("export const CLIPS = {\n")
        for k, v in data.items():
            body = json.dumps(v, ensure_ascii=False, separators=(",", ":"))
            f.write(f'  {json.dumps(k)}: {{ file: require("../assets/recite/{k}.mp3"), ...{body} }},\n')
        f.write("};\n")

main()
