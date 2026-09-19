import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { resolveSpriteBoxAsset } from '../src/utils/spritebox';

const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
try {
  const { getObjectSpriteBox, objectAssets } = await server.ssrLoadModule('/src/data/objectAssets.ts');
  const { playerSpriteBoxes } = await server.ssrLoadModule('/src/data/spriteboxes.ts');
  assert.ok(playerSpriteBoxes.attack, 'Hero must expose the attack state');
  for (const [key, set] of Object.entries(objectAssets) as [string, any][]) {
    if (!key.startsWith('enemies/') || !set.actions.attack) continue;
    const attack = getObjectSpriteBox(key, 'attack');
    assert.equal(attack.kind, 'looper');
    for (let i = 0; i < attack.frames.length; i++) {
      assert.equal(resolveSpriteBoxAsset(attack, '', i * attack.frameMs).src, attack.frames[i].src);
    }
    console.log(`${key}: ${attack.frames.length} attack frames verified.`);
  }
  console.log('Hero attack selection and discovered enemy attack clips verified.');
} finally {
  await server.close();
}
