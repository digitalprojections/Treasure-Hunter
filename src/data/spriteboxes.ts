import { characterAnimations } from './characterAnimations';
import { getObjectSpriteBox } from './objectAssets';
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

function animationEntries(frames: readonly string[], pathPrefix: string) {
  return (frames?.length ? frames : [heroCutoutAssets.mage]).map((frame, index) => [frame, `${pathPrefix}_${String(index + 1).padStart(3, '0')}`] as const) as [
    readonly [string, string],
    ...readonly [string, string][],
  ];
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
  barricade: { ...getObjectSpriteBox('barriers/barricade'), id: 'visual.barricade', label: 'Barricade' },
  boar: staticBox('visual.boar', 'Boar', [[wildlifeAssets.boar, 'wildlife/boar']]),
  cactus: staticBox('visual.cactus', 'Cactus', [[terrainAssets.cactus, 'terrain/cactus']]),
  cannon: defenseAssets.cannon,
  deer: staticBox('visual.deer', 'Deer', [[wildlifeAssets.deer, 'wildlife/deer']]),
  falcon: staticBox('visual.falcon', 'Falcon', [[wildlifeAssets.falcon, 'wildlife/falcon']]),
  fireTurret: defenseAssets.fireTurret,
  fish: staticBox('visual.fish', 'Fish', [[wildlifeAssets.fish, 'wildlife/fish']]),
  flower: staticBox('visual.flower', 'Flowers', [[terrainAssets.flower, 'terrain/flower']]),
  gold: staticBox('visual.gold', 'Gold Cache', [[resourceAssets.gold, 'resources/gold']]),
  goldMine: staticBox('visual.gold_mine', 'Gold Mine', [[resourceAssets.goldMine, 'resources/gold_mine']]),
  goblin: staticBox('visual.goblin', 'Goblin Camp', [[enemyAssets.goblin, 'enemies/goblin']]),
  harpy: staticBox('visual.harpy', 'Harpy Roost', [[enemyAssets.harpy, 'enemies/harpy']]),
  ironGate: staticBox('visual.iron_gate', 'Iron Gate', [[barrierAssets.ironGate, 'barriers/iron_gate']]),
  key: staticBox('visual.key', 'Key Marker', [[symbolAssets.key, 'symbols/key_symbol']]),
  magicGate: staticBox('visual.magic_gate', 'Magic Gate', [[barrierAssets.magicGate, 'barriers/magic_gate']]),
  magicTurret: defenseAssets.magicTurret,
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
  turret: defenseAssets.turret,
  turtle: staticBox('visual.turtle', 'Turtle', [[wildlifeAssets.turtle, 'wildlife/turtle']]),
  village: staticBox('visual.village', 'Village', [[structureAssets.village, 'structures/village']]),
  waypoint: staticBox('visual.waypoint', 'Waypoint', [[symbolAssets.waypoint, 'symbols/waypoint_symbol']]),
  well: staticBox('visual.well', 'Well', [[structureAssets.well, 'structures/well']]),
  wolf: staticBox('visual.wolf', 'Wolf Den', [[enemyAssets.wolf, 'enemies/wolf']]),
  wood: staticBox('visual.wood', 'Wood Pile', [[resourceAssets.wood, 'resources/wood']]),
  woodBridge: staticBox('visual.wood_bridge', 'Wood Bridge', [[barrierAssets.woodBridge, 'barriers/wood_bridge']]),
  woodenGate: staticBox('visual.wooden_gate', 'Wooden Gate', [[barrierAssets.woodenGate, 'barriers/wooden_gate']]),
};

// Existing map characters automatically use their discovered idle animation.
for (const domain of ['enemies', 'wildlife']) {
  for (const [name, states] of Object.entries(characterAnimations[domain] ?? {})) {
    if (states.idle && Object.hasOwn(visualSpriteBoxes, name)) {
      visualSpriteBoxes[name as TileVisualId] = { ...states.idle, id: `visual.${name}`, label: visualSpriteBoxes[name as TileVisualId].label };
    }
  }
}

export const symbolSpriteBoxes = {
  fog: staticBox('symbol.fog', 'Fog', [[symbolAssets.fog, 'symbols/fog']]),
} as const;

export const playerSpriteBoxes: CharacterSpriteBoxSet = {
  idle: staticBox('hero.mage.idle', 'Mage idle', [[heroCutoutAssets.mage, 'heroes/mage/idle_001']]),
  walk: looperBox('hero.mage.walk', 'Mage walking', animationEntries(mageAnimationAssets.walk, 'heroes/mage/walk'), 120),
  scout: looperBox('hero.mage.scout', 'Mage scouting', animationEntries(mageAnimationAssets.scout, 'heroes/mage/scout'), 140),
  collect: looperBox('hero.mage.collect', 'Mage collecting', animationEntries(mageAnimationAssets.collect, 'heroes/mage/collect'), 110),
  hit: looperBox('hero.mage.hit', 'Mage hit', animationEntries(mageAnimationAssets.hit, 'heroes/mage/hit'), 150),
  escape: looperBox('hero.mage.escape', 'Mage escaping', animationEntries(mageAnimationAssets.walk, 'heroes/mage/escape'), 100),
};

// Folder states override configured defaults while retaining gameplay timing and IDs.
for (const [state, clip] of Object.entries(characterAnimations.heroes?.mage ?? {})) {
  if (Object.hasOwn(playerSpriteBoxes, state)) {
    const key = state as keyof CharacterSpriteBoxSet;
    const previous = playerSpriteBoxes[key];
    playerSpriteBoxes[key] = { ...clip, id: previous.id, label: previous.label,
      frameMs: previous.kind === 'looper' ? previous.frameMs : clip.frameMs };
  }
}
