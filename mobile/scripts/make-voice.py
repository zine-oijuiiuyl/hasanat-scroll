#!/usr/bin/env python3
"""Records every card that is not from the Qur'an (dhikr, duas, hadith) with an Arabic neural voice, so they can be
read aloud without the iPhone's voice (Zine, 2026-10-31). The voice is Piper's "kareem" (ar_JO, medium), run here
on the computer; the app only plays the recordings.

  --cards  JSON list of {id, ar} for the cards (dumped from the app's library)
  --voice  ar_JO-kareem-medium.onnx (from rhasspy/piper-voices, or k2-fsa/sherpa-onnx's tts-models release)
  --asr    optional sherpa-onnx Whisper folder: transcribes each part and prints how close it is to the text
A card with a fuller text in src/hadith-long.js is recorded part by part, with a pause between parts. Each word gets
a time inside its part in proportion to its letters. Writes assets/voice/<id>.mp3 and src/voice-data.js.
"""
import argparse, difflib, json, os, re, subprocess, sys, tempfile, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RATE, GAP, LENGTH_SCALE = 22050, 0.45, 1.12   # a pause between parts (s); a little slower than the voice's default

def letters(w):
    return len(re.sub(r"[^ء-يٱ]", "", w)) or 1

def norm(s):
    s = re.sub(r"[ؐ-ًؚ-ٰٟۖ-ۭـ]", "", s)
    s = re.sub(r"[ٱآأإ]", "ا", s).replace("ى", "ي").replace("ة", "ه")
    return re.sub(r"[^ء-ي ]", "", s)

def long_texts():
    src = open(os.path.join(ROOT, "src", "hadith-long.js")).read()
    return json.loads(src[src.index("export const LONG = ") + 20:].rstrip().rstrip(";"))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cards", required=True); ap.add_argument("--voice", required=True); ap.add_argument("--asr")
    a = ap.parse_args()
    from piper import PiperVoice
    from piper.config import SynthesisConfig
    voice = PiperVoice.load(a.voice)
    cfg = SynthesisConfig(length_scale=LENGTH_SCALE)
    rec = None
    if a.asr:
        import sherpa_onnx
        d = a.asr.rstrip("/") + "/"
        rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=d + "small-encoder.int8.onnx", decoder=d + "small-decoder.int8.onnx",
                                                         tokens=d + "small-tokens.txt", language="ar", task="transcribe", num_threads=4)
    LONG = long_texts()
    outdir = os.path.join(ROOT, "assets", "voice"); os.makedirs(outdir, exist_ok=True)
    data = {}
    for c in json.load(open(a.cards)):
        words = LONG[c["id"]]["w"] if c["id"] in LONG else c["ar"].split()
        parts = LONG[c["id"]]["p"] if c["id"] in LONG else [[0, len(words)]]
        audio, times, at = [], [None] * len(words), 0.0
        for k, (p0, p1) in enumerate(parts):
            text = " ".join(words[p0:p1])
            say = text.replace("ﷺ", "صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ")   # the voice can't read the ligature
            pcm = np.concatenate([np.frombuffer(ch.audio_int16_bytes, np.int16) for ch in voice.synthesize(say, cfg)])
            # The voice leaves a little air at both ends: time the words over the part that is not silent.
            loud = np.where(np.abs(pcm) > 900)[0]
            s0, s1 = (loud[0], loud[-1]) if len(loud) else (0, len(pcm))
            span = (s1 - s0) / RATE
            total = sum(letters(w) for w in words[p0:p1])
            acc = 0
            for i in range(p0, p1):
                st = at + s0 / RATE + span * acc / total
                acc += letters(words[i])
                times[i] = [round(st * 1000), round((at + s0 / RATE + span * acc / total) * 1000)]
            audio.append(pcm); at += len(pcm) / RATE
            if k + 1 < len(parts):
                audio.append(np.zeros(int(GAP * RATE), np.int16)); at += GAP
            if rec:
                s = rec.create_stream()
                x = pcm.astype(np.float32) / 32768
                s.accept_waveform(16000, np.interp(np.arange(0, len(x), RATE / 16000), np.arange(len(x)), x).astype(np.float32))
                rec.decode_stream(s)
                score = difflib.SequenceMatcher(None, norm(text).replace(" ", ""), norm(s.result.text).replace(" ", "")).ratio()
                flag = "  <-- check" if score < 0.75 else ""
                print(f"   {c['id']} part {k + 1}: {score:.2f}{flag}" + (f"\n      said: {s.result.text}\n      text: {text}" if flag else ""))
        wav = os.path.join(tempfile.gettempdir(), c["id"] + ".wav")
        with wave.open(wav, "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE); w.writeframes(np.concatenate(audio).tobytes())
        subprocess.check_call(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-af", "loudnorm=I=-18:TP=-2", "-ar", "22050", "-ac", "1", "-b:a", "40k",
                               os.path.join(outdir, c["id"] + ".mp3")])
        data[c["id"]] = times
        print(f"{c['id']:14s} {len(words):3d} words {len(parts)} parts {at:5.1f}s")
    with open(os.path.join(ROOT, "src", "voice-data.js"), "w") as f:
        f.write("// Made by scripts/make-voice.py: every card that is not from the Qur'an, read by Piper's Arabic voice \"kareem\",\n")
        f.write("// and when each word starts and ends in its recording, in ms (the words of src/hadith-long.js when the card\n")
        f.write("// has a fuller text there, else the card's own words).\n")
        f.write("export const VOICE = {\n")
        for k, v in data.items():
            f.write(f'  {json.dumps(k)}: {{ file: require("../assets/voice/{k}.mp3"), t: {json.dumps(v, separators=(",", ":"))} }},\n')
        f.write("};\n")

main()
