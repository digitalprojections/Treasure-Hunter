import { EntityType, type GameState, type Tile } from '../types';
import { REQUIRED_RELIC_COUNT } from './mapGenerator';
export interface OracleClue { id: string; title: string; text: string; }
function bearing(state: GameState, tile: Tile) {
  const dx = tile.x - state.playerPos.x, dy = tile.y - state.playerPos.y;
  return `${dy < 0 ? 'north' : dy > 0 ? 'south' : ''}${dx < 0 ? 'west' : dx > 0 ? 'east' : ''}` || 'beneath your feet';
}
export function oracleClues(state: GameState): OracleClue[] {
  if (state.isGameOver) return [{ id: 'victory', title: 'The pact fulfilled', text: 'The island has yielded its secrets. A new shore awaits.' }];
  const clues: OracleClue[] = [];
  if (state.stamina <= 4) clues.push({ id: 'rest', title: 'A fading flame', text: 'Your strength runs thin. Conclude the day before venturing farther.' });
  const unlocked = state.stats.relicsCollected >= REQUIRED_RELIC_COUNT;
  const target = state.tiles.filter(t => t.entity === (unlocked ? EntityType.EXIT : EntityType.RELIC) && !t.entityFound)
    .sort((a,b) => Math.abs(a.x-state.playerPos.x)+Math.abs(a.y-state.playerPos.y)-Math.abs(b.x-state.playerPos.x)-Math.abs(b.y-state.playerPos.y))[0];
  if (target) clues.push(unlocked
    ? { id: 'escape', title: 'The passage opens', text: `The relics are united. Your ship waits ${bearing(state,target)}. Return and leave this island.` }
    : { id: `relic-${target.id}`, title: 'An ancient whisper', text: `A relic sleeps ${bearing(state,target)}, where ${target.type.replace('_',' ')} guards the old world. Seek its golden seal.` });
  const threat = state.tiles.find(t=>t.discovered && !t.visualConsumed && t.visual?.tone==='threat' && Math.abs(t.x-state.playerPos.x)+Math.abs(t.y-state.playerPos.y)<=2);
  if(threat) clues.push({id:`threat-${threat.id}`,title:'Something stirs',text:`${threat.visual!.label} waits nearby. Inspect its stamina cost before you strike.`});
  clues.push({ id: 'explore', title: 'Beyond the veil', text: 'Walk beside the mist to uncover the island. Scout reveals a wider circle around you.' });
  if(!unlocked) clues.push({ id:'collection',title:'The island’s bargain',text:`Recover ${REQUIRED_RELIC_COUNT-state.stats.relicsCollected} more relic${REQUIRED_RELIC_COUNT-state.stats.relicsCollected===1?'':'s'} to open the passage home. Treasure alone will not free you.` });
  return clues;
}
