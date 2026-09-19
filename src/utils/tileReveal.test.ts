import test from 'node:test';
import assert from 'node:assert/strict';
import { TileType, type Tile } from '../types';
import { newlyRevealedTiles, revealsWithinIsland } from './tileReveal';
const tiles: Tile[] = [
  { id: 'near', x: 1, y: 0, type: TileType.GRASS, discovered: false },
  { id: 'distant', x: 9, y: 9, type: TileType.GRASS, discovered: false },
  { id: 'known', x: 0, y: 0, type: TileType.GRASS, discovered: true },
];
test('all skill and interaction reveals share hidden-to-visible detection, including distant tiles', () => {
  const after = tiles.map(t => ({ ...t, discovered: true }));
  assert.deepEqual(newlyRevealedTiles(tiles, after), ['near', 'distant']);
  assert.deepEqual(revealsWithinIsland({ island: 1, tiles }, { island: 1, tiles: after }), ['near', 'distant']);
  assert.equal(tiles[0].discovered, false);
});
test('initialization, map resets and unchanged tiles never produce reveal effects', () => {
  const after = tiles.map(t => ({ ...t, discovered: true }));
  assert.deepEqual(revealsWithinIsland(null, { island: 1, tiles: after }), []);
  assert.deepEqual(revealsWithinIsland({ island: 1, tiles }, { island: 2, tiles: after }), []);
  assert.deepEqual(newlyRevealedTiles(tiles, tiles), []);
  assert.deepEqual(newlyRevealedTiles(after, after), []);
});
