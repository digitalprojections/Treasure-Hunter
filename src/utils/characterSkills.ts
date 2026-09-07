import { GameState, Resources } from '../types';
import { CharacterAnimationState, CharacterSpriteBoxSet } from './spritebox';

export type CharacterSkillTarget = 'self' | 'tile' | 'enemy' | 'area';

export type CharacterSkillId =
  | 'scout_area'
  | 'relic_survey'
  | 'archive_clue'
  | 'trap_ward';

export type SkillCost = Partial<Pick<Resources, 'gold' | 'wood' | 'stone' | 'gems'> & { stamina: number }>;

export interface CharacterSkill {
  id: CharacterSkillId;
  label: string;
  description: string;
  animation: CharacterAnimationState;
  target: CharacterSkillTarget;
  range: number;
  cooldownTurns: number;
  cost: SkillCost;
}

export interface CharacterDefinition {
  id: string;
  label: string;
  role: string;
  spriteBoxes: CharacterSpriteBoxSet;
  skills: readonly CharacterSkill[];
}

export interface SkillAvailability {
  canUse: boolean;
  reason?: string;
}

const RESOURCE_LABELS: Record<keyof SkillCost, string> = {
  gold: 'gold',
  wood: 'wood',
  stone: 'stone',
  gems: 'gems',
  stamina: 'stamina',
};

function getAvailableAmount(gameState: GameState, resource: keyof SkillCost) {
  return resource === 'stamina' ? gameState.stamina : gameState.resources[resource];
}

export function getSkillCostLabel(cost: SkillCost) {
  const parts = (Object.keys(RESOURCE_LABELS) as (keyof SkillCost)[])
    .filter((resource) => (cost[resource] ?? 0) > 0)
    .map((resource) => `${cost[resource]} ${RESOURCE_LABELS[resource]}`);

  return parts.length > 0 ? parts.join(' / ') : 'Free';
}

export function canUseCharacterSkill(skill: CharacterSkill, gameState: GameState): SkillAvailability {
  const cooldown = gameState.skillCooldowns?.[skill.id] ?? 0;
  if (cooldown > 0) {
    return { canUse: false, reason: `Ready in ${cooldown} day${cooldown === 1 ? '' : 's'}.` };
  }

  for (const resource of Object.keys(RESOURCE_LABELS) as (keyof SkillCost)[]) {
    const required = skill.cost[resource] ?? 0;
    if (required > getAvailableAmount(gameState, resource)) {
      return { canUse: false, reason: `Need ${required} ${RESOURCE_LABELS[resource]}.` };
    }
  }

  return { canUse: true };
}

export function spendSkillCost(gameState: GameState, skill: CharacterSkill): GameState {
  return {
    ...gameState,
    resources: {
      ...gameState.resources,
      gold: gameState.resources.gold - (skill.cost.gold ?? 0),
      wood: gameState.resources.wood - (skill.cost.wood ?? 0),
      stone: gameState.resources.stone - (skill.cost.stone ?? 0),
      gems: gameState.resources.gems - (skill.cost.gems ?? 0),
    },
    stamina: gameState.stamina - (skill.cost.stamina ?? 0),
  };
}

export function startSkillCooldown(
  cooldowns: GameState['skillCooldowns'] = {},
  skill: CharacterSkill,
): NonNullable<GameState['skillCooldowns']> {
  if (skill.cooldownTurns <= 0) return { ...cooldowns };

  return {
    ...cooldowns,
    [skill.id]: skill.cooldownTurns,
  };
}

export function tickSkillCooldowns(cooldowns: GameState['skillCooldowns'] = {}): NonNullable<GameState['skillCooldowns']> {
  return Object.fromEntries(
    Object.entries(cooldowns)
      .map(([skillId, turns]) => [skillId, Math.max(0, turns - 1)] as const)
      .filter(([, turns]) => turns > 0),
  );
}
