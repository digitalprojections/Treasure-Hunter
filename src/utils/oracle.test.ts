import test from 'node:test';
import assert from 'node:assert/strict';
import { oracleClues } from './oracle';
import { EntityType, TileType, type GameState } from '../types';
const state = (): GameState => ({ tiles: [{id:'r',x:8,y:2,type:TileType.FOREST,entity:EntityType.RELIC,discovered:false}], playerPos:{x:2,y:8}, stamina:20,maxStamina:20,resources:{gold:100,wood:20,stone:10,gems:0},stats:{relicsCollected:0,treasuresFound:0,trapsTriggered:0,daysElapsed:1},isGameOver:false });
test('oracle gives a truthful bearing without exposing coordinates or revealing tiles',()=>{const s=state();const clues=oracleClues(s);assert.match(clues[0].text,/northeast/i);assert.equal(s.tiles[0].discovered,false);assert.doesNotMatch(clues[0].text,/8|2/);});
test('collected relics are excluded and unlocked ship becomes the objective',()=>{const s=state();s.tiles[0].entityFound=true;s.stats.relicsCollected=3;s.tiles.push({id:'ship',x:0,y:8,type:TileType.SAND,entity:EntityType.EXIT,discovered:false});assert.match(oracleClues(s)[0].text,/west/);assert.equal(oracleClues(s)[0].id,'escape');});
test('low stamina warns before exploration and victory overrides warnings',()=>{const s=state();s.stamina=2;assert.equal(oracleClues(s)[0].id,'rest');s.isGameOver=true;assert.equal(oracleClues(s)[0].id,'victory');});
test('empty and exhausted maps still have useful clues',()=>{const s=state();s.tiles=[];assert.ok(oracleClues(s).length);assert.ok(oracleClues(s).every(c=>c.text.length>0));});
