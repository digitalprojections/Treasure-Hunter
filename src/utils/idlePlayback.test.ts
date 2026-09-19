import test from 'node:test';
import assert from 'node:assert/strict';
import { createIdlePlayback, advanceIdlePlayback } from './idlePlayback';

test('idle begins still and waits a random 4 to 10 seconds', () => {
  assert.equal(createIdlePlayback(100, () => 0).nextStartMs, 4100);
  assert.equal(createIdlePlayback(100, () => 0.5).nextStartMs, 7100);
  assert.equal(createIdlePlayback(100, () => 1).nextStartMs, 10100);
  const state = createIdlePlayback(0, () => 0);
  assert.equal(advanceIdlePlayback(state, 3999, 840).elapsedMs, 0);
});

test('plays one complete clip then rests and chooses a fresh delay', () => {
  const waiting = createIdlePlayback(0, () => 0);
  const playing = advanceIdlePlayback(waiting, 4000, 840);
  assert.equal(playing.startedAtMs, 4000);
  assert.equal(advanceIdlePlayback(playing, 4280, 840).elapsedMs, 280);
  assert.equal(advanceIdlePlayback(playing, 4839, 840).elapsedMs, 839);
  const resting = advanceIdlePlayback(playing, 4840, 840, () => 0.5);
  assert.equal(resting.elapsedMs, 0);
  assert.equal(resting.startedAtMs, null);
  assert.equal(resting.nextStartMs, 11840);
});

test('resuming after a long pause starts at frame zero without replaying missed cycles', () => {
  const state = advanceIdlePlayback(createIdlePlayback(0, () => 0), 90000, 840);
  assert.equal(state.elapsedMs, 0);
  assert.equal(state.startedAtMs, 90000);
});

test('reset after an action cancels the previous idle cycle and waits again', () => {
  const playing = advanceIdlePlayback(createIdlePlayback(0, () => 0), 4000, 840);
  const reset = createIdlePlayback(4200, () => 0);
  assert.equal(playing.startedAtMs, 4000);
  assert.equal(advanceIdlePlayback(reset, 4840, 840).elapsedMs, 0);
  assert.equal(reset.nextStartMs, 8200);
});

test('static heroes never start an idle cycle', () => {
  const state = advanceIdlePlayback(createIdlePlayback(0, () => 0), 5000, 0);
  assert.equal(state.elapsedMs, 0);
  assert.equal(state.startedAtMs, null);
});
