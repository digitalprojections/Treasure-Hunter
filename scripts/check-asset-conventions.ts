import { readdir, writeFile } from 'node:fs/promises';
import { discoverObjectAssets } from '../src/utils/objectAssets';
import { auditAssetFiles } from '../src/utils/assetAudit';

const paths = await readdir(new URL('../assets/', import.meta.url), { recursive: true });
const files = Object.fromEntries(paths.map(file => {
  const path = `assets/${file.replaceAll('\\', '/')}`;
  return [path, path];
}));
const issues = auditAssetFiles(files);
const registry = discoverObjectAssets(files);
for (const name of ['gold', 'wood', 'stone', 'gem']) {
  if (!registry[`symbols/${name}_symbol`]?.static) {
    issues.push(`Missing HUD icon: assets/symbols/${name}_symbol/${name}_symbol.png (or static.png). Generic UI icon is used until supplied.`);
  }
}
if (process.argv.includes('--report')) {
  await writeFile(new URL('../assets/ASSET-AUDIT.md', import.meta.url),
    '# Asset convention audit\n\nRegenerate with `npm run assets:check -- --report`. This report does not modify images.\n\n' +
    issues.map(issue => `- ${issue}`).join('\n') + '\n');
}
for (const issue of issues) console.error(issue);
console.log(`Asset convention audit: ${issues.length} issue(s). No files changed.`);
process.exitCode = issues.length ? 1 : 0;
