import { discoverObjectAssets } from '../utils/objectAssets';
import { selectObjectSpriteBox } from '../utils/assetCatalog';
import { createAssetLookup } from '../utils/assetLookup';
import { auditAssetFiles } from '../utils/assetAudit';

// Vite discovers new files at development startup/build, including new object folders.
export const assetFiles = import.meta.glob<string>(
  '../../assets/**/*.{png,PNG,webp,WEBP,jpg,JPG,jpeg,JPEG}',
  { eager: true, query: '?url', import: 'default' },
);
const assetIssues = auditAssetFiles(assetFiles);
if (assetIssues.length) console.warn('Asset convention violations:\n' + assetIssues.join('\n'));
export const objectAssets = discoverObjectAssets(assetFiles);
// Resolve explicit category/type bindings through the validated registry.
export const findAsset = createAssetLookup(assetFiles);

export function getObjectSpriteBox(key: string, action = 'idle') {
  return selectObjectSpriteBox(objectAssets, key, action);
}
