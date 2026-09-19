import { normalizeVolume } from './audio';

type Ramp = { from: number; to: number; start: number; duration: number; done?: () => void };
type Level = { gain: number; ramp?: Ramp };
type Voice = Level & { audio: HTMLAudioElement; kind: 'bed' | 'cue'; started: boolean; index: number; releasing?: boolean };
const CROSSFADE_MS = 1000;
const CUE_ATTACK_MS = 240;
const CUE_RELEASE_MS = 700;
const DUCK_GAIN = 0.3;

// Interpolate power, not amplitude, so overlapping unrelated passages do not dip.
function advance(level: Level, now: number) {
  const ramp = level.ramp;
  if (!ramp) return;
  const progress = Math.min(1, Math.max(0, (now - ramp.start) / ramp.duration));
  const mix = progress * progress * (3 - 2 * progress);
  level.gain = Math.sqrt((1 - mix) * ramp.from ** 2 + mix * ramp.to ** 2);
  if (progress === 1) { level.ramp = undefined; ramp.done?.(); }
}

export class MusicPlayer {
  private bed?: Voice;
  private pending?: Voice;
  private standby?: Voice;
  private cue?: Voice;
  private cuePriority = 0;
  private cueDucks = true;
  private voices = new Set<Voice>();
  private duck: Level = { gain: 1 };
  private failed = new Set<number>();
  private index = 0;
  private volume = 0;
  private running = false;
  private disposed = false;
  private timer?: ReturnType<typeof setInterval>;

  constructor(private tracks: readonly string[], private status: (message: string) => void,
    private createAudio = () => new Audio(), private sectionLoops = false) {
    if (tracks.length) this.bed = this.makeBed(0, 1);
    status(tracks.length ? 'Click to enable music' : 'No music for this scene');
  }

  private ramp(level: Level, to: number, duration: number, done?: () => void) {
    advance(level, Date.now());
    level.ramp = { from: level.gain, to, start: Date.now(), duration: Math.max(1, duration), done };
  }

  private makeVoice(source: string, kind: Voice['kind'], gain = 0, index = -1): Voice {
    const audio = this.createAudio();
    audio.preload = 'auto';
    audio.volume = 0;
    audio.src = source;
    const voice: Voice = { audio, kind, gain, index, started: false };
    this.voices.add(voice);
    return voice;
  }

  private makeBed(index: number, gain = 0) {
    const voice = this.makeVoice(this.tracks[index], 'bed', gain, index);
    // Native looping is a fallback if a replacement is delayed; normally we overlap.
    voice.audio.loop = this.sectionLoops;
    voice.audio.onplaying = () => {
      if (!this.running || !this.voices.has(voice)) return;
      if (this.pending === voice) {
        const previous = this.bed;
        this.pending = undefined;
        this.bed = voice;
        this.index = index;
        this.ramp(voice, 1, CROSSFADE_MS);
        if (previous) this.retire(previous, CROSSFADE_MS);
      }
      voice.started = true;
      if (!this.cue) this.showTrack();
      this.prepareNext();
    };
    voice.audio.onended = () => {
      if (this.running && this.bed === voice) this.changeBed(this.nextIndex());
    };
    voice.audio.onerror = () => this.failBed(voice);
    return voice;
  }

  private nextIndex() {
    if (!this.tracks.length || this.failed.size >= this.tracks.length) return -1;
    let index = this.sectionLoops ? this.index : (this.index + 1) % this.tracks.length;
    while (this.failed.has(index)) index = (index + 1) % this.tracks.length;
    return index;
  }

  private prepareNext() {
    if (!this.running || this.standby || this.pending) return;
    const index = this.nextIndex();
    if (index >= 0) this.standby = this.makeBed(index);
  }

  private changeBed(index: number) {
    if (this.pending || index < 0 || !this.running) return;
    if (this.standby && this.standby.index !== index) this.remove(this.standby);
    const next = this.standby ?? this.makeBed(index);
    this.standby = undefined;
    this.pending = next;
    void this.start(next);
  }

  private async start(voice: Voice) {
    try { await voice.audio.play(); }
    catch (error) {
      if (!this.running || !this.voices.has(voice)) return;
      const name = (error as { name?: string })?.name;
      if (name === 'NotAllowedError') this.status('Click to enable music');
      else if (name !== 'AbortError') {
        if (voice.kind === 'bed') this.failBed(voice);
        else this.finishCue(voice);
      }
    }
  }

  private failBed(voice: Voice) {
    if (!this.voices.has(voice) || voice.releasing) return;
    this.failed.add(voice.index);
    this.remove(voice);
    if (this.failed.size >= this.tracks.length) {
      this.status('Music files could not be played');
      return;
    }
    let next = (voice.index + 1) % this.tracks.length;
    while (this.failed.has(next)) next = (next + 1) % this.tracks.length;
    this.changeBed(next);
  }

  private retire(voice: Voice, duration: number) {
    voice.releasing = true;
    voice.audio.onplaying = voice.audio.onended = voice.audio.onerror = null;
    this.ramp(voice, 0, duration, () => this.remove(voice));
  }

