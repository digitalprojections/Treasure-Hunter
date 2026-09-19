import test from 'node:test';
import assert from 'node:assert/strict';
import { getActorIdleDuration } from './actorIdle';
import { createLooperSpriteBox, createSpriteAsset } from './spritebox';
import { TileType, type Tile } from '../types';
import { advanceIdlePlayback, createIdlePlayback } from './idlePlayback';

const enemy: Tile = { id: '1-1', x: 1, y: 1, type: TileType.GRASS, discovered: true,
  visual: { id: 'goblin', label: 'Goblin', tone: 'threat' } };
const clip = createLooperSpriteBox('enemy.goblin.idle', 'Goblin', [createSpriteAsset('/a', 'idle_001'), createSpriteAsset('/b', 'idle_002')], 140);

test('wildlife shares randomized idle playback but explicit actions and consumed animals do not', () => {
  for (const id of ['boar', 'deer', 'falcon', 'fish', 'rabbit', 'turtle'] as const) {
    const animal: Tile = { ...enemy, visual: { id, label: id, tone: 'wildlife' } };
    assert.equal(getActorIdleDuration(animal, clip, false), 280, id);
    assert.equal(getActorIdleDuration({ ...animal, discovered: false }, clip, false), 0);
    assert.equal(getActorIdleDuration({ ...animal, visualConsumed: true }, clip, false), 0);
    assert.equal(getActorIdleDuration({ ...animal, visual: { ...animal.visual!, action: 'walk' } }, clip, false), 0);
    assert.equal(getActorIdleDuration(animal, undefined, false), 0);
  }
  assert.equal(getActorIdleDuration({ ...enemy, visual: { id: 'flower', label: 'Flower', tone: 'ambient' } }, clip, false), 0);
});

test('only visible, undefeated enemies in idle get a random playback clock', () => {
  assert.equal(getActorIdleDuration(enemy, clip, false), 280);
  assert.equal(getActorIdleDuration(enemy, clip, true), 0);
  assert.equal(getActorIdleDuration({ ...enemy, discovered: false }, clip, false), 0);
  assert.equal(getActorIdleDuration({ ...enemy, visualConsumed: true }, clip, false), 0);
  assert.equal(getActorIdleDuration({ ...enemy, visual: { ...enemy.visual!, action: 'attack' } }, clip, false), 0);
});

test('enemies keep independent idle schedules and pause after one loop', () => {
  const first = advanceIdlePlayback(createIdlePlayback(0, () => 0), 4000, 280);
  const second = advanceIdlePlayback(createIdlePlayback(0, () => 0.5), 4000, 280);
  assert.equal(first.startedAtMs, 4000);
  assert.equal(second.startedAtMs, null);
  assert.equal(advanceIdlePlayback(first, 4140, 280).elapsedMs, 140);
  assert.equal(advanceIdlePlayback(first, 4280, 280).startedAtMs, null);
});
