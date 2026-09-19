import test from 'node:test';
import assert from 'node:assert/strict';
import { discoverCharacterAnimations } from './characterAnimations';
import { resolveSpriteBoxAsset } from './spritebox';

test('discovers characters and states from folders and sorts arbitrary frame counts numerically', () => {
  const files = Object.fromEntries([10, 2, 1, 25].map(n => [
    `../../assets/enemies/goblin/idle/Sprite_Animation_centered_${n}.png`, `/frame-${n}.png`,
  ]));
  const result = discoverCharacterAnimations(files);
  const idle = result.enemies.goblin.idle;
  assert.equal(idle.id, 'enemy.goblin.idle');
  assert.deepEqual(idle.frames.map(f => f.frameIndex), [1, 2, 10, 25]);
  assert.equal(resolveSpriteBoxAsset(idle, '', idle.frameMs * 4).src, '/frame-1.png');
});

test('keeps domains, characters and arbitrary states separate, including single frames', () => {
  const result = discoverCharacterAnimations({
    'assets/enemies/goblin/idle/frame_001.png': '/goblin.png',
    'assets/enemies/goblin/attack/frame_002.png': '/attack.png',
    'assets/heroes/goblin/walk/frame_001.png': '/hero.png',
    'assets/wildlife/deer/idle/frame_001.PNG': '/deer.png',
    'assets/enemies/orc/idle/frame_001.webp': '/orc.webp',
  });
  assert.equal(result.enemies.goblin.attack.frames.length, 1);
  assert.equal(result.heroes.goblin.walk.frames[0].src, '/hero.png');
  assert.equal(result.wildlife.deer.idle.frames[0].src, '/deer.png');
  assert.equal(result.enemies.orc.idle.frames[0].src, '/orc.webp');
});

test('ignores static art, unsupported files and nested export folders', () => {
  assert.deepEqual(discoverCharacterAnimations({
    'assets/enemies/goblin.png': '/static.png',
    'assets/enemies/goblin/idle/goblin.png': '/unnumbered.png',
    'assets/enemies/goblin/idle/readme.txt': '/readme.txt',
    'assets/enemies/goblin/idle/backup/frame_001.png': '/backup.png',
    'assets/exports/goblin/idle/frame_001.png': '/export.png',
  }), {});
});
