import { EntityType, type GameState } from '../types';
import { oracleClues } from '../utils/oracle';
import { REQUIRED_RELIC_COUNT } from '../utils/mapGenerator';
export interface StoryReply {label:string;response:string;}
export interface StoryBeat {id:string;speaker:string;text:string;replies:StoryReply[];}
/** Narrative observes the expedition. It never issues game actions or changes tiles. */
export function storyBeat(state:GameState,island:number):StoryBeat {
 const clue=oracleClues(state).find(c=>c.id.startsWith('relic-')||c.id==='escape')?.text??'Follow the edge of the mist. The oracle reads the island as you uncover it.';
 const replies:StoryReply[]=[{label:'What should I look for?',response:clue},{label:'Why did Elin come here?',response:'“She heard someone calling from a stone. A familiar voice. She came to find its owner. Now the stones answer in hers.”'}];
 const count=state.stats.relicsCollected;
 if(state.isGameOver)return {id:`${island}:escape`,speaker:'Elin · through the oracle',text:'“Keep rowing. If you hear me calling from the water, do not turn around.” Beyond the reef, another island answers.',replies:[{label:'I will find you.',response:'For a moment, the voice sounds like your sister again. “Then follow the light.”'}]};
 if(count>=REQUIRED_RELIC_COUNT)return {id:`${island}:return`,speaker:'Elin · through the oracle',text:'“The relics can carry my voice beyond this shore. Return to your ship. I will tell you what happened when the sea can no longer hear.”',replies};
 if(count===2)return {id:`${island}:second`,speaker:'A memory in the relic',text:'Mara’s voice breaks through the static: “Elin was not trying to take the island’s treasure. She was trying to wake someone beneath it.”',replies};
 if(count===1)return {id:`${island}:first`,speaker:'Elin · a distant voice',text:'“You found one. I knew you would.” The voice catches. “There are pieces of me in these stones. Please, keep looking.”',replies};
 const nearby=state.tiles.find(t=>t.discovered && Math.max(Math.abs(t.x-state.playerPos.x),Math.abs(t.y-state.playerPos.y))<=1&&(t.entity===EntityType.VILLAGE||t.visual?.id==='village'||t.entity===EntityType.RUIN||t.visual?.id==='roadSign'||t.visual?.id==='quest'));
 if(nearby){const keeper=nearby.entity===EntityType.VILLAGE||nearby.visual?.id==='village'||nearby.visual?.id==='quest';return {id:`${island}:landmark:${nearby.id}`,speaker:keeper?'Mara · island keeper':'A note in Elin’s hand',text:keeper?'“That letter… you are her family. Elin passed this way. She told me you would follow, even if she asked you not to.”':'“The island changes, but its relics remember. Trust what you can observe. The oracle points toward what is still missing.”',replies:[{label:keeper?'Did she leave a clue?':'Read the margin',response:clue},{label:keeper?'What happened to her?':'Read the final line',response:'“I heard my own voice beneath the ruins. It was asking to be let out. I had not spoken.”'}]};}
 return {id:`${island}:letter`,speaker:'Elin’s letter',text:island<=1?'“If this reaches you, follow the relics. I thought the island was keeping something prisoner. Now I think it was keeping something safe. —Elin”':'On this new shore, the oracle repeats a phrase from Elin’s letter: “The island changes. What it remembers does not.”',replies};
}
