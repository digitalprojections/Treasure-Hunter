import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const heroRoot = path.join(repoRoot, 'assets', 'heroes');
const mageRoot = path.join(heroRoot, 'mage');

const ZIP_TO_STATE = new Map([
  ['Sprite_Animation_batch_transparent_centered.zip', 'walk'],
  ['Sprite_Animation_batch_transparent_centered (1).zip', 'scout'],
  ['Sprite_Animation_batch_transparent_centered (2).zip', 'hit'],
  ['Sprite_Animation_batch_transparent_centered (3).zip', 'collect'],
]);

function cleanStateDirectory(state) {
  const stateDir = path.join(mageRoot, state);
  fs.rmSync(stateDir, { recursive: true, force: true });
  fs.mkdirSync(stateDir, { recursive: true });
  return stateDir;
}

function extractZip(zipPath, outDir) {
  execFileSync('powershell.exe', [
    '-NoProfile',
    '-Command',
    `Expand-Archive -LiteralPath ${JSON.stringify(zipPath)} -DestinationPath ${JSON.stringify(outDir)} -Force`,
  ], { stdio: 'inherit' });
}

function findFrames(extractDir) {
  const frames = [];
  const pending = [extractDir];

  while (pending.length > 0) {
    const current = pending.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) pending.push(fullPath);
      if (entry.isFile() && /\.png$/i.test(entry.name)) frames.push(fullPath);
    }
  }

  return frames.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function importZip(zipName, state) {
  const zipPath = path.join(heroRoot, zipName);
  if (!fs.existsSync(zipPath)) {
    throw new Error(`Missing zip: ${zipPath}`);
  }

  const stateDir = cleanStateDirectory(state);
  const extractDir = path.join(mageRoot, `.tmp-${state}`);
  fs.rmSync(extractDir, { recursive: true, force: true });
  fs.mkdirSync(extractDir, { recursive: true });

  try {
    extractZip(zipPath, extractDir);
    const frames = findFrames(extractDir);
    if (frames.length === 0) {
      throw new Error(`No PNG frames found in ${zipName}`);
    }

    frames.forEach((frame, index) => {
      const frameNumber = String(index + 1).padStart(3, '0');
      fs.copyFileSync(frame, path.join(stateDir, `${state}_${frameNumber}.png`));
    });

    return { state, frames: frames.length };
  } finally {
    fs.rmSync(extractDir, { recursive: true, force: true });
  }
}

const imported = [...ZIP_TO_STATE].map(([zipName, state]) => importZip(zipName, state));

for (const result of imported) {
  console.log(`Imported ${result.frames} ${result.state} frames`);
}
