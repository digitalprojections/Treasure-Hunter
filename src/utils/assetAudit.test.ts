import test from 'node:test';
import assert from 'node:assert/strict';
import { auditAssetFiles } from './assetAudit';

test('audit reports flat images, unnumbered actions and missing neutral art', () => {
  const issues = auditAssetFiles({
    'assets/wildlife/deer.png': '/flat',
    'assets/enemies/wolf/idle/wolf.png': '/unnumbered',
    'assets/heroes/engineer/damage/frame_001.png': '/damage',
    'assets/heroes/mage/idle/Frame (1).png': '/valid',
    'assets/terrain/plains/plains.png': '/valid-still',
  });
  assert.equal(issues.length, 3);
  assert.ok(issues.some(issue => issue.includes('wildlife/deer.png')));
  assert.ok(issues.some(issue => issue.includes('wolf/idle/wolf.png')));
  assert.ok(issues.some(issue => issue.includes('missing neutral art')));
});

test('audit reports conflicting numeric indices', () => {
  assert.match(auditAssetFiles({
    'assets/terrain/plains/variant_01.png': '/one',
    'assets/terrain/plains/variant_01.webp': '/duplicate',
  }).join('\n'), /Duplicate/);
});
