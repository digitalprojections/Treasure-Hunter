import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { readdir } from 'node:fs/promises';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { visualSpriteBoxes } = await server.ssrLoadModule('/src/data/spriteboxes.ts');
  const { SpriteBox } = await server.ssrLoadModule('/src/SpriteBox.tsx');
  const { getObjectSpriteBox } = await server.ssrLoadModule('/src/data/objectAssets.ts');
  const { visualAssetPools } = await server.ssrLoadModule('/src/data/assets.ts');
  const files = (await readdir(new URL('../assets/barriers/barricade/', import.meta.url)))
    .filter(name => /\.(png|webp|jpe?g)$/i.test(name))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  const barricade = visualSpriteBoxes.barricade;
  assert.equal(barricade.kind, 'static');
  assert.ok(files.length > 0);
  assert.deepEqual(barricade.assets.map(asset => decodeURIComponent(asset.src).split('/').at(-1)), files);
  assert.deepEqual(visualAssetPools.barricade, barricade.assets.map(asset => asset.src));
  const seen = new Set<string>();
  for (let seed = 0; seed < files.length * 100; seed++) {
    const props = { spriteBox: barricade, seed: `tile:${seed}` };
    const first = renderToStaticMarkup(React.createElement(SpriteBox, { ...props, elapsedMs: 0 }));
    assert.equal(first, renderToStaticMarkup(React.createElement(SpriteBox, { ...props, elapsedMs: 9000 })));
    assert.ok(!first.includes('data:image'));
    seen.add(first);
  }
  assert.equal(seen.size, files.length);
  console.log(`Verified all ${files.length} discovered barricade variants render without placeholders.`);
  for (const type of ['cannon', 'fireTurret', 'magicTurret', 'turret']) {
    const box = visualSpriteBoxes[type];
    assert.equal(box.kind, 'static');
    assert.deepEqual(box.levels, [1, 2, 3, 4]);
    for (let level = 1; level <= 4; level++) {
      const first = renderToStaticMarkup(React.createElement(SpriteBox, { spriteBox: box, seed: 'a', level, elapsedMs: 0 }));
      const later = renderToStaticMarkup(React.createElement(SpriteBox, { spriteBox: box, seed: 'b', level, elapsedMs: 9000 }));
      assert.equal(first, later);
      assert.ok(first.includes(`level_0${level}.png`), first);
    }
  }
  assert.equal(getObjectSpriteBox('defenses/turret', 'missing').kind, 'static');
  assert.equal(getObjectSpriteBox('heroes/mage', 'walk').kind, 'looper');
  assert.equal(getObjectSpriteBox('missing/object').kind, 'static');
  console.log('Verified all 16 tower level renders, time/seed stability, and discovered action fallback.');
} finally {
  await server.close();
}
