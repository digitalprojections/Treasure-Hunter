import { EntityType, TileType, TileVisualId } from '../types';
import {
  CharacterSpriteBoxSet,
  createLooperSpriteBox,
  createSpriteAsset,
  createStaticSpriteBox,
  SpriteBoxModule,
} from '../utils/spritebox';
import {
  barrierAssets,
  defenseAssets,
  enemyAssets,
  entityAssets,
  heroCutoutAssets,
  mageAnimationAssets,
  resourceAssets,
  structureAssets,
  symbolAssets,
  terrainAssets,
  tileTerrainAssets,
  wildlifeAssets,
} from './assets';

function asset(src: string, name: string) {
  return createSpriteAsset(src, name);
}

function staticBox(id: string, label: string, entries: readonly [readonly [string, string], ...readonly [string, string][]]) {
  return createStaticSpriteBox(
    id,
    label,
    entries.map(([src, name]) => asset(src, name)) as [ReturnType<typeof asset>, ...ReturnType<typeof asset>[]],
  );
}

function looperBox(id: string, label: string, entries: readonly [readonly [string, string], ...readonly [string, string][]], frameMs = 300) {
  return createLooperSpriteBox(
    id,
    label,
    entries.map(([src, name]) => asset(src, name)) as [ReturnType<typeof asset>, ...ReturnType<typeof asset>[]],
    frameMs,
  );
}

export const tileTerrainSpriteBoxes: Record<TileType, SpriteBoxModule> = {
  [TileType.WATER]: staticBox('terrain.shallow_water', 'Water', [[tileTerrainAssets[TileType.WATER], 'terrain/shallow_water']]),
  [TileType.SAND]: staticBox('terrain.desert', 'Sand', [[tileTerrainAssets[TileType.SAND], 'terrain/desert']]),
  [TileType.GRASS]: staticBox('terrain.plains', 'Grass', [[tileTerrainAssets[TileType.GRASS], 'terrain/plains']]),
  [TileType.FOREST]: staticBox('terrain.forest', 'Forest', [[tileTerrainAssets[TileType.FOREST], 'terrain/forest']]),
  [TileType.MOUNTAIN]: staticBox('terrain.mountain', 'Mountain', [[tileTerrainAssets[TileType.MOUNTAIN], 'terrain/mountain']]),
  [TileType.DEEP_WATER]: staticBox('terrain.deep_water', 'Deep Water', [[tileTerrainAssets[TileType.DEEP_WATER], 'terrain/shallow_water']]),
};

export const entitySpriteBoxes: Partial<Record<EntityType, SpriteBoxModule>> = {
  [EntityType.TREASURE]: staticBox('entity.treasure', 'Treasure', [[entityAssets[EntityType.TREASURE]!, 'resources/chest']]),
  [EntityType.TRAP]: staticBox('entity.trap', 'Trap', [[entityAssets[EntityType.TRAP]!, 'symbols/danger']]),
  [EntityType.RELIC]: staticBox('entity.relic', 'Relic', [[entityAssets[EntityType.RELIC]!, 'resources/crystal']]),
  [EntityType.RUIN]: staticBox('entity.ruin', 'Ruin', [[entityAssets[EntityType.RUIN]!, 'structures/ruins']]),
  [EntityType.VILLAGE]: staticBox('entity.village', 'Village', [[entityAssets[EntityType.VILLAGE]!, 'structures/village']]),
  [EntityType.EXIT]: staticBox('entity.exit', 'Exit Port', [[entityAssets[EntityType.EXIT]!, 'structures/port']]),
};

