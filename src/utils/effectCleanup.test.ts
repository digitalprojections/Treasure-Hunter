import test from 'node:test';
import assert from 'node:assert/strict';
import { createEffectCleanup, removeCompletedEffects } from './effectCleanup';

test('many completions share one scheduled flush and keep newest revision', () => {
  const jobs: (() => void)[] = [];
  const batches: Map<string, number>[] = [];
  const queue = createEffectCleanup(batch => batches.push(batch), task => { jobs.push(task); return jobs.length; }, () => {});
  for (let i = 0; i < 40; i++) queue.add(`tile-${i}`, 1);
  queue.add('tile-0', 2);
  queue.add('tile-0', 1);
  assert.equal(jobs.length, 1);
  assert.equal(batches.length, 0);
  jobs[0]();
  assert.equal(batches.length, 1);
  assert.equal(batches[0].size, 40);
  assert.equal(batches[0].get('tile-0'), 2);
  queue.add('later', 3);
  assert.equal(jobs.length, 2);
});

test('cleanup preserves replacement effects and unchanged references', () => {
  const effects = { a: { revision: 2, kind: 'relic' as const }, b: { revision: 1, kind: 'regular' as const } };
  assert.equal(removeCompletedEffects(effects, new Map([['a', 1], ['missing', 1]])), effects);
  const next = removeCompletedEffects(effects, new Map([['a', 1], ['b', 1]]));
  assert.deepEqual(Object.keys(next), ['a']);
  assert.equal(next.a, effects.a);
  assert.ok(effects.b);
});

test('disposing cancels pending cleanup and queue remains reusable after effect remount', () => {
  const cancelled: number[] = [];
  const jobs: (() => void)[] = [];
  const batches: Map<string, number>[] = [];
  const queue = createEffectCleanup(batch => batches.push(batch), task => { jobs.push(task); return jobs.length; }, id => cancelled.push(id));
  queue.add('old', 1);
  queue.cancel();
  assert.deepEqual(cancelled, [1]);
  queue.add('new', 2);
  jobs[1]();
  assert.deepEqual([...batches[0]], [['new', 2]]);
});
