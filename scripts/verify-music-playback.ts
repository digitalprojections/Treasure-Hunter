import { musicTracksForIsland } from '../src/utils/musicFlow';
import { MusicPlayer } from '../src/utils/musicPlayer';
import { discoverAudio } from '../src/utils/audio';

const catalog = discoverAudio(import.meta.glob<string>('../assets/music/**/*.{mp3,ogg,wav,m4a,webm}', { eager: true, query: '?url', import: 'default' }));
const button = document.querySelector<HTMLButtonElement>('#run')!;
const output = document.querySelector<HTMLPreElement>('#result')!;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
button.onclick = async () => {
  button.disabled = true;
  const context = new AudioContext();
  const analyser = context.createAnalyser();
  analyser.fftSize = 2048;
  analyser.connect(context.destination);
  const samples = new Float32Array(analyser.fftSize);
  const audios: HTMLAudioElement[] = [], started: string[] = [], errors: string[] = [];
  let phase = 'startup', silentMs = 0, longestSilenceMs = 0, rmsMin = Infinity, measurements = 0;
  const overlaps = new Set<string>();
  let backgroundVolumeChanges = 0;
  const player = new MusicPlayer(musicTracksForIsland(catalog.loops.exploration, 1), () => {}, () => {
    const audio = new Audio();
    context.createMediaElementSource(audio).connect(analyser);
    audio.addEventListener('playing', () => started.push(audio.src));
    audio.addEventListener('error', () => errors.push(audio.src));
    audios.push(audio);
    return audio;
  }, true);
  let monitor: ReturnType<typeof setInterval> | undefined;
  const check = (condition: boolean, message: string) => { if (!condition) throw Error(message); };
  try {
    await context.resume();
    player.setVolume(0.35);
    await player.play();
    await sleep(700);
    monitor = setInterval(() => {
      analyser.getFloatTimeDomainData(samples);
      const rms = Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
      rmsMin = Math.min(rmsMin, rms); measurements++;
      silentMs = rms < 0.0001 ? silentMs + 20 : 0;
      longestSilenceMs = Math.max(longestSilenceMs, silentMs);
      if (phase === 'combat' || phase === 'replacement') {
        const bed = audios.find(a => a.src.includes('/loops/exploration/') && !a.paused);
        if (!bed || Math.abs(bed.volume - 0.35) > 0.0001) backgroundVolumeChanges++;
      }
      const audible = audios.filter(a => !a.paused && a.volume > 0.01);
      if (audible.length >= 2) overlaps.add(phase);
    }, 20);
    phase = 'loop';
    const first = audios.find(a => !a.paused)!;
    first.currentTime = first.duration - 1.3;
    await sleep(2300);
    phase = 'combat';
    player.playCue(catalog.events.combat[0], 1);
    await sleep(500);
    const combat = audios.find(a => a.src.includes('/events/combat/'))!;
    await sleep(combat.duration * 1000 + 1500);
    check(!started.some(s => s.includes('sunken-02')), 'Combat changed the island track');
    phase = 'replacement';
    player.playCue(catalog.events.rest[0], 1);
    await sleep(700);
    player.playCue(catalog.events.victory[0], 4);
    await sleep(500);
    const victory = audios.find(a => a.src.includes('/events/victory/'))!;
    await sleep(victory.duration * 1000 + 800);
    phase = 'island';
    player.setTracks(musicTracksForIsland(catalog.loops.exploration, 2), true);
    await sleep(1600);
    clearInterval(monitor);
    check(started.some(s => s.includes('sunken-02')), 'New island did not select the next track');
    check(['loop', 'combat', 'replacement', 'island'].every(p => overlaps.has(p)), 'Missing overlap coverage');
    check(backgroundVolumeChanges === 0, 'An event changed the background volume');
    check(errors.length === 0, 'Audio file failed to decode');
    check(longestSilenceMs < 120, 'Detected an audible silence gap');
    player.setVolume(0);
    check(audios.every(a => a.paused && a.volume === 0), 'Mute left an audio layer running');
    output.textContent = JSON.stringify({ result: 'PASS', measurements, longestSilenceMs, minimumRms: rmsMin,
      overlapPhases: [...overlaps], backgroundVolumeChanges, playingEvents: started.length, decodeErrors: errors.length, mute: 'PASS' }, null, 2);
  } catch (error) {
    output.textContent = JSON.stringify({ result: 'FAIL', error: String(error), phase, longestSilenceMs, errors }, null, 2);
  } finally {
    clearInterval(monitor);
    player.dispose();
    await context.close();
    button.disabled = false;
  }
};

