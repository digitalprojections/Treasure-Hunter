import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {TileRevealParticles} from '../src/components/TileRevealParticles';
import '../src/index.css';
const root=createRoot(document.getElementById('board')!);
const output=document.getElementById('result')!;
const delay=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const noop=()=>{};
document.getElementById('run')!.onclick=async()=>{
 output.textContent='Running';
 flushSync(()=>root.render(<div style={{display:'grid',gridTemplateColumns:'repeat(8,42px)'}}>{Array.from({length:40},(_,i)=><div key={i} style={{position:'relative',width:42,height:42,background:'#234638'}}><TileRevealParticles kind="special" onComplete={noop}/></div>)}</div>));
 await delay(50);
 const effects=[...document.querySelectorAll('.tile-reveal')];
 const nodes=effects.reduce((sum,el)=>sum+el.querySelectorAll('*').length+1,0);
 const animations=effects.reduce((sum,el)=>sum+el.getAnimations({subtree:true}).length,0);
 const filtered=effects.flatMap(el=>[el,...el.querySelectorAll('*')]).filter(el=>getComputedStyle(el).filter!=='none'||getComputedStyle(el).boxShadow!=='none').length;
 const svgOnly=effects.every(el=>el.tagName.toLowerCase()==='svg'&&[...el.querySelectorAll('*')].every(child=>child.namespaceURI==='http://www.w3.org/2000/svg'));
 output.textContent=JSON.stringify({result:svgOnly&&animations<=160&&filtered===0?'PASS':'FAIL',effects:40,nodes,animations,filtered,svgOnly},null,2);
};

// Freeze representative frames for repeatable visual inspection without racing screenshots.
const preview=document.createElement('button');preview.textContent='Preview effect designs';document.body.prepend(preview);
preview.onclick=async()=>{
 const kinds=['regular','special','gem','relic','treasure','relic-complete','escape'] as const;
 flushSync(()=>root.render(<div style={{display:'flex',flexWrap:'wrap',gap:80,padding:80,background:'#0f172a',color:'white'}}>{kinds.map(kind=><div key={kind} style={{position:'relative',width:64,height:64,background:'#234638',border:'1px solid #597a4c'}}><TileRevealParticles kind={kind} onComplete={noop}/><span style={{position:'absolute',top:100,fontSize:12,whiteSpace:'nowrap'}}>{kind}</span></div>)}</div>));
 await delay(50);
 document.querySelectorAll('.tile-reveal').forEach(el=>el.getAnimations({subtree:true}).forEach(animation=>{animation.pause();animation.currentTime=350;}));
 output.textContent='Effect designs paused at 350 ms';
};
