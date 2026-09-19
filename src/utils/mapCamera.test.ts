import test from 'node:test';
import assert from 'node:assert/strict';
import { needsCameraFollow } from './mapCamera';
test('movement inside the central safe area leaves the camera still', () => {
  assert.equal(needsCameraFollow(200, 300, 400, 600), false);
  assert.equal(needsCameraFollow(250, 340, 400, 600), false);
});
test('approaching any viewport edge follows the hero', () => {
  for (const [x,y] of [[50,300],[350,300],[200,70],[200,530]])
    assert.equal(needsCameraFollow(x,y,400,600), true);
});
