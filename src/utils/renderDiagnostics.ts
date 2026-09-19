// Development-only counters used by the repeatable grid performance check.
export const tileRenderCounts = new Map<string, number>();
export function recordTileRender(id:string){if(import.meta.env.DEV)tileRenderCounts.set(id,(tileRenderCounts.get(id)??0)+1);}

export const particleRenderCounts = new Map<string, number>();
export function recordParticleRender(kind: string) {
  if (import.meta.env.DEV) particleRenderCounts.set(kind, (particleRenderCounts.get(kind) ?? 0) + 1);
}
