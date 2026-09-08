import test from 'node:test';
import assert from 'node:assert/strict';
import { Tile, TileType } from '../types';
import {
  classifyTerrainTile,
  classifyTerrainTiles,
  getMinimumTerrainTileSetSize,
  MINIMUM_TERRAIN_VARIANT_KEYS,
} from './terrainTiles';

function tile(x: number, y: number, type: TileType): Tile {
  return {
    id: `${x}-${y}`,
    x,
    y,
    type,
    discovered: true,
  };
}

test('minimum terrain tile set covers every cardinal edge mask', () => {
  assert.equal(getMinimumTerrainTileSetSize(), 16);
  assert.equal(new Set(MINIMUM_TERRAIN_VARIANT_KEYS).size, 16);
  assert.equal(MINIMUM_TERRAIN_VARIANT_KEYS[0], 'isolated');
  assert.equal(MINIMUM_TERRAIN_VARIANT_KEYS[15], 'center');
});

test('classifies a center tile joined on all four cardinal sides', () => {
  const tiles = [
    tile(1, 1, TileType.GRASS),
    tile(1, 0, TileType.GRASS),
    tile(2, 1, TileType.GRASS),
    tile(1, 2, TileType.GRASS),
    tile(0, 1, TileType.GRASS),
  ];

  const classification = classifyTerrainTile(tiles[0], tiles);

  assert.equal(classification.joinMask, 15);
  assert.equal(classification.variantKey, 'center');
  assert.deepEqual(classification.exposedEdges, []);
});

test('does not join diagonals or different terrain themes', () => {
  const tiles = [
    tile(1, 1, TileType.WATER),
    tile(1, 0, TileType.WATER),
    tile(2, 1, TileType.SAND),
    tile(2, 2, TileType.WATER),
  ];

  const classification = classifyTerrainTile(tiles[0], tiles);

  assert.equal(classification.joinMask, 1);
  assert.equal(classification.variantKey, 'north');
  assert.deepEqual(classification.exposedEdges, ['east', 'south', 'west']);
});

test('classifies a complete tile map by stable tile id', () => {
  const classifications = classifyTerrainTiles([
    tile(0, 0, TileType.SAND),
    tile(1, 0, TileType.SAND),
    tile(0, 1, TileType.WATER),
  ]);

  assert.equal(classifications.get('0-0')?.variantKey, 'east');
  assert.equal(classifications.get('1-0')?.variantKey, 'west');
  assert.equal(classifications.get('0-1')?.variantKey, 'isolated');
});