  private remove(voice: Voice) {
    voice.audio.onplaying = voice.audio.onended = voice.audio.onerror = null;
    voice.audio.volume = 0;
    voice.audio.pause();
    voice.ramp = undefined;
    this.voices.delete(voice);
    if (this.standby === voice) this.standby = undefined;
    if (this.pending === voice) this.pending = undefined;
    if (this.bed === voice) this.bed = undefined;
  }

  private showTrack() {
    const source = this.bed?.audio.src;
    if (source) this.status(`Playing: ${decodeURIComponent(source.split('/').pop()!).replace(/\.[^.]+$/, '')}`);
  }

  private applyVolumes() {
    for (const voice of this.voices) {
      voice.audio.volume = Math.min(1, Math.max(0, this.volume * voice.gain * (voice.kind === 'bed' ? this.duck.gain : 1)));
    }
  }

  private tick = () => {
    const now = Date.now();
    const cue = this.cue;
    if (cue?.started && !cue.releasing && Number.isFinite(cue.audio.duration)) {
      const remaining = cue.audio.duration - cue.audio.currentTime;
      if (remaining <= CUE_RELEASE_MS / 1000) {
        cue.releasing = true;
        // Generated cues already fade to silence. Recover the bed before that tail.
        this.ramp(this.duck, 1, Math.max(25, remaining * 1000 - 100));
        this.ramp(cue, 0, Math.max(25, remaining * 1000));
      }
    }
    advance(this.duck, now);
    for (const voice of this.voices) advance(voice, now);
    this.applyVolumes();
    const bed = this.bed;
    if (bed?.started && !bed.releasing && Number.isFinite(bed.audio.duration)
      && bed.audio.currentTime >= bed.audio.duration - CROSSFADE_MS / 1000) {
      this.changeBed(this.nextIndex());
    }
  };

  setVolume(volume: number) {
    if (this.disposed) return;
    this.volume = normalizeVolume(volume, 0);
    this.applyVolumes();
    if (!this.volume) { this.pause(); this.status('Music muted'); }
  }

  setTracks(tracks: readonly string[], sectionLoops = false) {
    if (this.disposed || (sectionLoops === this.sectionLoops && tracks.length === this.tracks.length
      && tracks.every((track, i) => track === this.tracks[i]))) return;
    if (this.pending) this.remove(this.pending);
    if (this.standby) this.remove(this.standby);
    this.tracks = tracks;
    this.sectionLoops = sectionLoops;
    this.failed.clear();
    this.index = 0;
    if (!tracks.length) {
      if (this.bed) this.retire(this.bed, CROSSFADE_MS);
      this.status('No music for this scene');
    } else if (this.running) this.changeBed(0);
    else {
      if (this.bed) this.remove(this.bed);
      this.bed = this.makeBed(0, 1);
    }
  }

  playCue(source: string, priority = 1, duckBackground = true) {
    if (this.disposed || !this.volume || !this.running || (this.cue && priority <= this.cuePriority)) return;
    // A superseded loading cue never needs a fade; a playing cue remains until its replacement starts.
    if (this.cue && !this.cue.started) this.remove(this.cue);
    const cue = this.makeVoice(source, 'cue');
    this.cue = cue;
    this.cuePriority = priority;
    this.cueDucks = duckBackground;
    cue.audio.loop = false;
    cue.audio.onplaying = () => {
      if (!this.running || this.cue !== cue || cue.started || !this.voices.has(cue)) return;
      cue.started = true;
      for (const other of this.voices) if (other.kind === 'cue' && other !== cue) this.retire(other, CUE_ATTACK_MS);
      this.ramp(cue, 1, CUE_ATTACK_MS);
      this.ramp(this.duck, this.cueDucks ? DUCK_GAIN : 1, CUE_ATTACK_MS);
      this.status(`Event: ${decodeURIComponent(source.split('/').slice(-2).join('/')).replace(/\.[^.]+$/, '')}`);
    };
    cue.audio.onended = () => this.finishCue(cue);
    cue.audio.onerror = () => this.finishCue(cue);
    void this.start(cue);
  }

  private finishCue(cue: Voice) {
    if (!this.voices.has(cue)) return;
    this.remove(cue);
    if (this.cue !== cue) return;
    this.cue = undefined;
    this.cuePriority = 0;
    this.ramp(this.duck, 1, CUE_ATTACK_MS);
    this.showTrack();
  }

  async play() {
    if (this.disposed || !this.volume) return;
    this.running = true;
    this.timer ??= setInterval(this.tick, 25);
    this.applyVolumes();
    if (this.pending) await this.start(this.pending);
    if (this.bed && this.bed.audio.paused) await this.start(this.bed);
  }

  pause() {
    this.running = false;
    clearInterval(this.timer);
    this.timer = undefined;
    for (const voice of this.voices) {
      if (voice !== this.bed || voice.releasing) this.remove(voice);
      else { voice.ramp = undefined; voice.gain = 1; voice.audio.pause(); }
    }
    this.cue = undefined;
    this.cuePriority = 0;
    this.duck = { gain: 1 };
    this.applyVolumes();
    this.status('Music paused');
  }

  dispose() {
    this.pause();
    this.disposed = true;
    for (const voice of this.voices) this.remove(voice);
  }
}
