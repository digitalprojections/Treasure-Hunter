import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createLooperSpriteBox,
  createSpriteAsset,
  createStaticSpriteBox,
  getHorizontalFacingAfterMove,
  getSeededIndex,
  getSpriteFrameIndex,
  resolveSpriteBoxAsset,
} from './spritebox';

test('getSpriteFrameIndex reads numbered filename suffixes', () => {
  assert.equal(getSpriteFrameIndex('defenses/cannon_004.png'), 4);
  assert.equal(getSpriteFrameIndex('barriers/barricade-12'), 12);
  assert.equal(getSpriteFrameIndex('terrain/forest.png'), 0);
});

test('static spriteboxes choose the same variant for the same seed', () => {
  const spriteBox = createStaticSpriteBox('visual.barricade', 'Barricade', [
    createSpriteAsset('/barricade.png', 'barriers/barricade'),
    createSpriteAsset('/barricade_001.png', 'barriers/barricade_001'),
    createSpriteAsset('/barricade_002.png', 'barriers/barricade_002'),
  ]);

  const first = resolveSpriteBoxAsset(spriteBox, 'tile:4-9');
  const second = resolveSpriteBoxAsset(spriteBox, 'tile:4-9');

  assert.equal(first.src, second.src);
  assert.equal(first.src, spriteBox.assets[getSeededIndex('tile:4-9', spriteBox.assets.length)].src);
});

test('looper spriteboxes sort frames by naming convention and advance by frame time', () => {
  const spriteBox = createLooperSpriteBox('visual.cannon', 'Cannon', [
    createSpriteAsset('/cannon_003.png', 'defenses/cannon_003'),
    createSpriteAsset('/cannon_001.png', 'defenses/cannon_001'),
    createSpriteAsset('/cannon_002.png', 'defenses/cannon_002'),
  ], 100);

  assert.deepEqual(spriteBox.frames.map((frame) => frame.name), [
    'defenses/cannon_001',
    'defenses/cannon_002',
    'defenses/cannon_003',
  ]);
  assert.equal(resolveSpriteBoxAsset(spriteBox, 'ignored', 0).name, 'defenses/cannon_001');
  assert.equal(resolveSpriteBoxAsset(spriteBox, 'ignored', 150).name, 'defenses/cannon_002');
  assert.equal(resolveSpriteBoxAsset(spriteBox, 'ignored', 350).name, 'defenses/cannon_001');
});

test('horizontal facing follows lateral movement and persists during vertical movement', () => {
  assert.equal(getHorizontalFacingAfterMove('right', 5, 4), 'left');
  assert.equal(getHorizontalFacingAfterMove('left', 4, 5), 'right');
  assert.equal(getHorizontalFacingAfterMove('left', 4, 4), 'left');
  assert.equal(getHorizontalFacingAfterMove('right', 4, 4), 'right');
});

test('short character action loop advances through every supplied frame', () => {
  const spriteBox = createLooperSpriteBox('hero.mage.hit', 'Mage hit', [
    createSpriteAsset('/hit_001.png', 'heroes/mage/hit_001'),
    createSpriteAsset('/hit_002.png', 'heroes/mage/hit_002'),
    createSpriteAsset('/hit_003.png', 'heroes/mage/hit_003'),
    createSpriteAsset('/hit_004.png', 'heroes/mage/hit_004'),
  ], 150);

  assert.equal(resolveSpriteBoxAsset(spriteBox, 'ignored', 0).name, 'heroes/mage/hit_001');
  assert.equal(resolveSpriteBoxAsset(spriteBox, 'ignored', 150).name, 'heroes/mage/hit_002');
  assert.equal(resolveSpriteBoxAsset(spriteBox, 'ignored', 300).name, 'heroes/mage/hit_003');
  assert.equal(resolveSpriteBoxAsset(spriteBox, 'ignored', 450).name, 'heroes/mage/hit_004');
  assert.equal(resolveSpriteBoxAsset(spriteBox, 'ignored', 600).name, 'heroes/mage/hit_001');
});
