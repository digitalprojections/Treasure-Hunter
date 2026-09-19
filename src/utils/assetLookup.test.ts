import test from 'node:test';
import assert from 'node:assert/strict';
import { createAssetLookup, MISSING_ASSET } from './assetLookup';

test('retains exact art and normalizes Windows paths', () => {
  const lookup = createAssetLookup({ '../../assets/heroes/engineer/engineer.png': '/original' });
  assert.equal(lookup('heroes/engineer/engineer.png'), '/original');
  assert.equal(lookup('heroes\\engineer\\engineer.png'), '/original');
});

test('removed engineer portraits fall back to discovered same-character frames in numeric order', () => {
  const lookup = createAssetLookup({
    '../../assets/heroes/engineer/damage/frame_010.png': '/ten',
    '../../assets/heroes/engineer/damage/frame_002.png': '/two',
    '../../assets/heroes/scout/idle/idle_001.png': '/other-character',
  });
  assert.equal(lookup('heroes/engineer/engineer.png'), '/two');
  assert.equal(lookup('heroes/engineer/bg_removed__engineer.png'), '/two');
});

test('idle art takes precedence over damage/death and flat art can migrate into folders', () => {
  const lookup = createAssetLookup({
    '../../assets/heroes/engineer/death/death_001.png': '/death',
    '../../assets/heroes/engineer/idle/idle_001.png': '/idle',
    '../../assets/resources/wood/static.webp': '/wood',
  });
  assert.equal(lookup('heroes/engineer/engineer.png'), '/idle');
  assert.equal(lookup('resources/wood.png'), '/wood');
});

test('missing object uses a valid placeholder rather than another object or broken URL', () => {
  const lookup = createAssetLookup({ '../../assets/resources/wood.png': '/wood' });
  assert.equal(lookup('resources/gold.png'), MISSING_ASSET);
  assert.equal(createAssetLookup({})('heroes/mage/mage.png'), MISSING_ASSET);
});
