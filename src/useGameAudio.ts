import { useCallback, useEffect, useRef, useState } from 'react';
import { selectEffectSource, SynthSfx } from './utils/synthSfx';
import { musicTracksForIsland } from './utils/musicFlow';
import { MusicPlayer } from './utils/musicPlayer';
import { discoverAudio, normalizeVolume, type MusicScene, type SoundEvent, type MusicEvent } from './utils/audio';

const catalog = discoverAudio(import.meta.glob<string>('../assets/{music,sounds}/**/*.{mp3,ogg,wav,m4a,webm,MP3,OGG,WAV,M4A,WEBM}', { eager: true, query: '?url', import: 'default' }));
if (catalog.issues.length) console.warn('Audio files outside the folder convention:', catalog.issues);
const storageKey = 'treasure-hunter-audio';
function readVolumes() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    return { music: normalizeVolume(saved.music, 0.25), sounds: normalizeVolume(saved.sounds, 0.65) };
  } catch { return { music: 0.25, sounds: 0.65 }; }
}

export function useGameAudio(scene: MusicScene, islandNumber = 1) {
  const backgroundScene = scene === 'victory' ? 'play' : scene;
  const [startingMusicRoll] = useState(Math.random);
  const [volumes, setVolumes] = useState(readVolumes);
  const [musicStatus, setMusicStatus] = useState('Click to enable music');
  const music = useRef<MusicPlayer | null>(null);
  const unlocked = useRef(false);
  const musicVolume = useRef(volumes.music);
  musicVolume.current = volumes.music;
  const effects = useRef(new Set<HTMLAudioElement>());
  const synth = useRef<SynthSfx | null>(null);
  const lastPlayed = useRef<Partial<Record<SoundEvent, number>>>({});
  const lastCue = useRef<Partial<Record<MusicEvent, number>>>({});
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(volumes)); } catch { /* Storage may be unavailable. */ }
    for (const audio of effects.current) audio.volume = volumes.sounds;
    synth.current?.setVolume(volumes.sounds);
    music.current?.setVolume(volumes.music);
    if (unlocked.current && !document.hidden) void music.current?.play();
  }, [volumes]);
  useEffect(() => {
    const player = new MusicPlayer([], setMusicStatus);
    music.current = player;
    player.setVolume(musicVolume.current);
    const play = () => { if (!document.hidden) void player.play(); };
    // Call play inside the gesture itself, and retry if an earlier attempt was blocked.
    const unlock = () => { unlocked.current = true; play(); };
    const visibility = () => { if (document.hidden) player.pause(); else if (unlocked.current) play(); };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', visibility);
    if (unlocked.current) play();
    return () => { player.dispose(); music.current = null; window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => {
    const loops = backgroundScene === 'play' ? catalog.loops.exploration : [];
    const tracks = loops.length ? loops : catalog.music[backgroundScene];
    music.current?.setTracks(backgroundScene === 'play' ? musicTracksForIsland(tracks, islandNumber, startingMusicRoll) : tracks, backgroundScene === 'play');
    if (unlocked.current && !document.hidden) void music.current?.play();
  }, [backgroundScene, islandNumber, startingMusicRoll]);
  useEffect(() => {
    const active = effects.current;
    const silence = () => { if (document.hidden) { for (const audio of active) audio.pause(); active.clear(); synth.current?.stop(); } };
    document.addEventListener('visibilitychange', silence);
    return () => { document.removeEventListener('visibilitychange', silence); for (const audio of active) audio.pause(); active.clear(); synth.current?.dispose(); synth.current = null; };
  }, []);
  const playSound = useCallback((event: SoundEvent) => {
    const files = catalog.sounds[event];
    if (!volumes.sounds || document.hidden) return;
    const now = performance.now();
    if (now - (lastPlayed.current[event] ?? -Infinity) < (event === 'warning' ? 1200 : 100)) return;
    lastPlayed.current[event] = now;
    const source = selectEffectSource(files);
    if (!source) {
      synth.current ??= new SynthSfx();
      synth.current.setVolume(volumes.sounds);
      synth.current.play(event);
      return;
    }
    if (effects.current.size >= 6) return;
    const audio = new Audio(source);
    audio.volume = volumes.sounds;
    effects.current.add(audio);
    const done = () => { effects.current.delete(audio); };
    audio.onended = done;
    audio.onerror = done;
    void audio.play().catch(done);
  }, [volumes.sounds]);
  const playMusicEvent = useCallback((event: MusicEvent) => {
    if (document.hidden || !musicVolume.current) return;
    const now = performance.now();
    if (now - (lastCue.current[event] ?? -Infinity) < (event === 'combat' ? 8000 : 4000)) return;
    const source = selectEffectSource(catalog.events[event]);
    if (!source) return;
    lastCue.current[event] = now;
    const priority = event === 'victory' ? 4 : event === 'relic' ? 3 : event === 'discovery' ? 2 : 1;
    music.current?.playCue(source, priority);
  }, []);
  return { volumes, setVolumes, playSound, playMusicEvent, musicStatus };
}
