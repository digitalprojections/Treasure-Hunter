import test from 'node:test';
import assert from 'node:assert/strict';
import { discoverObjectAssets } from './objectAssets';
import { selectObjectSpriteBox } from './assetCatalog';
import { resolveSpriteBoxAsset } from './spritebox';

test('empty folders and absent objects resolve to a safe missing-art marker', () => {
  const box = selectObjectSpriteBox({}, 'heroes/new_hero');
  assert.equal(box.kind, 'static');
  assert.ok(resolveSpriteBoxAsset(box, '').src.startsWith('data:image/svg+xml,'));
});

test('missing idle never substitutes damage art', () => {
  const registry = discoverObjectAssets({
    'assets/heroes/engineer/damage/export_002.png': '/two',
    'assets/heroes/engineer/damage/export_001.png': '/one',
  });
  const idle = selectObjectSpriteBox(registry, 'heroes/engineer');
  assert.equal(idle.kind, 'static');
  assert.ok(resolveSpriteBoxAsset(idle, '', 9999).src.startsWith('data:image/svg+xml,'));
  assert.equal(selectObjectSpriteBox(registry, 'heroes/engineer', 'damage').kind, 'looper');
});

test('static levels, cutouts, and action selection stay independent', () => {
  const registry = discoverObjectAssets({
    'assets/defenses/new_tower/level_01.png': '/one',
    'assets/defenses/new_tower/level_02.png': '/two',
    'assets/heroes/new_hero/static.png': '/portrait',
    'assets/heroes/new_hero/cutout.png': '/cutout',
  });
  assert.equal(resolveSpriteBoxAsset(selectObjectSpriteBox(registry, 'defenses/new_tower'), '', 100, 2).src, '/two');
  assert.equal(resolveSpriteBoxAsset(selectObjectSpriteBox(registry, 'heroes/new_hero', 'idle', true), '').src, '/cutout');
});
