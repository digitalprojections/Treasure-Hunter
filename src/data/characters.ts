import { CharacterDefinition } from '../utils/characterSkills';
import { playerSpriteBoxes } from './spriteboxes';

export const mageCharacter: CharacterDefinition = {
  id: 'mage',
  label: 'Mage',
  role: 'Arcane scout',
  spriteBoxes: playerSpriteBoxes,
  skills: [
    {
      id: 'scout_area',
      label: 'Scout',
      description: 'Reveal nearby terrain.',
      animation: 'scout',
      target: 'area',
      range: 2,
      cooldownTurns: 1,
      cost: { gold: 50 },
    },
    {
      id: 'relic_survey',
      label: 'Survey',
      description: 'Reveal one unrecovered relic.',
      animation: 'scout',
      target: 'area',
      range: 12,
      cooldownTurns: 2,
      cost: { gold: 100 },
    },
    {
      id: 'trap_ward',
      label: 'Ward',
      description: 'Reveal nearby trapped caches.',
      animation: 'hit',
      target: 'area',
      range: 2,
      cooldownTurns: 2,
      cost: { gold: 35, stamina: 1 },
    },
    {
      id: 'archive_clue',
      label: 'Archives',
      description: 'Request an island clue.',
      animation: 'scout',
      target: 'self',
      range: 0,
      cooldownTurns: 1,
      cost: { gold: 25 },
    },
  ],
};

export const playableCharacters = [mageCharacter] as const;
export const activeCharacter = mageCharacter;
