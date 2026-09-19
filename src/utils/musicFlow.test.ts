import test from 'node:test';
import assert from 'node:assert/strict';
import { musicCueForOutcome, musicTracksForIsland } from './musicFlow';

test('important outcomes get musical cues; routine actions remain quiet', () => {
  assert.equal(musicCueForOutcome({ achievement: 'relic_collected', animation: 'collect' }), 'relic');
  assert.equal(musicCueForOutcome({ achievement: 'treasure_found', animation: 'collect' }), 'discovery');
  assert.equal(musicCueForOutcome({ animation: 'attack' }), 'combat');
  assert.equal(musicCueForOutcome({ animation: 'hit' }), 'setback');
  assert.equal(musicCueForOutcome({ achievement: 'island_escape', animation: 'escape' }), 'victory');
  for (const animation of ['walk', 'idle', 'collect', 'scout']) assert.equal(musicCueForOutcome({ animation }), undefined);
});

test('one track is selected for the entire island and changes only with the island number', () => {
  const tracks = ['a', 'b', 'c'];
  assert.deepEqual(musicTracksForIsland(tracks, 1), ['a']);
  assert.deepEqual(musicTracksForIsland(tracks, 1), ['a']);
  assert.deepEqual(musicTracksForIsland(tracks, 2), ['b']);
  assert.deepEqual(musicTracksForIsland(tracks, 3), ['c']);
  assert.deepEqual(musicTracksForIsland(tracks, 4), ['a']);
  assert.deepEqual(tracks, ['a', 'b', 'c']);
});
test('empty and single-track catalogs, initial island and invalid indices are safe', () => {
  assert.deepEqual(musicTracksForIsland([], 1), []);
  assert.deepEqual(musicTracksForIsland(['only'], 20), ['only']);
  for (const island of [0, -1, NaN, Infinity]) {
    assert.deepEqual(musicTracksForIsland(['a', 'b'], island), ['a']);
  }
});
