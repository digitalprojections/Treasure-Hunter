export interface ExpeditionLog {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  count: number;
}

export function appendLog(previous: ExpeditionLog[], incoming: ExpeditionLog): ExpeditionLog[] {
  const latest = previous[0];
  if ((incoming.type === 'warning' || incoming.type === 'error') &&
      latest?.type === incoming.type && latest.message === incoming.message) {
    return [{ ...latest, timestamp: incoming.timestamp, count: latest.count + 1 }, ...previous.slice(1)];
  }
  return [incoming, ...previous.slice(0, 19)];
}
