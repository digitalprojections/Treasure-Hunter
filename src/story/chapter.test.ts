import test from 'node:test';
import assert from 'node:assert/strict';
import { chapterGameState, chapterTiles, createChapter, chapterAction, sitePosition, type Chapter } from './chapter';
function at(s:Chapter,site:string){return {...s,pos:sitePosition(s,site)};}
for(let seed=0;seed<6;seed++)test(`chapter ${seed}: evidence-led choices can win with finite supplies`,()=>{
 let s=createChapter(seed);
 s=chapterAction(at(s,'keeper'),{type:'choose',choice:'help'});
 assert.equal(s.inventory.bandage,0);assert.ok(s.journal.some(t=>t.includes(s.symbol)));
 s=chapterAction(at(s,'bridge'),{type:'choose',choice:'rope'});
 s=chapterAction(at(s,'bell'),{type:'choose',choice:s.symbol});
 s=chapterAction(at(s,'heart'),{type:'choose',choice:'salt'});
 s=chapterAction(at(s,'ship'),{type:'choose',choice:'sail'});
 assert.equal(s.status,'won');assert.equal(s.savedKeeper,true);
});
test('wrong bells hurt and repeated mistakes visibly end the run',()=>{let s=createChapter(0);s={...at(s,'bell'),bridge:true};const wrong=s.symbol==='moon'?'stag':'moon';s=chapterAction(s,{type:'choose',choice:wrong});assert.equal(s.health,1);s=chapterAction(s,{type:'choose',choice:wrong});assert.equal(s.status,'dead');assert.match(s.cause,/bell/i);assert.equal(chapterAction(s,{type:'rest'}),s);});
test('cannot choose remotely, bypass gates, or spend supplies twice',()=>{let s=createChapter(0);assert.equal(chapterAction(s,{type:'choose',choice:'salt'}),s);s=at(s,'bridge');s=chapterAction(s,{type:'choose',choice:'rope'});const rope=s.inventory.rope;s=chapterAction(s,{type:'choose',choice:'rope'});assert.equal(s.inventory.rope,rope);s=createChapter(0);const bridge=sitePosition(s,'bridge');s={...s,pos:{x:bridge.x-1,y:bridge.y}};assert.equal(chapterAction(s,{type:'move',...bridge}).pos,s.pos);});
test('light exhaustion kills; finite oil cannot create infinite rest',()=>{let s=createChapter(0);s={...s,light:1};s=chapterAction(s,{type:'move',x:s.pos.x,y:s.pos.y-1});assert.equal(s.status,'dead');let r=createChapter(0);r=chapterAction({...r,light:3},{type:'rest'});assert.equal(r.inventory.oil,1);r=chapterAction(r,{type:'rest'});assert.equal(r.inventory.oil,0);assert.equal(chapterAction(r,{type:'rest'}),r);});
test('generation is deterministic, varies symbols and mirrors geography',()=>{assert.deepEqual(createChapter(5),createChapter(5));assert.notEqual(createChapter(0).symbol,createChapter(1).symbol);assert.notDeepEqual(sitePosition(createChapter(0),'ship'),sitePosition(createChapter(1),'ship'));});

for(let seed=0;seed<6;seed++)test(`full walking route remains solvable on tide ${seed}`,()=>{
 let s=createChapter(seed);
 function walk(cx:number,y:number){const x=seed%2?11-cx:cx;let budget=100;while((s.pos.x!==x||s.pos.y!==y)&&budget--){const next=s.pos.y!==y?{x:s.pos.x,y:s.pos.y+Math.sign(y-s.pos.y)}:{x:s.pos.x+Math.sign(x-s.pos.x),y:s.pos.y};const before=s.pos;s=chapterAction(s,{type:'move',...next});assert.notDeepEqual(s.pos,before,'route must be traversable');assert.equal(s.status,'playing');}assert.ok(budget>0);}
 walk(2,6);s=chapterAction(s,{type:'choose',choice:'help'});
 walk(2,2);walk(4,2);s=chapterAction(s,{type:'choose',choice:'read'});
 walk(5,2);walk(5,5);s=chapterAction(s,{type:'choose',choice:'rope'});
 walk(6,5);s=chapterAction(s,{type:'choose',choice:s.symbol});
 walk(8,5);walk(9,5);s=chapterAction(s,{type:'choose',choice:'salt'});
 walk(5,5);walk(5,9);walk(2,9);s=chapterAction(s,{type:'choose',choice:'sail'});
 assert.equal(s.status,'won');assert.ok(s.light>0);assert.equal(s.inventory.oil,2);
});

test('full-size islands allow several first moves and alternative paths',()=>{const s=createChapter(0);assert.equal(chapterTiles(s).length,144);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])assert.notEqual(chapterAction(s,{type:'move',x:s.pos.x+dx,y:s.pos.y+dy}).pos,s.pos);});

test('original UI adapter preserves tile identity and translates survival supplies',()=>{const s=createChapter(0);const g=chapterGameState(s);const moved=chapterAction(s,{type:'move',x:2,y:8});const next=chapterGameState(moved,g.tiles);assert.equal(next.tiles,g.tiles);assert.equal(next.stamina,39);assert.deepEqual(next.resources,{gold:2,wood:1,stone:1,gems:1});assert.equal(chapterGameState({...s,status:'dead'}).isGameOver,true);});
