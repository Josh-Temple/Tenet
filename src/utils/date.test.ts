import { describe, expect, it } from 'vitest';
import { getLocalDateKey } from './date';

describe('getLocalDateKey', () => {
  it('returns yyyy-MM-dd for the local date', () => {
    expect(getLocalDateKey(new Date(2026, 0, 2, 3, 4, 5))).toBe('2026-01-02');
  });

  it('does not derive date keys through UTC ISO splitting', () => {
    const date = new Date(2026, 5, 19, 0, 30, 0);
    expect(getLocalDateKey(date)).toBe(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
  });

  it('returns a stable value for an arbitrary Date argument', () => {
    expect(getLocalDateKey(new Date(2030, 11, 31, 23, 59, 59))).toBe('2030-12-31');
  });
});
