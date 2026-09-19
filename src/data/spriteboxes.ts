import { characterAnimations } from './characterAnimations';
import { getObjectSpriteBox } from './objectAssets';
import { EntityType, TileType, TileVisualId } from '../types';
import {
  CharacterSpriteBoxSet,
  createSpriteAsset,
  createStaticSpriteBox,
  SpriteBoxModule,
} from '../utils/spritebox';
import {
  barrierAssets,
  defenseAssets,
  enemyAssets,
  entityAssets,
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
  magicGate: staticBox('visual.magic_gate', 'Magic Gate', [[barrierAssets.magicGate, 'barriers/magic_gate']]),
  magicTurret: defenseAssets.magicTurret,
  orc: staticBox('visual.orc', 'Orc Camp', [[enemyAssets.orc, 'enemies/orc']]),
  quest: staticBox('visual.quest', 'Quest Marker', [[symbolAssets.quest, 'symbols/quest']]),
  rabbit: staticBox('visual.rabbit', 'Rabbit', [[wildlifeAssets.rabbit, 'wildlife/rabbit']]),
  random: staticBox('visual.random', 'Strange Marker', [[symbolAssets.random, 'symbols/random']]),
  roadSign: staticBox('visual.road_sign', 'Road Sign', [[structureAssets.roadSign, 'structures/road_sign']]),
  skeleton: staticBox('visual.skeleton', 'Skeleton Post', [[enemyAssets.skeleton, 'enemies/skeleton']]),
  stone: staticBox('visual.stone', 'Stone Deposit', [[resourceAssets.stone, 'resources/stone']]),
  stoneBridge: staticBox('visual.stone_bridge', 'Stone Bridge', [[barrierAssets.stoneBridge, 'barriers/stone_bridge']]),
  stoneGate: staticBox('visual.stone_gate', 'Stone Gate', [[barrierAssets.stoneGate, 'barriers/stone_gate']]),
  stump: staticBox('visual.stump', 'Old Stump', [[terrainAssets.stump, 'terrain/stump']]),
  teleport: staticBox('visual.teleport', 'Teleport Circle', [[structureAssets.teleport, 'structures/teleport']]),
  troll: staticBox('visual.troll', 'Troll Path', [[enemyAssets.troll, 'enemies/troll']]),
  turret: defenseAssets.turret,
  turtle: staticBox('visual.turtle', 'Turtle', [[wildlifeAssets.turtle, 'wildlife/turtle']]),
  village: staticBox('visual.village', 'Village', [[structureAssets.village, 'structures/village']]),
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

export const playerSpriteBoxes: CharacterSpriteBoxSet = Object.fromEntries(
  Object.entries({ idle: 140, walk: 120, attack: 140, scout: 140, collect: 110, hit: 150, escape: 100 }).map(([state, frameMs]) => {
    const box = getObjectSpriteBox('heroes/mage', state);
    return [state, { ...box, id: `hero.mage.${state}`, label: `Mage ${state}`,
      ...(box.kind === 'looper' ? { frameMs } : {}) }];
  }),
) as CharacterSpriteBoxSet;
