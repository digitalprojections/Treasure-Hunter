import { REQUIRED_RELIC_COUNT } from './mapGenerator';
import test from 'node:test';
import assert from 'node:assert/strict';
import { EntityType, TileType, type GameState } from '../types';
import { moveHero } from './interactions';
import { discoveryRewardEffect } from './rewardFeedback';

function state(entity?: EntityType): GameState {
  return { tiles: [
    { id: 'start', x: 0, y: 0, type: TileType.GRASS, discovered: true },
    { id: 'reward', x: 1, y: 0, type: TileType.GRASS, discovered: true, entity },
  ], playerPos: { x: 0, y: 0 }, resources: { gold: 0, wood: 0, stone: 0, gems: 0 },
  stamina: 20, maxStamina: 20, stats: { treasuresFound: 0, relicsCollected: 0, trapsTriggered: 0, daysElapsed: 1 }, isGameOver: false };
}
for (const [entity, kind] of [[EntityType.RELIC, 'relic'], [EntityType.TREASURE, 'treasure'], [EntityType.TRAP, 'gem']] as const) {
  test(`${kind} discovery places themed feedback on the actual reward tile only once`, () => {
    const before = state(entity);
    const result = moveHero(before, 1, 0, () => 0);
    assert.deepEqual(discoveryRewardEffect(before, result.state, result.achievement), { tileId: 'reward', kind });
    const back = moveHero(result.state, 0, 0).state;
    const repeat = moveHero(back, 1, 0);
    assert.equal(discoveryRewardEffect(back, repeat.state, repeat.achievement), undefined);
  });
}
test('gem rewards from an altar use the same localized effect', () => {
  const before = state();
  before.tiles[1].visual = { id: 'altar', label: 'Altar', tone: 'landmark' };
  const result = moveHero(before, 1, 0);
  assert.deepEqual(discoveryRewardEffect(before, result.state, result.achievement), { tileId: 'reward', kind: 'gem' });
});
test('ordinary or rejected moves have no reward burst', () => {
  const before = state();
  const result = moveHero(before, 1, 0);
  assert.equal(discoveryRewardEffect(before, result.state), undefined);
  assert.equal(discoveryRewardEffect(before, before), undefined);
});

test('the final required relic has a distinct completion burst', () => {
  const before = state(EntityType.RELIC);
  before.stats.relicsCollected = REQUIRED_RELIC_COUNT - 1;
  const result = moveHero(before, 1, 0);
  assert.deepEqual(discoveryRewardEffect(before, result.state, result.achievement), { tileId: 'reward', kind: 'relic-complete' });
  const back = moveHero(result.state, 0, 0).state;
  const repeat = moveHero(back, 1, 0);
  assert.equal(discoveryRewardEffect(back, repeat.state, repeat.achievement), undefined);
});
