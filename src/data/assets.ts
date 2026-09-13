import { characterAnimations } from './characterAnimations';
import { EntityType, TileType, TileVisualId } from '../types';

import archerHero from '../../assets/heroes/archer/archer.png';
import archerHeroCutout from '../../assets/heroes/archer/bg_removed__archer_.png';
import engineerHero from '../../assets/heroes/engineer/engineer.png';
import engineerHeroCutout from '../../assets/heroes/engineer/bg_removed__engineer.png';
import explorerHero from '../../assets/heroes/explorer/explorer.png';
import explorerHeroCutout from '../../assets/heroes/explorer/bg_removed__explorer_.png';
import scoutHero from '../../assets/heroes/scout/scout.png';
import scoutHeroCutout from '../../assets/heroes/scout/bg_removed__scout.png';
import soldierHero from '../../assets/heroes/soldier/soldier.png';
import soldierHeroCutout from '../../assets/heroes/soldier/bg_removed__soldier.png';

import goblinEnemy from '../../assets/enemies/goblin.png';
import harpyEnemy from '../../assets/enemies/harpy.png';
import orcEnemy from '../../assets/enemies/orc.png';
import skeletonEnemy from '../../assets/enemies/skeleton.png';
import trollEnemy from '../../assets/enemies/troll.png';
import wolfEnemy from '../../assets/enemies/wolf.png';

import boarWildlife from '../../assets/wildlife/boar.png';
import deerWildlife from '../../assets/wildlife/deer.png';
import falconWildlife from '../../assets/wildlife/falcon.png';
import fishWildlife from '../../assets/wildlife/fish.png';
import rabbitWildlife from '../../assets/wildlife/rabbit.png';
import turtleWildlife from '../../assets/wildlife/turtle.png';

import chestResource from '../../assets/resources/chest.png';
import crystalResource from '../../assets/resources/crystal.png';
import goldResource from '../../assets/resources/gold.png';
import goldMineResource from '../../assets/resources/gold_mine.png';
import stoneResource from '../../assets/resources/stone.png';
import woodResource from '../../assets/resources/wood.png';

import cactusTerrain from '../../assets/terrain/cactus.png';
import desertTerrain from '../../assets/terrain/desert.png';
import flowerTerrain from '../../assets/terrain/flower.png';
import forestTerrain from '../../assets/terrain/forest.png';
import mountainTerrain from '../../assets/terrain/mountain.png';
import plainsTerrain from '../../assets/terrain/plains.png';
import shallowWaterTerrain from '../../assets/terrain/shallow_water.png';
import stumpTerrain from '../../assets/terrain/stump.png';

import altarStructure from '../../assets/structures/altar.png';
import portStructure from '../../assets/structures/port.png';
import roadSignStructure from '../../assets/structures/road_sign.png';
import ruinsStructure from '../../assets/structures/ruins.png';
import teleportStructure from '../../assets/structures/teleport.png';
import villageStructure from '../../assets/structures/village.png';
import wellStructure from '../../assets/structures/well.png';

import barricadeBarrier from '../../assets/barriers/barricade.png';
import barricade1Barrier from '../../assets/barriers/barricade1.png';
import barricade2Barrier from '../../assets/barriers/barricade2.png';
import barricade3Barrier from '../../assets/barriers/barricade3.png';
import barricade4Barrier from '../../assets/barriers/barricade4.png';
import barricade5Barrier from '../../assets/barriers/barricade5.png';
import ironGateBarrier from '../../assets/barriers/iron_gate.png';
import magicGateBarrier from '../../assets/barriers/magic_gate.png';
import stoneBridgeBarrier from '../../assets/barriers/stone_bridge.png';
import stoneGateBarrier from '../../assets/barriers/stone_gate.png';
import woodBridgeBarrier from '../../assets/barriers/wood_bridge.png';
import woodenGateBarrier from '../../assets/barriers/wooden_gate.png';

import cannon1Defense from '../../assets/defenses/cannon1.png';
import cannon2Defense from '../../assets/defenses/cannon2.png';
import cannon3Defense from '../../assets/defenses/cannon3.png';
import cannon4Defense from '../../assets/defenses/cannon4.png';
import fireTurret1Defense from '../../assets/defenses/fire_turret1.png';
import fireTurret2Defense from '../../assets/defenses/fire_turret2.png';
import fireTurret3Defense from '../../assets/defenses/fire_turret3.png';
import fireTurret4Defense from '../../assets/defenses/fire_turret4.png';
import magicTurret1Defense from '../../assets/defenses/magic_turret1.png';
import magicTurret2Defense from '../../assets/defenses/magic_turret2.png';
import magicTurret3Defense from '../../assets/defenses/magic_turret3.png';
import magicTurret4Defense from '../../assets/defenses/magic_turret4.png';
import turret1Defense from '../../assets/defenses/turret1.png';
import turret2Defense from '../../assets/defenses/turret2.png';
import turret3Defense from '../../assets/defenses/turret3.png';
import turret4Defense from '../../assets/defenses/turret4.png';

