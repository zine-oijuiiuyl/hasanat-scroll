#!/usr/bin/env python3
"""Cuts Mishary Alafasy's recitation to exactly the words each Qur'an card shows (Zine, 2026-10-30), with the time
of every word, so the app can light each word as it is said.

Inputs (not in the repo):
  --cards   JSON list of {id, ar, src} for the cards whose source names a verse (dumped from the app's library)
  --align   Alafasy_128kbps.json from https://github.com/cpfair/quran-align (release 2016-11-24, CC BY 4.0):
            for every verse, [first word, word after the last, start ms, end ms] segments
  --text    quran.json from the quran-json npm package (Tanzil Uthmani text), whose words the segments count
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

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cards", required=True); ap.add_argument("--align", required=True); ap.add_argument("--text", required=True)
    a = ap.parse_args()
    cards = json.load(open(a.cards))
    segs = {(x["surah"], x["ayah"]): x["segments"] for x in json.load(open(a.align))}
    text = {(s["id"], v["id"]): v["text"] for s in json.load(open(a.text)) for v in s["verses"]}
    outdir = os.path.join(ROOT, "assets", "recite"); os.makedirs(outdir, exist_ok=True)
    tmp = tempfile.mkdtemp()
    data = {}
    for c in cards:
        m = re.search(r"(\d+):(\d+)(?:-(\d+))?", c["src"])
        s, fr, to = int(m[1]), int(m[2]), int(m[3] or m[2])
        words, files, offset = [], [], 0
        for ay in range(fr, to + 1):
            mp3 = os.path.join(tmp, f"{s:03d}{ay:03d}.mp3")
            if not os.path.exists(mp3):
                urllib.request.urlretrieve(f"https://everyayah.com/data/Alafasy_128kbps/{s:03d}{ay:03d}.mp3", mp3)
            dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3]).decode()) * 1000
            vw = text[(s, ay)].split()
            t = [None] * len(vw)
            for w0, w1, st, en in segs[(s, ay)]:
                n = max(1, w1 - w0)
                for k in range(n):
                    if 0 <= w0 + k < len(t) and t[w0 + k] is None:
                        t[w0 + k] = [offset + st + (en - st) * k / n, offset + st + (en - st) * (k + 1) / n]
            words += [(norm(w), tt) for w, tt in zip(vw, t)]
            files.append(mp3); offset += dur
        toks = [norm(w) for w in c["ar"].split()]
        idx, score = align(toks, [w for w, _ in words])
        real = sum(1 for x in toks if x)
        times = [words[i][1] if i >= 0 else None for i in idx]
        known = [x for x in times if x]
        if not known:
            print("SKIP", c["id"], "no timings", file=sys.stderr); continue
        start = max(0, min(x[0] for x in known) - PAD_START)
        end = min(offset, max(x[1] for x in known) + PAD_END)
        out = os.path.join(outdir, c["id"] + ".mp3")
        inputs = sum([["-i", f] for f in files], [])
        cat = "".join(f"[{i}:a]" for i in range(len(files))) + f"concat=n={len(files)}:v=0:a=1[a];[a]atrim=start={start/1000:.3f}:end={end/1000:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.05,afade=t=out:st={max(0,(end-start)/1000-0.15):.3f}:d=0.15[o]"
        subprocess.check_call(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", cat, "-map", "[o]", "-ac", "1", "-b:a", "64k", out])
        data[c["id"]] = [[round(x[0] - start), round(x[1] - start)] if x else None for x in times]
        print(f"{c['id']:14s} {score}/{real} words matched, {(end-start)/1000:5.1f}s of {offset/1000:5.1f}s")
    with open(os.path.join(ROOT, "src", "recite-data.js"), "w") as f:
        f.write("// Made by scripts/make-recitations.py: Mishary Alafasy (everyayah.com) cut to the words on each card, and\n")
        f.write("// when each card word starts and ends in its clip, in ms (null: a mark, not a word). Word timings from\n")
        f.write("// quran-align by Charles Parker (CC BY 4.0).\n")
        f.write("export const CLIPS = {\n")
        for k, v in data.items():
            f.write(f'  {json.dumps(k)}: {{ file: require("../assets/recite/{k}.mp3"), t: {json.dumps(v, separators=(",", ":"))} }},\n')
        f.write("};\n")

main()
