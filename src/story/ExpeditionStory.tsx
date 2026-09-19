import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import type { GameState } from '../types';
import { storyBeat } from './narrative';
import './chapterBubbles.css';
/** Deliberately no game setter, action dispatcher or resource callback. */
export function ExpeditionStory({state,island,viewport,hidden}:{state:GameState;island:number;viewport:RefObject<HTMLElement|null>;hidden:boolean}){
 const beat=useMemo(()=>storyBeat(state,island),[state,island]);
 const [closed,setClosed]=useState('');
 const expanded=closed!==beat.id;
 const [answer,setAnswer]=useState({id:'',text:''});
 const response=answer.id===beat.id?answer.text:'';
 const [entries,setEntries]=useState<string[]>([]);
 const [journal,setJournal]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null);
 const bubble=useRef<HTMLDivElement>(null);
 const [position,setPosition]=useState({left:0,top:0,width:300,maxHeight:300});
 const record=(text:string)=>setEntries(current=>current.includes(text)?current:[...current,text]);
 useEffect(()=>{record(`${beat.speaker}: ${beat.text}`);},[beat.id]);
 useEffect(()=>{if(journal)dialog.current?.showModal();else dialog.current?.close();},[journal]);
 useLayoutEffect(()=>{
  let frame:number|null=null;
  const place=()=>{frame=null;const map=viewport.current;const el=bubble.current;if(!map||!el)return;const m=map.getBoundingClientRect();const hero=map.querySelector('.tile-current-hero')?.getBoundingClientRect();const width=Math.max(180,Math.min(320,m.width-20));const maxHeight=Math.max(110,Math.min(310,m.height-28));const height=Math.min(el.scrollHeight,maxHeight);
   const left=Math.max(m.left+10,Math.min((hero?.left??m.left)+28,m.right-width-10));
   const top=Math.max(m.top+10,Math.min((hero?.bottom??m.top)+10,m.bottom-height-10));
   setPosition(p=>p.left===left&&p.top===top&&p.width===width&&p.maxHeight===maxHeight?p:{left,top,width,maxHeight});};
  const schedule=()=>{if(frame===null)frame=requestAnimationFrame(place);};place();
  const observer=new ResizeObserver(schedule);if(bubble.current)observer.observe(bubble.current);if(viewport.current)observer.observe(viewport.current);
  window.addEventListener('scroll',schedule,true);window.addEventListener('resize',schedule);
  return()=>{observer.disconnect();window.removeEventListener('scroll',schedule,true);window.removeEventListener('resize',schedule);if(frame!==null)cancelAnimationFrame(frame);};
 },[viewport,state.playerPos,response,beat.id,expanded,hidden]);
 return <>
 {!hidden&&<div ref={bubble} className={`chapter-bubble ${expanded?'':'chapter-bubble-closed'}`} style={position} aria-label="Map conversation">
 {expanded?<><div className="chapter-bubble-top"><span>{beat.speaker}</span><button aria-label="Close conversation" onClick={()=>setClosed(beat.id)}>×</button></div>
 <p>{beat.text}</p><div className="chapter-bubble-choices">{beat.replies.map(reply=><button key={reply.label} onClick={()=>{setAnswer({id:beat.id,text:reply.response});record(reply.response);}}><strong>{reply.label}</strong></button>)}</div>
 {response&&<p className="chapter-bubble-response" role="status">{response}</p>}<button className="chapter-journal-link" onClick={()=>setJournal(true)}>Read journal</button>
 </>:<button onClick={()=>setClosed('')}>Story · {beat.speaker}</button>}
 </div>}
 <dialog ref={dialog} className="chapter-dialog" aria-label="Story journal" onCancel={()=>setJournal(false)} onClose={()=>setJournal(false)}><span>THE BELL THAT REMEMBERS</span><h2>Story journal</h2>{entries.map((entry,i)=><p key={i}>{entry}</p>)}<button onClick={()=>setJournal(false)}>Return to the map</button></dialog>
 </>;
}
