#!/usr/bin/env python3
"""Gives the dhikr and dua cards a real human reading (Zine, 2026-10-31: "I don't like the AI voice"). The recordings
are Hamad Al-Duraihim's reading of Hisn al-Muslim, from github.com/rn0x/Adhkar-json (shared with no restrictions).
Each recording reads a whole entry of the book, so the card's words are found inside it and cut out, and every word
gets its time, so the app can light each word as it is said.

The words are found with Meta's Omnilingual ASR CTC model (Apache 2.0, sherpa-onnx's asr-models release
sherpa-onnx-omnilingual-asr-1600-languages-300M-ctc-int8-2025-11-12): the model gives, every 20 ms, how likely each
letter is, and a forced alignment of the card's letters over that finds where the card is said and when each word starts.

  --cards  JSON list of {id, ar} for the cards that are not from the Qur'an (dumped from the app's library)
  --model  the Omnilingual model folder (model.int8.onnx, tokens.txt)
Cards with a fuller text in src/hadith-long.js, and cards the book doesn't have (most hadith), get no recording.
Writes assets/voice/<id>.mp3 and src/voice-data.js.
"""
import argparse, json, os, re, subprocess, tempfile, urllib.request
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = "https://raw.githubusercontent.com/rn0x/Adhkar-json/main"
FRAME = 0.02            # seconds per model frame
SR = 16000
MIN_SCORE = -1.2        # mean log-probability per letter below which a match is not trusted

HARAKAT = r"[ؐ-ًؚ-ٰٟۖ-ۭـ]"

def norm(s):
    """For finding the card inside the book's text: letters only, hamza and ta marbuta folded."""
    s = re.sub(HARAKAT, "", s)
    s = re.sub(r"[ٱآأإ]", "ا", s).replace("ى", "ي").replace("ة", "ه")
    return " ".join(re.sub(r"[^ء-ي ]", " ", s).split())

def letters(w):
    """A card word as the model writes it: no vowel marks, wasla as a plain alif."""
    w = re.sub(HARAKAT, "", w).replace("ٱ", "ا")
    return re.sub(r"[^ء-ي]", "", w)

# Letters the model may write either way: their likelihoods are added together.
SAME = [set("اأإآ"), set("هة"), set("يى"), set("ؤو"), set("ئي")]

class Model:
    def __init__(self, d):
        import onnxruntime as ort
        self.sess = ort.InferenceSession(os.path.join(d, "model.int8.onnx"), providers=["CPUExecutionProvider"])
        self.id = {}
        for line in open(os.path.join(d, "tokens.txt"), encoding="utf8"):
            s, i = line.rstrip("\n").rsplit(" ", 1)
            self.id[s if s else " "] = int(i)

    def logp(self, x):
        x = (x - x.mean()) / (x.std() + 1e-7)
        l = self.sess.run(None, {"x": x[None].astype(np.float32)})[0][0].astype(np.float64)
        l -= l.max(1, keepdims=True)
        return l - np.log(np.exp(l).sum(1, keepdims=True))

    def emit(self, lp, ch):
        """Log-likelihood per frame of one letter (or a space), counting its other spellings."""
        alts = next((g for g in SAME if ch in g), {ch})
        ids = [self.id[c] for c in alts if c in self.id]
        return np.logaddexp.reduce(lp[:, ids], axis=1)

