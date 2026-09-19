"""Rebuild the demo score from the theme recording. Requires librosa, numpy, soundfile."""
import argparse, hashlib, json
from pathlib import Path
import librosa
import numpy as np
import scipy.signal
# librosa <0.10 uses the former scipy.signal.hann location.
if not hasattr(scipy.signal, "hann"):
    scipy.signal.hann = scipy.signal.windows.hann

parser = argparse.ArgumentParser()
parser.add_argument('source', nargs='?', default='assets/music/events/demo/sunken.wav')
parser.add_argument('--output', default='src/data/demo-beats.json')
args = parser.parse_args()
source = Path(args.source)
y, sr = librosa.load(source, sr=22050, mono=True)
hop = 256
onset = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
tempo, frames = librosa.beat.beat_track(onset_envelope=onset, sr=sr, hop_length=hop, trim=False)
times = librosa.frames_to_time(frames, sr=sr, hop_length=hop)
rms = librosa.feature.rms(y=y, hop_length=hop)[0]
strength = onset[frames] / max(float(np.percentile(onset[frames], 95)), 1e-9)
energy = rms[np.minimum(frames, len(rms)-1)] / max(float(np.percentile(rms, 95)), 1e-9)
beats = [{'time': round(float(t), 4), 'strength': round(float(min(s,1)),3), 'energy': round(float(min(e,1)),3)} for t,s,e in zip(times,strength,energy) if t < len(y)/sr]
if len(beats) < 8: raise RuntimeError('Too few detected beats to choreograph this track')
score = {'source': source.as_posix(), 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'duration': round(len(y)/sr,4), 'bpm': round(float(np.asarray(tempo).flat[0]),3), 'method': 'librosa onset-strength dynamic-programming beat tracker, hop 256 at 22050Hz', 'beats': beats}
out = Path(args.output); out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(score,indent=2)+'\n')
print(json.dumps({k:v for k,v in score.items() if k != 'beats'},indent=2)); print(f'{len(beats)} beat cues written to {out}')
