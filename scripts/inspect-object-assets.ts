import { readdir } from 'node:fs/promises';
import { discoverObjectAssets } from '../src/utils/objectAssets';

const files = await readdir(new URL('../assets/', import.meta.url), { recursive: true });
const registry = discoverObjectAssets(Object.fromEntries(files.map(file => {
  const path = `assets/${file.replaceAll('\\', '/')}`;
  return [path, path];
})));
for (const [key, set] of Object.entries(registry).sort(([a], [b]) => a.localeCompare(b))) {
  if (set.static) console.log(`${key}: static ${set.static.levels ? `levels ${set.static.levels.join(', ')}` : `${set.static.assets.length} variants`}`);
  for (const [action, clip] of Object.entries(set.actions)) console.log(`${key}/${action}: ${clip.frames.length} frames`);
}
