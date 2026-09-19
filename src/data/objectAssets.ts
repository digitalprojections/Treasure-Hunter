import { discoverObjectAssets } from '../utils/objectAssets';
import { selectObjectSpriteBox } from '../utils/assetCatalog';
import { createAssetLookup } from '../utils/assetLookup';

// Vite discovers new files at development startup/build, including new object folders.
export const assetFiles = import.meta.glob<string>(
  '../../assets/{heroes,enemies,wildlife,defenses,structures,resources,barriers,terrain,symbols}/**/*.{png,PNG,webp,WEBP,jpg,JPG,jpeg,JPEG}',
  { eager: true, query: '?url', import: 'default' },
);
export const objectAssets = discoverObjectAssets(assetFiles);
// Temporary compatibility until the approved folder migration replaces legacy consumers.
export const findAsset = createAssetLookup(assetFiles);

export function getObjectSpriteBox(key: string, action = 'idle') {
  return selectObjectSpriteBox(objectAssets, key, action);
}
