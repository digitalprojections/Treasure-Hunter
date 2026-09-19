import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import score from '../data/demo-beats.json';
import { createDemoLevel, createDemoSequence, sampleDemo } from './demoSequence';
test('authored route uses adjacent tiles and ends at the extraction ship', () => {
  const level = createDemoLevel();
  assert.equal(level.tiles.length, 18 * 18);
  for (let i=1;i<level.route.length;i++) assert.equal(Math.abs(level.route[i].x-level.route[i-1].x)+Math.abs(level.route[i].y-level.route[i-1].y),1);
  assert.deepEqual(level.route.at(-1), level.route[0]);
});
test('score follows measured beats and includes three relics plus extraction', () => {
  const sequence = createDemoSequence(score.beats);
  assert.ok(sequence.every((cue,i) => cue.time === score.beats[i].time));
  assert.equal(sequence.filter(c=>c.event==='relic').length,3);
  assert.equal(sequence.filter(c=>c.event==='escape').length,1);
  for (let i=1;i<sequence.length;i++) assert.ok(sequence[i].time>sequence[i-1].time);
});
test('sampling is deterministic when seeking and never leaves the island', () => {
  const sequence=createDemoSequence(score.beats);
  for (let t=0;t<score.duration;t+=.137) {
    const sample=sampleDemo(sequence,t);
    assert.ok(sample.x>=0 && sample.x<18 && sample.y>=0 && sample.y<18);
    assert.deepEqual(sample,sampleDemo(sequence,t));
  }
  assert.equal(sampleDemo(sequence,score.duration).relics,3);
});

test('checked-in beat map belongs to the supplied theme recording', () => {
  const recording=readFileSync(new URL('../../assets/music/events/demo/sunken.wav',import.meta.url));
  assert.equal(createHash('sha256').update(recording).digest('hex'),score.sha256);
  assert.ok(score.beats.length>400);
  assert.ok(score.beats.every((b,i)=>b.time>=0 && b.time<score.duration && (!i||b.time>score.beats[i-1].time)));
});
test('beat route never teleports and provides sustained fights and discoveries',()=>{
  const sequence=createDemoSequence(score.beats);
  for(let i=1;i<sequence.length;i++)assert.ok(Math.abs(sequence[i].x-sequence[i-1].x)+Math.abs(sequence[i].y-sequence[i-1].y)<=1);
  assert.ok(sequence.filter(c=>c.event==='fight').length>=12);
  assert.ok(sequence.filter(c=>c.event==='treasure').length>=20);
});
