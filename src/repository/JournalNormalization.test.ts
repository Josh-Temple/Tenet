import { describe, expect, it } from 'vitest';
import { normalizeJournalSelections, normalizeMarketAssessment, normalizePersonalCondition } from './JournalNormalization';

describe('journal selection normalization', () => {
  it('normalizes Normal to Neutral', () => expect(normalizePersonalCondition('Normal')).toBe('Neutral'));
  it('normalizes Bad to Poor', () => expect(normalizePersonalCondition('Bad')).toBe('Poor'));
  it('normalizes Appropriate to Accurate', () => expect(normalizeMarketAssessment('Appropriate')).toBe('Accurate'));
  it('does not keep out-of-type journal choice strings', () => {
    expect(normalizeJournalSelections({ journalDate: '2026-06-19', personalCondition: 'Terrible' as any }).personalCondition).toBeNull();
  });
});
