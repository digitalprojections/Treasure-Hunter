import { memo, useMemo, useState } from 'react';
import { Compass, Sparkles, ChevronRight, X } from 'lucide-react';
import type { GameState } from '../types';
import { oracleClues, type OracleClue } from '../utils/oracle';
import { REQUIRED_RELIC_COUNT } from '../utils/mapGenerator';
import './ExpeditionOracle.css';

/** Decorative motion stays in CSS; no animation clock touches game state. */
export const ExpeditionOracle = memo(function ExpeditionOracle({ state, clues: suppliedClues, relicTarget = REQUIRED_RELIC_COUNT }: { state: GameState; clues?: OracleClue[]; relicTarget?: number }) {
  const clues = useMemo(() => suppliedClues ?? oracleClues(state), [state, suppliedClues]);
  const [selection, setSelection] = useState({ context: '', index: 0, reading: 0 });
  const context = clues.map(c => c.id).join('|');
  const index = selection.context === context ? selection.index % clues.length : 0;
  const clue = clues[index];
  const [dismissedOmen, setDismissedOmen] = useState<string | null>(null);
  const omen = clues[0].id;
  const dismissed = dismissedOmen === omen;
  return <>
    <button className="oracle-launcher" data-visible={dismissed} onClick={()=>setDismissedOmen(null)} aria-label="Open expedition oracle"><Compass size={18}/><span>Oracle</span></button>
    <section className="expedition-oracle" data-dismissed={dismissed} aria-label="Expedition oracle">
    <button className="oracle-dismiss" onClick={()=>setDismissedOmen(omen)} aria-label="Dismiss expedition oracle"><X size={16}/></button>
    <header className="oracle-heading"><span className="oracle-jewel" aria-hidden="true"/><span>THE ISLAND ORACLE</span><span className="oracle-edition">IX</span></header>
    <div className="oracle-chamber">
      <div className="oracle-mechanism" aria-hidden="true">
        <span className="oracle-ring oracle-ring-outer"/><span className="oracle-ring oracle-ring-inner"/>
        <span className="oracle-direction oracle-north">N</span><span className="oracle-direction oracle-south">S</span>
        <span className="oracle-core"><Compass size={44} strokeWidth={1}/></span>
        <i className="oracle-mote oracle-mote-a"/><i className="oracle-mote oracle-mote-b"/><i className="oracle-mote oracle-mote-c"/>
      </div>
      <div className="oracle-inscription" key={`${clue.id}:${selection.reading}`}>
        <span className="oracle-eyebrow">{clue.title}</span>
        <p role="status" aria-live="polite" aria-atomic="true">{clue.text}</p>
      </div>
    </div>
    <div className="oracle-controls">
      <div className="oracle-seals" aria-label={`${state.stats.relicsCollected} of ${relicTarget} relics recovered`}>
        {Array.from({length:relicTarget},(_,i)=><span key={i} data-lit={i<state.stats.relicsCollected} aria-hidden="true">◆</span>)}
      </div>
      <button onClick={()=>setSelection({context,index:(index+1)%clues.length,reading:selection.reading+1})} aria-label="Read next oracle clue"><Sparkles size={12}/> Consult <ChevronRight size={12}/></button>
    </div>
  </section></>;
});
