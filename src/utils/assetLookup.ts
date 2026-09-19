/** An explicit missing-art marker keeps missing optional files from crashing the game. */
export const MISSING_ASSET = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" fill="#334155"/><text x="48" y="64" text-anchor="middle" font-size="52" fill="#fbbf24">?</text></svg>',
);

function normalize(path: string) {
  return path.replaceAll('\\', '/').replace(/^.*?assets\//, '');
}

/** Legacy filenames are preferences, not bundler imports or required files. */
export function createAssetLookup(files: Record<string, string>) {
  const entries = Object.entries(files).map(([path, url]) => [normalize(path), url] as const);
  const exact = new Map(entries);
  return (requested: string): string => {
    const path = normalize(requested);
    if (exact.has(path)) return exact.get(path)!;
    const parts = path.split('/');
    const object = parts.length > 2 ? parts.slice(0, 2).join('/') : path.replace(/\.[^.]+$/, '');
    const priority = (candidate: string) => {
      const relative = candidate.slice(object.length + 1);
      if (/^(static|[^/]+)\.(png|webp|jpe?g)$/i.test(relative)) return 0;
      if (relative.startsWith('idle/')) return 1;
      if (relative.startsWith('walk/')) return 2;
      return 3;
    };
    const candidates = entries.filter(([candidate]) => candidate.startsWith(`${object}/`));
    candidates.sort(([a], [b]) => priority(a) - priority(b) || a.localeCompare(b, 'en', { numeric: true }));
    return candidates[0]?.[1] ?? MISSING_ASSET;
  };
}
