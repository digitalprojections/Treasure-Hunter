import { objectAssets } from './objectAssets';
import { selectObjectSpriteBox } from '../utils/assetCatalog';
import { resolveSpriteBoxAsset } from '../utils/spritebox';
// Bind symbols only to existing counters with matching meaning.
export const statSymbols = Object.fromEntries(Object.entries({
  gold: 'gold', wood: 'wood', stone: 'stone', gems: 'gem',
  exploration: 'discovered', traps: 'bomb', stamina: 'potion', points: 'star',
}).map(([stat, name]) => [stat, resolveSpriteBoxAsset(
  selectObjectSpriteBox(objectAssets, `symbols/${name}_symbol`, 'idle', false, 'hud'), stat,
).src])) as Record<'gold' | 'wood' | 'stone' | 'gems' | 'exploration' | 'traps' | 'stamina' | 'points', string>;
