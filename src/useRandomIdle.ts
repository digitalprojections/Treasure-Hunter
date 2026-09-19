import { useEffect, useState } from 'react';
import { advanceIdlePlayback, createIdlePlayback } from './utils/idlePlayback';

/** Each mounted actor owns its clock; disabling it cancels the current performance. */
export function useRandomIdle(durationMs: number, actorKey: string): number {
  const [elapsedMs, setElapsedMs] = useState(0);
  useEffect(() => {
    setElapsedMs(0);
    if (durationMs <= 0) return;
    let playback = createIdlePlayback(performance.now());
    const reset = () => {
      playback = createIdlePlayback(performance.now());
      setElapsedMs(0);
    };
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      playback = advanceIdlePlayback(playback, performance.now(), durationMs);
      setElapsedMs(playback.elapsedMs);
    }, 60);
    document.addEventListener('visibilitychange', reset);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', reset);
    };
  }, [durationMs, actorKey]);
  return durationMs > 0 ? elapsedMs : 0;
}
