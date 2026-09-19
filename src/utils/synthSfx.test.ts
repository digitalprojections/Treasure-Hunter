import test from 'node:test';
import assert from 'node:assert/strict';
import { soundEvents } from './audio';
import { effectVoices, selectEffectSource, SynthSfx } from './synthSfx';

test('every event has a short bounded synthesis recipe', () => {
  for (const event of soundEvents) {
    const voices = effectVoices(event);
    assert.ok(voices.length > 0 && voices.length <= 5);
    for (const voice of voices) {
      assert.ok(voice.duration > 0 && voice.delay + voice.duration < 2);
      assert.ok(voice.frequency > 0 && voice.endFrequency > 0);
      assert.ok(voice.gain > 0 && voice.gain <= 0.2);
    }
  }
});
test('recordings override synthesis and empty folders use synthesis', () => {
  assert.equal(selectEffectSource([], () => 0), undefined);
  assert.equal(selectEffectSource(['a', 'b'], () => 0.9), 'b');
});
test('synth respects mute, voice cap, immediate stop, and disposal', () => {
  let started = 0, stopped = 0, closed = 0;
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
  const context = {
    state: 'running', currentTime: 0, destination: {},
    createGain: () => ({ gain: param(), connect() {}, disconnect() {} }),
    createOscillator: () => ({ frequency: param(), connect() {}, disconnect() {}, start() { started++; }, stop() { stopped++; }, onended: null }),
    close: async () => { closed++; },
  } as unknown as AudioContext;
  const synth = new SynthSfx(() => context);
  synth.setVolume(0);
  synth.play('walk');
  assert.equal(started, 0);
  synth.setVolume(0.5);
  for (let i = 0; i < 20; i++) synth.play('walk');
  assert.equal(started, 12);
  const scheduledStops = stopped;
  synth.stop();
  assert.equal(stopped, scheduledStops + 12);
  synth.play('walk');
  assert.ok(started > 12);
  synth.dispose();
  assert.equal(closed, 1);
});
