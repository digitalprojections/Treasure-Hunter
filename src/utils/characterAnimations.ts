import { createLooperSpriteBox, createSpriteAsset, type LooperSpriteBox, type SpriteBoxAsset } from './spritebox';

export type CharacterAnimationRegistry = Record<string, Record<string, Record<string, LooperSpriteBox>>>;
const domainIds: Record<string, string> = { heroes: 'hero', enemies: 'enemy', wildlife: 'wildlife' };

/** Discover assets/<domain>/<character>/<state>/<numbered frame>, independent of bundler URLs. */
export function discoverCharacterAnimations(files: Record<string, string>): CharacterAnimationRegistry {
  const groups = new Map<string, { domain: string; character: string; state: string; frames: SpriteBoxAsset[] }>();
  for (const [path, src] of Object.entries(files)) {
    const match = /(?:^|\/)assets\/(heroes|enemies|wildlife)\/([^/]+)\/([^/]+)\/([^/]+\.(?:png|webp|jpe?g))$/i.exec(path.replaceAll('\\', '/'));
    if (!match) continue;
    const [, rawDomain, character, state] = match;
    const domain = rawDomain.toLowerCase();
    const key = `${domain}/${character}/${state}`;
    const group = groups.get(key) ?? { domain, character, state, frames: [] };
    group.frames.push(createSpriteAsset(src, path));
    groups.set(key, group);
  }
  const registry: CharacterAnimationRegistry = {};
  for (const { domain, character, state, frames } of groups.values()) {
    // Map entries only exist after at least one matching frame was added.
    const clip = createLooperSpriteBox(`${domainIds[domain]}.${character}.${state}`, `${character} ${state}`,
      frames as [SpriteBoxAsset, ...SpriteBoxAsset[]], 140);
    const characters = registry[domain] ??= Object.create(null);
    const states = characters[character] ??= Object.create(null);
    states[state] = clip;
  }
  return registry;
}
