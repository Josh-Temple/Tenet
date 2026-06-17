import { describe, it, expect } from 'vitest';
import { calculateExpectedRiskReward, calculateRealizedR, checkEntryPriceConsistency } from './calculations';

describe('calculations', () => {
  describe('calculateExpectedRiskReward', () => {
    it('should correctly calculate for BUY trade', () => {
      expect(calculateExpectedRiskReward('BUY', 100, 90, 120)).toBe(2);
      expect(calculateExpectedRiskReward('BUY', 100, 95, 110)).toBe(2);
    });

    it('should correctly calculate for SELL trade', () => {
      expect(calculateExpectedRiskReward('SELL', 100, 110, 80)).toBe(2);
      expect(calculateExpectedRiskReward('SELL', 100, 105, 90)).toBe(2);
    });

    it('should return null when inputs are missing or invalid', () => {
      expect(calculateExpectedRiskReward('BUY', null, 90, 120)).toBeNull();
      expect(calculateExpectedRiskReward('SELL', 100, undefined, 80)).toBeNull();
      expect(calculateExpectedRiskReward('BUY', 0, 90, 120)).toBeNull();
      expect(calculateExpectedRiskReward('SELL', 100, 110, -5)).toBeNull();
    });

    it('should return null when stop loss equals entry price to avoid division by zero', () => {
      expect(calculateExpectedRiskReward('BUY', 100, 100, 120)).toBeNull();
    });

    it('should return null for invalid risk/reward directions (e.g. SL is above Entry in BUY)', () => {
      // Risk is correctly absolute, but reward would be negative
      expect(calculateExpectedRiskReward('BUY', 100, 110, 90)).toBeNull();
    });
  });

  describe('calculateRealizedR', () => {
    it('should correctly calculate for BUY trade', () => {
      expect(calculateRealizedR('BUY', 90, 100, 120)).toBe(2); // Initial risk: 10, Profit: 20
      expect(calculateRealizedR('BUY', 90, 100, 95)).toBe(-0.5); // Initial risk: 10, Loss: 5
    });

    it('should correctly calculate for SELL trade', () => {
      expect(calculateRealizedR('SELL', 110, 100, 80)).toBe(2); // Initial risk: 10, Profit: 20
      expect(calculateRealizedR('SELL', 110, 100, 105)).toBe(-0.5); // Initial risk: 10, Loss: 5
    });

    it('should return null when SL is same as Entry', () => {
      expect(calculateRealizedR('BUY', 100, 100, 120)).toBeNull();
    });
    
    it('should return null if there are zeroes, nulls or bad values', () => {
      expect(calculateRealizedR('BUY', 0, 100, 120)).toBeNull();
      expect(calculateRealizedR('SELL', 110, null, 80)).toBeNull();
      expect(calculateRealizedR('BUY', NaN, 100, 120)).toBeNull();
      expect(calculateRealizedR('BUY', 90, Infinity, 120)).toBeNull();
    });
  });

  describe('checkEntryPriceConsistency', () => {
    it('should return warnings for BUY trade when SL >= Entry', () => {
      const warnings = checkEntryPriceConsistency('BUY', 100, 105, 120);
      expect(warnings).toContain('買い注文ですが、損切り価格がエントリー価格以上になっています。');
    });

    it('should return warnings for BUY trade when TP <= Entry', () => {
      const warnings = checkEntryPriceConsistency('BUY', 100, 90, 95);
      expect(warnings).toContain('買い注文ですが、利確目標価格がエントリー価格以下になっています。');
    });

    it('should return warnings for SELL trade when SL <= Entry', () => {
      const warnings = checkEntryPriceConsistency('SELL', 100, 95, 80);
      expect(warnings).toContain('売り注文ですが、損切り価格がエントリー価格以下になっています。');
    });

    it('should return warnings for SELL trade when TP >= Entry', () => {
      const warnings = checkEntryPriceConsistency('SELL', 100, 110, 105);
      expect(warnings).toContain('売り注文ですが、利確目標価格がエントリー価格以上になっています。');
    });

    it('should return empty array when consistent', () => {
      expect(checkEntryPriceConsistency('BUY', 100, 90, 120)).toEqual([]);
      expect(checkEntryPriceConsistency('SELL', 100, 110, 80)).toEqual([]);
    });

    it('should return empty array when prices are missing or zero/negative', () => {
      expect(checkEntryPriceConsistency('BUY', 100, null, 120)).toEqual([]);
      expect(checkEntryPriceConsistency('BUY', 100, 0, 120)).toEqual([]);
      expect(checkEntryPriceConsistency('SELL', 0, 110, 80)).toEqual([]);
      expect(checkEntryPriceConsistency('BUY', 100, 90, -5)).toEqual([]);
    });
  });
});
