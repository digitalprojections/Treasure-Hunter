/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tile, TileType, EntityType, TileVisual } from '../types';

const MAP_WIDTH = 12;
const MAP_HEIGHT = 12;
export const REQUIRED_RELIC_COUNT = 3;

const visualPools: Record<TileType, TileVisual[]> = {
  [TileType.WATER]: [
    { id: 'fish', label: 'Fish', tone: 'wildlife' },
    { id: 'turtle', label: 'Turtle', tone: 'wildlife' },
    { id: 'woodBridge', label: 'Wood Bridge', tone: 'landmark' },
    { id: 'waypoint', label: 'Waypoint', tone: 'landmark' },
  ],
  [TileType.DEEP_WATER]: [
    { id: 'fish', label: 'Fish', tone: 'wildlife' },
    { id: 'turtle', label: 'Turtle', tone: 'wildlife' },
  ],
  [TileType.SAND]: [
    { id: 'cactus', label: 'Cactus', tone: 'ambient' },
    { id: 'roadSign', label: 'Road Sign', tone: 'landmark' },
    { id: 'woodenGate', label: 'Wooden Gate', tone: 'landmark' },
    { id: 'barricade', label: 'Barricade', tone: 'landmark' },
    { id: 'quest', label: 'Quest Marker', tone: 'landmark' },
    { id: 'random', label: 'Strange Marker', tone: 'ambient' },
  ],
  [TileType.GRASS]: [
    { id: 'flower', label: 'Flowers', tone: 'ambient' },
    { id: 'rabbit', label: 'Rabbit', tone: 'wildlife' },
    { id: 'deer', label: 'Deer', tone: 'wildlife' },
    { id: 'boar', label: 'Boar', tone: 'wildlife' },
    { id: 'village', label: 'Village', tone: 'landmark' },
    { id: 'well', label: 'Well', tone: 'landmark' },
    { id: 'gold', label: 'Gold Cache', tone: 'resource' },
    { id: 'wood', label: 'Wood Pile', tone: 'resource' },
    { id: 'goblin', label: 'Goblin Camp', tone: 'threat' },
    { id: 'potion', label: 'Potion Sign', tone: 'landmark' },
    { id: 'star', label: 'Star Shrine', tone: 'landmark' },
  ],
  [TileType.FOREST]: [
    { id: 'stump', label: 'Old Stump', tone: 'ambient' },
    { id: 'falcon', label: 'Falcon Perch', tone: 'wildlife' },
    { id: 'wolf', label: 'Wolf Den', tone: 'threat' },
    { id: 'boar', label: 'Boar Trail', tone: 'wildlife' },
    { id: 'wood', label: 'Wood Pile', tone: 'resource' },
    { id: 'barricade', label: 'Barricade', tone: 'landmark' },
    { id: 'scroll', label: 'Scroll Marker', tone: 'landmark' },
    { id: 'troll', label: 'Troll Path', tone: 'threat' },
    { id: 'turret', label: 'Old Turret', tone: 'threat' },
  ],
  [TileType.MOUNTAIN]: [
    { id: 'stone', label: 'Stone Deposit', tone: 'resource' },
    { id: 'goldMine', label: 'Gold Mine', tone: 'resource' },
    { id: 'stoneBridge', label: 'Stone Bridge', tone: 'landmark' },
    { id: 'stoneGate', label: 'Stone Gate', tone: 'landmark' },
    { id: 'ironGate', label: 'Iron Gate', tone: 'landmark' },
    { id: 'magicGate', label: 'Magic Gate', tone: 'landmark' },
    { id: 'altar', label: 'Altar', tone: 'landmark' },
    { id: 'teleport', label: 'Teleport Circle', tone: 'landmark' },
    { id: 'key', label: 'Key Marker', tone: 'landmark' },
    { id: 'cannon', label: 'Cannon Nest', tone: 'threat' },
    { id: 'fireTurret', label: 'Fire Turret', tone: 'threat' },
    { id: 'magicTurret', label: 'Magic Turret', tone: 'threat' },
    { id: 'skeleton', label: 'Skeleton Post', tone: 'threat' },
    { id: 'orc', label: 'Orc Camp', tone: 'threat' },
    { id: 'harpy', label: 'Harpy Roost', tone: 'threat' },
  ],
};

function pickVisual(type: TileType): TileVisual | undefined {
  const pool = visualPools[type];
  if (!pool.length) return undefined;

  const chance = type === TileType.WATER || type === TileType.DEEP_WATER ? 0.16 : 0.34;
  if (Math.random() > chance) return undefined;

  return pool[Math.floor(Math.random() * pool.length)];
}

export function generateIsland(): Tile[] {
  const tiles: Tile[] = [];
  const centerX = MAP_WIDTH / 2;
  const centerY = MAP_HEIGHT / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const normalizedDist = dist / maxDist;
      
      let type: TileType;
      const rand = Math.random();

      // Simple island logic based on distance from center
      if (normalizedDist > 0.8 + (rand * 0.2)) {
        type = TileType.DEEP_WATER;
      } else if (normalizedDist > 0.6 + (rand * 0.2)) {
        type = TileType.WATER;
      } else if (normalizedDist > 0.5 + (rand * 0.1)) {
        type = TileType.SAND;
      } else if (normalizedDist > 0.2 + (rand * 0.1)) {
        type = rand > 0.8 ? TileType.FOREST : TileType.GRASS;
      } else {
        type = rand > 0.7 ? TileType.MOUNTAIN : TileType.GRASS;
      }

      tiles.push({
        id: `${x}-${y}`,
        x,
        y,
        type,
        discovered: false,
      });
    }
  }

  // Populate land tiles with non-critical entities.
  const landTiles = tiles.filter(t => t.type !== TileType.WATER && t.type !== TileType.DEEP_WATER);
  landTiles.forEach(tile => {
    const rand = Math.random();
    if (rand < 0.05) {
      tile.entity = EntityType.TREASURE;
    } else if (rand < 0.10) {
      tile.entity = EntityType.TRAP;
    } else if (rand < 0.12) {
      tile.entity = EntityType.RUIN;
    }
  });

  // Place one exit tile on the coast
  const coastalSand = tiles.filter(t => t.type === TileType.SAND);
  if (coastalSand.length > 0) {
    const exitTile = coastalSand[Math.floor(Math.random() * coastalSand.length)];
    exitTile.entity = EntityType.EXIT;
    // Ensure it's not a treasure too
  }

  const relicCandidates = landTiles
    .filter(t => t.entity !== EntityType.EXIT)
    .sort(() => Math.random() - 0.5);

  for (let i = 0; i < Math.min(REQUIRED_RELIC_COUNT, relicCandidates.length); i++) {
    relicCandidates[i].entity = EntityType.RELIC;
  }

  tiles.forEach(tile => {
    if (!tile.entity) {
      tile.visual = pickVisual(tile.type);
    }
  });

  return tiles;
}

export function getStartingPosition(tiles: Tile[]): { x: number, y: number } {
  // Find a sand tile near the edge to start
  const sandTiles = tiles.filter(t => t.type === TileType.SAND);
  if (sandTiles.length > 0) {
    const start = sandTiles[Math.floor(Math.random() * sandTiles.length)];
    return { x: start.x, y: start.y };
  }
  // Fallback to center
  return { x: 5, y: 5 };
}
