import type { CSSProperties } from 'react';

const sparks = [[-18, -12], [0, -22], [18, -14], [23, 3], [14, 19], [-4, 22], [-20, 13], [-23, -2]];

export function TileRevealParticles({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="tile-reveal" data-effect="animal-reveal" aria-hidden="true"
      onAnimationEnd={event => { if (event.target === event.currentTarget) onComplete(); }}>
      <span className="tile-reveal-ring" />
      {sparks.map(([x, y], index) => (
        <span key={index} className="tile-reveal-spark"
          style={{ '--spark-x': `${x}px`, '--spark-y': `${y}px`, '--spark-delay': `${index * 22}ms` } as CSSProperties} />
      ))}
    </div>
  );
}
