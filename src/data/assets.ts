import { objectAssets, findAsset } from './objectAssets';
import { resolveSpriteBoxAsset } from '../utils/spritebox';
import { characterAnimations } from './characterAnimations';
import { EntityType, TileType, TileVisualId } from '../types';

const archerHero = findAsset('heroes/archer');
const archerHeroCutout = findAsset('heroes/archer', true);
const engineerHero = findAsset('heroes/engineer');
const engineerHeroCutout = findAsset('heroes/engineer', true);
const explorerHero = findAsset('heroes/explorer');
const explorerHeroCutout = findAsset('heroes/explorer', true);
const scoutHero = findAsset('heroes/scout');
const scoutHeroCutout = findAsset('heroes/scout', true);
const soldierHero = findAsset('heroes/soldier');
const soldierHeroCutout = findAsset('heroes/soldier', true);

const goblinEnemy = findAsset('enemies/goblin');
const harpyEnemy = findAsset('enemies/harpy');
const orcEnemy = findAsset('enemies/orc');
const skeletonEnemy = findAsset('enemies/skeleton');
const trollEnemy = findAsset('enemies/troll');
const wolfEnemy = findAsset('enemies/wolf');

const boarWildlife = findAsset('wildlife/boar');
const deerWildlife = findAsset('wildlife/deer');
const falconWildlife = findAsset('wildlife/falcon');
const fishWildlife = findAsset('wildlife/fish');
const rabbitWildlife = findAsset('wildlife/rabbit');
const turtleWildlife = findAsset('wildlife/turtle');

const chestResource = findAsset('resources/chest');
const crystalResource = findAsset('resources/crystal');
const goldResource = findAsset('resources/gold');
const goldMineResource = findAsset('resources/gold_mine');
const stoneResource = findAsset('resources/stone');
const woodResource = findAsset('resources/wood');

const cactusTerrain = findAsset('terrain/cactus');
const desertTerrain = findAsset('terrain/desert');
const flowerTerrain = findAsset('terrain/flower');
const forestTerrain = findAsset('terrain/forest');
const mountainTerrain = findAsset('terrain/mountain');
const plainsTerrain = findAsset('terrain/plains');
const shallowWaterTerrain = findAsset('terrain/shallow_water');
const stumpTerrain = findAsset('terrain/stump');

const altarStructure = findAsset('structures/altar');
const portStructure = findAsset('structures/port');
const roadSignStructure = findAsset('structures/road_sign');
const ruinsStructure = findAsset('structures/ruins');
const teleportStructure = findAsset('structures/teleport');
const villageStructure = findAsset('structures/village');
const wellStructure = findAsset('structures/well');

const barricadeBarrier = findAsset('barriers/barricade');
const ironGateBarrier = findAsset('barriers/iron_gate');
const magicGateBarrier = findAsset('barriers/magic_gate');
const stoneBridgeBarrier = findAsset('barriers/stone_bridge');
const stoneGateBarrier = findAsset('barriers/stone_gate');
const woodBridgeBarrier = findAsset('barriers/wood_bridge');
const woodenGateBarrier = findAsset('barriers/wooden_gate');


const dangerSymbol = findAsset('symbols/danger');
const fogSymbol = findAsset('symbols/fog');
const questSymbol = findAsset('symbols/quest');
const randomSymbol = findAsset('symbols/random');

export const heroAssets = {
  archer: archerHero,
  engineer: engineerHero,
  explorer: explorerHero,
  mage: findAsset('heroes/mage'),
  scout: scoutHero,
  soldier: soldierHero,
} as const;

export const heroCutoutAssets = {
  archer: archerHeroCutout,
  engineer: engineerHeroCutout,
  explorer: explorerHeroCutout,
  mage: findAsset('heroes/mage'),
  scout: scoutHeroCutout,
  soldier: soldierHeroCutout,
} as const;

export const mageAnimationAssets = Object.fromEntries(
  Object.entries(characterAnimations.heroes?.mage ?? {}).map(([state, clip]) => [state, clip.frames.map(frame => frame.src)]),
);

export const enemyAssets = {
  goblin: goblinEnemy,
  harpy: harpyEnemy,
  orc: orcEnemy,
  skeleton: skeletonEnemy,
  troll: trollEnemy,
  wolf: wolfEnemy,
} as const;

export const wildlifeAssets = {
  boar: boarWildlife,
  deer: deerWildlife,
  falcon: falconWildlife,
  fish: fishWildlife,
  rabbit: rabbitWildlife,
  turtle: turtleWildlife,
} as const;

export const resourceAssets = {
  chest: chestResource,
  crystal: crystalResource,
  gold: goldResource,
  goldMine: goldMineResource,
  stone: stoneResource,
  wood: woodResource,
} as const;

