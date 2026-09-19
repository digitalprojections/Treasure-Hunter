import test from 'node:test';
import assert from 'node:assert/strict';
import { EntityType, Tile, TileType } from '../types';
import { generateIsland, getStartingPosition, REQUIRED_RELIC_COUNT } from './mapGenerator';

const tile = (x: number, type: TileType, extra: Partial<Tile> = {}): Tile => ({
  id: `${x}-0`, x, y: 0, type, discovered: false, ...extra,
});

test('spawn excludes every entity and decorative visual, preferring empty sand', () => {
  const busy = Object.values(EntityType).map((entity, x) => tile(x, TileType.SAND, { entity }));
  busy.push(tile(20, TileType.SAND, { visual: { id: 'flower', label: 'Flowers', tone: 'ambient' } }));
  const tiles = [...busy, tile(21, TileType.GRASS), tile(22, TileType.SAND)];
  for (let i = 0; i < 50; i++) assert.deepEqual(getStartingPosition(tiles), { x: 22, y: 0 });
});

test('spawn falls back to empty land instead of occupied sand or water', () => {
  const tiles = [tile(0, TileType.SAND, { entity: EntityType.EXIT }),
    tile(1, TileType.WATER), tile(2, TileType.DEEP_WATER), tile(3, TileType.GRASS)];
  assert.deepEqual(getStartingPosition(tiles), { x: 3, y: 0 });
});

test('invalid maps fail explicitly without inventing a spawn coordinate', () => {
  assert.throws(() => getStartingPosition([]), /empty land tile/i);
  assert.throws(() => getStartingPosition([tile(0, TileType.SAND, { entity: EntityType.RELIC })]), /empty land tile/i);
});

test('generation reserves a clear spawn even when every land tile rolls an entity', t => {
  t.mock.method(Math, 'random', () => 0);
  const tiles = generateIsland();
  const position = getStartingPosition(tiles);
  const start = tiles.find(tile => tile.x === position.x && tile.y === position.y)!;
  assert.equal(start.type, TileType.SAND);
  assert.equal(start.entity, undefined);
  assert.equal(start.visual, undefined);
  assert.equal(tiles.filter(tile => tile.entity === EntityType.RELIC).length, REQUIRED_RELIC_COUNT);
  assert.equal(tiles.filter(tile => tile.entity === EntityType.EXIT).length, 1);
});
