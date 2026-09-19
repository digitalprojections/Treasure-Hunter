import test from 'node:test';
import assert from 'node:assert/strict';
import { createAssetLookup, MISSING_ASSET } from './assetLookup';

test('resolves object keys and rejects legacy paths and unrelated actions', () => {
  const lookup = createAssetLookup({
    'assets/resources/wood/static.png': '/wood',
    'assets/resources/gold.png': '/legacy',
    'assets/heroes/engineer/damage/frame_001.png': '/damage',
  });
  assert.equal(lookup('resources/wood'), '/wood');
  assert.equal(lookup('resources/gold'), MISSING_ASSET);
  assert.equal(lookup('heroes/engineer'), MISSING_ASSET);
  assert.equal(lookup('resources/wood/static.png'), MISSING_ASSET);
});
