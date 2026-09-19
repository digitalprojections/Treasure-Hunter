// Development-only counters used by the repeatable grid performance check.
export const tileRenderCounts = new Map<string, number>();
export function recordTileRender(id:string){if(import.meta.env.DEV)tileRenderCounts.set(id,(tileRenderCounts.get(id)??0)+1);}
