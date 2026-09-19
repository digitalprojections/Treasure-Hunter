import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, X, Volume2, Compass } from 'lucide-react';
import score from '../data/demo-beats.json';
import themeUrl from '../../assets/music/events/demo/sunken.wav?url';
import { createDemoSequence, sampleDemo } from '../utils/demoSequence';
import { DemoRenderer, loadDemoImages } from './demoRenderer';
import './demo.css';
const cues=createDemoSequence(score.beats);
const clock=(seconds:number)=>`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
export default function DemoMode(){
  const audio=useRef<HTMLAudioElement>(null),canvas=useRef<HTMLCanvasElement>(null);
  const [ready,setReady]=useState(false),[playing,setPlaying]=useState(false),[started,setStarted]=useState(false);
  const [time,setTime]=useState(0),[error,setError]=useState(''),[volume,setVolume]=useState(.6),[loop,setLoop]=useState(false);
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  const reducedRef=useRef(reduced);reducedRef.current=reduced;
  const sample=sampleDemo(cues,time);
  useEffect(()=>{let cancelled=false,frame=0;let renderer:DemoRenderer;let previous=performance.now(),lastUI=0,lastTime=-1,lastReduced=reducedRef.current;
    loadDemoImages().then(images=>{
      if(cancelled)return;renderer=new DemoRenderer(images,cues);setReady(true);
      const draw=(now:number)=>{
        const element=canvas.current,media=audio.current;
        if(!element||!media)return;
        const width=element.clientWidth,height=element.clientHeight,dpr=Math.min(devicePixelRatio,2);
        const resized=element.width!==Math.round(width*dpr)||element.height!==Math.round(height*dpr);
        if(resized){element.width=Math.round(width*dpr);element.height=Math.round(height*dpr);}
        const dt=(now-previous)/1000;previous=now;
        if(lastTime!==media.currentTime||resized||lastReduced!==reducedRef.current){
          const ctx=element.getContext('2d')!;ctx.setTransform(dpr,0,0,dpr,0,0);
          renderer.draw(ctx,width,height,media.currentTime,dt,reducedRef.current,resized||Math.abs(media.currentTime-lastTime)>2);
          lastTime=media.currentTime;lastReduced=reducedRef.current;
        }
        if(now-lastUI>80){setTime(media.currentTime);lastUI=now;}
        frame=requestAnimationFrame(draw);
      };frame=requestAnimationFrame(draw);
    }).catch(()=>{if(!cancelled)setError('The island artwork could not load. Reload to try again.');});
    const hidden=()=>{if(document.hidden)audio.current?.pause();};
    document.addEventListener('visibilitychange',hidden);
    return()=>{cancelled=true;cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',hidden);};
  },[]);
  useEffect(()=>{if(audio.current)audio.current.volume=volume;},[volume]);
  const play=async()=>{const media=audio.current;if(!media)return;setError('');if(media.ended)media.currentTime=0;
    try{await media.play();setStarted(true);}catch{setError('Playback could not start. Tap Play to retry.');}};
  const replay=()=>{if(audio.current)audio.current.currentTime=0;void play();};
  const exitUrl=location.pathname;
  return <main className="demo-mode" data-demo-playing={playing} data-demo-beat={sample.index}>
    <audio ref={audio} src={themeUrl} preload="auto" loop={loop} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)} onError={()=>setError('The theme song could not load. Reload to try again.')} />
    <canvas ref={canvas} className="demo-canvas" aria-label="Self-playing island expedition synchronized to Sunken Relic Run" />
    <header className="demo-header"><div><span className="demo-eyebrow">Treasure Hunter · live autoplay</span><h1>Sunken Relic Run</h1></div>
      <a href={exitUrl} className="demo-icon-button" aria-label="Exit demo"><X size={20}/></a></header>
    <section className="demo-chapter" aria-live="polite"><span className="demo-eyebrow">{sample.relics===3?'Return to the tide':`Relics awakened · ${sample.relics} / 3`}</span><h2>{time>=score.duration-.8?'The island remembers':sample.chapter}</h2></section>
    {!started&&<div className="demo-intro"><Compass size={38}/><p className="demo-eyebrow">A journey written in rhythm</p><h2>Wake the island.</h2><p>Enemy swarms. Chain lightning. Relic storms. The expedition plays itself.</p><button disabled={!ready} onClick={()=>void play()}><Play size={18}/>{ready?'Begin the journey':'Preparing the island…'}</button></div>}
    {error&&<p role="alert" className="demo-error">{error}</p>}
    {started&&!playing&&time>=score.duration-.8&&<div className="demo-ending"><h2>Every relic has a story.</h2><button onClick={replay}>Experience it again</button></div>}
    <footer className="demo-controls">
      <div className="demo-waveform" aria-hidden="true">{Array.from({length:96},(_,i)=>{
        const beat=score.beats[Math.floor(i/96*score.beats.length)];return <i key={i} style={{height:`${18+beat.energy*82}%`,background:i/96<time/score.duration?'#e2bd76':'#42665f'}}/>;
      })}</div>
      <input className="demo-seek" aria-label="Demo playback position" type="range" min="0" max={score.duration} step="0.05" value={time} onChange={e=>{if(audio.current){audio.current.currentTime=Number(e.target.value);setTime(Number(e.target.value));}}}/>
      <div className="demo-transport"><button className="demo-icon-button" disabled={!ready} onClick={()=>playing?audio.current?.pause():void play()} aria-label={playing?'Pause demo':'Play demo'}>{playing?<Pause size={18}/>:<Play size={18}/>}</button>
        <button className="demo-icon-button" onClick={replay} disabled={!ready} aria-label="Restart demo"><RotateCcw size={17}/></button>
        <span className="demo-time">{clock(time)} / {clock(score.duration)}</span>
        <label className="demo-volume"><Volume2 size={16}/><input aria-label="Demo music volume" type="range" min="0" max="1" step=".05" value={volume} onChange={e=>setVolume(Number(e.target.value))}/></label>
        <label><input type="checkbox" checked={loop} onChange={e=>setLoop(e.target.checked)}/> Loop</label>
        <label><input type="checkbox" checked={reduced} onChange={e=>setReduced(e.target.checked)}/> Gentle effects</label>
      </div>
    </footer>
  </main>;
}
