import test from 'node:test';
import assert from 'node:assert/strict';
import { musicCueForOutcome } from './musicFlow';

test('important outcomes get musical cues; routine actions remain quiet', () => {
  assert.equal(musicCueForOutcome({ achievement: 'relic_collected', animation: 'collect' }), 'relic');
  assert.equal(musicCueForOutcome({ achievement: 'treasure_found', animation: 'collect' }), 'discovery');
  assert.equal(musicCueForOutcome({ animation: 'attack' }), 'combat');
  assert.equal(musicCueForOutcome({ animation: 'hit' }), 'setback');
  assert.equal(musicCueForOutcome({ achievement: 'island_escape', animation: 'escape' }), 'victory');
  for (const animation of ['walk', 'idle', 'collect', 'scout']) assert.equal(musicCueForOutcome({ animation }), undefined);
});
