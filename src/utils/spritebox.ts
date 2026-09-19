export type SpriteBoxKind = 'static' | 'looper';
export type CharacterAnimationState = 'idle' | 'walk' | 'scout' | 'collect' | 'hit' | 'escape';
export type HorizontalFacing = 'left' | 'right';

export interface SpriteBoxAsset {
  src: string;
  name: string;
  frameIndex: number;
}

export interface StaticSpriteBox {
  id: string;
  kind: 'static';
  label: string;
  assets: readonly SpriteBoxAsset[];
  /** Explicit upgrade numbers aligned with assets; absent means seeded variants. */
  levels?: readonly number[];
}

export interface LooperSpriteBox {
  id: string;
  kind: 'looper';
  label: string;
  frames: readonly SpriteBoxAsset[];
  frameMs: number;
}

export type SpriteBoxModule = StaticSpriteBox | LooperSpriteBox;
export type CharacterSpriteBoxSet = Record<CharacterAnimationState, SpriteBoxModule>;

const FILE_NAME_PATTERN = /([^\\/]+?)(?:\.[a-z0-9]+)?$/i;
const FRAME_SUFFIX_PATTERN = /(?:^|[_-])(\d+)$|\((\d+)\)$/;

export function getSpriteAssetName(pathOrName: string) {
  return FILE_NAME_PATTERN.exec(pathOrName)?.[1] ?? pathOrName;
}

export function getSpriteFrameIndex(pathOrName: string) {
  const name = getSpriteAssetName(pathOrName);
  const match = FRAME_SUFFIX_PATTERN.exec(name);
  const frame = match?.[1] ?? match?.[2];
  return frame ? Number.parseInt(frame, 10) : 0;
}

export function createSpriteAsset(src: string, name: string): SpriteBoxAsset {
  return {
    src,
    name,
    frameIndex: getSpriteFrameIndex(name),
  };
}

export function createStaticSpriteBox(id: string, label: string, sources: readonly [SpriteBoxAsset, ...SpriteBoxAsset[]]): StaticSpriteBox {
  return {
    id,
    kind: 'static',
    label,
    assets: sources,
  };
}

export function createLooperSpriteBox(id: string, label: string, sources: readonly [SpriteBoxAsset, ...SpriteBoxAsset[]], frameMs = 260): LooperSpriteBox {
  return {
    id,
    kind: 'looper',
    label,
    frameMs,
    frames: [...sources].sort((a, b) => a.frameIndex - b.frameIndex || a.name.localeCompare(b.name)),
  };
}

export function getSeededIndex(seed: string, length: number) {
  if (length <= 1) return 0;

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return hash % length;
}

export function resolveSpriteBoxAsset(spriteBox: SpriteBoxModule, seed: string, elapsedMs = 0, level = 1) {
  if (spriteBox.kind === 'looper') {
    const frame = Math.floor(elapsedMs / spriteBox.frameMs) % spriteBox.frames.length;
    return spriteBox.frames[frame];
  }

  if (spriteBox.levels) {
    const requested = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
    let index = 0;
    spriteBox.levels.forEach((available, i) => { if (available <= requested) index = i; });
    return spriteBox.assets[index];
  }
  return spriteBox.assets[getSeededIndex(seed, spriteBox.assets.length)];
}

export function getHorizontalFacingAfterMove(currentFacing: HorizontalFacing, fromX: number, toX: number): HorizontalFacing {
  if (toX < fromX) return 'left';
  if (toX > fromX) return 'right';

  return currentFacing;
}
