import type { TileRevealEffect } from './tileReveal';

/** Collect animation completions without committing game state per tile. */
export function createEffectCleanup(
  flush: (completed: Map<string, number>) => void,
  schedule: (task: () => void) => number,
  cancelScheduled: (handle: number) => void,
) {
  let pending = new Map<string, number>();
  let handle: number | null = null;
  return {
    add(tileId: string, revision: number) {
      pending.set(tileId, Math.max(revision, pending.get(tileId) ?? revision));
      if (handle !== null) return;
      handle = schedule(() => {
        handle = null;
        const completed = pending;
        pending = new Map();
        flush(completed);
      });
    },
    cancel() {
      if (handle !== null) cancelScheduled(handle);
      handle = null;
      pending.clear();
    },
  };
}

export function removeCompletedEffects(
  current: Record<string, TileRevealEffect>,
  completed: ReadonlyMap<string, number>,
): Record<string, TileRevealEffect> {
  let next = current;
  for (const [tileId, revision] of completed) {
    if (current[tileId]?.revision !== revision) continue;
    if (next === current) next = { ...current };
    delete next[tileId];
  }
  return next;
}
