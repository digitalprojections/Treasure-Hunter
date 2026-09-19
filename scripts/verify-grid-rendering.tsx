import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {TileComponent} from '../src/App';
import {tileRenderCounts} from '../src/utils/renderDiagnostics';
import {moveHero} from '../src/utils/interactions';
import {classifyTerrainTiles} from '../src/utils/terrainTiles';
import {TileType,type GameState} from '../src/types';
import '../src/index.css';
const noop=()=>{},delay=(ms:number)=>new Promise(r=>setTimeout(r,ms));
const initial=():GameState=>({tiles:Array.from({length:144},(_,i)=>({id:`check-${i}`,x:i%12,y:Math.floor(i/12),type:TileType.GRASS,discovered:true})),playerPos:{x:5,y:5},resources:{gold:100,wood:20,stone:10,gems:0},stats:{treasuresFound:0,relicsCollected:0,trapsTriggered:0,daysElapsed:1},stamina:100,maxStamina:100,isGameOver:false});
const terrain=classifyTerrainTiles(initial().tiles);
function Check(){
 const [state,setState]=useState(initial),[animation,setAnimation]=useState<'idle'|'walk'>('idle'),[report,setReport]=useState('Ready');
 const run=async()=>{try{
   const before=initial();flushSync(()=>{setState(before);setAnimation('idle');setReport('Running');});await delay(150);
   tileRenderCounts.clear();await delay(400);
   const idleOthers=[...tileRenderCounts].filter(([id])=>id!=='check-65');
   if(idleOthers.length)throw Error('Static tiles rendered during idle: '+JSON.stringify(idleOthers));
   tileRenderCounts.clear();
   const after=moveHero(before,6,5).state;
   flushSync(()=>{setState(after);setAnimation('walk');});await delay(300);
   const changed=[...tileRenderCounts.keys()];
   if(changed.some(id=>!['check-65','check-66'].includes(id)))throw Error('Unchanged tiles rerendered: '+changed);
   if(!changed.includes('check-65')||!changed.includes('check-66'))throw Error('Hero tiles failed to update');
   const walkCounts=Object.fromEntries(tileRenderCounts);
   const hidden=initial();hidden.tiles[67]={...hidden.tiles[67],discovered:false};hidden.tiles[90]={...hidden.tiles[90],discovered:false};
   flushSync(()=>{setState(hidden);setAnimation('idle');});await delay(150);tileRenderCounts.clear();
   flushSync(()=>{setState(moveHero(hidden,6,5).state);setAnimation('walk');});await delay(250);
   const revealChanged=[...tileRenderCounts.keys()];
   if(revealChanged.some(id=>!['check-65','check-66','check-67'].includes(id)))throw Error('Unrelated tiles rendered on reveal: '+revealChanged);
   if(!revealChanged.includes('check-67'))throw Error('Revealed tile did not update');
   setReport(JSON.stringify({result:'PASS',tiles:144,staticRendersDuringIdle:idleOthers.length,walkRenderedTiles:walkCounts,revealRenderedTiles:revealChanged},null,2));
 }catch(error){setReport('FAIL '+String(error));}};
 return <div style={{background:'#0f172a',color:'white',height:'100vh',overflow:'auto',padding:20}}><h1>Treasure Hunter grid rendering check</h1><button onClick={()=>void run()}>Run rendering check</button><pre>{report}</pre>
 <div style={{display:'grid',gridTemplateColumns:'repeat(12,32px)',width:384}}>{state.tiles.map(tile=>{const current=state.playerPos.x===tile.x&&state.playerPos.y===tile.y;return <TileComponent key={tile.id} tile={tile} terrain={terrain.get(tile.id)} isCurrent={current} idleElapsedMs={0} playerAnimation={current?animation:'idle'} playerFacing="right" spriteClockMs={0} combat={null} onClick={noop} onRevealComplete={noop}/>;})}</div></div>;
}
createRoot(document.getElementById('root')!).render(<Check/>);
