export const musicScenes = ['menu', 'play', 'victory', 'defeat'] as const;
export const soundEvents = ['walk', 'attack', 'collect', 'hit', 'scout', 'escape', 'warning', 'rest', 'reveal'] as const;
export type MusicScene = typeof musicScenes[number];
export type SoundEvent = typeof soundEvents[number];
export const musicEvents = ['combat', 'discovery', 'relic', 'setback', 'rest', 'victory'] as const;
export type MusicEvent = typeof musicEvents[number];

export function discoverAudio(files: Record<string, string>) {
  const music = Object.fromEntries(musicScenes.map(key => [key, []])) as Record<MusicScene, string[]>;
  const sounds = Object.fromEntries(soundEvents.map(key => [key, []])) as Record<SoundEvent, string[]>;
  const issues: string[] = [];
  const loops = { exploration: [] as string[] };
  const events = Object.fromEntries(musicEvents.map(key => [key, []])) as Record<MusicEvent, string[]>;
  for (const [path, url] of Object.entries(files).sort()) {
    const section = path.replaceAll('\\', '/').match(/(?:^|\/)assets\/music\/(loops|events)\/([^/]+)\/[^/]+\.(?:mp3|ogg|wav|m4a|webm)$/i);
    if (section) {
      const group = section[1] === 'loops' ? loops : events;
      if (Object.hasOwn(group, section[2])) (group as Record<string, string[]>)[section[2]].push(url);
      else issues.push(path);
      continue;
    }
    const match = path.replaceAll('\\', '/').match(/(?:^|\/)assets\/(music|sounds)\/([^/]+)\/[^/]+\.(?:mp3|ogg|wav|m4a|webm)$/i);
    const group = match?.[1] === 'music' ? music : sounds;
    if (!match || !Object.hasOwn(group, match[2])) { issues.push(path); continue; }
    (group as Record<string, string[]>)[match[2]].push(url);
  }
  return { music, sounds, loops, events, issues };
}

export function normalizeVolume(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
}