import bombSymbol from '../../assets/symbols/bomb_symbol.png';
import dangerSymbol from '../../assets/symbols/danger.png';
import discoveredSymbol from '../../assets/symbols/discovered_symbol.png';
import fogSymbol from '../../assets/symbols/fog.png';
import keySymbol from '../../assets/symbols/key_symbol.png';
import potionSymbol from '../../assets/symbols/potion_symbol.png';
import questSymbol from '../../assets/symbols/quest.png';
import randomSymbol from '../../assets/symbols/random.png';
import scrollSymbol from '../../assets/symbols/scroll_symbol.png';
import starSymbol from '../../assets/symbols/star_symbol.png';
import waypointSymbol from '../../assets/symbols/waypoint_symbol.png';

export const heroAssets = {
  archer: archerHero,
  engineer: engineerHero,
  explorer: explorerHero,
  mage: characterAnimations.heroes.mage.walk.frames[0].src,
  scout: scoutHero,
  soldier: soldierHero,
} as const;

export const heroCutoutAssets = {
  archer: archerHeroCutout,
  engineer: engineerHeroCutout,
  explorer: explorerHeroCutout,
  mage: characterAnimations.heroes.mage.walk.frames[0].src,
  scout: scoutHeroCutout,
  soldier: soldierHeroCutout,
} as const;

export const mageAnimationAssets = Object.fromEntries(
  Object.entries(characterAnimations.heroes.mage).map(([state, clip]) => [state, clip.frames.map(frame => frame.src)]),
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
  barricade1: barricade1Barrier,
  barricade2: barricade2Barrier,
  barricade3: barricade3Barrier,
  barricade4: barricade4Barrier,
  barricade5: barricade5Barrier,
  ironGate: ironGateBarrier,
  magicGate: magicGateBarrier,
  stoneBridge: stoneBridgeBarrier,
  stoneGate: stoneGateBarrier,
  woodBridge: woodBridgeBarrier,
  woodenGate: woodenGateBarrier,
} as const;

export const defenseAssets = {
  cannon1: cannon1Defense,
  cannon2: cannon2Defense,
  cannon3: cannon3Defense,
  cannon4: cannon4Defense,
  fireTurret1: fireTurret1Defense,
  fireTurret2: fireTurret2Defense,
  fireTurret3: fireTurret3Defense,
  fireTurret4: fireTurret4Defense,
  magicTurret1: magicTurret1Defense,
  magicTurret2: magicTurret2Defense,
  magicTurret3: magicTurret3Defense,
  magicTurret4: magicTurret4Defense,
  turret1: turret1Defense,
  turret2: turret2Defense,
  turret3: turret3Defense,
  turret4: turret4Defense,
} as const;

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
  barricade: [
    barrierAssets.barricade,
    barrierAssets.barricade1,
    barrierAssets.barricade2,
    barrierAssets.barricade3,
    barrierAssets.barricade4,
    barrierAssets.barricade5,
  ],
  boar: [wildlifeAssets.boar],
  cactus: [terrainAssets.cactus],
  cannon: [defenseAssets.cannon1, defenseAssets.cannon2, defenseAssets.cannon3, defenseAssets.cannon4],
  deer: [wildlifeAssets.deer],
  falcon: [wildlifeAssets.falcon],
  fireTurret: [defenseAssets.fireTurret1, defenseAssets.fireTurret2, defenseAssets.fireTurret3, defenseAssets.fireTurret4],
  fish: [wildlifeAssets.fish],
  flower: [terrainAssets.flower],
  gold: [resourceAssets.gold],
  goldMine: [resourceAssets.goldMine],
  goblin: [enemyAssets.goblin],
  harpy: [enemyAssets.harpy],
  ironGate: [barrierAssets.ironGate],
  key: [symbolAssets.key],
  magicGate: [barrierAssets.magicGate],
  magicTurret: [defenseAssets.magicTurret1, defenseAssets.magicTurret2, defenseAssets.magicTurret3, defenseAssets.magicTurret4],
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
  turret: [defenseAssets.turret1, defenseAssets.turret2, defenseAssets.turret3, defenseAssets.turret4],
  turtle: [wildlifeAssets.turtle],
  village: [structureAssets.village],
  waypoint: [symbolAssets.waypoint],
  well: [structureAssets.well],
  wolf: [enemyAssets.wolf],
  wood: [resourceAssets.wood],
  woodBridge: [barrierAssets.woodBridge],
  woodenGate: [barrierAssets.woodenGate],
};

export function getVisualAsset(id: TileVisualId, seed: string) {
  const assets = visualAssetPools[id];
  let hash = 0;

  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return assets[hash % assets.length];
}

export const playerAsset = heroCutoutAssets.explorer;
