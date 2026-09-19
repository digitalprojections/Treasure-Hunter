import type { Tile } from '../types';
import type { SpriteBoxModule } from './spritebox';
import { objectRules } from './interactions';

export function getActorIdleDuration(tile: Tile, sprite: SpriteBoxModule | undefined, fighting: boolean): number {
  if (!tile.discovered || tile.visualConsumed || tile.entity || fighting || !tile.visual ||
      (tile.visual.action && tile.visual.action !== 'idle') ||
      (objectRules[tile.visual.id]?.action !== 'Defeat' && tile.visual.tone !== 'wildlife') || sprite?.kind !== 'looper' || sprite.frames.length < 2) return 0;
  return sprite.frames.length * sprite.frameMs;
}