export const visualSpriteBoxes: Record<TileVisualId, SpriteBoxModule> = {
  altar: staticBox('visual.altar', 'Altar', [[structureAssets.altar, 'structures/altar']]),
  barricade: staticBox('visual.barricade', 'Barricade', [
    [barrierAssets.barricade, 'barriers/barricade'],
    [barrierAssets.barricade1, 'barriers/barricade_001'],
    [barrierAssets.barricade2, 'barriers/barricade_002'],
    [barrierAssets.barricade3, 'barriers/barricade_003'],
    [barrierAssets.barricade4, 'barriers/barricade_004'],
    [barrierAssets.barricade5, 'barriers/barricade_005'],
  ]),
  boar: staticBox('visual.boar', 'Boar', [[wildlifeAssets.boar, 'wildlife/boar']]),
  cactus: staticBox('visual.cactus', 'Cactus', [[terrainAssets.cactus, 'terrain/cactus']]),
  cannon: looperBox('visual.cannon', 'Cannon', [
    [defenseAssets.cannon1, 'defenses/cannon_001'],
    [defenseAssets.cannon2, 'defenses/cannon_002'],
    [defenseAssets.cannon3, 'defenses/cannon_003'],
    [defenseAssets.cannon4, 'defenses/cannon_004'],
  ]),
  deer: staticBox('visual.deer', 'Deer', [[wildlifeAssets.deer, 'wildlife/deer']]),
  falcon: staticBox('visual.falcon', 'Falcon', [[wildlifeAssets.falcon, 'wildlife/falcon']]),
  fireTurret: looperBox('visual.fire_turret', 'Fire Turret', [
    [defenseAssets.fireTurret1, 'defenses/fire_turret_001'],
    [defenseAssets.fireTurret2, 'defenses/fire_turret_002'],
    [defenseAssets.fireTurret3, 'defenses/fire_turret_003'],
    [defenseAssets.fireTurret4, 'defenses/fire_turret_004'],
  ], 220),
  fish: staticBox('visual.fish', 'Fish', [[wildlifeAssets.fish, 'wildlife/fish']]),
  flower: staticBox('visual.flower', 'Flowers', [[terrainAssets.flower, 'terrain/flower']]),
  gold: staticBox('visual.gold', 'Gold Cache', [[resourceAssets.gold, 'resources/gold']]),
  goldMine: staticBox('visual.gold_mine', 'Gold Mine', [[resourceAssets.goldMine, 'resources/gold_mine']]),
  goblin: staticBox('visual.goblin', 'Goblin Camp', [[enemyAssets.goblin, 'enemies/goblin']]),
  harpy: staticBox('visual.harpy', 'Harpy Roost', [[enemyAssets.harpy, 'enemies/harpy']]),
  ironGate: staticBox('visual.iron_gate', 'Iron Gate', [[barrierAssets.ironGate, 'barriers/iron_gate']]),
  key: staticBox('visual.key', 'Key Marker', [[symbolAssets.key, 'symbols/key_symbol']]),
  magicGate: staticBox('visual.magic_gate', 'Magic Gate', [[barrierAssets.magicGate, 'barriers/magic_gate']]),
  magicTurret: looperBox('visual.magic_turret', 'Magic Turret', [
    [defenseAssets.magicTurret1, 'defenses/magic_turret_001'],
    [defenseAssets.magicTurret2, 'defenses/magic_turret_002'],
    [defenseAssets.magicTurret3, 'defenses/magic_turret_003'],
    [defenseAssets.magicTurret4, 'defenses/magic_turret_004'],
  ], 240),
  orc: staticBox('visual.orc', 'Orc Camp', [[enemyAssets.orc, 'enemies/orc']]),
  potion: staticBox('visual.potion', 'Potion Sign', [[symbolAssets.potion, 'symbols/potion_symbol']]),
  quest: staticBox('visual.quest', 'Quest Marker', [[symbolAssets.quest, 'symbols/quest']]),
  rabbit: staticBox('visual.rabbit', 'Rabbit', [[wildlifeAssets.rabbit, 'wildlife/rabbit']]),
  random: staticBox('visual.random', 'Strange Marker', [[symbolAssets.random, 'symbols/random']]),
  roadSign: staticBox('visual.road_sign', 'Road Sign', [[structureAssets.roadSign, 'structures/road_sign']]),
  scroll: staticBox('visual.scroll', 'Scroll Marker', [[symbolAssets.scroll, 'symbols/scroll_symbol']]),
  skeleton: staticBox('visual.skeleton', 'Skeleton Post', [[enemyAssets.skeleton, 'enemies/skeleton']]),
  star: staticBox('visual.star', 'Star Shrine', [[symbolAssets.star, 'symbols/star_symbol']]),
  stone: staticBox('visual.stone', 'Stone Deposit', [[resourceAssets.stone, 'resources/stone']]),
  stoneBridge: staticBox('visual.stone_bridge', 'Stone Bridge', [[barrierAssets.stoneBridge, 'barriers/stone_bridge']]),
  stoneGate: staticBox('visual.stone_gate', 'Stone Gate', [[barrierAssets.stoneGate, 'barriers/stone_gate']]),
  stump: staticBox('visual.stump', 'Old Stump', [[terrainAssets.stump, 'terrain/stump']]),
  teleport: staticBox('visual.teleport', 'Teleport Circle', [[structureAssets.teleport, 'structures/teleport']]),
  troll: staticBox('visual.troll', 'Troll Path', [[enemyAssets.troll, 'enemies/troll']]),
  turret: looperBox('visual.turret', 'Turret', [
    [defenseAssets.turret1, 'defenses/turret_001'],
    [defenseAssets.turret2, 'defenses/turret_002'],
    [defenseAssets.turret3, 'defenses/turret_003'],
    [defenseAssets.turret4, 'defenses/turret_004'],
  ]),
  turtle: staticBox('visual.turtle', 'Turtle', [[wildlifeAssets.turtle, 'wildlife/turtle']]),
  village: staticBox('visual.village', 'Village', [[structureAssets.village, 'structures/village']]),
  waypoint: staticBox('visual.waypoint', 'Waypoint', [[symbolAssets.waypoint, 'symbols/waypoint_symbol']]),
  well: staticBox('visual.well', 'Well', [[structureAssets.well, 'structures/well']]),
  wolf: staticBox('visual.wolf', 'Wolf Den', [[enemyAssets.wolf, 'enemies/wolf']]),
  wood: staticBox('visual.wood', 'Wood Pile', [[resourceAssets.wood, 'resources/wood']]),
  woodBridge: staticBox('visual.wood_bridge', 'Wood Bridge', [[barrierAssets.woodBridge, 'barriers/wood_bridge']]),
  woodenGate: staticBox('visual.wooden_gate', 'Wooden Gate', [[barrierAssets.woodenGate, 'barriers/wooden_gate']]),
};

