import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => readFileSync(resolve(root, file), 'utf8');
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const metadata = JSON.parse(read('metadata.json'));
const html = read('index.html');
const app = read('src/App.tsx');
function sourceFiles(dir) {
  return readdirSync(resolve(root, dir), { withFileTypes: true }).flatMap(entry => {
    const file = join(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(file) : /\.(tsx?|css)$/.test(file) ? [file] : [];
  });
}
for (const file of ['index.html', 'metadata.json', 'README.md', 'package.json', 'package-lock.json', ...sourceFiles('src')]) {
  assert.doesNotMatch(read(file), /My Google AI Studio App|Isle Finder|Treasure Cartographer|react-example|Experimental Build|Satellite Uplink|Secure Session Linked/i, file + ': obsolete branding');
}
assert.equal(pkg.name, 'treasure-hunter');
assert.equal(lock.name, pkg.name);
assert.equal(lock.packages[''].name, pkg.name);
assert.equal(lock.version, pkg.version);
assert.equal(lock.packages[''].version, pkg.version);
assert.equal(metadata.name, 'Treasure Hunter');
assert.ok(html.includes('<title>Treasure Hunter</title>'));
for (const tag of ['description', 'og:title', 'og:description', 'og:image', 'twitter:title', 'twitter:description', 'twitter:image']) {
  assert.ok(html.includes('"' + tag + '" content="'), 'Missing metadata: ' + tag);
}
assert.ok(app.includes('Treasure Hunter <span'));
assert.ok(app.includes("import { version as appVersion } from '../package.json'"));
assert.ok(app.includes('v{appVersion}'));
console.log('Treasure Hunter branding and version checks passed (' + pkg.version + ').');

assert.ok(html.includes('href="%BASE_URL%favicon.svg"'));
assert.ok(read('public/favicon.svg').includes('<title>Treasure Hunter</title>'));
