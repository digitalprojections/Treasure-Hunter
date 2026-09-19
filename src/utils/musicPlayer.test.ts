import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { MusicPlayer } from './musicPlayer';

function setup(t: TestContext, loops = true) {
  t.mock.timers.enable({ apis: ['setInterval', 'Date'] });
  const audios: any[] = [], states: string[] = [];
  const player = new MusicPlayer(['a', 'b', 'c'], s => states.push(s), () => {
    const audio = { src: '', volume: 0, paused: true, loop: false, currentTime: 0, duration: 30, plays: 0,
      onended: null, onerror: null, onplaying: null,
      play: async () => { audio.paused = false; audio.plays++; }, pause() { audio.paused = true; } };
    audios.push(audio); return audio as unknown as HTMLAudioElement;
  }, loops);
  t.after(() => player.dispose());
  player.setVolume(0.5); void player.play(); audios[0].onplaying();
  return { player, audios, states, bed: audios[0], tick: (ms = 1200) => t.mock.timers.tick(ms),
    latest: (src: string) => [...audios].reverse().find(a => a.src === src && a.plays > 0) ?? [...audios].reverse().find(a => a.src === src)! };
}
test('overlay cue preserves exploration volume and volume changes preserve fade progress', t => {
  const { player, bed, latest, tick } = setup(t);
  player.playCue('relic', 3);
  const cue = latest('relic'); cue.onplaying(); tick();
  assert.equal(cue.loop, false);
  assert.equal(bed.volume, 0.5);
  player.setVolume(0.3);
  assert.equal(bed.volume, 0.3); assert.equal(cue.volume, 0.3);
  cue.onended(); tick();
  assert.equal(bed.src, 'a'); assert.equal(bed.volume, 0.3);
});
test('blocked playback retries from a later gesture without resetting the source', async t => {
  const { player, bed, states } = setup(t);
  player.pause();
  let attempts = 0;
  bed.play = async () => { if (++attempts === 1) throw { name: 'NotAllowedError' }; bed.paused = false; };
  await player.play(); assert.equal(states.at(-1), 'Click to enable music');
  await player.play(); assert.equal(attempts, 2); assert.equal(bed.src, 'a');
});
test('unplayable tracks are each attempted once and a broken playlist stops', async t => {
  const states: string[] = [], played: string[] = [];
  const player = new MusicPlayer(['a', 'b'], s => states.push(s), () => {
    const audio = { src: '', volume: 0, paused: true, pause() {}, play: async () => {
      played.push(audio.src); throw { name: 'NotSupportedError' };
    } };
    return audio as unknown as HTMLAudioElement;
  });
  t.after(() => player.dispose());
  player.setVolume(0.5); await player.play();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(played, ['a', 'b']);
  assert.equal(states.at(-1), 'Music files could not be played');
});
test('playlist advances, wraps, pauses when muted and removes all disposal handlers', t => {
  const { player, bed, latest, audios, tick } = setup(t, false);
  bed.onended(); latest('b').onplaying(); tick();
  latest('b').onended(); latest('c').onplaying(); tick();
  latest('c').onended(); latest('a').onplaying(); tick();
  assert.equal(latest('a').paused, false);
  player.setVolume(0); void player.play();
  assert.ok(audios.every(a => a.paused));
  player.dispose();
  assert.ok(audios.every(a => a.onended === null && a.onplaying === null && a.onerror === null));
});
test('event priorities prevent stacking, cue failure recovers and pause cancels cue completion', t => {
  const { player, bed, latest, audios, tick } = setup(t);
  player.playCue('relic', 3); latest('relic').onplaying(); tick();
  const count = audios.length; player.playCue('combat', 1); assert.equal(audios.length, count);
  player.setVolume(0.4);
  assert.equal(bed.volume, 0.4);
  latest('relic').onerror(); tick(); assert.equal(bed.volume, 0.4);
  player.playCue('combat', 1);
  const stale = latest('combat').onended;
  player.pause(); stale(); tick();
  assert.equal(bed.src, 'a');
  assert.equal(latest('combat').onended, null);
});
test('scene changes overlap, and another scene change cancels the obsolete loading track', t => {
  const { player, bed, latest, tick } = setup(t);
  player.setTracks(['menu']); const obsolete = latest('menu'); const stale = obsolete.onplaying;
  player.setTracks(['victory']); stale(); tick();
  assert.equal(bed.paused, false); assert.equal(obsolete.paused, true);
  latest('victory').onplaying(); tick(400);
  assert.ok(bed.volume > 0 && latest('victory').volume > 0);
  tick(); assert.equal(bed.paused, true);
  player.setTracks([]); tick(); assert.equal(latest('victory').paused, true);
});
test('a failed replacement keeps the previous section audible while the next candidate loads', t => {
  const { player, bed, latest, tick } = setup(t);
  player.setTracks(['b', 'c'], true);
  latest('b').onerror(); tick();
  assert.equal(bed.paused, false);
  latest('c').onplaying(); tick();
  assert.equal(bed.paused, true);
  assert.equal(latest('c').volume, 0.5);
});
test('volume changes during a crossfade scale both layers without resetting their envelope', t => {
  const { player, bed, latest, tick } = setup(t);
  player.setTracks(['new']); latest('new').onplaying(); tick(500);
  const old = bed.volume, next = latest('new').volume;
  player.setVolume(0.25);
  assert.equal(bed.volume, old / 2); assert.equal(latest('new').volume, next / 2);
  tick(); assert.equal(latest('new').volume, 0.25);
});
test('pause during crossfade cancels outgoing layers and resumes the current section', async t => {
  const { player, bed, latest, tick } = setup(t);
  player.setTracks(['new']); latest('new').onplaying(); tick(400);
  player.pause(); tick();
  assert.equal(bed.paused, true); assert.equal(latest('new').paused, true);
  await player.play();
  assert.equal(latest('new').paused, false); assert.equal(bed.paused, true);
});


test('completed gameplay cues keep the current island track and playback position', t => {
  const { player, bed, latest, audios, tick } = setup(t);
  bed.currentTime = 8;
  for (const event of ['combat', 'combat', 'discovery', 'relic', 'rest', 'setback', 'victory']) {
    player.playCue(event, 1);
    latest(event).onplaying();
    latest(event).onended();
    tick();
    assert.equal(bed.paused, false);
    assert.equal(bed.currentTime, 8);
    assert.equal(bed.src, 'a');
    assert.equal(audios.filter(a => a.src !== 'a' && a.src !== event && a.plays > 0 && !a.paused).length, 0);
    assert.ok(!audios.some(a => ['b', 'c'].includes(a.src)), 'events cannot choose another track');
  }
});