export const symbolSpriteBoxes = {
  fog: staticBox('symbol.fog', 'Fog', [[symbolAssets.fog, 'symbols/fog']]),
} as const;

export const playerSpriteBoxes: CharacterSpriteBoxSet = {
  idle: staticBox('hero.mage.idle', 'Mage idle', [[heroCutoutAssets.mage, 'heroes/mage/idle_001']]),
  walk: looperBox('hero.mage.walk', 'Mage walking', [
    [mageAnimationAssets[0], 'heroes/mage/walk_001'],
    [mageAnimationAssets[1], 'heroes/mage/walk_002'],
    [mageAnimationAssets[2], 'heroes/mage/walk_003'],
    [mageAnimationAssets[3], 'heroes/mage/walk_004'],
    [mageAnimationAssets[4], 'heroes/mage/walk_005'],
    [mageAnimationAssets[5], 'heroes/mage/walk_006'],
    [mageAnimationAssets[6], 'heroes/mage/walk_007'],
  ], 120),
  scout: looperBox('hero.mage.scout', 'Mage scouting', [
    [mageAnimationAssets[0], 'heroes/mage/scout_001'],
    [mageAnimationAssets[1], 'heroes/mage/scout_002'],
    [mageAnimationAssets[2], 'heroes/mage/scout_003'],
    [mageAnimationAssets[3], 'heroes/mage/scout_004'],
    [mageAnimationAssets[4], 'heroes/mage/scout_005'],
    [mageAnimationAssets[5], 'heroes/mage/scout_006'],
    [mageAnimationAssets[6], 'heroes/mage/scout_007'],
  ], 140),
  collect: looperBox('hero.mage.collect', 'Mage collecting', [
    [mageAnimationAssets[0], 'heroes/mage/collect_001'],
    [mageAnimationAssets[1], 'heroes/mage/collect_002'],
    [mageAnimationAssets[2], 'heroes/mage/collect_003'],
    [mageAnimationAssets[3], 'heroes/mage/collect_004'],
    [mageAnimationAssets[4], 'heroes/mage/collect_005'],
    [mageAnimationAssets[5], 'heroes/mage/collect_006'],
    [mageAnimationAssets[6], 'heroes/mage/collect_007'],
  ], 110),
  hit: staticBox('hero.mage.hit', 'Mage hit', [[mageAnimationAssets[3], 'heroes/mage/hit_001']]),
  escape: looperBox('hero.mage.escape', 'Mage escaping', [
    [mageAnimationAssets[0], 'heroes/mage/escape_001'],
    [mageAnimationAssets[1], 'heroes/mage/escape_002'],
    [mageAnimationAssets[2], 'heroes/mage/escape_003'],
    [mageAnimationAssets[3], 'heroes/mage/escape_004'],
    [mageAnimationAssets[4], 'heroes/mage/escape_005'],
    [mageAnimationAssets[5], 'heroes/mage/escape_006'],
    [mageAnimationAssets[6], 'heroes/mage/escape_007'],
  ], 120),
};
