import type { ObjectAssetRegistry } from './objectAssets';
import { createSpriteAsset, createStaticSpriteBox, type SpriteBoxModule } from './spritebox';

export const MISSING_ASSET = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" fill="#334155"/><text x="48" y="64" text-anchor="middle" font-size="52" fill="#fbbf24">?</text></svg>',
);

/** Resolve an object/action, never a particular image filename. */
export function selectObjectSpriteBox(registry: ObjectAssetRegistry, key: string, action = 'idle', cutout = false): SpriteBoxModule {
  const set = registry[key];
  if (set?.actions[action]) return set.actions[action];
  const still = set?.cutout;
  if (cutout && still) return createStaticSpriteBox(key, key, [still]);
  if (set?.static) return set.static;
  const clip = set?.actions.idle ?? set?.actions.walk
    ?? (set && Object.entries(set.actions).sort(([a], [b]) => a.localeCompare(b))[0]?.[1]);
  // Missing actions use one still; damage/death must not play as an idle loop.
  const asset = still ?? clip?.frames[0] ?? createSpriteAsset(MISSING_ASSET, key);
  return createStaticSpriteBox(key, key, [asset]);
}
