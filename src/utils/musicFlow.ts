import type { MusicEvent } from './audio';

export function musicCueForOutcome(result: { animation: string; achievement?: string }): MusicEvent | undefined {
  if (result.achievement === 'island_escape') return 'victory';
  if (result.achievement === 'relic_collected') return 'relic';
  if (result.achievement === 'treasure_found') return 'discovery';
  if (result.animation === 'attack') return 'combat';
  if (result.animation === 'hit') return 'setback';
}
