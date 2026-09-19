import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ShipNavigation } from '../src/components/ShipNavigation';
import '../src/index.css';
function Check() {
  const viewport = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  return <><button onClick={() => setEnabled(value => !value)}>Toggle extraction</button>
    <button onClick={() => viewport.current!.scrollTo(600, 600)}>Show ship</button>
    <button onClick={() => viewport.current!.scrollTo(0, 0)}>Hide ship</button>
    <div ref={viewport} style={{ width: 300, height: 300, overflow: 'auto', position: 'relative', margin: 20 }}>
      <div style={{ width: 900, height: 900, background: '#234738', position: 'relative' }}>
        <div className="extraction-ready" style={{ position: 'absolute', left: 700, top: 700, width: 50, height: 50 }}>Ship</div>
      </div>
    </div><ShipNavigation viewport={viewport} enabled={enabled} /></>;
}
createRoot(document.getElementById('root')!).render(<Check />);
