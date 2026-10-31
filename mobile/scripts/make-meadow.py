# Makes assets/sounds/amb-butterflies.wav, the butterflies weather sound: a 40 s seamless loop of a stream with
# birds far off. Sources, both CC0, from the Blanket app (github.com/rafaelmardojai/blanket, data/resources/sounds):
# stream.ogg ("Stream" by gluckose, freesound 333987) and birds.ogg ("Birds" by kvgarlic, freesound 156826).
# Run: python3 scripts/make-meadow.py stream.ogg birds.ogg assets/sounds/amb-butterflies.wav
import sys, subprocess, numpy as np, wave
R=22050
def load(f, start, dur):
    raw = subprocess.run(["ffmpeg","-v","error","-ss",str(start),"-t",str(dur),"-i",f,"-ac","1","-ar",str(R),"-af","highpass=f=90","-f","s16le","-"],capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(float)/32768
L, F = 40, 3
s = load(sys.argv[1], 30, L+F); b = load(sys.argv[2], 40, L+F)
n = min(len(s), len(b)); x = s[:n] + 0.4*b[:n]
N, Fn = L*R, F*R
t = np.arange(Fn)/Fn
head = x[:Fn]*np.sqrt(t) + x[N:N+Fn]*np.sqrt(1-t)
y = np.concatenate([head, x[Fn:N]])
y *= 10**(-34/20)/np.sqrt((y**2).mean())
print("peak", np.abs(y).max())
y = np.clip(y, -1, 1)
w = wave.open(sys.argv[3], "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(R)
w.writeframes((y*32767).astype(np.int16).tobytes()); w.close()
