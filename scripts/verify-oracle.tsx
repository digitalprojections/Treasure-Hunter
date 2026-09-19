import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { ExpeditionOracle } from '../src/components/ExpeditionOracle';
import { EntityType, TileType, type GameState } from '../src/types';
const initial: GameState = {tiles:[{id:'relic',x:8,y:2,type:TileType.FOREST,entity:EntityType.RELIC,discovered:false}],playerPos:{x:2,y:8},stamina:20,maxStamina:20,resources:{gold:100,wood:20,stone:10,gems:0},stats:{relicsCollected:0,treasuresFound:0,trapsTriggered:0,daysElapsed:1},isGameOver:false};
function Check(){
 const [state,setState]=useState(initial),[report,setReport]=useState('Ready');
 function run(){try{
  flushSync(()=>setState(initial));
  const inscription=document.querySelector('.oracle-inscription');
  for(let i=0;i<40;i++)flushSync(()=>setState({...initial,playerPos:{x:i%10,y:8}}));
  if(document.querySelector('.oracle-inscription')!==inscription)throw Error('Movement restarted the inscription');
  flushSync(()=>document.querySelector<HTMLButtonElement>('[aria-label="Read next oracle clue"]')!.click());
  if(document.querySelector('.oracle-inscription')===inscription)throw Error('Consult did not reveal a new inscription');
  flushSync(()=>document.querySelector<HTMLButtonElement>('[aria-label="Dismiss expedition oracle"]')!.click());
  if(document.querySelector('.expedition-oracle')?.getAttribute('data-dismissed')!=='true')throw Error('Dismiss failed');
  flushSync(()=>setState({...initial,stamina:2}));
  if(document.querySelector('.expedition-oracle')?.getAttribute('data-dismissed')!=='false')throw Error('Urgent omen did not reopen');
  setReport('PASS: 40 moves preserved the inscription; consult, dismissal and urgent reopening verified.');
 }catch(e){setReport('FAIL: '+e);}}
 return <><button onClick={run}>Run oracle check</button><pre style={{whiteSpace:'pre-wrap'}}>{report}</pre><div style={{position:'relative',width:340,height:460,background:'#0f172a'}}><ExpeditionOracle state={state}/></div></>;
}
createRoot(document.getElementById('root')!).render(<Check/>);
