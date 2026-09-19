"""Render the editable musical section plan; originals are never modified.

Requires numpy, ffmpeg and ffprobe. Usage: python scripts/build-music-flow.py
"""
import hashlib
import json
import subprocess
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
plan = json.loads((ROOT / 'scripts/music-sections.json').read_text(encoding='utf-8'))
source = ROOT / plan['source']
destination = (ROOT / 'assets/music').resolve()
rate = 44100
decoded = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(source), '-vn', '-ac', '2', '-ar', str(rate), '-f', 'f32le', '-'])
samples = np.frombuffer(decoded, dtype=np.float32).reshape(-1, 2)
report = {'source': plan['source'], 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'clips': []}
for clip in plan['clips']:
    output = (destination / clip['path']).resolve()
    if not output.is_relative_to(destination) or output == source.resolve():
        raise ValueError('Output must stay within music and cannot replace the source')
    start, end = round(clip['start'] * rate), round(clip['end'] * rate)
    if not 0 <= start < end <= len(samples):
        raise ValueError(f'Invalid section: {clip}')
    audio = samples[start:end].copy()
    if clip.get('loop'):
        # Preserve section length/beat timing: blend the tail into the pre-roll
        # immediately preceding its first sample, not into a duplicated first beat.
        blend = min(round(.12 * rate), start)
        mix = np.linspace(0, 1, blend)[:, None]
        audio[-blend:] = audio[-blend:] * (1 - mix) + samples[start-blend:start] * mix
    else:
        attack, release = round(.025 * rate), round(.3 * rate)
        audio[:attack] *= np.linspace(0, 1, attack)[:, None]
        audio[-release:] *= np.linspace(1, 0, release)[:, None]
    # Common loudness target with headroom; no sample clipping.
    rms = float(np.sqrt(np.mean(audio ** 2)))
    peak = float(np.max(np.abs(audio)))
    gain = min(0.12 / max(rms, 1e-6), 0.79 / max(peak, 1e-6))
    audio *= gain
    output.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(rate), '-ac', '2', '-i', '-', '-c:a', 'libvorbis', '-q:a', '5', str(output)], input=audio.astype('<f4').tobytes(), check=True)
    # Decode generated file to verify codec, duration, peak and join delta.
    check = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(output), '-f', 'f32le', '-ac', '2', '-ar', str(rate), '-'])
    check = np.frombuffer(check, dtype=np.float32).reshape(-1, 2)
    actual_duration = len(check) / rate
    if abs(actual_duration - len(audio) / rate) > .05 or not np.isfinite(check).all():
        raise ValueError(f'Invalid rendered audio: {output}')
    report['clips'].append({**clip, 'duration': round(actual_duration, 3), 'peak': round(float(np.max(abs(check))), 4), 'join_delta': round(float(np.max(abs(check[-1] - check[0]))), 5) if clip.get('loop') else None})
    print(f"{clip['path']}: {actual_duration:.2f}s")
(destination / 'section-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