def align(model, lp, words):
    """Finds where the words are said in the recording. Returns (score, first frame of each word, last frame)."""
    chars, word_of = [], []
    for k, w in enumerate(words):
        if k: chars.append(" "); word_of.append(-1)
        for c in letters(w): chars.append(c); word_of.append(k)
    L, T = len(chars), lp.shape[0]
    S = 2 * L + 1                       # blank, c1, blank, c2, ... cL, blank
    em = np.zeros((T, S))
    em[:, 0::2] = lp[:, [0]]
    for i, c in enumerate(chars): em[:, 2 * i + 1] = model.emit(lp, c)
    skip = np.zeros(S, bool)            # may jump over the blank between two different letters
    for i in range(1, L):
        if chars[i] != chars[i - 1]: skip[2 * i + 1] = True
    NEG = -1e18
    dp = np.full(S, NEG); back = np.zeros((T, S), np.int8)
    ends = []
    for t in range(T):
        stay = dp
        one = np.concatenate([[NEG], dp[:-1]])
        two = np.where(skip, np.concatenate([[NEG, NEG], dp[:-2]]), NEG)
        best = np.maximum(stay, np.maximum(one, two))
        ch = np.where(best == stay, 0, np.where(best == one, 1, 2)).astype(np.int8)
        # the card's first letter may start at any frame (the recording says other things around it)
        best[0] = 0.0; ch[0] = 3
        dp = best + em[t]; back[t] = ch
        ends.append(dp[S - 2])
    t_end = int(np.argmax(ends)); score = ends[t_end]
    # walk back
    s, t = S - 2, t_end
    path = []
    while t >= 0:
        path.append((t, s))
        c = int(back[t, s])
        if c == 3: break
        s -= c; t -= 1
    path.reverse()
    first, last = [None] * len(words), [None] * len(words)
    for t, s in path:
        if s % 2 == 1:
            k = word_of[(s - 1) // 2]
            if k >= 0:
                if first[k] is None: first[k] = t
                last[k] = t
    return score / max(1, L), first, last

def energy(x):
    n = int(0.01 * SR)
    e = np.sqrt(np.mean(x[: len(x) // n * n].reshape(-1, n) ** 2, axis=1))
    return e   # one value per 10 ms

def quiet_point(e, fr, to):
    """The quietest 30 ms between two times (in 10 ms steps)."""
    fr, to = max(0, fr), min(len(e) - 3, to)
    if to <= fr: return fr
    w = np.convolve(e, np.ones(3), "valid")
    return fr + int(np.argmin(w[fr:to]))

def long_ids():
    src = open(os.path.join(ROOT, "src", "hadith-long.js")).read()
    return set(json.loads(src[src.index("export const LONG = ") + 20:].rstrip().rstrip(";")))

def candidates(card, book):
    """Entries of the book that contain the card's words: a whole sentence first, then the shortest."""
    n = norm(card["ar"])
    out = []
    for cat, x in book:
        t = norm(x["text"])
        m = re.search(r"(?:^| )" + re.escape(n) + r"(?= |$)", t)
        if not m: continue
        # does the card end where a sentence of the entry ends (a comma or full stop after it in the book)?
        raw = re.sub(HARAKAT, "", x["text"])
        whole = len(t) == m.end() or bool(re.search(re.escape(n.split()[-1][-2:]) + r"\s*[،,.:؛!)»﴾﴿]", raw))
        out.append((not whole, len(t), x))
    return [x for _, _, x in sorted(out, key=lambda z: (z[0], z[1]))]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cards", required=True); ap.add_argument("--model", required=True)
    a = ap.parse_args()
    model = Model(a.model)
    tmp = os.path.join(tempfile.gettempdir(), "hisn-audio"); os.makedirs(tmp, exist_ok=True)
    book_file = os.path.join(tmp, "adhkar.json")
    if not os.path.exists(book_file): urllib.request.urlretrieve(REPO + "/adhkar.json", book_file)
    book = [(c["category"], x) for c in json.load(open(book_file)) for x in c["array"]]
    skip = long_ids()
    outdir = os.path.join(ROOT, "assets", "voice"); os.makedirs(outdir, exist_ok=True)
    for f in os.listdir(outdir): os.remove(os.path.join(outdir, f))
    data, cache = {}, {}
    for card in json.load(open(a.cards)):
        if card["id"] in skip: continue
        words = card["ar"].split()
        best = None
        for x in candidates(card, book)[:4]:
            mp3 = os.path.join(tmp, x["filename"] + ".mp3")
            if not os.path.exists(mp3): urllib.request.urlretrieve(REPO + x["audio"], mp3)
            if mp3 not in cache:
                raw = subprocess.check_output(["ffmpeg", "-loglevel", "error", "-i", mp3, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"])
                pcm = np.frombuffer(raw, np.float32).copy()
                cache[mp3] = (pcm, model.logp(pcm))
            pcm, lp = cache[mp3]
            score, first, last = align(model, lp, words)
            if best is None or score > best[0] + 0.15: best = (score, first, last, mp3, x)
            if score > -0.35: break      # a clear match: take the preferred entry
        if not best or best[0] < MIN_SCORE or None in best[1]:
            print(f"{card['id']:22s} -- not in the book" + (f" (best {best[0]:.2f})" if best else "")); continue
        score, first, last, mp3, x = best
        pcm = cache[mp3][0]; e = energy(pcm)
        f0, f1 = first[0] * 2, (last[-1] + 1) * 2          # in 10 ms steps
        start = quiet_point(e, f0 - 12, f0)                # the gap before the first word (words often run together)
        nxt = f1 + 45                                      # up to 0.45 s after the last letter
        end = quiet_point(e, f1 + 4, nxt)
        st, en = start / 100, end / 100 + 0.03
        out = os.path.join(outdir, card["id"] + ".mp3")
        subprocess.check_call(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3, "-af",
                               f"atrim=start={st:.3f}:end={en:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.04,"
                               f"afade=t=out:st={max(0, en - st - 0.08):.3f}:d=0.08,loudnorm=I=-18:TP=-2",
                               "-map", "0:a", "-map_metadata", "-1", "-ar", "44100", "-ac", "1", "-b:a", "64k", out])
        times = []
        for k in range(len(words)):
            s0 = first[k] * FRAME - st
            s1 = (first[k + 1] * FRAME - st) if k + 1 < len(words) else (last[k] + 1) * FRAME - st + 0.1
            times.append([max(0, round(s0 * 1000 - 60)), round(s1 * 1000 - 60)])
        data[card["id"]] = times
        print(f"{card['id']:22s} {score:5.2f}  {en - st:4.1f}s  from {x['filename']}.mp3  {norm(x['text'])[:60]}")
    with open(os.path.join(ROOT, "src", "voice-data.js"), "w") as f:
        f.write("// Made by scripts/make-human-voice.py: the dhikr and dua cards read by Hamad Al-Duraihim (his Hisn al-Muslim\n")
        f.write("// recordings, from github.com/rn0x/Adhkar-json), cut to the card's words, and when each word starts and ends\n")
        f.write("// in its clip, in ms.\n")
        f.write("export const VOICE = {\n")
        for k, v in data.items():
            f.write(f'  {json.dumps(k)}: {{ file: require("../assets/voice/{k}.mp3"), t: {json.dumps(v, separators=(",", ":"))} }},\n')
        f.write("};\n")
    print(len(data), "cards recorded")

main()
