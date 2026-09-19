import { useEffect, useState } from 'react';

/** Update only the tile that owns an active animation. */
export function useSpriteClock(enabled: boolean, animationKey: string, frameMs = 60) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    setElapsed(0);
    if (!enabled) return;
    const start = performance.now();
    const timer = window.setInterval(() => {
      if (!document.hidden) setElapsed(performance.now() - start);
    }, Math.max(16, frameMs));
    return () => window.clearInterval(timer);
  }, [enabled, animationKey, frameMs]);
  return enabled ? elapsed : 0;
}
