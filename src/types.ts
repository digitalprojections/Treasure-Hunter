/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum TileType {
  WATER = 'water',
  SAND = 'sand',
  GRASS = 'grass',
  FOREST = 'forest',
  MOUNTAIN = 'mountain',
  DEEP_WATER = 'deep_water'
}

export enum EntityType {
  TREASURE = 'treasure',
  TRAP = 'trap',
  RELIC = 'relic',
  RUIN = 'ruin',
  VILLAGE = 'village',
  EXIT = 'exit'
}

export type TileVisualId =
  | 'altar'
  | 'barricade'
  | 'boar'
  | 'cactus'
  | 'cannon'
  | 'deer'
  | 'falcon'
  | 'fireTurret'
  | 'fish'
  | 'flower'
  | 'gold'
  | 'goldMine'
  | 'goblin'
  | 'harpy'
  | 'ironGate'
  | 'key'
  | 'magicGate'
  | 'magicTurret'
  | 'orc'
  | 'potion'
  | 'quest'
  | 'rabbit'
  | 'random'
  | 'roadSign'
  | 'scroll'
  | 'skeleton'
  | 'star'
  | 'stone'
  | 'stoneBridge'
  | 'stoneGate'
  | 'stump'
  | 'teleport'
  | 'troll'
  | 'turret'
  | 'turtle'
  | 'village'
  | 'waypoint'
  | 'well'
  | 'wolf'
  | 'wood'
  | 'woodBridge'
  | 'woodenGate';

export type TileVisualTone = 'ambient' | 'landmark' | 'threat' | 'resource' | 'wildlife';

export interface TileVisual {
  id: TileVisualId;
  label: string;
  tone: TileVisualTone;
}

export interface Tile {
  id: string;
  x: number;
  y: number;
  type: TileType;
  entity?: EntityType;
  entityFound?: boolean;
  visual?: TileVisual;
  visualConsumed?: boolean;
  discovered: boolean;
}

export interface Resources {
  gold: number;
  wood: number;
  stone: number;
  gems: number;
}

export interface PlayerStats {
  treasuresFound: number;
  relicsCollected: number;
  trapsTriggered: number;
  daysElapsed: number;
}

export interface GameState {
  tiles: Tile[];
  playerPos: { x: number, y: number };
  resources: Resources;
  stamina: number;
  maxStamina: number;
  stats: PlayerStats;
  isGameOver: boolean;
  skillCooldowns?: Record<string, number>;
  message?: string;
}
