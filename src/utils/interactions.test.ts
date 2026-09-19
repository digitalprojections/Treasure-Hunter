import test from 'node:test';
import assert from 'node:assert/strict';
import { EntityType, TileType, type GameState, type Tile, type TileVisualId } from '../types';
import { moveHero, describeInteraction } from './interactions';
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
  assert.deepEqual(result.state.playerPos, initial.playerPos);
  assert.equal(result.animation, 'attack');
  assert.equal(result.combatTargetId, '1-0');
  const returned = moveHero(moveHero(result.state, 0, 0).state, 1, 0);
  assert.equal(returned.state.resources.gold, 112);
  assert.equal(initial.stamina, 20);
});

test('diagonal combat stays in place and a later click enters the cleared tile', () => {
  const initial = state({ visual: visual('wolf') });
  initial.tiles[1].y = 1;
  const result = moveHero(initial, 1, 1);
  assert.deepEqual(result.state.playerPos, { x: 0, y: 0 });
  assert.equal(result.state.resources.gold, 112);
  const next = moveHero(result.state, 1, 1);
  assert.deepEqual(next.state.playerPos, { x: 1, y: 1 });
  assert.equal(next.state.resources.gold, 112);
  assert.equal(next.combatTargetId, undefined);
});

test('distant enemy clicks do not initiate combat or spend stamina', () => {
  const initial = state({ visual: visual('goblin') });
  initial.tiles[1].x = 2;
  assert.equal(moveHero(initial, 2, 0).state, initial);
  assert.equal(moveHero(initial, 2, 0).combatTargetId, undefined);
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
test('trapped caches randomly trade stamina for gems exactly once', () => {
  const initial = state({ entity: EntityType.TRAP });
  assert.match(describeInteraction(initial.tiles[1]), /1–3 gems.*2–5 stamina/i);
  const first = moveHero(initial, 1, 0, () => 0);
  assert.equal(first.state.resources.gold, 100);
  assert.equal(first.state.resources.gems, 3);
  assert.equal(first.state.stamina, 18);
  assert.equal(first.state.stats.trapsTriggered, 1);
  assert.equal(first.animation, 'collect');
  const again = moveHero(moveHero(first.state, 0, 0).state, 1, 0);
  assert.equal(again.state.resources.gold, 100);
  assert.equal(again.state.resources.gems, 3);
  assert.equal(again.state.stamina, 16);
  assert.equal(initial.resources.gold, 100);
});

test('cache trade with insufficient stamina leaves all state untouched', () => {
  const initial = state({ entity: EntityType.TRAP }); initial.stamina = 2;
  assert.equal(moveHero(initial, 1, 0).state, initial);
});

test('an undiscovered cache is revealed before any trade is charged', () => {
  const initial = state({ entity: EntityType.TRAP, discovered: false });
  const revealed = moveHero(initial, 1, 0).state;
  assert.deepEqual(revealed.playerPos, initial.playerPos);
  assert.equal(revealed.resources.gold, 100);
  assert.equal(revealed.stamina, 20);
  assert.equal(revealed.tiles[1].discovered, true);
  assert.equal(revealed.tiles[1].entityFound, undefined);
});

test('treasure rewards trigger only once', () => {
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

test('strange markers can reward or lose gold, exactly once without negative balances', () => {
  const initial = state({ visual: visual('random') });
  assert.match(describeInteraction(initial.tiles[1]), /gain.*lose.*20 gold/i);
  const win = moveHero(initial, 1, 0, () => 0);
  assert.equal(win.state.resources.gold, 120);
  const loss = moveHero(initial, 1, 0, () => 1);
  assert.equal(loss.state.resources.gold, 80);
  assert.equal(loss.state.stamina, 19);
  assert.equal(loss.state.tiles[1].visualConsumed, true);
  assert.equal(moveHero(moveHero(loss.state, 0, 0).state, 1, 0, () => 0).state.resources.gold, 80);
  initial.resources.gold = 5;
  assert.equal(moveHero(initial, 1, 0, () => 1).state.resources.gold, 0);
});

test('skull rolls stay within both ranges and require the maximum possible cost', () => {
  const initial = state({ entity: EntityType.TRAP });
  const high = moveHero(initial, 1, 0, () => 1);
  assert.equal(high.state.resources.gems, 5);
  assert.equal(high.state.stamina, 15);
  initial.stamina = 4;
  assert.equal(moveHero(initial, 1, 0, () => { throw new Error('Must not roll before accepting'); }).state, initial);
});