export const terrainAssets = {
  cactus: cactusTerrain,
  desert: desertTerrain,
  flower: flowerTerrain,
  forest: forestTerrain,
  mountain: mountainTerrain,
  plains: plainsTerrain,
  shallowWater: shallowWaterTerrain,
  stump: stumpTerrain,
} as const;

export const structureAssets = {
  altar: altarStructure,
  port: portStructure,
  roadSign: roadSignStructure,
  ruins: ruinsStructure,
  teleport: teleportStructure,
  village: villageStructure,
  well: wellStructure,
} as const;

export const barrierAssets = {
  barricade: barricadeBarrier,
  ironGate: ironGateBarrier,
  magicGate: magicGateBarrier,
  stoneBridge: stoneBridgeBarrier,
  stoneGate: stoneGateBarrier,
  woodBridge: woodBridgeBarrier,
  woodenGate: woodenGateBarrier,
} as const;

export const defenseAssets = Object.fromEntries(
  Object.entries(objectAssets).filter(([key, set]) => key.startsWith('defenses/') && set.static)
    .map(([key, set]) => [key.split('/')[1].replace(/_([a-z])/g, (_, c) => c.toUpperCase()), set.static]),
);

export const symbolAssets = {
  danger: dangerSymbol,
  fog: fogSymbol,
  quest: questSymbol,
  random: randomSymbol,
} as const;

export const tileTerrainAssets: Record<TileType, string> = {
  [TileType.WATER]: terrainAssets.shallowWater,
  [TileType.SAND]: terrainAssets.desert,
  [TileType.GRASS]: terrainAssets.plains,
  [TileType.FOREST]: terrainAssets.forest,
  [TileType.MOUNTAIN]: terrainAssets.mountain,
  [TileType.HIGH_MOUNTAIN]: terrainAssets.mountain,
  [TileType.DEEP_WATER]: terrainAssets.shallowWater,
};

export const entityAssets: Partial<Record<EntityType, string>> = {
  [EntityType.TREASURE]: resourceAssets.chest,
  [EntityType.TRAP]: symbolAssets.danger,
  [EntityType.RELIC]: resourceAssets.crystal,
  [EntityType.RUIN]: structureAssets.ruins,
  [EntityType.VILLAGE]: structureAssets.village,
  [EntityType.EXIT]: structureAssets.port,
};

export const visualAssetPools: Record<TileVisualId, readonly string[]> = {
  altar: [structureAssets.altar],
  barricade: objectAssets['barriers/barricade']?.static?.assets.map(asset => asset.src) ?? [barrierAssets.barricade],
  boar: [wildlifeAssets.boar],
  cactus: [terrainAssets.cactus],
  camp: [structureAssets.village],
  cannon: defenseAssets.cannon.assets.map(asset => asset.src),
  deer: [wildlifeAssets.deer],
  falcon: [wildlifeAssets.falcon],
  fireTurret: defenseAssets.fireTurret.assets.map(asset => asset.src),
  fish: [wildlifeAssets.fish],
  flower: [terrainAssets.flower],
  gold: [resourceAssets.gold],
  goldMine: [resourceAssets.goldMine],
  goblin: [enemyAssets.goblin],
  harpy: [enemyAssets.harpy],
  ironGate: [barrierAssets.ironGate],
  magicGate: [barrierAssets.magicGate],
  magicTurret: defenseAssets.magicTurret.assets.map(asset => asset.src),
  orc: [enemyAssets.orc],
  oasis: [structureAssets.well],
  quest: [symbolAssets.quest],
  rabbit: [wildlifeAssets.rabbit],
  random: [symbolAssets.random],
  roadSign: [structureAssets.roadSign],
  skeleton: [enemyAssets.skeleton],
  stone: [resourceAssets.stone],
  stoneBridge: [barrierAssets.stoneBridge],
  stoneGate: [barrierAssets.stoneGate],
  stump: [terrainAssets.stump],
  teleport: [structureAssets.teleport],
  troll: [enemyAssets.troll],
  turret: defenseAssets.turret.assets.map(asset => asset.src),
  turtle: [wildlifeAssets.turtle],
  village: [structureAssets.village],
  well: [structureAssets.well],
  wolf: [enemyAssets.wolf],
  wood: [resourceAssets.wood],
  woodBridge: [barrierAssets.woodBridge],
  woodenGate: [barrierAssets.woodenGate],
};

export function getVisualAsset(id: TileVisualId, seed: string, level = 1) {
  if (defenseAssets[id]) return resolveSpriteBoxAsset(defenseAssets[id], seed, 0, level).src;
  const assets = visualAssetPools[id];
  let hash = 0;

  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return assets[hash % assets.length];
}

export const playerAsset = heroCutoutAssets.explorer;
