import React, { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { ExpeditionStory } from '../src/story/ExpeditionStory';
import { ExpeditionOracle } from '../src/components/ExpeditionOracle';
import { EntityType, TileType, type GameState } from '../src/types';
const initial: GameState = {tiles:[{id:'relic',x:8,y:2,type:TileType.FOREST,entity:EntityType.RELIC,discovered:false}],playerPos:{x:2,y:8},stamina:20,maxStamina:20,resources:{gold:100,wood:20,stone:10,gems:0},stats:{relicsCollected:0,treasuresFound:0,trapsTriggered:0,daysElapsed:1},isGameOver:false};
function Check(){
 const [state,setState]=useState(initial),[report,setReport]=useState('Ready');
 const viewport=useRef<HTMLDivElement>(null);
 function run(){try{
  if(document.querySelector('.chapter-bubble'))throw Error('Story appeared without a user request');
  if(document.querySelector('.expedition-oracle')?.getAttribute('data-dismissed')!=='true')throw Error('Oracle starts open');
  flushSync(()=>setState(initial));
  const inscription=document.querySelector('.oracle-inscription');
  for(let i=0;i<40;i++)flushSync(()=>setState({...initial,playerPos:{x:i%10,y:8}}));
  if(document.querySelector('.oracle-inscription')!==inscription)throw Error('Movement restarted the inscription');
  flushSync(()=>document.querySelector<HTMLButtonElement>('[aria-label="Read next oracle clue"]')!.click());
  if(document.querySelector('.oracle-inscription')===inscription)throw Error('Consult did not reveal a new inscription');
  flushSync(()=>document.querySelector<HTMLButtonElement>('[aria-label="Dismiss expedition oracle"]')!.click());
  if(document.querySelector('.expedition-oracle')?.getAttribute('data-dismissed')!=='true')throw Error('Dismiss failed');
  flushSync(()=>setState({...initial,stamina:2}));
  if(document.querySelector('.expedition-oracle')?.getAttribute('data-dismissed')!=='true')throw Error('New clue reopened dismissed oracle');
  const dock=document.getElementById('expedition-reading-controls')!;
  const storyButton=document.querySelector<HTMLButtonElement>('[aria-label="Open story conversation"]')!;
  if(!dock.contains(storyButton))throw Error('Story launcher is over the map');
  flushSync(()=>storyButton.click());
  if(!document.querySelector('.chapter-bubble'))throw Error('Story did not open');
  flushSync(()=>document.querySelector<HTMLButtonElement>('[aria-label="Close conversation"]')!.click());
  flushSync(()=>setState({...initial,stats:{...initial.stats,relicsCollected:3}}));
  if(document.querySelector('.chapter-bubble'))throw Error('New story beat reopened bubble');
  const oracleButton=document.querySelector<HTMLButtonElement>('[aria-label="Open expedition oracle"]')!;
  if(!dock.contains(oracleButton))throw Error('Oracle launcher is over the map');
  flushSync(()=>oracleButton.click());
  if(document.querySelector('.expedition-oracle')?.getAttribute('data-dismissed')!=='false')throw Error('Oracle cannot reopen manually');
  flushSync(()=>document.querySelector<HTMLButtonElement>('[aria-label="Dismiss expedition oracle"]')!.click());
  setReport('PASS: no automatic popups, 40 moves without flicker, both controls outside map, explicit reopening, and persistent dismissal after new clues and relics.');
 }catch(e){setReport('FAIL: '+e);}}
 return <><button onClick={run}>Run oracle check</button><pre style={{whiteSpace:'pre-wrap'}}>{report}</pre><div id="expedition-reading-controls"/><div ref={viewport} style={{position:'relative',width:340,height:460,background:'#0f172a'}}><ExpeditionOracle state={state}/><ExpeditionStory state={state} island={1} viewport={viewport} hidden={false}/></div></>;
}
createRoot(document.getElementById('root')!).render(<Check/>);
