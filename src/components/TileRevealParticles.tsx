import { memo } from 'react';
import { recordParticleRender } from '../utils/renderDiagnostics';
import { Gem, Compass, Coins, ShipWheel } from 'lucide-react';
import type { TileEffectKind } from '../utils/tileReveal';
import './TileRevealParticles.css';

const emblems = { gem: Gem, 'relic-complete': ShipWheel, relic: Compass, treasure: Coins, escape: ShipWheel };
// Four motes per path: two animation layers instead of eight shadowed elements.
const motes = [
  'M22 29l2-2 2 2-2 2Z M74 25l2-2 2 2-2 2Z M71 77l2-2 2 2-2 2Z M18 70l2-2 2 2-2 2Z',
  'M48 15l2-2 2 2-2 2Z M82 52l2-2 2 2-2 2Z M43 82l2-2 2 2-2 2Z M14 45l2-2 2 2-2 2Z',
];
export const TileRevealParticles = memo(function TileRevealParticles({ onComplete, kind = 'special' }: { onComplete: () => void; kind?: TileEffectKind }) {
  recordParticleRender(kind);
  const reward = kind !== 'regular' && kind !== 'special';
  const Emblem = reward ? emblems[kind] : undefined;
  return (
    <svg className={`tile-reveal tile-reveal-${kind}${reward ? ' tile-discovery' : ''}`}
      viewBox="0 0 100 100" fill="none" aria-hidden="true" focusable="false"
      data-effect={reward ? `${kind}-discovery` : `${kind}-reveal`}
      onAnimationEnd={event => { if (event.target === event.currentTarget) onComplete(); }}>
      {reward ? <>
        <g className="discovery-sigil">
          <circle cx="50" cy="50" r="38" />
          <circle cx="50" cy="50" r="29" strokeDasharray="2 7" />
          <path d="M50 3 55 12 50 21 45 12Z M97 50 88 55 79 50 88 45Z M50 97 45 88 50 79 55 88Z M3 50 12 45 21 50 12 55Z" />
        </g>
        <g className="discovery-emblem">{Emblem && <Emblem x="32" y="32" width="36" height="36" strokeWidth={1.4}/>}</g>
      </> : <g className="tile-reveal-ring">
        <circle className="reveal-ring-halo" cx="50" cy="50" r="36" />
        <circle cx="50" cy="50" r="36" />
      </g>}
      {kind !== 'regular' && motes.map((d,index)=><path key={index} d={d} className={`tile-reveal-spark spark-trail-${index}`} />)}
    </svg>
  );
});
