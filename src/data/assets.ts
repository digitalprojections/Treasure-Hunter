import { objectAssets, findAsset } from './objectAssets';
import { resolveSpriteBoxAsset } from '../utils/spritebox';
import { characterAnimations } from './characterAnimations';
import { EntityType, TileType, TileVisualId } from '../types';

const archerHero = findAsset('heroes/archer/archer.png');
const archerHeroCutout = findAsset('heroes/archer/bg_removed__archer_.png');
const engineerHero = findAsset('heroes/engineer/engineer.png');
const engineerHeroCutout = findAsset('heroes/engineer/bg_removed__engineer.png');
const explorerHero = findAsset('heroes/explorer/explorer.png');
const explorerHeroCutout = findAsset('heroes/explorer/bg_removed__explorer_.png');
const scoutHero = findAsset('heroes/scout/scout.png');
const scoutHeroCutout = findAsset('heroes/scout/bg_removed__scout.png');
const soldierHero = findAsset('heroes/soldier/soldier.png');
const soldierHeroCutout = findAsset('heroes/soldier/bg_removed__soldier.png');

const goblinEnemy = findAsset('enemies/goblin.png');
const harpyEnemy = findAsset('enemies/harpy.png');
const orcEnemy = findAsset('enemies/orc.png');
const skeletonEnemy = findAsset('enemies/skeleton.png');
const trollEnemy = findAsset('enemies/troll.png');
const wolfEnemy = findAsset('enemies/wolf.png');

const boarWildlife = findAsset('wildlife/boar.png');
const deerWildlife = findAsset('wildlife/deer.png');
const falconWildlife = findAsset('wildlife/falcon.png');
const fishWildlife = findAsset('wildlife/fish.png');
const rabbitWildlife = findAsset('wildlife/rabbit.png');
const turtleWildlife = findAsset('wildlife/turtle.png');

const chestResource = findAsset('resources/chest.png');
const crystalResource = findAsset('resources/crystal.png');
const goldResource = findAsset('resources/gold.png');
const goldMineResource = findAsset('resources/gold_mine.png');
const stoneResource = findAsset('resources/stone.png');
const woodResource = findAsset('resources/wood.png');

const cactusTerrain = findAsset('terrain/cactus.png');
const desertTerrain = findAsset('terrain/desert.png');
const flowerTerrain = findAsset('terrain/flower.png');
const forestTerrain = findAsset('terrain/forest.png');
const mountainTerrain = findAsset('terrain/mountain.png');
const plainsTerrain = findAsset('terrain/plains.png');
const shallowWaterTerrain = findAsset('terrain/shallow_water.png');
const stumpTerrain = findAsset('terrain/stump.png');

const altarStructure = findAsset('structures/altar.png');
const portStructure = findAsset('structures/port.png');
const roadSignStructure = findAsset('structures/road_sign.png');
const ruinsStructure = findAsset('structures/ruins.png');
const teleportStructure = findAsset('structures/teleport.png');
const villageStructure = findAsset('structures/village.png');
const wellStructure = findAsset('structures/well.png');

const barricadeBarrier = findAsset('barriers/barricade.png');
const ironGateBarrier = findAsset('barriers/iron_gate.png');
const magicGateBarrier = findAsset('barriers/magic_gate.png');
const stoneBridgeBarrier = findAsset('barriers/stone_bridge.png');
const stoneGateBarrier = findAsset('barriers/stone_gate.png');
const woodBridgeBarrier = findAsset('barriers/wood_bridge.png');
const woodenGateBarrier = findAsset('barriers/wooden_gate.png');


const bombSymbol = findAsset('symbols/bomb_symbol.png');
const dangerSymbol = findAsset('symbols/danger.png');
const discoveredSymbol = findAsset('symbols/discovered_symbol.png');
const fogSymbol = findAsset('symbols/fog.png');
const keySymbol = findAsset('symbols/key_symbol.png');
const potionSymbol = findAsset('symbols/potion_symbol.png');
const questSymbol = findAsset('symbols/quest.png');
const randomSymbol = findAsset('symbols/random.png');
const scrollSymbol = findAsset('symbols/scroll_symbol.png');
const starSymbol = findAsset('symbols/star_symbol.png');
const waypointSymbol = findAsset('symbols/waypoint_symbol.png');

export const heroAssets = {
  archer: archerHero,
  engineer: engineerHero,
  explorer: explorerHero,
  mage: findAsset('heroes/mage/mage.png'),
  scout: scoutHero,
  soldier: soldierHero,
} as const;

export const heroCutoutAssets = {
  archer: archerHeroCutout,
  engineer: engineerHeroCutout,
  explorer: explorerHeroCutout,
  mage: findAsset('heroes/mage/mage.png'),
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
  bomb: bombSymbol,
  danger: dangerSymbol,
  discovered: discoveredSymbol,
  fog: fogSymbol,
  key: keySymbol,
  potion: potionSymbol,
  quest: questSymbol,
  random: randomSymbol,
  scroll: scrollSymbol,
  star: starSymbol,
  waypoint: waypointSymbol,
} as const;

export const tileTerrainAssets: Record<TileType, string> = {
  [TileType.WATER]: terrainAssets.shallowWater,
  [TileType.SAND]: terrainAssets.desert,
  [TileType.GRASS]: terrainAssets.plains,
  [TileType.FOREST]: terrainAssets.forest,
  [TileType.MOUNTAIN]: terrainAssets.mountain,
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
  key: [symbolAssets.key],
  magicGate: [barrierAssets.magicGate],
  magicTurret: defenseAssets.magicTurret.assets.map(asset => asset.src),
  orc: [enemyAssets.orc],
  potion: [symbolAssets.potion],
  quest: [symbolAssets.quest],
  rabbit: [wildlifeAssets.rabbit],
  random: [symbolAssets.random],
  roadSign: [structureAssets.roadSign],
  scroll: [symbolAssets.scroll],
  skeleton: [enemyAssets.skeleton],
  star: [symbolAssets.star],
  stone: [resourceAssets.stone],
  stoneBridge: [barrierAssets.stoneBridge],
  stoneGate: [barrierAssets.stoneGate],
  stump: [terrainAssets.stump],
  teleport: [structureAssets.teleport],
  troll: [enemyAssets.troll],
  turret: defenseAssets.turret.assets.map(asset => asset.src),
  turtle: [wildlifeAssets.turtle],
  village: [structureAssets.village],
  waypoint: [symbolAssets.waypoint],
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
