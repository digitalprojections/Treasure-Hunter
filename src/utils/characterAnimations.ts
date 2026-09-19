import { discoverObjectAssets } from './objectAssets';
import type { LooperSpriteBox } from './spritebox';
export type CharacterAnimationRegistry = Record<string, Record<string, Record<string, LooperSpriteBox>>>;
const domainIds: Record<string, string> = { heroes: 'hero', enemies: 'enemy', wildlife: 'wildlife' };

/** Characters use exactly the same path and numbering contract as other objects. */
export function discoverCharacterAnimations(files: Record<string, string>): CharacterAnimationRegistry {
  const registry: CharacterAnimationRegistry = {};
  for (const [key, set] of Object.entries(discoverObjectAssets(files))) {
    const [domain, character] = key.split('/');
    if (!domainIds[domain] || !Object.keys(set.actions).length) continue;
    const characters = registry[domain] ??= Object.create(null);
    const states = characters[character] ??= Object.create(null);
    for (const [state, clip] of Object.entries(set.actions)) {
      states[state] = { ...clip, id: `${domainIds[domain]}.${character}.${state}`, label: `${character} ${state}` };
    }
  }
  return registry;
}
