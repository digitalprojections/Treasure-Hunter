import test from 'node:test';
import assert from 'node:assert/strict';
import { storyBeat } from './narrative';
import { EntityType, TileType, type GameState } from '../types';
const state = ():GameState => ({tiles:[{id:'r',x:8,y:2,type:TileType.FOREST,entity:EntityType.RELIC,discovered:false}],playerPos:{x:2,y:8},stamina:20,maxStamina:20,resources:{gold:100,wood:20,stone:10,gems:0},stats:{relicsCollected:0,treasuresFound:0,trapsTriggered:0,daysElapsed:1},isGameOver:false});
function freeze<T>(value:T):T{if(value&&typeof value==='object'){Object.freeze(value);Object.values(value).forEach(freeze);}return value;}
test('narrative reads a frozen expedition without changing map, supplies or movement',()=>{const s=freeze(state());const before=JSON.stringify(s);const beat=storyBeat(s,1);assert.ok(beat.text);assert.ok(beat.replies.length);assert.equal(JSON.stringify(s),before);});
test('story clues use the actual generated island',()=>{const beat=storyBeat(state(),1);assert.ok(beat.replies.some(r=>r.response.includes('northeast')));});
test('relic discoveries advance the narrative without introducing gates or new objectives',()=>{const s=state();const opening=storyBeat(s,1);s.stats.relicsCollected=1;const first=storyBeat(s,1);s.stats.relicsCollected=3;const last=storyBeat(s,1);assert.notEqual(opening.id,first.id);assert.match(last.text,/ship/i);assert.equal(s.isGameOver,false);});
test('only discovered nearby landmarks host local conversations',()=>{const s=state();s.tiles.push({id:'v',x:2,y:7,type:TileType.GRASS,entity:EntityType.VILLAGE,discovered:false});assert.equal(storyBeat(s,1).speaker,'Elin’s letter');s.tiles[1].discovered=true;assert.equal(storyBeat(s,1).speaker,'Mara · island keeper');});
