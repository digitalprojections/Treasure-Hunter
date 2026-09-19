import { memo, type CSSProperties } from 'react';
import { recordParticleRender } from '../utils/renderDiagnostics';
import { Gem, Compass, Coins, ShipWheel } from 'lucide-react';
import type { TileEffectKind } from '../utils/tileReveal';

const sparks = [[-18, -12], [0, -22], [18, -14], [23, 3], [14, 19], [-4, 22], [-20, 13], [-23, -2]];
const emblems = { gem: Gem, 'relic-complete': ShipWheel, relic: Compass, treasure: Coins, escape: ShipWheel };

export const TileRevealParticles = memo(function TileRevealParticles({ onComplete, kind = 'special' }: { onComplete: () => void; kind?: TileEffectKind }) {
  recordParticleRender(kind);
  const reward = kind !== 'regular' && kind !== 'special';
  const Emblem = reward ? emblems[kind] : undefined;
  return (
    <div className={`tile-reveal tile-reveal-${kind}${reward ? ' tile-discovery' : ''}`}
      data-effect={reward ? `${kind}-discovery` : `${kind}-reveal`} aria-hidden="true"
      onAnimationEnd={event => { if (event.target === event.currentTarget) onComplete(); }}>
      {reward ? (
        <>
          <svg className="discovery-sigil" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="38" />
            <circle cx="50" cy="50" r="29" strokeDasharray="2 7" />
            <path d="M50 3 55 12 50 21 45 12Z M97 50 88 55 79 50 88 45Z M50 97 45 88 50 79 55 88Z M3 50 12 45 21 50 12 55Z" />
          </svg>
          <span className="discovery-emblem">{Emblem && <Emblem size={22} strokeWidth={1.4} />}</span>
        </>
      ) : <span className="tile-reveal-ring" />}
      {kind !== 'regular' && sparks.map(([x, y], index) => (
        <span key={index} className="tile-reveal-spark"
          style={{ '--spark-x': `${x}px`, '--spark-y': `${y}px`, '--spark-delay': `${index * 22}ms` } as CSSProperties} />
      ))}
    </div>
  );
});
