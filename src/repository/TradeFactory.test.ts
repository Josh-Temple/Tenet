import { describe, expect, it } from 'vitest';
import { createDraftTrade, getChecklistIssues, copyChecksToEntryChecklist } from './TradeFactory';

describe('trade factory', () => {
  it('keeps createdAt when auto-saving an existing draft', () => {
    const existing = createDraftTrade({ id: 't1', symbol: 'XAUUSD', direction: 'BUY', now: '2026-01-01T00:00:00.000Z' });
    const updated = createDraftTrade({ id: 't1', symbol: 'XAUUSD', direction: 'BUY', existing, now: '2026-01-02T00:00:00.000Z' });
    expect(updated.createdAt).toBe(existing.createdAt);
    expect(updated.updatedAt).toBe('2026-01-02T00:00:00.000Z');
  });
  it('does not save blank or UNSET symbols', () => {
    expect(createDraftTrade({ id: 't1', symbol: '', direction: 'BUY' }).symbol).toBe('XAUUSD');
    expect(createDraftTrade({ id: 't2', symbol: 'UNSET', direction: 'BUY' }).symbol).toBe('XAUUSD');
  });
  it('records checklist warning issue buckets', () => {
    const issues = getChecklistIssues({ a: 'Fail', b: 'Unclear', c: 'Unanswered', d: 'Pass' });
    expect(issues).toEqual({ failItems: ['a'], unclearItems: ['b'], unansweredItems: ['c'] });
  });
  it('stores stop loss and scenario memos on entryCheckList', () => {
    const entry = copyChecksToEntryChecklist({}, 'SL memo', 'scenario memo');
    expect(entry.stopLossLogicMemo).toBe('SL memo');
    expect(entry.scenarioMemo).toBe('scenario memo');
  });
});
