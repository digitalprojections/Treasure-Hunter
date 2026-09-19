import React, { useEffect, useRef, useState } from 'react';
import score from '../data/demo-beats.json';
import themeUrl from '../../assets/music/events/demo/sunken.wav?url';
import { createDemoSequence, sampleDemo } from '../utils/demoSequence';
import { LiveDemoBoard } from './LiveDemoBoard';
import './demo.css';
const cues=createDemoSequence(score.beats);
export default function DemoMode(){
  const audio=useRef<HTMLAudioElement>(null);
  const [playing,setPlaying]=useState(false),[started,setStarted]=useState(false),[time,setTime]=useState(0),[error,setError]=useState('');
  const [muted,setMuted]=useState(false);
  const sample=sampleDemo(cues,time);
  const passed=cues.slice(0,sample.index+1);
  const fights=passed.filter(c=>c.event==='fight').length,treasures=passed.filter(c=>c.event==='treasure').length;
  useEffect(()=>{let frame=0,last=0;
    const tick=(now:number)=>{if(now-last>=33){setTime(audio.current?.currentTime??0);last=now;}frame=requestAnimationFrame(tick);};
    frame=requestAnimationFrame(tick);
    const hidden=()=>{if(document.hidden)audio.current?.pause();};document.addEventListener('visibilitychange',hidden);
    return()=>{cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',hidden);};
  },[]);
  const start=async()=>{setError('');try{if(audio.current){audio.current.volume=.6;await audio.current.play();setStarted(true);}}catch{setError('Tap Start demo to enable the theme music.');}};
  return <main className="autoplay-game" data-demo-playing={playing} data-demo-beat={sample.index}>
    <audio ref={audio} src={themeUrl} loop muted={muted} preload="auto" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onError={()=>setError('Theme music could not load. Reload to retry.')}/>
    <header className="autoplay-header"><strong>Treasure Hunter <small>DEMO</small></strong>
      <span>Relics {sample.relics}/3</span><span>Gold {treasures*25}</span><span>Encounters {fights}</span>
      <button onClick={()=>playing?audio.current?.pause():void start()}>{playing?'Pause':started?'Resume':'Start demo'}</button>
      <button onClick={()=>setMuted(value=>!value)}>{muted?'Unmute':'Mute'}</button>
      <a href={location.pathname}>Exit demo</a>
    </header>
    <LiveDemoBoard cues={cues} time={time} playing={playing}/>
    <div className="autoplay-message" role="status">{error||(!started?'Start the demo to let the expedition play itself.':!playing?'Demo paused.':sample.event==='fight'?'Enemy wave — chain attack!':sample.event==='spell'?'Arcane surge!':sample.event==='relic'?'Relic recovered!':sample.event==='escape'?'Extraction complete — another expedition begins.':'Treasure discovered!')}</div>
  </main>;
}
