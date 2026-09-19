import { normalizeVolume, type SoundEvent } from './audio';

interface Voice { frequency: number; endFrequency: number; duration: number; delay: number; gain: number; wave: OscillatorType }
const tone = (frequency: number, endFrequency: number, duration: number, delay = 0, gain = 0.12, wave: OscillatorType = 'sine'): Voice =>
  ({ frequency, endFrequency, duration, delay, gain, wave });
const recipes: Record<SoundEvent, Voice[]> = {
  walk: [tone(130, 55, 0.09, 0, 0.16), tone(105, 45, 0.08, 0.14, 0.1)],
  attack: [tone(700, 95, 0.13, 0, 0.06, 'sawtooth'), tone(130, 40, 0.18, 0.08, 0.18)],
  collect: [tone(660, 660, 0.18), tone(880, 880, 0.22, 0.09), tone(1320, 1320, 0.3, 0.18, 0.07)],
  hit: [tone(150, 35, 0.26, 0, 0.18), tone(95, 45, 0.17, 0, 0.04, 'triangle')],
  reveal: [tone(420, 1260, 0.5, 0, 0.055), tone(784, 784, 0.22, 0.06, 0.09),
    tone(1175, 1175, 0.3, 0.18, 0.065), tone(1568, 1568, 0.45, 0.3, 0.045)],
  scout: [tone(330, 990, 0.45, 0, 0.08), tone(495, 1485, 0.5, 0.07, 0.05)],
  escape: [tone(523, 523, 0.32), tone(659, 659, 0.32, 0.16), tone(784, 784, 0.35, 0.32), tone(1047, 1047, 0.65, 0.48)],
  warning: [tone(260, 220, 0.13, 0, 0.07, 'triangle'), tone(220, 180, 0.15, 0.15, 0.06, 'triangle')],
  rest: [tone(392, 392, 0.5, 0, 0.08), tone(494, 494, 0.55, 0.14, 0.06), tone(587, 587, 0.65, 0.28, 0.05)],
};
export const effectVoices = (event: SoundEvent): readonly Voice[] => recipes[event];
export const selectEffectSource = (files: readonly string[], random = Math.random): string | undefined =>
  files.length ? files[Math.min(files.length - 1, Math.floor(random() * files.length))] : undefined;

/** Lazily owns one audio context. Short envelopes prevent clicks and long tails. */
export class SynthSfx {
  private context?: AudioContext;
  private master?: GainNode;
  private volume = 0.65;
  private active = new Map<OscillatorNode, GainNode>();
  constructor(private createContext = () => new AudioContext()) {}

  setVolume(volume: number) {
    this.volume = normalizeVolume(volume, 0);
    if (this.master) this.master.gain.value = this.volume;
    if (!this.volume) this.stop();
  }

  play(event: SoundEvent) {
    if (!this.volume || this.active.size + recipes[event].length > 12) return;
    try {
      this.context ??= this.createContext();
      const context = this.context;
      if (!this.master) { this.master = context.createGain(); this.master.connect(context.destination); }
      this.master.gain.value = this.volume;
      if (context.state === 'suspended') void context.resume().catch(() => this.stop());
      for (const voice of recipes[event]) {
        const oscillator = context.createOscillator();
        const envelope = context.createGain();
        const start = context.currentTime + voice.delay;
        oscillator.type = voice.wave;
        oscillator.frequency.setValueAtTime(voice.frequency, start);
        oscillator.frequency.exponentialRampToValueAtTime(voice.endFrequency, start + voice.duration);
        envelope.gain.setValueAtTime(0, start);
        envelope.gain.linearRampToValueAtTime(voice.gain, start + 0.008);
        envelope.gain.exponentialRampToValueAtTime(0.0001, start + voice.duration);
        oscillator.connect(envelope);
        envelope.connect(this.master);
        this.active.set(oscillator, envelope);
        oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); this.active.delete(oscillator); };
        oscillator.start(start);
        oscillator.stop(start + voice.duration + 0.01);
      }
    } catch { this.stop(); /* Unsupported audio must never interrupt gameplay. */ }
  }

  stop() {
    for (const [oscillator, envelope] of this.active) {
      oscillator.onended = null;
      try { oscillator.stop(); } catch { /* Already ended. */ }
      oscillator.disconnect();
      envelope.disconnect();
    }
    this.active.clear();
  }

  dispose() {
    this.stop();
    this.master?.disconnect();
    void this.context?.close().catch(() => {});
    this.context = undefined;
    this.master = undefined;
  }
}
