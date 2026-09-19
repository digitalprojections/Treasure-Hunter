import type { MusicEvent } from './audio';

export function musicCueForOutcome(result: { animation: string; achievement?: string }): MusicEvent | undefined {
  if (result.achievement === 'island_escape') return 'victory';
  if (result.achievement === 'relic_collected') return 'relic';
  if (result.achievement === 'treasure_found') return 'discovery';
  if (result.animation === 'attack') return 'combat';
  if (result.animation === 'hit') return 'setback';
}

// Each island owns one track, including full-track fallback when section clips are absent.
export function musicTracksForIsland(tracks: readonly string[], islandNumber: number, startingRoll = 0): string[] {
  if (!tracks.length) return [];
  const index = Number.isFinite(islandNumber) ? Math.max(0, Math.floor(islandNumber) - 1) : 0;
  const roll = Number.isFinite(startingRoll) ? Math.max(0, Math.min(1, startingRoll)) : 0;
  const offset = Math.min(tracks.length - 1, Math.floor(roll * tracks.length));
  return [tracks[(offset + index) % tracks.length]];
}
