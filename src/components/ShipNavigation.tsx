import { useEffect, useState, type RefObject } from 'react';
import { ArrowRight, Ship } from 'lucide-react';
import { shipNavigation } from '../utils/shipNavigation';

export function ShipNavigation({ viewport, enabled }: { viewport: RefObject<HTMLElement | null>; enabled: boolean }) {
  const [marker, setMarker] = useState<{ x: number; y: number; angle: number } | null>(null);
  useEffect(() => {
    const map = viewport.current;
    if (!enabled || !map) { setMarker(null); return; }
    const update = () => {
      const ship = map.querySelector('.extraction-ready');
      if (!ship) { setMarker(null); return; }
      const bounds = map.getBoundingClientRect(), target = ship.getBoundingClientRect();
      const direction = shipNavigation(target.left + target.width / 2 - bounds.left,
        target.top + target.height / 2 - bounds.top, map.clientWidth, map.clientHeight);
      setMarker(direction ? { ...direction, x: bounds.left + direction.x, y: bounds.top + direction.y } : null);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(map);
    map.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { observer.disconnect(); map.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [viewport, enabled]);
  if (!enabled || !marker) return null;
  return <div className="ship-navigation" role="img" aria-label="Unlocked ship direction"
    style={{ left: marker.x, top: marker.y }}>
    <ArrowRight className="ship-navigation-arrow" size={42} style={{ transform: `rotate(${marker.angle}deg)` }} />
    <Ship size={17} className="ship-navigation-icon" />
  </div>;
}
