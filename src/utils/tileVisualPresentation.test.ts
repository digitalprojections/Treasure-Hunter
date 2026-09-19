import assert from 'node:assert/strict';
import test from 'node:test';
import { EntityType } from '../types';
import { getTileAssetPresentation } from './tileVisualPresentation';

const fullTilePresentation = {
  containerClassName: 'absolute inset-0 z-10 pointer-events-none',
  imageClassName: 'object-fill',
};

test('resource visuals fill the entire tile without spacing', () => {
  assert.deepEqual(getTileAssetPresentation({ visualTone: 'resource' }), fullTilePresentation);
});

test('resource-backed entities use the same full-tile presentation', () => {
  assert.deepEqual(getTileAssetPresentation({ entityType: EntityType.TREASURE }), fullTilePresentation);
  assert.deepEqual(getTileAssetPresentation({ entityType: EntityType.RELIC }), fullTilePresentation);
});

test('non-resource visuals and entities retain their contained presentation', () => {
  const containedPresentation = {
    containerClassName: 'absolute inset-0 z-10 p-[10%] pointer-events-none',
    imageClassName: 'object-contain drop-shadow-lg',
  };

  assert.deepEqual(getTileAssetPresentation({ visualTone: 'landmark' }), containedPresentation);
  assert.deepEqual(getTileAssetPresentation({ entityType: EntityType.RUIN }), containedPresentation);
});
