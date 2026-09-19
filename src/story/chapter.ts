import { EntityType, TileType, type Tile, type GameState } from '../types';
import type { OracleClue } from '../utils/oracle';
export const symbols = ['moon','stag','serpent'] as const;
export type Site = 'ship'|'keeper'|'inscription'|'bridge'|'bell'|'heart';
export const sites: Site[] = ['ship','keeper','inscription','bridge','bell','heart'];
export const siteNames: Record<Site,string> = {ship:'The wreck',keeper:'Mara, the keeper',inscription:'Weathered tablet',bridge:'Broken causeway',bell:'The three bells',heart:'The heartstone'};
const positions: Record<Site,{x:number;y:number}> = {ship:{x:2,y:9},keeper:{x:2,y:6},inscription:{x:4,y:2},bridge:{x:6,y:5},bell:{x:7,y:5},heart:{x:9,y:4}};
export interface Chapter { seed:number;symbol:typeof symbols[number];pos:{x:number;y:number};health:number;light:number;inventory:{oil:number;rope:number;salt:number;bandage:number};bridge:boolean;gate:boolean;heart:boolean;savedKeeper:boolean;readTablet:boolean;status:'playing'|'dead'|'won';cause:string;journal:string[];message:string; }
export type ChapterAction = {type:'move';x:number;y:number}|{type:'choose';choice:string}|{type:'rest'};
export function sitePosition(s:Chapter,site:string){const p=positions[site as Site];return {x:s.seed%2?11-p.x:p.x,y:p.y};}
export function nearSite(s:Chapter,site:Site){const p=sitePosition(s,site);return Math.abs(s.pos.x-p.x)+Math.abs(s.pos.y-p.y)<=1;}
export function createChapter(seed:number):Chapter{return {seed,symbol:symbols[seed%3],pos:{x:seed%2?9:2,y:9},health:3,light:40,inventory:{oil:2,rope:1,salt:1,bandage:1},bridge:false,gate:false,heart:false,savedKeeper:false,readTablet:false,status:'playing',cause:'',journal:['Elin’s letter: “Do not trust the loudest voice. Find the heartstone. I am still here.”'],message:'Your sister’s letter brought you here. The wreck will not survive another tide.'};}
export function chapterTiles(s:Chapter):Tile[]{return Array.from({length:144},(_,i)=>{
 const x=i%12,y=Math.floor(i/12),cx=s.seed%2?11-x:x;
 const western=cx>=1&&cx<=5&&y>=1&&y<=10;
 const eastern=cx>=8&&cx<=10&&y>=2&&y<=9;
 const causeway=y===5&&(cx===6||cx===7);
 const lagoon=(cx===3&&(y===4||y===5||y===7))||(cx===4&&y===7);
 const land=(western||eastern||causeway)&&!lagoon;
 const type=!land?TileType.DEEP_WATER:cx===1||cx===5||y===1||y===10?TileType.SAND:(cx+y+s.seed)%4===0?TileType.FOREST:TileType.GRASS;
 const tile: Tile = {id:`story-${x}-${y}`,x,y,type,discovered:true};
 const site=sites.find(site=>{const p=positions[site];return p.x===cx&&p.y===y;});
 if(site==='keeper')tile.visual={id:'quest',label:'Mara, the keeper',tone:'landmark'};
 if(site==='ship')tile.entity=EntityType.EXIT;
 if(site==='heart'){tile.entity=EntityType.RELIC;tile.entityFound=s.heart;}
 if(site==='inscription')tile.visual={id:'roadSign',label:'Weathered tablet',tone:'landmark'};
 if(site==='bridge')tile.visual={id:'woodBridge',label:'Broken causeway',tone:'landmark'};
 if(site==='bell'){tile.visual={id:'magicGate',label:'The three bells',tone:'landmark'};tile.visualConsumed=s.gate;}
 return tile;
});}

