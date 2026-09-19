import { useEffect, useLayoutEffect, useRef, useState, type RefObject, type ReactNode } from 'react';
import { conversation, nearSite, sites, siteNames, type Chapter, type ChapterAction, type Site } from './chapter';
import './chapterBubbles.css';
function ChapterDialog({children,onClose,label}:{children:ReactNode;onClose:()=>void;label:string}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const dialog=ref.current;dialog?.showModal();return()=>dialog?.close();},[]);
 return <dialog ref={ref} className="chapter-dialog" aria-label={label} onCancel={event=>{event.preventDefault();onClose();}}>{children}</dialog>;
}
export function ChapterBubbles({chapter,onAction,onRetry,onNewTide,viewport,journalRevision,hidden}:{chapter:Chapter;onAction:(a:ChapterAction)=>void;onRetry:()=>void;onNewTide:()=>void;viewport:RefObject<HTMLElement|null>;journalRevision:number;hidden:boolean}){
 const nearby=sites.filter(site=>nearSite(chapter,site));
 const [selected,setSelected]=useState<Site>('ship');
 const active=nearby.includes(selected)?selected:nearby[0];
 const [closed,setClosed]=useState('');
 const context=nearby.join(':');
 const expanded=closed!==context;
 const [journal,setJournal]=useState(false);
 const [ending,setEnding]=useState(false);
 const [position,setPosition]=useState({left:0,top:0,width:300,maxHeight:300});
 const bubble=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(journalRevision)setJournal(true);},[journalRevision]);
 useEffect(()=>{setEnding(false);if(chapter.status==='playing')return;const t=setTimeout(()=>setEnding(true),chapter.status==='dead'?1100:100);return()=>clearTimeout(t);},[chapter.status]);
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
 },[viewport,chapter.pos,chapter.message,active,expanded,hidden]);
 const dialogue=active?conversation(chapter,active):null;
 return <>
  {!hidden&&chapter.status==='playing'&&dialogue&&<div ref={bubble} className={`chapter-bubble ${expanded?'':'chapter-bubble-closed'}`} style={position} aria-label="Map conversation">
   {expanded?<><div className="chapter-bubble-top"><span>{dialogue.speaker}</span><button aria-label="Close conversation" onClick={()=>setClosed(context)}>×</button></div>
   {nearby.length>1&&<nav aria-label="Nearby conversations">{nearby.map(site=><button key={site} aria-pressed={active===site} onClick={()=>setSelected(site)}>{siteNames[site]}</button>)}</nav>}
   <p>{dialogue.text}</p><div className="chapter-bubble-choices">{dialogue.choices.map(choice=><button key={choice.id} disabled={choice.disabled} onClick={()=>onAction({type:'choose',choice:choice.id})}><strong>{choice.label}</strong>{choice.cost&&<small>{choice.cost}</small>}</button>)}</div>
   <p className="chapter-bubble-response" role="status">{chapter.message}</p><button className="chapter-journal-link" onClick={()=>setJournal(true)}>Read journal</button></>:<button onClick={()=>setClosed('')}>Talk · {siteNames[active]}</button>}
  </div>}
  {journal&&<ChapterDialog label="Evidence journal" onClose={()=>setJournal(false)}><span>CHAPTER I · THE BELL THAT REMEMBERS</span><h2>Evidence journal</h2>{chapter.journal.map((line,i)=><p key={i}>{line}</p>)}<button onClick={()=>setJournal(false)}>Return to the map</button></ChapterDialog>}
  {ending&&<ChapterDialog label={chapter.status==='dead'?'Expedition failed':'Chapter complete'} onClose={()=>{}}><span>{chapter.status==='dead'?'THE ISLAND KEEPS YOU':'CHAPTER I COMPLETE'}</span><h2>{chapter.status==='dead'?'Your light goes out.':'A voice came aboard.'}</h2><p>{chapter.status==='dead'?chapter.cause:chapter.message}</p>{chapter.status==='won'?<blockquote>From the heartstone, Elin whispers: “The lighthouse is answering. That is not my voice.”<small>Next chapter · The Borrowed Voice</small></blockquote>:<p>The clues will remain true. Retry this island with what you have learned.</p>}<button onClick={onRetry}>Retry this island</button><button onClick={onNewTide}>A different tide</button></ChapterDialog>}
 </>;
}
