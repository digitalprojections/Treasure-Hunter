import { REQUIRED_RELIC_COUNT } from './mapGenerator';
import type { GameState } from '../types';
export type RewardEffectKind = 'gem' | 'relic-complete' | 'relic' | 'treasure' | 'escape';

export function discoveryRewardEffect(before: GameState, after: GameState, achievement?: string):
  { tileId: string; kind: RewardEffectKind } | undefined {
  if (before === after) return;
  const kind: RewardEffectKind | undefined = achievement === 'relic_collected' ? (before.stats.relicsCollected < REQUIRED_RELIC_COUNT && after.stats.relicsCollected >= REQUIRED_RELIC_COUNT ? 'relic-complete' : 'relic')
    : achievement === 'treasure_found' ? 'treasure'
    : achievement === 'island_escape' ? 'escape'
    : after.resources.gems > before.resources.gems ? 'gem' : undefined;
  if (!kind) return;
  const tile = after.tiles.find(t => t.x === after.playerPos.x && t.y === after.playerPos.y);
  if (tile) return { tileId: tile.id, kind };
}
