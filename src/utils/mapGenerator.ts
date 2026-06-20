/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tile, TileType, EntityType } from '../types';

const MAP_WIDTH = 12;
const MAP_HEIGHT = 12;

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

  // Populate land tiles with entities
  const landTiles = tiles.filter(t => t.type !== TileType.WATER && t.type !== TileType.DEEP_WATER);
  landTiles.forEach(tile => {
    const rand = Math.random();
    if (rand < 0.05) {
      tile.entity = EntityType.TREASURE;
    } else if (rand < 0.10) {
      tile.entity = EntityType.TRAP;
    } else if (rand < 0.12) {
      tile.entity = EntityType.RELIC;
    } else if (rand < 0.14) {
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
