import test from 'node:test';
import assert from 'node:assert/strict';
import { MusicPlayer } from './musicPlayer';

test('overlay cue plays once without lowering or changing exploration', () => {
  const audios: any[] = [];
  const player = new MusicPlayer(['a', 'b'], () => {}, () => {
    const audio = { src: '', volume: 0, loop: false, onended: null, onerror: null, onplaying: null,
      play: async () => {}, pause() {} };
    audios.push(audio);
    return audio as unknown as HTMLAudioElement;
  }, true);
  player.setVolume(0.5);
  player.playCue('relic', 3, false);
  assert.equal(audios[1].loop, false);
  assert.equal(audios[0].volume, 0.5);
  player.setVolume(0.3);
  assert.equal(audios[0].volume, 0.3);
  assert.equal(audios[1].volume, 0.3);
  assert.equal(audios[0].src, 'a');
  audios[1].onended();
  assert.equal(audios[0].src, 'a');
  player.dispose();
});

test('blocked music can retry from a subsequent gesture without resetting its track', async () => {
  let attempts = 0;
  const audio = { src: '', volume: 0, paused: true, onended: null, onerror: null, onplaying: null,
    play: async () => { if (++attempts === 1) throw { name: 'NotAllowedError' }; }, pause() {} };
  const states: string[] = [];
  const player = new MusicPlayer(['a.mp3', 'b.mp3'], state => states.push(state), () => audio as unknown as HTMLAudioElement);
  player.setVolume(0.25);
  await player.play();
  assert.equal(states.at(-1), 'Click to enable music');
  await player.play();
  assert.equal(attempts, 2);
  assert.equal(audio.src, 'a.mp3');
  player.dispose();
});

test('unplayable tracks are skipped once and an entirely broken playlist stops', async () => {
  const played: string[] = [];
  const audio = { src: '', volume: 0, paused: true, onended: null, onerror: null, onplaying: null,
    play: async () => { played.push(audio.src); throw { name: 'NotSupportedError' }; }, pause() {} };
  const states: string[] = [];
  const player = new MusicPlayer(['a.mp3', 'b.mp3'], state => states.push(state), () => audio as unknown as HTMLAudioElement);
  player.setVolume(0.25);
  await player.play();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(played, ['a.mp3', 'b.mp3']);
  assert.equal(states.at(-1), 'Music files could not be played');
  player.dispose();
});

test('playlist advances, loops, pauses when muted, and detaches on disposal', async () => {
  let attempts = 0, pauses = 0;
  const audio = { src: '', volume: 0, paused: true, onended: null as (() => void) | null,
    onerror: null, onplaying: null, play: async () => { attempts++; }, pause() { pauses++; } };
  const player = new MusicPlayer(['a.mp3', 'b.mp3'], () => {}, () => audio as unknown as HTMLAudioElement);
  player.setVolume(0.3);
  await player.play();
  audio.onended!();
  assert.equal(audio.src, 'b.mp3');
  audio.onended!();
  assert.equal(audio.src, 'a.mp3');
  assert.equal(attempts, 3);
  player.setVolume(0);
  await player.play();
  assert.equal(attempts, 3);
  assert.equal(pauses, 1);
  player.dispose();
  assert.equal(audio.onended, null);
  assert.equal(audio.onplaying, null);
});

test('event cues duck loops, prevent stacking and restore music on completion', async () => {
  const audios: any[] = [];
  const createAudio = () => {
    const audio = { src: '', volume: 0, paused: true, loop: false, onended: null, onerror: null, onplaying: null,
      play: async () => {}, pause() {} };
    audios.push(audio);
    return audio as unknown as HTMLAudioElement;
  };
  const player = new MusicPlayer(['loop-a', 'loop-b'], () => {}, createAudio, true);
  player.setVolume(0.5);
  assert.equal(audios[0].loop, true);
  player.playCue('relic', 3);
  assert.equal(audios.length, 2);
  assert.equal(audios[1].volume, 0.5);
  player.playCue('combat', 1);
  assert.equal(audios.length, 2);
  player.setVolume(0.4);
  assert.equal(audios[0].volume, 0.4 * 0.18);
  assert.equal(audios[1].volume, 0.4);
  assert.equal(audios[0].src, 'loop-a');
  audios[1].onended();
  assert.equal(audios[0].src, 'loop-a');
  player.setVolume(0.4);
  assert.equal(audios[0].volume, 0.4);
  player.playCue('rest', 1);
  player.pause();
  assert.equal(audios[0].src, 'loop-a');
  assert.equal(audios[2].onended, null);
  player.dispose();
});

test('only completed combat cues advance once in order; errors and replaced cues do not', async () => {
  const audios: any[] = [];
  const player = new MusicPlayer(['a', 'b', 'c'], () => {}, () => {
    const audio = { src: '', volume: 0, onended: null, onerror: null, onplaying: null, play: async () => {}, pause() {} };
    audios.push(audio);
    return audio as unknown as HTMLAudioElement;
  }, true);
  player.setVolume(0.5);
  player.playCue('broken', 1, true, true);
  audios[1].onerror();
  assert.equal(audios[0].src, 'a');
  player.playCue('combat', 1, true, true);
  const staleEnd = audios[2].onended;
  player.playCue('victory', 4);
  staleEnd();
  assert.equal(audios[0].src, 'a');
  const completed = audios[3].onended;
  completed();
  completed();
  assert.equal(audios[0].src, 'a');
  player.playCue('combat', 1, true, true);
  audios[4].onended();
  assert.equal(audios[0].src, 'b');
  player.playCue('combat', 1, true, true);
  audios[5].onended();
  assert.equal(audios[0].src, 'c');
  player.playCue('combat', 1, true, true);
  audios[6].onended();
  assert.equal(audios[0].src, 'a');
  player.dispose();
});
