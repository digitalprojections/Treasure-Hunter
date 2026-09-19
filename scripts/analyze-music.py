"""Analyze changes in harmony, timbre and energy; propose musical sections.

Writes an editable section plan and diagnostic plot, never edits source audio.
Usage: python scripts/analyze-music.py "assets/music/play/track.mp3"
"""
import argparse
import json
import subprocess
from pathlib import Path

import librosa
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from scipy.signal import find_peaks
import scipy.signal
# Compatibility for older librosa with newer SciPy's window namespace.
if not hasattr(scipy.signal, 'hann'):
    scipy.signal.hann = scipy.signal.windows.hann

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
parser.add_argument('--output', type=Path, default=Path('tmp/music-analysis'))
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
rate = 22050
raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(args.source), '-vn', '-ac', '1', '-ar', str(rate), '-f', 'f32le', '-'])
y = np.frombuffer(raw, dtype=np.float32)
hop = 512
chroma = librosa.feature.chroma_stft(y=y, sr=rate, hop_length=hop)
mfcc = librosa.feature.mfcc(y=y, sr=rate, hop_length=hop, n_mfcc=13)
rms = librosa.feature.rms(y=y, hop_length=hop)[0]
features = np.vstack([chroma, mfcc, np.log(np.maximum(rms, 1e-6))[None, :]])
features = (features - features.mean(axis=1, keepdims=True)) / np.maximum(features.std(axis=1, keepdims=True), 1e-6)
# Compare several seconds either side, rather than choosing low-volume cut points.
window = round(3 * rate / hop)
novelty = np.zeros(features.shape[1])
for i in range(window, len(novelty) - window):
    novelty[i] = np.linalg.norm(features[:, i-window:i].mean(axis=1) - features[:, i:i+window].mean(axis=1))
peaks, _ = find_peaks(novelty, distance=round(9 * rate / hop), prominence=1.0)
tempo, beats = librosa.beat.beat_track(y=y, sr=rate, hop_length=hop)
beat_times = librosa.frames_to_time(beats, sr=rate, hop_length=hop)
duration = len(y) / rate
candidates = []
for i in peaks:
    time = i * hop / rate
    if 6 < time < duration - 6:
        snapped = float(beat_times[np.argmin(abs(beat_times - time))]) if len(beat_times) else time
        candidates.append({'seconds': round(snapped, 3), 'strength': round(float(novelty[i]), 3)})
times = np.arange(len(novelty)) * hop / rate
fig, axes = plt.subplots(3, 1, figsize=(16, 8), sharex=True)
axes[0].plot(times[:len(rms)], rms); axes[0].set_ylabel('Energy')
axes[1].imshow(chroma, origin='lower', aspect='auto', extent=[0, duration, 0, 12]); axes[1].set_ylabel('Harmony')
axes[2].plot(times, novelty); axes[2].set_ylabel('Section change'); axes[2].set_xlabel('Seconds')
for point in candidates:
    for axis in axes: axis.axvline(point['seconds'], color='red', alpha=.5)
    axes[2].annotate(str(point['seconds']), (point['seconds'], point['strength']), fontsize=8)
fig.suptitle(args.source.name + ' — structural transitions (candidates, not editorial approval)')
fig.tight_layout(); fig.savefig(args.output / 'structure.png'); plt.close(fig)
report = {'source': args.source.as_posix(), 'duration': duration, 'tempo_estimate': float(np.asarray(tempo).flat[0]), 'transitions': candidates}
(args.output / 'structure.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
