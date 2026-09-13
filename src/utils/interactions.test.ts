import test from 'node:test';
import assert from 'node:assert/strict';
import { EntityType, TileType, type GameState, type Tile, type TileVisualId } from '../types';
import { moveHero } from './interactions';
const tile = (x: number, extra: Partial<Tile> = {}): Tile => ({ id: `${x}-0`, x, y: 0, type: TileType.GRASS, discovered: true, ...extra });
function state(extra: Partial<Tile> = {}): GameState {
  return { tiles: [tile(0), tile(1, extra)], playerPos: { x: 0, y: 0 }, resources: { gold: 100, wood: 20, stone: 10, gems: 2 }, stamina: 20, maxStamina: 20, stats: { treasuresFound: 0, relicsCollected: 0, trapsTriggered: 0, daysElapsed: 1 }, isGameOver: false };
}
const visual = (id: TileVisualId) => ({ id, label: id, tone: 'landmark' as const });
test('combat spends stamina, awards loot once and clears the enemy', () => {
  const initial = state({ visual: visual('goblin') });
  const result = moveHero(initial, 1, 0);
  assert.equal(result.state.stamina, 16);
  assert.equal(result.state.resources.gold, 112);
  assert.equal(result.state.tiles[1].visualConsumed, true);
  const returned = moveHero(moveHero(result.state, 0, 0).state, 1, 0);
  assert.equal(returned.state.resources.gold, 112);
  assert.equal(initial.stamina, 20);
});
test('insufficient combat stamina blocks movement and loot without mutations', () => {
  const initial = { ...state({ visual: visual('troll') }), stamina: 2 };
  const result = moveHero(initial, 1, 0);
  assert.equal(result.state, initial);
  assert.match(result.message, /stamina/i);
});
test('resource piles grant supplies once', () => {
  const first = moveHero(state({ visual: visual('wood') }), 1, 0);
  assert.equal(first.state.resources.wood, 28);
  assert.equal(moveHero(moveHero(first.state, 0, 0).state, 1, 0).state.resources.wood, 28);
});
test('barriers require supplies and stay passable once cleared', () => {
  const initial = state({ visual: visual('ironGate') });
  initial.resources.stone = 0;
  assert.equal(moveHero(initial, 1, 0).state, initial);
  initial.resources.stone = 5;
  const result = moveHero(initial, 1, 0);
  assert.equal(result.state.resources.stone, 0);
  assert.equal(result.state.tiles[1].visualConsumed, true);
});
test('recovery respects maximum stamina and cannot be farmed', () => {
  const first = moveHero(state({ visual: visual('well') }), 1, 0);
  assert.equal(first.state.stamina, 20);
  const again = moveHero(moveHero(first.state, 0, 0).state, 1, 0);
  assert.equal(again.state.stamina, 18);
});
test('traps cannot make gold negative, treasure rewards trigger only once', () => {
  const initial = state({ entity: EntityType.TRAP }); initial.resources.gold = 0;
  assert.equal(moveHero(initial, 1, 0).state.resources.gold, 0);
  const treasure = moveHero(state({ entity: EntityType.TREASURE }), 1, 0, () => 0);
  assert.equal(treasure.state.resources.gold, 120);
  assert.equal(treasure.achievement, 'treasure_found');
  assert.equal(moveHero(moveHero(treasure.state, 0, 0).state, 1, 0).achievement, undefined);
});
test('exit stays usable after early visit and escape locks further moves', () => {
  const early = moveHero(state({ entity: EntityType.EXIT }), 1, 0);
  assert.equal(early.state.tiles[1].entityFound, undefined);
  const ready = moveHero(early.state, 0, 0).state; ready.stats.relicsCollected = 3;
  const escaped = moveHero(ready, 1, 0);
  assert.equal(escaped.achievement, 'island_escape');
  assert.equal(escaped.state.isGameOver, true);
  assert.equal(moveHero(escaped.state, 0, 0).state, escaped.state);
});
test('deep water, distant tiles, same position and exhaustion reject movement', () => {
  for (const s of [state({ type: TileType.DEEP_WATER }), { ...state(), stamina: 0 }]) assert.equal(moveHero(s, 1, 0).state, s);
  const s = state(); assert.equal(moveHero(s, 4, 0).state, s); assert.equal(moveHero(s, 0, 0).state, s);
});
test('relics reveal extraction and remain one-time rewards', () => {
  const s = state({ entity: EntityType.RELIC }); s.tiles.push(tile(2, { entity: EntityType.EXIT, discovered: false })); s.stats.relicsCollected = 2;
  const result = moveHero(s, 1, 0);
  assert.equal(result.state.stats.relicsCollected, 3);
  assert.equal(result.state.tiles[2].discovered, true);
});
test('survey objects reveal nearby tiles and portals travel only to discovered partners', () => {
  const s = state({ visual: visual('roadSign') }); s.tiles.push(tile(3, { discovered: false }));
  assert.equal(moveHero(s, 1, 0).state.tiles[2].discovered, true);
  const p = state({ visual: visual('teleport') });
  p.tiles.push(tile(5, { visual: visual('teleport'), discovered: false }));
  assert.deepEqual(moveHero(p, 1, 0).state.playerPos, { x: 1, y: 0 });
  p.tiles[2].discovered = true;
  assert.deepEqual(moveHero(p, 1, 0).state.playerPos, { x: 5, y: 0 });
});
test('ordinary forest movement cannot farm wood and costs only stamina', () => {
  const s = state({ type: TileType.FOREST }); s.resources.gold = 0;
  const result = moveHero(s, 1, 0);
  assert.equal(result.state.resources.wood, 20);
  assert.equal(result.state.stamina, 19);
});
