import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { TileComponent } from '../src/App';
import { TileType } from '../src/types';
import '../src/index.css';
const root=createRoot(document.getElementById('board')!);
const result=document.getElementById('result')!;
const tiles=Array.from({length:5},(_,x)=>({id:String(x),x,y:0,type:TileType.SAND,discovered:true}));
const pause=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const noop=()=>{};
function render(x:number){flushSync(()=>root.render(<div style={{display:'grid',gridTemplateColumns:'repeat(5,64px)'}}>{tiles.map(tile=><TileComponent key={tile.id} tile={tile} isCurrent={tile.x===x} playerAnimation="walk" playerFacing="right" idleElapsedMs={0} spriteClockMs={80} combat={null} onRevealComplete={noop}/>)}</div>));}
render(0);
document.getElementById('run')!.onclick=async()=>{
 try{
  render(0);await pause(400);
  for(const x of [1,2,3,4,3,2,1,0,1,2,3,4]){
   render(x);
   for(let frame=0;frame<3;frame++){
    await pause(16);
    const heroes=document.querySelectorAll('[data-layer="hero"]');
    if(heroes.length!==1)throw Error(`Tile ${x}: ${heroes.length} heroes remain mounted`);
    if(heroes[0].closest('[data-tile-id]')?.getAttribute('data-tile-id')!==String(x))throw Error('Hero attached to stale tile');
   }
  }
  await pause(350);
  if(document.querySelectorAll('[data-layer="hero"]').length!==1)throw Error('Stale hero after settling');
  result.textContent='PASS: exactly one hero during 12 rapid moves, reversals and settling.';
 }catch(error){result.textContent='FAIL: '+error;}
};
