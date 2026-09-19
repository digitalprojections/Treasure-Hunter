import type { RewardEffectKind } from './rewardFeedback';
import type { Tile } from '../types';

export type TileRevealKind = 'regular' | 'special';
export type TileEffectKind = TileRevealKind | RewardEffectKind;
export type TileRevealEffect = { revision: number; kind: TileEffectKind };
export type RevealSnapshot = { island: number; tiles: readonly Tile[] };

/** Initial maps and resets are not discoveries; only hidden-to-visible changes animate. */
export function newlyRevealedTiles(before: readonly Tile[], after: readonly Tile[]): string[] {
  const hidden = new Set(before.filter(tile => !tile.discovered).map(tile => tile.id));
  return after.filter(tile => tile.discovered && hidden.has(tile.id)).map(tile => tile.id);
}

export function revealsWithinIsland(before: RevealSnapshot | null, after: RevealSnapshot): string[] {
  return before && before.island === after.island ? newlyRevealedTiles(before.tiles, after.tiles) : [];
}
