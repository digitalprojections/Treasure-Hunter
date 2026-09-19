import test from 'node:test';
import assert from 'node:assert/strict';
import { appendLog, type ExpeditionLog } from './expeditionLog';

const warning: ExpeditionLog = { id: 'a', message: 'Need 1 stamina to move.', type: 'warning', timestamp: '12:00:00', count: 1 };
test('repeated warnings update a single row and refresh its flash counter', () => {
  const logs = [warning];
  const result = appendLog(logs, { ...warning, id: 'b', timestamp: '12:00:01' });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'a');
  assert.equal(result[0].count, 2);
  assert.equal(result[0].timestamp, '12:00:01');
  assert.equal(logs[0].count, 1);
});
test('different messages and later warning episodes remain separate', () => {
  const rest = { ...warning, id: 'b', message: 'Rested.' };
  assert.equal(appendLog([rest, warning], { ...warning, id: 'c' }).length, 3);
  assert.equal(appendLog([warning], { ...warning, id: 'd', type: 'success' }).length, 2);
});
test('history stays capped and distinct successes are never grouped', () => {
  const history = Array.from({ length: 20 }, (_, i) => ({ ...warning, id: String(i), type: 'success' as const }));
  const result = appendLog(history, { ...warning, id: 'new', type: 'success' });
  assert.equal(result.length, 20);
  assert.equal(result[0].count, 1);
});
