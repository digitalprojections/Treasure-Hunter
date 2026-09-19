import { discoverObjectAssets } from './objectAssets';
import { selectObjectSpriteBox } from './assetCatalog';
import { resolveSpriteBoxAsset } from './spritebox';
export { MISSING_ASSET } from './assetCatalog';

/** Resolve category/type keys, never infer identity from a legacy filename. */
export function createAssetLookup(files: Record<string, string>) {
  const registry = discoverObjectAssets(files);
  return (key: string, cutout = false): string =>
    resolveSpriteBoxAsset(selectObjectSpriteBox(registry, key, 'idle', cutout), key).src;
}
