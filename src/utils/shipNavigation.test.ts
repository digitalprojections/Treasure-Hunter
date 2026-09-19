import test from 'node:test';
import assert from 'node:assert/strict';
import { shipNavigation } from './shipNavigation';
test('visible ship needs no direction marker', () => {
  assert.equal(shipNavigation(150, 200, 300, 400), null);
});
test('offscreen ship points toward each edge', () => {
  assert.equal(shipNavigation(500, 200, 300, 400)?.angle, 0);
  assert.equal(shipNavigation(150, 600, 300, 400)?.angle, 90);
  assert.equal(shipNavigation(-100, 200, 300, 400)?.angle, 180);
  assert.equal(shipNavigation(150, -100, 300, 400)?.angle, -90);
});
test('diagonal marker stays inside the visible map', () => {
  const marker = shipNavigation(900, -300, 300, 400)!;
  assert.ok(marker.x >= 28 && marker.x <= 272);
  assert.ok(marker.y >= 28 && marker.y <= 372);
  assert.ok(marker.angle < 0 && marker.angle > -90);
});
