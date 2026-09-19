import test from 'node:test';
import assert from 'node:assert/strict';
import { discoverObjectAssets } from './objectAssets';
import { selectObjectSpriteBox, MISSING_ASSET } from './assetCatalog';
import { resolveSpriteBoxAsset } from './spritebox';
import { generateIsland } from './mapGenerator';
import { objectRules } from './interactions';

test('stat symbols are available to HUD consumers but never to map consumers', () => {
  const registry = discoverObjectAssets({
    'assets/symbols/bomb_symbol/bomb_symbol.png': '/bomb',
    'assets/symbols/discovered_symbol/static.png': '/eye',
    'assets/resources/gold/gold_symbol.png': '/misplaced',
    'assets/symbols/fog/fog.png': '/fog',
  });
  assert.equal(registry['resources/gold'], undefined);
  assert.equal(resolveSpriteBoxAsset(selectObjectSpriteBox(registry, 'symbols/bomb_symbol'), '').src, MISSING_ASSET);
  assert.equal(resolveSpriteBoxAsset(selectObjectSpriteBox(registry, 'symbols/bomb_symbol', 'idle', false, 'hud'), '').src, '/bomb');
  assert.equal(resolveSpriteBoxAsset(selectObjectSpriteBox(registry, 'symbols/fog'), '').src, '/fog');
});

test('HUD-only symbols have no map interactions or generated placements', () => {
  const ids = new Set(['key', 'potion', 'scroll', 'star', 'waypoint']);
  for (const id of ids) assert.equal(Object.hasOwn(objectRules, id), false);
  for (let i = 0; i < 40; i++) {
    assert.ok(generateIsland().every(tile => !tile.visual || !ids.has(tile.visual.id)));
  }
});
