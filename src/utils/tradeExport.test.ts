import { describe, expect, it } from 'vitest';
import { buildTradeCsv, buildTradeExportFileName } from './tradeExport';
import { Trade } from '../types';

const baseTrade: Trade = {
  id: 'trade-1',
  schemaVersion: 5,
  createdAt: '2026-06-19T10:00:00.000Z',
  updatedAt: '2026-06-19T10:30:00.000Z',
  date: '2026-06-19',
  symbol: 'XAUUSD',
  direction: 'BUY',
  session: 'London',
  status: 'Reviewed',
  plan: {
    htfDirection: 'Uptrend',
    marketStructure: 'Higher Highs/Lows',
    rangePosition: 'Lower Edge',
    setupType: 'Pullback Buy (Uptrend)',
    horizontalLineType: 'Clear Swing Low',
    auxiliaryConditions: [],
    plannedEntryPrice: 2300,
    plannedStopLoss: 2290,
    plannedTakeProfit: 2320,
    basicScenario: 'Wait for pullback, then confirmation',
    invalidationCondition: 'Break below structure',
    takeProfitReason: '',
    skipCondition: '',
    freeMemo: '',
    entryCheckList: {
      isRelatedToFocusLine: 'Pass',
      isNotRangeCenter: 'Pass',
      isNotChasing: 'Pass',
      isStopLossLogical: 'Pass',
      hasEnoughReward: 'Pass',
      isNotRevenge: 'Pass',
      isInScenario: 'Pass'
    }
  },
  review: {
    actualEntryPrice: 2301,
    actualExitPrice: 2321,
    exitDate: '2026-06-19',
    monetaryPnL: 100,
    fees: 2,
    realizedR: 2,
    evaluationAnalysis: 'Accurate',
    evaluationEntryPosition: 'Good',
    evaluationStopLoss: 'As Planned',
    evaluationTakeProfit: 'As Planned',
    evaluationOverall: 'Good Trade',
    ruleComplianceLevel: 'Perfect Compliance',
    violations: [],
    reviewGoodPoints: 'Stayed patient',
    reviewImprovementPoints: 'Memo has comma, newline\nand quote "here"',
    reviewNextAction: 'Execute',
    reviewNextConcreteAction: 'Repeat setup',
    reviewedAt: '2026-06-19T11:00:00.000Z'
  }
};

describe('tradeExport', () => {
  it('builds CSV with flattened trade fields and escaped cells', () => {
    const csv = buildTradeCsv([baseTrade]);

    expect(csv).toContain('id,date,createdAt,updatedAt,symbol,direction');
    expect(csv).toContain('trade-1,2026-06-19,2026-06-19T10:00:00.000Z');
    expect(csv).toContain('Pullback Buy (Uptrend),2300,2290,2320');
    expect(csv).toContain('"Memo has comma, newline\nand quote ""here"""');
  });

  it('builds stable export filenames from timestamp and format', () => {
    expect(buildTradeExportFileName('csv', new Date('2026-06-19T10:00:00.123Z'))).toBe('tenet-trades-2026-06-19T10-00-00-123Z.csv');
    expect(buildTradeExportFileName('json', new Date('2026-06-19T10:00:00.123Z'))).toBe('tenet-trades-2026-06-19T10-00-00-123Z.json');
  });
});
