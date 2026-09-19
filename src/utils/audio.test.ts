import test from 'node:test';
import assert from 'node:assert/strict';
import { discoverAudio, normalizeVolume } from './audio';

test('audio discovery accepts only the declared folder contract', () => {
  const catalog = discoverAudio({
    '../../assets/music/play/forest.mp3': '/forest.mp3',
    '../../assets/sounds/attack/hit.wav': '/hit.wav',
    '../../assets/music/unknown/a.mp3': '/wrong.mp3',
    '../../assets/sounds/walk/nested/a.mp3': '/nested.mp3',
    '../../assets/music/play/readme.md': '/readme',
  });
  assert.deepEqual(catalog.music.play, ['/forest.mp3']);
  assert.deepEqual(catalog.sounds.attack, ['/hit.wav']);
  assert.deepEqual(catalog.sounds.walk, []);
  assert.equal(catalog.issues.length, 3);
});
test('empty audio folders are valid and volumes remain safe', () => {
  assert.deepEqual(discoverAudio({}).issues, []);
  assert.equal(normalizeVolume(2, 0.5), 1);
  assert.equal(normalizeVolume(-1, 0.5), 0);
  assert.equal(normalizeVolume('invalid', 0.5), 0.5);
  assert.equal(normalizeVolume(0, 0.5), 0);
});

test('section loops and event cues have explicit subfolders, originals remain fallback', () => {
  const catalog = discoverAudio({
    '../assets/music/play/original.mp3': 'original',
    '../assets/music/loops/exploration/section.ogg': 'loop',
    '../assets/music/events/relic/phrase.ogg': 'relic',
    '../assets/music/events/made-up/phrase.ogg': 'bad',
  });
  assert.deepEqual(catalog.loops.exploration, ['loop']);
  assert.deepEqual(catalog.events.relic, ['relic']);
  assert.deepEqual(catalog.music.play, ['original']);
  assert.equal(catalog.issues.length, 1);
});
