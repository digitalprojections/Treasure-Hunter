import type { MusicEvent } from './audio';

export function musicCueForOutcome(result: { animation: string; achievement?: string }): MusicEvent | undefined {
  if (result.achievement === 'island_escape') return 'victory';
  if (result.achievement === 'relic_collected') return 'relic';
  if (result.achievement === 'treasure_found') return 'discovery';
  if (result.animation === 'attack') return 'combat';
  if (result.animation === 'hit') return 'setback';
}

// Each island owns one track, including full-track fallback when section clips are absent.
export function musicTracksForIsland(tracks: readonly string[], islandNumber: number): string[] {
  if (!tracks.length) return [];
  const index = Number.isFinite(islandNumber) ? Math.max(0, Math.floor(islandNumber) - 1) : 0;
  return [tracks[index % tracks.length]];
}
