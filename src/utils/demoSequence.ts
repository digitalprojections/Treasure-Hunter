import { TileType, EntityType, type Tile } from '../types';
export type Beat = { time: number; strength: number; energy: number };
export type DemoCue = Beat & { x: number; y: number; routeIndex: number; event?: 'relic' | 'treasure' | 'spell' | 'fight' | 'escape'; relics: number; chapter: string };
export const DEMO_SIZE = 18;
const waypoints = [[2,14],[2,10],[5,10],[5,5],[2,5],[2,2],[8,2],[8,6],[5,6],[5,9],[10,9],[10,3],[14,3],[14,7],[11,7],[11,11],[15,11],[15,15],[11,15],[11,12],[8,12],[8,15],[2,15],[2,14]];
export function createDemoLevel() {
  const route = [{x:2,y:14}];
  for(const [x,y] of waypoints.slice(1)) {
    let current = route.at(-1)!;
    while(current.x !== x || current.y !== y) {
      current = {x: current.x + Math.sign(x-current.x), y: current.y + (current.x === x ? Math.sign(y-current.y) : 0)};
      route.push(current);
    }
  }
  const landmarks = [{x:8,y:2,entity:EntityType.RELIC},{x:14,y:3,entity:EntityType.RELIC},{x:15,y:15,entity:EntityType.RELIC},
    {x:5,y:5,entity:EntityType.TREASURE},{x:10,y:9,entity:EntityType.TREASURE},{x:2,y:14,entity:EntityType.EXIT}];
  const path = new Set(route.map(p=>`${p.x},${p.y}`));
  const tiles: Tile[] = Array.from({length:324},(_,i)=>{
    const x=i%18,y=Math.floor(i/18),onPath=path.has(`${x},${y}`);
    const edge=Math.min(x,y,17-x,17-y);
    const type=edge===0?TileType.DEEP_WATER:edge===1?TileType.WATER:onPath?TileType.SAND:
      x>10&&y<9?TileType.MOUNTAIN:(x*7+y*11)%5<3?TileType.FOREST:TileType.GRASS;
    const entity=landmarks.find(p=>p.x===x&&p.y===y)?.entity;
    return {id:`demo-${x}-${y}`,x,y,type,entity,discovered:true};
  });
  return {route,tiles,landmarks};
}
export function createDemoSequence(beats: readonly Beat[]): DemoCue[] {
  const {route,landmarks}=createDemoLevel();
  if(beats.length < route.length*2) throw new Error('The theme needs at least two beats per route step');
  let previous=-1,relics=0;
  return beats.map((beat,i)=>{
    const routeIndex=Math.floor(Math.floor(i/2)/Math.floor((beats.length-1)/2)*(route.length-1));
    const pos=route[routeIndex];
    const arrived=routeIndex!==previous; previous=routeIndex;
    const landmark=landmarks.find(p=>p.x===pos.x&&p.y===pos.y);
    const event:DemoCue['event']=arrived&&routeIndex>0&&landmark?.entity===EntityType.RELIC?'relic':
      arrived&&routeIndex===route.length-1?'escape':arrived&&landmark?.entity===EntityType.TREASURE?'treasure':
      i>0&&i%32===0?'spell':i>0&&i%16===0?'fight':i>0&&i%8===0?'treasure':undefined;
    if(event==='relic') relics++;
    const chapter=relics===0?'The waking shore':relics===1?'Echoes of the grove':relics===2?'The shattered sanctuary':'The homeward tide';
    return {...beat,...pos,routeIndex,event,relics,chapter};
  });
}
export function sampleDemo(cues: readonly DemoCue[], time: number) {
  let lo=0,hi=cues.length;
  while(lo<hi){const mid=(lo+hi)>>>1;if(cues[mid].time<=time)lo=mid+1;else hi=mid;}
  const index=Math.max(0,lo-1),cue=cues[index];
  let next=index+1;
  while(next<cues.length&&cues[next].routeIndex===cue.routeIndex)next++;
  const destination=cues[next]??cue;
  const span=Math.min(.62,Math.max(.001,destination.time-cue.time));
  const progress=destination===cue?0:Math.max(0,Math.min(1,(time-(destination.time-span))/span));
  const eased=progress*progress*(3-2*progress);
  return {...cue,index,x:cue.x+(destination.x-cue.x)*eased,y:cue.y+(destination.y-cue.y)*eased,
    moving:progress>0&&progress<1,facing:destination.x<cue.x?'left':'right',
    pulse:time<cue.time?0:Math.exp(-(time-cue.time)*5),age:Math.max(0,time-cue.time)};
}
