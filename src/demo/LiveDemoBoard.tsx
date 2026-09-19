import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { TileComponent } from '../App';
import { SpriteBox } from '../SpriteBox';
import { TileRevealParticles } from '../components/TileRevealParticles';
import { activeCharacter } from '../data/characters';
import { visualSpriteBoxes, entitySpriteBoxes } from '../data/spriteboxes';
import { createDemoLevel, sampleDemo, type DemoCue } from '../utils/demoSequence';
import { classifyTerrainTiles } from '../utils/terrainTiles';
import { EntityType } from '../types';
const level=createDemoLevel(),tileSize=64,noop=()=>{};
const terrain=classifyTerrainTiles(level.tiles);
const revealAt=level.tiles.map(tile=>level.route.findIndex(p=>Math.hypot(p.x-tile.x,p.y-tile.y)<2.3));
const GameTile=memo(TileComponent);
const Ground=memo(function Ground({routeIndex,relics}:{routeIndex:number;relics:number}){
  const tiles=useMemo(()=>level.tiles.map((tile,i)=>({...tile,discovered:revealAt[i]>=0&&revealAt[i]<=routeIndex,
    entityFound:tile.entity===EntityType.RELIC?level.landmarks.filter(p=>p.entity===EntityType.RELIC).findIndex(p=>p.x===tile.x&&p.y===tile.y)<relics:tile.entity!==EntityType.EXIT&&routeIndex>=level.route.findIndex(p=>p.x===tile.x&&p.y===tile.y)})),[routeIndex,relics]);
  return <div className="autoplay-tiles" inert>{tiles.map(tile=><GameTile key={tile.id} tile={tile}
    terrain={terrain.get(tile.id)} isCurrent={false} extractionReady={tile.entity===EntityType.EXIT&&relics===3}
    idleElapsedMs={0} playerAnimation="idle" playerFacing="right" spriteClockMs={0} combat={null} onClick={noop} onRevealComplete={noop}/>)}</div>;
});
export function LiveDemoBoard({cues,time,playing}:{cues:DemoCue[];time:number;playing:boolean}){
  const viewport=useRef<HTMLDivElement>(null),[size,setSize]=useState({width:800,height:600});
  const sample=sampleDemo(cues,time),hx=(sample.x+.5)*tileSize,hy=(sample.y+.5)*tileSize;
  useEffect(()=>{const node=viewport.current!;const observer=new ResizeObserver(()=>setSize({width:node.clientWidth,height:node.clientHeight}));observer.observe(node);return()=>observer.disconnect();},[]);
  const recent=cues.slice(Math.max(0,sample.index-4),sample.index+1).filter(c=>time>=c.time&&time-c.time<1.4);
  const waves=recent.filter(c=>c.event==='fight');
  const action=waves.length?'attack':sample.event==='relic'?'collect':sample.event==='spell'?'scout':sample.moving?'walk':'idle';
  const offsetX=size.width>=18*tileSize?(size.width-18*tileSize)/2:Math.max(Math.min(0,size.width-18*tileSize),Math.min(0,size.width/2-hx));
  const offsetY=size.height>=18*tileSize?(size.height-18*tileSize)/2:Math.max(Math.min(0,size.height-18*tileSize),Math.min(0,size.height/2-hy));
  return <div ref={viewport} className="autoplay-viewport" aria-label="Live demo game map" data-playing={playing}>
    <div className="autoplay-world" style={{transform:`translate3d(${offsetX}px,${offsetY}px,0)`}}>
      <Ground routeIndex={sample.routeIndex} relics={sample.relics}/>
      {recent.map(cue=><div key={cue.time} className="autoplay-effect" style={{left:cue.x*tileSize,top:cue.y*tileSize}}>
        <TileRevealParticles kind={cue.event==='relic'?'relic':cue.event==='treasure'?'treasure':cue.event==='escape'?'relic-complete':'special'} onComplete={noop}/>
        {cue.event==='spell'&&<div className="autoplay-spell"/>}
      </div>)}
      {waves.flatMap(wave=>Array.from({length:wave.energy>.75?3:2},(_,foe)=>{
        const age=time-wave.time,index=cues.indexOf(wave),angle=index*1.7+foe*Math.PI*2/3;
        const radius=60+Math.max(0,1-age/.65)*120+Math.max(0,age-.8)*80;
        const x=(wave.x+.5)*tileSize+Math.cos(angle)*radius,y=(wave.y+.5)*tileSize+Math.sin(angle)*radius*.65;
        const enemy=(['skeleton','wolf','goblin','orc','troll'] as const)[(index+foe)%5];
        return <React.Fragment key={`${wave.time}-${foe}`}>
          <div className="autoplay-enemy" data-enemy={enemy} style={{left:x-32,top:y-40,opacity:Math.min(1,age*8)*Math.max(0,1-Math.max(0,age-.8)/.6)}}>
            <SpriteBox spriteBox={visualSpriteBoxes[enemy]} seed={`${index}-${foe}`} elapsedMs={age*1000}/>
          </div>
          {age>.2&&<svg className="autoplay-bolt" viewBox="0 0 1152 1152" aria-hidden="true"><path d={`M ${hx} ${hy-12} L ${(hx+x)/2+12} ${(hy+y)/2-20} L ${(hx+x)/2-8} ${(hy+y)/2+5} L ${x} ${y}`} /></svg>}
        </React.Fragment>;
      }))}
      {recent.filter(c=>c.event==='treasure').map(cue=><div key={`loot-${cue.time}`} className="autoplay-loot" style={{left:cue.x*tileSize+Math.cos(cue.time)*60,top:cue.y*tileSize-20-(time-cue.time)*30,opacity:1-(time-cue.time)/1.4}}>
        <SpriteBox spriteBox={entitySpriteBoxes[EntityType.TREASURE]!} seed="demo-loot"/>
      </div>)}
      <div className="autoplay-hero" data-live-hero style={{transform:`translate3d(${hx-32}px,${hy-42}px,0)`}}>
        <div style={{transform:sample.facing==='left'?'scaleX(-1)':undefined,height:'100%'}}><SpriteBox spriteBox={activeCharacter.spriteBoxes[action]} seed="demo-hero" elapsedMs={sample.age*1000+sample.index%3*180}/></div>
      </div>
    </div>
  </div>;
}