function finish(s:Chapter):Chapter {if(s.health<=0||s.light<=0)return {...s,health:Math.max(0,s.health),light:Math.max(0,s.light),status:'dead',cause:s.health<=0?s.message:'Your last light guttered out. In the dark, the tide found you.'};return s;}
export function chapterAction(s:Chapter,a:ChapterAction):Chapter{
 if(s.status!=='playing')return s;
 if(a.type==='move'){
  if(Math.abs(a.x-s.pos.x)+Math.abs(a.y-s.pos.y)!==1)return s;
  const t=chapterTiles(s).find(t=>t.x===a.x&&t.y===a.y);if(!t||t.type===TileType.DEEP_WATER)return s;
  const canonicalX=s.seed%2?11-a.x:a.x;
  if((canonicalX===6&&!s.bridge)||(canonicalX===7&&!s.gate))return {...s,message:canonicalX===6?'The causeway has collapsed. Approach and choose how to cross.':'Three bells seal the passage. Read the evidence before choosing.'};
  return finish({...s,pos:{x:a.x,y:a.y},light:s.light-1,message:s.light<=5?'The lantern is fading. Use an oil flask before it goes dark.':s.message});
 }
 if(a.type==='rest'){if(!s.inventory.oil)return s;return {...s,light:Math.min(52,s.light+12),health:Math.min(3,s.health+1),inventory:{...s.inventory,oil:s.inventory.oil-1},message:'One oil flask spent. +12 light, +1 life. The tide offers no free rest.'};}
 const c=a.choice;
 const update=(patch:Partial<Chapter>)=>finish({...s,...patch});
 if(c==='help'&&nearSite(s,'keeper')&&!s.savedKeeper&&s.inventory.bandage)return update({savedKeeper:true,inventory:{...s.inventory,bandage:0},journal:[...s.journal,`Mara: “Elin passed safely beneath the ${s.symbol}. Ring that bell, and no other.”`],message:`Mara grips your wrist. “Your sister saved me once. The ${s.symbol} bell opens the sanctuary. The others wake the sea.”`});
 if(c==='ask'&&nearSite(s,'keeper'))return update({message:s.savedKeeper?'Mara: “Elin went below to silence the thing that speaks through the oracle. She left you a path, not a grave.”':'Mara: “I saw your sister. Help me stop the bleeding. Please. If you cannot, the old tablet knows the bells.”'});
 if(c==='read'&&nearSite(s,'inscription'))return update({readTablet:true,journal:s.readTablet?s.journal:[...s.journal,`Tablet: “Only the ${s.symbol} commands the tide. Offer what the sea leaves behind, never a living vein.”`],message:`Under the moss: “Only the ${s.symbol} commands the tide. Offer what the sea leaves behind, never a living vein.”`});
 if(c==='bandage'&&s.inventory.bandage&&s.health<3)return update({health:Math.min(3,s.health+1),inventory:{...s.inventory,bandage:0},message:'You use the only bandage. +1 life. Mara must now find another way.'});
 if(nearSite(s,'bridge')&&!s.bridge){
  if(c==='rope'&&s.inventory.rope)return update({bridge:true,inventory:{...s.inventory,rope:0},message:'You lash the broken beams. The crossing is safe in both directions.'});
  if(c==='jump')return update({bridge:true,health:s.health-1,light:s.light-4,message:'The beam breaks beneath you. You catch the far ledge and lower a plank. −1 life, −4 light.'});
 }
 if(nearSite(s,'bell')&&s.bridge&&!s.gate&&symbols.includes(c as typeof symbols[number])){
  if(c===s.symbol)return update({gate:true,journal:[...s.journal,'The true bell rings without a sound. The sanctuary door is open.'],message:'A silent vibration passes through your bones. The water parts. You chose the true bell.'});
  return update({health:s.health-2,light:s.light-4,message:'The false bell screams. A black wave strikes you against the stone. −2 life, −4 light.'});
 }
 if(nearSite(s,'heart')&&s.gate&&!s.heart){
  if(c==='salt'&&s.inventory.salt)return update({heart:true,inventory:{...s.inventory,salt:0},journal:[...s.journal,'The salt dissolved. Inside the heartstone, Elin whispered: “I am not below the island. I am inside it.”'],message:'You offer salt. The stone opens like an eye. Elin’s voice: “You found me. Now please—do not let it learn your name.”'});
  if(c==='blood')return update({health:s.health-1,message:'The altar drinks and asks for more. −1 life. The inscription forbade a living vein.'});
  if(c==='take')return update({health:s.health-2,message:'You wrench at the heartstone. Its roots close around your arm. −2 life. An offering is required.'});
 }
 if(c==='sail'&&nearSite(s,'ship')&&s.heart)return {...s,status:'won',message:s.savedKeeper?'Mara steadies the boat. Two survivors leave the shore. A third voice travels inside the stone.':'You push the boat out alone. Behind you, Mara’s lantern goes dark. Elin’s voice remains inside the stone.'};
 return s;
}
export function chapterClues(s:Chapter):OracleClue[]{
 const text=s.status==='dead'?'A life ended. The evidence remains true. Begin again with what you have learned.':s.heart?'The heart is yours. Return to the wreck. Your sister’s voice is not the only one inside.':s.light<=5?'Your flame is almost spent. Oil buys twelve more steps. Darkness grants no second chance.':!s.bridge?'A rope remembers the shore. A leap spends flesh. Both may cross; only one leaves you whole.':!s.gate?'A witness remembers; an inscription endures. Seek the keeper or the tablet before you ring a bell.':'When seawater vanishes, white crystals remain. Offer the sea’s memory, not your blood.';
 return [{id:s.status!=='playing'?s.status:s.heart?'return':s.light<=5?'warning':!s.bridge?'cross':!s.gate?'bell':'offering',title:'The bell that remembers',text}];
}
export interface Choice {id:string;label:string;cost?:string;disabled?:boolean;}
export function conversation(s:Chapter,site:Site):{speaker:string;text:string;choices:Choice[]}{
 switch(site){
 case 'keeper':return {speaker:'Mara · lighthouse keeper',text:s.savedKeeper?`“Elin carried the same look in her eyes. The ${s.symbol} bell let her pass. She told me: if my brother comes, tell him the island listens.”`:'“Don’t come closer… No. Wait. That letter. You’re Elin’s brother. I saw her at the bells. Do you have a bandage?”',choices:[{id:'help',label:'Bind her wound',cost:'1 bandage · earns her trust',disabled:s.savedKeeper||!s.inventory.bandage},{id:'ask',label:s.savedKeeper?'What was Elin looking for?':'Ask about Elin first'}]};
 case 'inscription':return {speaker:'The weathered tablet',text:'Three carved animals surround a line beneath the moss. Someone has recently traced it with a knife.',choices:[{id:'read',label:'Read the inscription',cost:'Free · recorded in your journal'}]};
 case 'bridge':return {speaker:'The broken causeway',text:s.bridge?'Your crossing holds. The bells wait beyond.':'A length of rotten timber spans the black water. A rope could hold it. You could jump, but the landing will hurt.',choices:s.bridge?[]:[{id:'rope',label:'Lash the beams',cost:'1 rope · safe crossing',disabled:!s.inventory.rope},{id:'jump',label:'Risk the leap',cost:'Lose 1 life and 4 light'}]};
 case 'bell':return {speaker:'The three bells',text:s.gate?'All three bells are still. The door stands open.':'Moon. Stag. Serpent. One opens the door. The other two call a crushing wave. Which symbol did the evidence name?',choices:s.gate?[]:symbols.map(id=>({id,label:`Ring the ${id} bell`,cost:'Wrong bell: lose 2 life and 4 light',disabled:!s.bridge}))};
 case 'heart':return {speaker:s.heart?'Elin · a voice inside the stone':'The sanctuary',text:s.heart?'“I thought I could silence it. It learned my voice instead. Take me away from here. And if you hear me calling from the water—keep rowing.”':'The heartstone rests in a bowl. Around its rim: “Return the sea to itself.” White grains sparkle in the grooves.',choices:s.heart?[]:[{id:'salt',label:'Offer your salt',cost:'1 salt',disabled:!s.inventory.salt},{id:'blood',label:'Offer a drop of blood',cost:'Lose 1 life'},{id:'take',label:'Tear the stone free',cost:'Lose 2 life'}]};
 case 'ship':return {speaker:'Elin’s letter',text:s.heart?'The boat is ready. Beyond the reef, a lighthouse blinks a signal no living keeper should know.':'“If this reaches you, I failed. Bring a rope, a little salt, and a light you can spare. Find the heartstone before the island remembers your name. —Elin”',choices:s.heart?[{id:'sail',label:'Leave the island',cost:s.savedKeeper?'Bring Mara aboard':'Sail without Mara'}]:[]};
 }
}

export function chapterGameState(s: Chapter, tiles = chapterTiles(s)): GameState {
 return { tiles, playerPos:s.pos, resources:{gold:s.inventory.oil,wood:s.inventory.rope,stone:s.inventory.salt,gems:s.inventory.bandage},stamina:s.light,maxStamina:52,stats:{treasuresFound:0,relicsCollected:s.heart?1:0,trapsTriggered:0,daysElapsed:1},isGameOver:s.status!=='playing'};
}
