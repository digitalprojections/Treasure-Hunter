export class MusicPlayer {
  private audio: HTMLAudioElement;
  private index = 0;
  private failed = new Set<number>();
  private disposed = false;
  private volume = 0;
  private cue?: HTMLAudioElement;
  private cuePriority = 0;
  private cueDucks = true;
  private fade?: ReturnType<typeof setInterval>;
  constructor(private tracks: readonly string[], private status: (message: string) => void,
    private createAudio = () => new Audio(), private sectionLoops = false) {
    this.audio = createAudio();
    this.audio.loop = sectionLoops;
    this.audio.preload = 'auto';
    if (tracks.length) this.audio.src = tracks[0];
    this.audio.onplaying = () => { if (!this.cue) this.showTrack(); };
    this.audio.onended = () => {
      if (!this.sectionLoops) this.index = (this.index + 1) % this.tracks.length;
      this.loadNext();
    };
    this.audio.onerror = () => this.skipFailed(this.index);
    status(tracks.length ? 'Click to enable music' : 'No music for this scene');
  }
  setVolume(volume: number) {
    this.volume = volume;
    clearInterval(this.fade);
    this.audio.volume = volume * (this.cue && this.cueDucks ? 0.18 : 1);
    if (this.cue) this.cue.volume = volume;
    if (!volume) { this.finishCue(); this.audio.pause(); this.status('Music muted'); }
  }
  private showTrack() {
    if (this.tracks.length) this.status(`Playing: ${decodeURIComponent(this.tracks[this.index].split('/').pop()!).replace(/\.[^.]+$/, '')}`);
  }
  private fadeBed(target: number) {
    clearInterval(this.fade);
    const start = this.audio.volume;
    let step = 0;
    this.fade = setInterval(() => {
      this.audio.volume = start + (target - start) * (++step / 12);
      if (step >= 12) clearInterval(this.fade);
    }, 25);
  }
  playCue(source: string, priority = 1, duckBackground = true, advanceAfter = false) {
    if (this.disposed || !this.volume || (this.cue && priority <= this.cuePriority)) return;
    this.finishCue();
    const cue = this.createAudio();
    this.cue = cue;
    this.cuePriority = priority;
    this.cueDucks = duckBackground;
    cue.loop = false;
    cue.src = source;
    cue.volume = this.volume;
    cue.onplaying = () => this.status(`Event: ${decodeURIComponent(source.split('/').slice(-2).join('/')).replace(/\.[^.]+$/, '')}`);
    const done = (completed = false) => {
      if (this.cue !== cue) return;
      this.finishCue();
      if (completed && advanceAfter) this.nextSection();
      this.showTrack();
    };
    cue.onended = () => done(true);
    cue.onerror = () => done();
    this.fadeBed(this.volume * (duckBackground ? 0.18 : 1));
    void cue.play().catch(() => done());
  }
  private finishCue() {
    if (!this.cue) return;
    this.cue.onended = this.cue.onerror = this.cue.onplaying = null;
    this.cue.pause();
    this.cue = undefined;
    this.cuePriority = 0;
    this.fadeBed(this.volume);
  }
  private nextSection() {
    if (!this.sectionLoops || this.tracks.length < 2 || this.failed.size === this.tracks.length) return;
    this.index = (this.index + 1) % this.tracks.length;
    this.loadNext();
  }
  async play() {
    if (this.disposed || !this.volume || !this.tracks.length || this.failed.size === this.tracks.length) return;
    const index = this.index;
    try { await this.audio.play(); }
    catch (error) {
      if (this.disposed || index !== this.index) return;
      const name = (error as { name?: string })?.name;
      if (name === 'NotAllowedError') this.status('Click to enable music');
      else if (name !== 'AbortError') this.skipFailed(index);
    }
  }
  pause() { this.finishCue(); clearInterval(this.fade); this.audio.volume = this.volume; this.audio.pause(); this.status('Music paused'); }
  private skipFailed(index: number) {
    if (this.disposed || this.failed.has(index)) return;
    this.failed.add(index);
    if (this.failed.size === this.tracks.length) { this.status('Music files could not be played'); return; }
    this.index = (index + 1) % this.tracks.length;
    this.loadNext();
  }
  private loadNext() {
    while (this.failed.has(this.index)) this.index = (this.index + 1) % this.tracks.length;
    this.audio.src = this.tracks[this.index];
    void this.play();
  }
  dispose() {
    this.disposed = true;
    this.finishCue();
    clearInterval(this.fade);
    this.audio.onended = this.audio.onerror = this.audio.onplaying = null;
    this.audio.pause();
  }
}
