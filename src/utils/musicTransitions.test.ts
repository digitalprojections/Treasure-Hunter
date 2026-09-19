import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { MusicPlayer } from './musicPlayer';

class FakeAudio {
  src = ''; volume = 0; loop = false; preload = ''; currentTime = 0; duration = 20;
  paused = true; onplaying: (() => void) | null = null; onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  play = async () => { this.paused = false; };
  pause() { this.paused = true; }
  playing() { this.paused = false; this.onplaying?.(); }
}
function setup(t: TestContext, loops = true) {
  t.mock.timers.enable({ apis: ['setInterval', 'Date'] });
  const audios: FakeAudio[] = [], states: string[] = [];
  const player = new MusicPlayer(['a', 'b', 'c'], s => states.push(s), () => {
    const audio = new FakeAudio(); audios.push(audio); return audio as unknown as HTMLAudioElement;
  }, loops);
  t.after(() => player.dispose());
  player.setVolume(0.5);
  void player.play();
  audios[0].playing();
  const tick = (ms: number) => t.mock.timers.tick(ms);
  tick(1000);
  return { player, audios, states, tick, bed: audios[0], latest: (src: string) => [...audios].reverse().find(a => a.src === src)! };
}
test('loading a cue does not duck the audible background', t => {
  const { player, bed, tick } = setup(t);
  player.playCue('combat');
  tick(1000);
  assert.equal(bed.volume, 0.5);
});
test('cue fades in and out while the background stays at its selected volume', t => {
  const { player, bed, latest, tick } = setup(t);
  player.playCue('combat');
  const cue = latest('combat');
  assert.equal(cue.volume, 0);
  cue.playing();
  tick(100);
  assert.ok(cue.volume > 0 && cue.volume < 0.5);
  tick(1000);
  assert.equal(bed.volume, 0.5);
  cue.currentTime = cue.duration - 0.7;
  tick(25); tick(600);
  assert.equal(bed.volume, 0.5);
  assert.ok(cue.volume < 0.5);
});
test('island track changes keep the old track until the new track is playing, then overlap', t => {
  const { player, bed, latest, tick } = setup(t);
  player.setTracks(['b'], true);
  const incoming = latest('b');
  assert.ok(incoming);
  assert.equal(bed.src, 'a');
  assert.equal(bed.paused, false);
  assert.equal(incoming.volume, 0);
  tick(1000);
  assert.equal(bed.paused, false, 'loading cannot cut off the old bed');
  incoming.playing(); tick(400);
  assert.ok(bed.volume > 0 && incoming.volume > 0);
  assert.ok(Math.abs(bed.volume ** 2 + incoming.volume ** 2 - 0.25) < 0.01);
  tick(1000);
  assert.equal(bed.paused, true);
  assert.equal(incoming.volume, 0.5);
});
test('loop boundaries overlap before the source reaches its end', t => {
  const { bed, audios, tick, latest } = setup(t);
  bed.currentTime = bed.duration - 0.9;
  tick(25);
  const repeat = latest('a');
  assert.notEqual(repeat, bed);
  repeat.playing(); tick(400);
  assert.ok(bed.volume > 0 && repeat.volume > 0);
  tick(1000);
  assert.equal(bed.paused, true);
  assert.equal(repeat.paused, false);
  assert.ok(audios.length < 5);
});
test('higher priority cues overlap instead of abruptly stopping a playing cue', t => {
  const { player, bed, latest, tick } = setup(t);
  player.playCue('combat', 1); const old = latest('combat'); old.playing(); tick(1000);
  player.playCue('victory', 4); const next = latest('victory');
  assert.equal(old.paused, false);
  next.playing(); tick(100);
  assert.ok(old.volume > 0 && next.volume > 0);
  assert.equal(bed.volume, 0.5);
  assert.equal(bed.paused, false);
  tick(1000); assert.equal(old.paused, true);
});
test('mute during a transition silences every layer and cancels stale playback callbacks', t => {
  const { player, bed, latest, audios, tick } = setup(t);
  player.setTracks(['b'], true);
  const pending = latest('b'), stale = pending.onplaying!;
  player.setVolume(0);
  stale(); tick(2000);
  for (const audio of audios) {
    assert.equal(audio.paused, true);
    assert.equal(audio.volume, 0);
  }
  assert.equal(bed.paused, true);
});

for (const event of ['combat', 'discovery', 'relic', 'rest', 'setback', 'victory']) {
  test(`${event} overlays leave main-loop volume and playback untouched throughout the cue`, t => {
    const { player, bed, latest, tick } = setup(t);
    bed.currentTime = 8;
    const unchanged = () => {
      assert.equal(bed.volume, 0.5);
      assert.equal(bed.paused, false);
      assert.equal(bed.currentTime, 8);
      assert.equal(bed.src, 'a');
    };
    player.playCue(event);
    tick(1000); unchanged();
    const cue = latest(event);
    cue.playing();
    for (const ms of [100, 200, 1000]) { tick(ms); unchanged(); }
    cue.currentTime = cue.duration - 0.7;
    for (const ms of [25, 300, 400]) { tick(ms); unchanged(); }
    cue.onended!();
    tick(1000); unchanged();
    player.playCue(event);
    latest(event).playing(); tick(300); unchanged();
    latest(event).onerror!(); tick(1000); unchanged();
  });
}

