import { activeCharacter } from '../data/characters';
import { tileTerrainSpriteBoxes, entitySpriteBoxes, visualSpriteBoxes } from '../data/spriteboxes';
import { resolveSpriteBoxAsset, type SpriteBoxModule } from '../utils/spritebox';
import { createDemoLevel, sampleDemo, type DemoCue } from '../utils/demoSequence';
import { EntityType } from '../types';

const TILE=72;
const level=createDemoLevel();
const props=['altar','teleport','wolf','skeleton','falcon','deer','flower','magicTurret','goblin','orc','troll'] as const;
export async function loadDemoImages() {
  const modules=[...Object.values(tileTerrainSpriteBoxes),...Object.values(entitySpriteBoxes),...Object.values(activeCharacter.spriteBoxes),...props.map(key=>visualSpriteBoxes[key])];
  const urls=new Set(modules.flatMap(box=>box.kind==='static'?box.assets.map(a=>a.src):box.frames.map(a=>a.src)));
  const images=new Map<string,HTMLImageElement>();
  await Promise.all([...urls].map(async src=>{const image=new Image();image.src=src;await image.decode();images.set(src,image);}));
  return images;
}
export class DemoRenderer {
  private terrain=document.createElement('canvas');
  private revealAt=level.tiles.map(tile=>level.route.findIndex(p=>Math.hypot(p.x-tile.x,p.y-tile.y)<2.3));
  private camera={x:2.5*TILE,y:14.5*TILE};
  constructor(private images:Map<string,HTMLImageElement>,private cues:DemoCue[]) {
    this.terrain.width=this.terrain.height=18*TILE;
    const ctx=this.terrain.getContext('2d')!;
    for(const tile of level.tiles){this.sprite(ctx,tileTerrainSpriteBoxes[tile.type],tile.id,0,tile.x*TILE,tile.y*TILE,TILE,TILE);}
  }
  private sprite(ctx:CanvasRenderingContext2D,box:SpriteBoxModule,seed:string,time:number,x:number,y:number,w:number,h:number){
    const image=this.images.get(resolveSpriteBoxAsset(box,seed,time).src);if(image)ctx.drawImage(image,x,y,w,h);
  }
  draw(ctx:CanvasRenderingContext2D,width:number,height:number,time:number,dt:number,reduced:boolean,snap=false){
    const sample=sampleDemo(this.cues,time),hx=(sample.x+.5)*TILE,hy=(sample.y+.5)*TILE;
    const energy=sample.energy;
    const zoom=Math.min(1.22,Math.max(.86,width/1000))*(reduced?1:1+Math.sin(time*.38)*.035);
    const lookX=reduced?0:Math.sin(time*.31)*24,lookY=reduced?0:Math.cos(time*.27)*14;
    const ease=snap||reduced?1:1-Math.exp(-Math.min(dt,.05)*4.2);
    this.camera.x+=(hx+lookX-this.camera.x)*ease;this.camera.y+=(hy+lookY-this.camera.y)*ease;
    ctx.fillStyle='#06151e';ctx.fillRect(0,0,width,height);
    ctx.save();ctx.translate(width/2,height*.51);ctx.scale(zoom,zoom);ctx.translate(-this.camera.x,-this.camera.y);
    ctx.drawImage(this.terrain,0,0);
    // Soft unexplored mist recedes along the authored route.
    for(const [tileIndex,tile] of level.tiles.entries()){
      const distance=Math.hypot(tile.x-sample.x,tile.y-sample.y);
      const seen=this.revealAt[tileIndex]>=0&&this.revealAt[tileIndex]<=sample.routeIndex;
      ctx.fillStyle=`rgba(5,18,27,${seen?.15:Math.min(.88,Math.max(.1,(distance-1.5)*.13))})`;
      ctx.fillRect(tile.x*TILE,tile.y*TILE,TILE+.5,TILE+.5);
      if(!tile.entity && tile.x>1&&tile.y>1&&tile.x<16&&tile.y<16 && (tile.x*13+tile.y*7)%13===0){
        ctx.globalAlpha=seen?.8:.25;
        this.sprite(ctx,visualSpriteBoxes[props[(tile.x+tile.y)%props.length]],tile.id,time*1000,tile.x*TILE,tile.y*TILE,TILE,TILE);ctx.globalAlpha=1;
      }
    }
    // Ancient route illuminated behind the expedition.
    ctx.beginPath();level.route.slice(0,sample.routeIndex+1).forEach((p,i)=>{if(i===0)ctx.moveTo((p.x+.5)*TILE,(p.y+.5)*TILE);else ctx.lineTo((p.x+.5)*TILE,(p.y+.5)*TILE);});
    ctx.strokeStyle='#66dbc4';ctx.lineWidth=2;ctx.globalAlpha=.3;ctx.stroke();ctx.globalAlpha=1;
    for(const landmark of level.landmarks){
      const at=level.route.findIndex(p=>p.x===landmark.x&&p.y===landmark.y);
      const recovered=landmark.entity===EntityType.RELIC?this.cues.some(c=>c.event==='relic'&&c.x===landmark.x&&c.y===landmark.y&&c.time<=time):landmark.entity!==EntityType.EXIT&&sample.routeIndex>=at;
      const x=(landmark.x+.5)*TILE,y=(landmark.y+.5)*TILE;
      if(recovered)continue;
      ctx.save();ctx.translate(x,y);
      const color=landmark.entity===EntityType.RELIC?'#83f6e0':'#f4c77b';
      ctx.strokeStyle=color;ctx.shadowColor=color;ctx.shadowBlur=18;
      ctx.globalAlpha=.35+(reduced?0:sample.pulse*.2);
      ctx.beginPath();ctx.ellipse(0,16,30,12,0,0,Math.PI*2);ctx.stroke();
      if(landmark.entity===EntityType.RELIC){const light=ctx.createLinearGradient(0,-190,0,20);light.addColorStop(0,'#82f9df00');light.addColorStop(1,'#82f9df66');ctx.fillStyle=light;ctx.fillRect(-16,-190,32,210);}
      ctx.globalAlpha=1;ctx.shadowBlur=0;
      this.sprite(ctx,entitySpriteBoxes[landmark.entity]!,`demo-${landmark.entity}`,time*1000,-32,-40,64,64);ctx.restore();
    }
    // Deterministic beat particles: seeking reconstructs the same scene, with bounded work.
    if(!reduced)for(let j=Math.max(0,sample.index-9);j<=sample.index;j++){
      const cue=this.cues[j],age=time-cue.time;if(age<0||age>2.5)continue;
      const major=cue.event==='spell'||cue.event==='relic'||cue.event==='escape';
      const count=major?100:cue.event==='fight'?42:28;
      const life=major?1.9:1.1;if(age>life)continue;
      const spread=cue.event==='treasure'?70:0;
      const x=(cue.x+.5)*TILE+Math.cos(j*2.4)*spread,y=(cue.y+.5)*TILE+Math.sin(j*2.4)*spread;
      const color=cue.event==='relic'||cue.event==='escape'?'#ffe5a4':cue.event==='spell'?'#b5a0ff':cue.event==='fight'?'#ffa36e':'#71e8d0';
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=color;ctx.fillStyle=color;
      if(major||j%4===0){ctx.globalAlpha=(1-age/life)*.55;ctx.lineWidth=major?2.5:1;ctx.beginPath();ctx.ellipse(x,y+16,12+age*(major?230:95),6+age*(major?115:46),0,0,Math.PI*2);ctx.stroke();}
      if(major){
        const radius=65+age*125;
        ctx.save();ctx.translate(x,y);ctx.scale(1,.58);ctx.rotate(age*.3);
        ctx.globalAlpha=Math.max(0,1-age/life)*.5;ctx.lineWidth=1.5;
        for(let ring=0;ring<2;ring++){
          ctx.beginPath();ctx.arc(0,0,radius+ring*18,0,Math.PI*2);ctx.stroke();
        }
        for(let rune=0;rune<12;rune++){
          const a=rune*Math.PI/6;ctx.save();ctx.rotate(a);ctx.strokeRect(radius-8,-4,8,8);ctx.restore();
        }
        if(cue.event==='spell'||cue.event==='relic'||cue.event==='escape'){
          ctx.beginPath();for(let star=0;star<=6;star++){
            const a=star*Math.PI*2/3;const px=Math.cos(a)*radius,py=Math.sin(a)*radius;
            if(star===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
          }ctx.stroke();
        }
        ctx.restore();
      }
      if(cue.event==='spell'||cue.event==='escape'){
        for(let ray=0;ray<5;ray++){
          const a=ray*Math.PI*2/5+j,px=x+Math.cos(a)*170,py=y+Math.sin(a)*100;
          const beam=ctx.createLinearGradient(px,py-250,px,py);
          beam.addColorStop(0,'#ad9cff00');beam.addColorStop(1,'#ad9cffaa');
          ctx.globalAlpha=Math.max(0,1-age/life)*.55;ctx.fillStyle=beam;ctx.fillRect(px-5,py-250,10,250);
        }ctx.fillStyle=color;
      }
      for(let k=0;k<count;k++){
        const angle=k*2.399963+j*.71, speed=(major?170:80)+(k%7)*15;
        const px=x+Math.cos(angle)*age*speed,py=y+Math.sin(angle)*age*speed*.55-age*36;
        ctx.globalAlpha=(1-age/life)*(.35+cue.energy*.55);ctx.beginPath();
        if(cue.event==='treasure'){
          ctx.save();ctx.translate(px,py);ctx.rotate(angle+age*4);ctx.fillRect(-3,-3,6,6);ctx.restore();
        }else {ctx.arc(px,py,major?3:2,0,Math.PI*2);ctx.fill();}
        if(major&&k%4===0){ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px-Math.cos(angle)*14,py-Math.sin(angle)*7);ctx.stroke();}
      }ctx.restore();
    }
    // New enemy squads arrive on accented beats; their charge, hit and defeat coexist.
    const waves=this.cues.slice(Math.max(0,sample.index-5),sample.index+1).filter(c=>c.event==='fight'&&time-c.time<1.65);
    for(const wave of waves){
      const age=time-wave.time,waveIndex=this.cues.indexOf(wave),squad=energy>.75?3:2;
      const originX=(wave.x+.5)*TILE,originY=(wave.y+.5)*TILE;
      for(let foe=0;foe<squad;foe++){
        const angle=waveIndex*1.7+foe*Math.PI*2/squad;
        const charge=Math.max(0,1-age/.65),knockback=Math.max(0,age-.72)*100;
        const distance=65+charge*130+knockback;
        const ex=originX+Math.cos(angle)*distance,ey=originY+Math.sin(angle)*distance*.65;
        const enemy=(['skeleton','wolf','goblin','orc','troll'] as const)[(waveIndex+foe)%5];
        const size=enemy==='troll'?102:76;
        ctx.save();ctx.globalAlpha=Math.min(1,age*8)*Math.max(0,1-Math.max(0,age-.9)/.75);
        this.sprite(ctx,visualSpriteBoxes[enemy],`foe-${waveIndex}-${foe}`,age*1000,ex-size/2,ey-size*.65,size,size);
        if(!reduced&&age>.2){
          ctx.globalCompositeOperation='lighter';ctx.strokeStyle=foe%2?'#a2ffff':'#ffd28a';ctx.lineWidth=2.5;
          ctx.beginPath();ctx.moveTo(hx,hy-10);
          for(let segment=1;segment<=6;segment++){
            const f=segment/6;ctx.lineTo(hx+(ex-hx)*f+Math.sin(segment*13+time*20)*12,hy+(ey-hy)*f-10+Math.cos(segment*7)*9);
          }ctx.stroke();ctx.fillStyle='#ffe6bd';ctx.beginPath();ctx.arc(ex,ey,8+(age% .2)*30,0,Math.PI*2);ctx.fill();
        }ctx.restore();
      }
    }
    // Treasure chests erupt, then gem trails arc back to the running hero.
    if(!reduced)for(const cue of this.cues.slice(Math.max(0,sample.index-3),sample.index+1).filter(c=>c.event==='treasure')){
      const age=time-cue.time;if(age>1.2)continue;
      const angle=this.cues.indexOf(cue)*2.4;
      const x=(cue.x+.5)*TILE+Math.cos(angle)*95,y=(cue.y+.5)*TILE+Math.sin(angle)*65;
      ctx.save();ctx.globalAlpha=Math.max(0,1-age/1.2);
      this.sprite(ctx,entitySpriteBoxes[EntityType.TREASURE]!,`loot-${cue.time}`,0,x-24,y-34-age*24,48,48);
      ctx.strokeStyle='#f9d07c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo((x+hx)/2,y-90,hx,hy-20);ctx.stroke();ctx.restore();
    }
    const activeEvent=this.cues.slice(Math.max(0,sample.index-4),sample.index+1).reverse().find(c=>c.event&&time-c.time<1.5);
    // Hero remains crisp in front of the spell work.
    ctx.save();ctx.translate(hx,hy);ctx.fillStyle='#020b18aa';ctx.beginPath();ctx.ellipse(0,24,23,9,0,0,Math.PI*2);ctx.fill();
    if(sample.facing==='left')ctx.scale(-1,1);
    const action=waves.length?'attack':sample.event==='escape'?'escape':sample.event==='relic'&&sample.age<.8?'collect':sample.event==='spell'&&sample.age<.7?'scout':sample.moving?'walk':'idle';
    this.sprite(ctx,activeCharacter.spriteBoxes[action],'demo-hero',(sample.age*1000+sample.index%3*180),-38,-47,76,76);ctx.restore();
    // Orbiting relics accumulate over the journey.
    for(let k=0;k<sample.relics;k++){
      const a=(reduced?0:time*.7)+k*Math.PI*2/3;
      const x=hx+Math.cos(a)*47,y=hy-38+Math.sin(a)*15;
      ctx.fillStyle='#a2ffed';ctx.shadowColor='#72fadc';ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(x,y-7);ctx.lineTo(x+5,y);ctx.lineTo(x,y+7);ctx.lineTo(x-5,y);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
    }
    ctx.restore();
    // Foreground sea spray and vignette, no full-screen flashes.
    if(!reduced){ctx.fillStyle='#9edacc';for(let i=0;i<34;i++){ctx.globalAlpha=.12+(i%4)*.05;ctx.beginPath();ctx.arc((i*137+time*(4+i%5))%width,(i*97-time*10+height*100)%height,1+i%2,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}
    const vignette=ctx.createRadialGradient(width/2,height/2,height*.15,width/2,height/2,Math.max(width,height)*.67);vignette.addColorStop(0,'#020b1400');vignette.addColorStop(1,'#020b14e8');ctx.fillStyle=vignette;ctx.fillRect(0,0,width,height);
    return sample;
  }
}
