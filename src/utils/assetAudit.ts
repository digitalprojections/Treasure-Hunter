import { discoverObjectAssets } from './objectAssets';

/** Audit uses the loader itself, so validation and runtime cannot disagree. */
export function auditAssetFiles(files: Record<string, string>): string[] {
  const issues: string[] = [];
  for (const [path, src] of Object.entries(files)) {
    if (!/\.(png|webp|jpe?g)$/i.test(path)) continue;
    if (!Object.keys(discoverObjectAssets({ [path]: src })).length) {
      if (/_symbol/i.test(path)) {
        issues.push(`${path}: stat-display art belongs in symbols/<name>_symbol/<name>_symbol.png (or static.png). It cannot be used as a map object.`);
        continue;
      }
      issues.push(`${path}: expected category/type/static.png, cutout.png, type.png, level_N.png, variant_N.png, or action/name_N.png (Windows name (N) is also supported).`);
    }
  }
  try {
    const registry = discoverObjectAssets(files);
    for (const [key, set] of Object.entries(registry)) {
      if (!set.static && !set.cutout && !set.actions.idle) {
        issues.push(`${key}: missing neutral art; add static.png, cutout.png, or idle/name_001.png. Other actions cannot substitute for idle.`);
      }
    }
  } catch (error) {
    issues.push(error instanceof Error ? error.message : String(error));
  }
  return issues;
}
