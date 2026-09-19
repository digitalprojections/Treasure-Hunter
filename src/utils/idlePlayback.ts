export interface IdlePlayback {
  nextStartMs: number;
  startedAtMs: number | null;
  elapsedMs: number;
}

/** A fresh quiet interval between single idle performances. */
export function createIdlePlayback(nowMs: number, random = Math.random): IdlePlayback {
  return { nextStartMs: nowMs + 4000 + Math.floor(random() * 6000), startedAtMs: null, elapsedMs: 0 };
}

export function advanceIdlePlayback(state: IdlePlayback, nowMs: number, durationMs: number, random = Math.random): IdlePlayback {
  if (durationMs <= 0) return { ...state, startedAtMs: null, elapsedMs: 0 };
  if (state.startedAtMs === null) {
    return nowMs < state.nextStartMs ? state : { ...state, startedAtMs: nowMs, elapsedMs: 0 };
  }
  const elapsedMs = Math.max(0, nowMs - state.startedAtMs);
  return elapsedMs >= durationMs ? createIdlePlayback(nowMs, random) : { ...state, elapsedMs };
}
