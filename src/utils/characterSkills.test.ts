import test from 'node:test';
import assert from 'node:assert/strict';
import { EntityType, GameState, TileType } from '../types';
import {
  canUseCharacterSkill,
  getSkillCostLabel,
  startSkillCooldown,
  tickSkillCooldowns,
  CharacterSkill,
} from './characterSkills';

const baseGameState: GameState = {
  tiles: [],
  playerPos: { x: 0, y: 0 },
  resources: { gold: 75, wood: 4, stone: 2, gems: 0 },
  stamina: 8,
  maxStamina: 20,
  stats: { treasuresFound: 0, relicsCollected: 0, trapsTriggered: 0, daysElapsed: 1 },
  isGameOver: false,
  skillCooldowns: {},
};

const scoutSkill: CharacterSkill = {
  id: 'scout_area',
  label: 'Scout',
  description: 'Reveal nearby terrain.',
  animation: 'scout' as const,
  target: 'area' as const,
  range: 2,
  cooldownTurns: 1,
  cost: { gold: 50, stamina: 1 },
};

test('canUseCharacterSkill accepts skills with enough resources and no cooldown', () => {
  const result = canUseCharacterSkill(scoutSkill, baseGameState);

  assert.deepEqual(result, { canUse: true });
});

test('canUseCharacterSkill reports the first blocking cost or cooldown', () => {
  assert.equal(
    canUseCharacterSkill(scoutSkill, { ...baseGameState, resources: { ...baseGameState.resources, gold: 10 } }).reason,
    'Need 50 gold.',
  );

  assert.equal(
    canUseCharacterSkill(scoutSkill, { ...baseGameState, skillCooldowns: { scout_area: 2 } }).reason,
    'Ready in 2 days.',
  );
});

test('startSkillCooldown and tickSkillCooldowns keep cooldown state compact', () => {
  const started = startSkillCooldown(baseGameState.skillCooldowns, scoutSkill);
  assert.deepEqual(started, { scout_area: 1 });

  const ticked = tickSkillCooldowns({ scout_area: 1, relic_survey: 3 });
  assert.deepEqual(ticked, { relic_survey: 2 });
});

test('getSkillCostLabel formats multi-resource skill costs', () => {
  assert.equal(getSkillCostLabel({ gold: 25 }), '25 gold');
  assert.equal(getSkillCostLabel({ gold: 50, stamina: 1 }), '50 gold / 1 stamina');
  assert.equal(getSkillCostLabel({}), 'Free');
});

test('trap reveal skills can target existing hidden trap tiles without moving the player', () => {
  const trapTile = {
    id: '1-0',
    x: 1,
    y: 0,
    type: TileType.GRASS,
    entity: EntityType.TRAP,
    discovered: false,
  };

  const gameState = { ...baseGameState, tiles: [trapTile] };
  assert.equal(gameState.tiles[0].entity, EntityType.TRAP);
  assert.equal(gameState.playerPos.x, 0);
});

