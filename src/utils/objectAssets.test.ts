import test from 'node:test';
import assert from 'node:assert/strict';
import { discoverObjectAssets } from './objectAssets';
import { resolveSpriteBoxAsset } from './spritebox';
import { readdirSync } from 'node:fs';

test('Windows batch-renamed static images are discovered and sorted numerically', () => {
  const set = discoverObjectAssets({
    'assets/barriers/barricade/barricade (10).png': '/ten',
    'assets/barriers/barricade/barricade (2).png': '/two',
    'assets/barriers/barricade/barricade (1).png': '/one',
  })['barriers/barricade'];
  assert.deepEqual(set.static.assets.map(a => a.src), ['/one', '/two', '/ten']);
  assert.equal(set.static.levels, undefined);
  assert.equal(resolveSpriteBoxAsset(set.static, 'tile', 0).src, resolveSpriteBoxAsset(set.static, 'tile', 9999).src);
});

test('Windows numbering works for explicit levels and action frames', () => {
  const registry = discoverObjectAssets({
    'assets/defenses/turret/level (2).png': '/level2',
    'assets/defenses/turret/level (1).png': '/level1',
    'assets/heroes/mage/walk/Frame (10).png': '/ten',
    'assets/heroes/mage/walk/Frame (2).png': '/two',
  });
  assert.equal(resolveSpriteBoxAsset(registry['defenses/turret'].static, '', 0, 2).src, '/level2');
  const clip = registry['heroes/mage'].actions.walk;
  assert.deepEqual(clip.frames.map(a => a.src), ['/two', '/ten']);
  assert.equal(resolveSpriteBoxAsset(clip, '', clip.frameMs).src, '/ten');
});

test('Windows and underscore numbering cannot silently duplicate an index', () => {
  assert.throws(() => discoverObjectAssets({
    'assets/barriers/barricade/barricade (1).png': '/a',
    'assets/barriers/barricade/variant_01.png': '/b',
  }), /Duplicate/);
});

test('discovers arbitrary tower types and level counts with numeric ordering', () => {
  const objects = discoverObjectAssets({
    'assets/defenses/ice_tower/level_10.png': '/ten',
    'assets/defenses/ice_tower/level_01.png': '/one',
    'assets/defenses/ice_tower/level_02.png': '/two',
  });
  const box = objects['defenses/ice_tower'].static;
  assert.equal(box.kind, 'static');
  assert.equal(resolveSpriteBoxAsset(box, 'a', 9000).src, '/one');
  assert.equal(resolveSpriteBoxAsset(box, 'b', 0, 2).src, '/two');
  assert.equal(resolveSpriteBoxAsset(box, 'b', 9999, 2).src, '/two');
  assert.equal(resolveSpriteBoxAsset(box, '', 0, 9).src, '/two');
  assert.equal(resolveSpriteBoxAsset(box, '', 0, 99).src, '/ten');
  assert.equal(resolveSpriteBoxAsset(box, '', 0, -1).src, '/one');
  assert.equal(resolveSpriteBoxAsset(box, '', 0, NaN).src, '/one');
});

test('keeps static variants and action frames distinct across domains', () => {
  const objects = discoverObjectAssets({
    'assets/structures/well/variant_02.png': '/v2',
    'assets/structures/well/variant_01.png': '/v1',
    'assets/heroes/mage/walk/walk_010.png': '/f10',
    'assets/heroes/mage/walk/walk_002.png': '/f2',
    'assets/heroes/mage/static.png': '/mage',
    'assets/defenses/mage/static.png': '/tower',
    'assets/heroes/mage/walk/preview.png': '/ignore',
    'assets/exports/well/static.png': '/ignore',
  });
  assert.equal(objects['structures/well'].static.assets.length, 2);
  const clip = objects['heroes/mage'].actions.walk;
  assert.deepEqual(clip.frames.map(f => f.src), ['/f2', '/f10']);
  assert.equal(resolveSpriteBoxAsset(clip, '', clip.frameMs).src, '/f10');
  assert.equal(objects['defenses/mage'].static.assets[0].src, '/tower');
  assert.equal(Object.keys(objects).length, 3);
});

test('discovers cutouts and arbitrary numbered export filenames by their action folder', () => {
  const objects = discoverObjectAssets({
    'assets/heroes/engineer/damage/Sprite_Animation_centered_002.png': '/damage2',
    'assets/heroes/engineer/damage/Sprite_Animation_centered_001.png': '/damage1',
    'assets/heroes/engineer/cutout.png': '/cutout',
    'assets/heroes/engineer/static.png': '/portrait',
  });
  assert.equal(objects['heroes/engineer'].cutout.src, '/cutout');
  assert.equal(objects['heroes/engineer'].static.assets[0].src, '/portrait');
  assert.deepEqual(objects['heroes/engineer'].actions.damage.frames.map(f => f.src), ['/damage1', '/damage2']);
});

test('rejects ambiguous level art and mixed selection modes', () => {
  assert.throws(() => discoverObjectAssets({
    'assets/defenses/turret/level_01.png': '/a',
    'assets/defenses/turret/level_01.webp': '/b',
  }), /Duplicate/);
  assert.throws(() => discoverObjectAssets({
    'assets/defenses/turret/level_01.png': '/a',
    'assets/defenses/turret/variant_01.png': '/b',
  }), /mix/i);
});

test('real defense folder discovers four static upgrade sets, never looping levels', () => {
  const files = readdirSync(new URL('../../assets/', import.meta.url), { recursive: true }) as string[];
  const registry = discoverObjectAssets(Object.fromEntries(files.map(file => {
    const path = `assets/${file.replaceAll('\\', '/')}`;
    return [path, path];
  })));
  for (const type of ['cannon', 'fire_turret', 'magic_turret', 'turret']) {
    const set = registry[`defenses/${type}`];
    assert.deepEqual(set.static.levels, [1, 2, 3, 4]);
    assert.deepEqual(Object.keys(set.actions), []);
    for (let level = 1; level <= 4; level++) {
      assert.equal(resolveSpriteBoxAsset(set.static, 'tile', 12345, level).src,
        `assets/defenses/${type}/level_0${level}.png`);
    }
  }
});
