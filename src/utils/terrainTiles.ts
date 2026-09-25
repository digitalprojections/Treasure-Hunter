import { Tile, TileType } from '../types';

export type CardinalDirection = 'north' | 'east' | 'south' | 'west';
export type TerrainJoinMask = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

export interface TerrainTileClassification {
  type: TileType;
  joins: Record<CardinalDirection, boolean>;
  exposedEdges: CardinalDirection[];
  coastEdges: CardinalDirection[];
  joinMask: TerrainJoinMask;
  variantKey: string;
}

export const MINIMUM_TERRAIN_VARIANT_KEYS = [
  'isolated',
  'north',
  'east',
  'north-east',
  'south',
  'north-south',
  'east-south',
  'north-east-south',
  'west',
  'north-west',
  'east-west',
  'north-east-west',
  'south-west',
  'north-south-west',
  'east-south-west',
  'center',
] as const;

const directionBits: Record<CardinalDirection, TerrainJoinMask> = {
  north: 1,
  east: 2,
  south: 4,
  west: 8,
};

const directionOffsets: Record<CardinalDirection, { dx: number; dy: number }> = {
  north: { dx: 0, dy: -1 },
  east: { dx: 1, dy: 0 },
  south: { dx: 0, dy: 1 },
  west: { dx: -1, dy: 0 },
};

const directions: CardinalDirection[] = ['north', 'east', 'south', 'west'];
const landTileTypes = new Set<TileType>([TileType.SAND, TileType.GRASS, TileType.FOREST, TileType.MOUNTAIN, TileType.HIGH_MOUNTAIN]);

export function getMinimumTerrainTileSetSize() {
  return MINIMUM_TERRAIN_VARIANT_KEYS.length;
}

export function getTerrainVariantKey(joinMask: TerrainJoinMask) {
  return MINIMUM_TERRAIN_VARIANT_KEYS[joinMask];
}

export function classifyTerrainTile(tile: Tile, tiles: readonly Tile[]): TerrainTileClassification {
  const byCoordinate = new Map(tiles.map((entry) => [`${entry.x}:${entry.y}`, entry]));
  let joinMask = 0 as TerrainJoinMask;
  const joins = {
    north: false,
    east: false,
    south: false,
    west: false,
  };
  const coastEdges: CardinalDirection[] = [];

  for (const direction of directions) {
    const offset = directionOffsets[direction];
    const neighbor = byCoordinate.get(`${tile.x + offset.dx}:${tile.y + offset.dy}`);
    const joinsTerrain = neighbor?.type === tile.type;

    joins[direction] = joinsTerrain;
    if (joinsTerrain) {
      joinMask = (joinMask | directionBits[direction]) as TerrainJoinMask;
    }
    if ((tile.type === TileType.WATER || tile.type === TileType.DEEP_WATER) && neighbor && landTileTypes.has(neighbor.type)) {
      coastEdges.push(direction);
    }
  }

  return {
    type: tile.type,
    joins,
    exposedEdges: directions.filter((direction) => !joins[direction]),
    coastEdges,
    joinMask,
    variantKey: getTerrainVariantKey(joinMask),
  };
}

export function classifyTerrainTiles(tiles: readonly Tile[]) {
  return new Map(tiles.map((tile) => [tile.id, classifyTerrainTile(tile, tiles)]));
}
