import { createLooperSpriteBox, createSpriteAsset, createStaticSpriteBox,
  type LooperSpriteBox, type SpriteBoxAsset, type StaticSpriteBox } from './spritebox';

export interface ObjectAssetSet {
  usage?: 'world' | 'hud';
  cutout?: SpriteBoxAsset;
  static?: StaticSpriteBox;
  actions: Record<string, LooperSpriteBox>;
}
export type ObjectAssetRegistry = Record<string, ObjectAssetSet>;
const domains = new Set(['heroes', 'enemies', 'wildlife', 'defenses', 'structures', 'resources', 'barriers', 'terrain', 'symbols']);
type Entry = { asset: SpriteBoxAsset; index: number; mode: 'level' | 'variant' | 'frame' };

/** Pure discovery: keys are domain/type; filenames determine selection, never file count. */
export function discoverObjectAssets(files: Record<string, string>): ObjectAssetRegistry {
  const groups = new Map<string, { object: string; action?: string; entries: Entry[] }>();
  for (const [rawPath, src] of Object.entries(files)) {
    const path = rawPath.replaceAll('\\', '/');
    const match = /(?:^|\/)assets\/([a-z_]+)\/([a-z][a-z0-9_]*)\/(.+)\.(?:png|webp|jpe?g)$/i.exec(path);
    if (!match || !domains.has(match[1]) || !/^[a-z][a-z0-9_]*$/.test(match[2])) continue;
    const [, domain, type, relative] = match;
    const hudOnly = domain === 'symbols' && type.endsWith('_symbol');
    if (/_symbol(?:[._/ -]|$)/i.test(`${type}/${relative}`) && !hudOnly) continue;
    let action: string | undefined;
    let mode: Entry['mode'];
    let index: number;
    const still = /^(level|variant)_(\d+)$/.exec(relative);
    const windowsStill = /^([^/]+?)\s*\((\d+)\)$/.exec(relative);
    const frame = /^([a-z][a-z0-9_]*)\/([^/]+?)(?:[_-](\d+)|\s*\((\d+)\))$/.exec(relative);
    if (still) { mode = still[1] as Entry['mode']; index = Number(still[2]); }
    else if (windowsStill) { mode = windowsStill[1].trim() === 'level' ? 'level' : 'variant'; index = Number(windowsStill[2]); }
    else if (relative === 'static' || relative === type) { mode = 'variant'; index = 0; }
    else if (relative === 'cutout') { action = '$cutout'; mode = 'variant'; index = 0; }
    else if (frame) { action = frame[1]; mode = 'frame'; index = Number(frame[3] ?? frame[4]); }
    else continue;
    if (!Number.isSafeInteger(index) || (mode !== 'variant' && index < 1)) continue;
    const object = `${domain}/${type}`;
    const key = `${object}/${action ?? '$static'}`;
    const group = groups.get(key) ?? { object, action, entries: [] };
    if (group.entries.some(entry => entry.mode !== mode)) throw new Error(`Mixed level and variant art: ${object}`);
    if (group.entries.some(entry => entry.index === index)) throw new Error(`Duplicate asset index: ${path}`);
    group.entries.push({ asset: createSpriteAsset(src, path), index, mode });
    groups.set(key, group);
  }
  const registry: ObjectAssetRegistry = Object.create(null);
  for (const { object, action, entries } of groups.values()) {
    entries.sort((a, b) => a.index - b.index);
    const sources = entries.map(entry => entry.asset) as [SpriteBoxAsset, ...SpriteBoxAsset[]];
    const set: ObjectAssetSet = registry[object] ??= { actions: Object.create(null), usage: object.startsWith('symbols/') && object.endsWith('_symbol') ? 'hud' : 'world' };
    if (action === '$cutout') set.cutout = sources[0];
    else if (action) set.actions[action] = createLooperSpriteBox(`${object}/${action}`, object, sources, 140);
    else {
      set.static = createStaticSpriteBox(object, object, sources);
      if (entries[0].mode === 'level') set.static.levels = entries.map(entry => entry.index);
    }
  }
  return registry;
}
