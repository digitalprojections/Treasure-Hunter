import { readdir } from 'node:fs/promises';
import { discoverCharacterAnimations } from '../src/utils/characterAnimations';

const root = new URL('../assets/', import.meta.url);
const files = await readdir(root, { recursive: true });
const registry = discoverCharacterAnimations(Object.fromEntries(files.map(file => {
  const path = `assets/${file.replaceAll('\\', '/')}`;
  return [path, path];
})));
for (const [domain, characters] of Object.entries(registry)) {
  for (const [character, states] of Object.entries(characters)) {
    for (const [state, clip] of Object.entries(states)) {
      console.log(`${domain}/${character}/${state}: ${clip.frames.length} frames`);
    }
  }
}
