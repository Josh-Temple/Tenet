import { ChecklistStatus, EntryChecklistResult, Trade, TradeDirection, TradePlan } from '../types';
import { DEFAULT_INSTRUMENT_CODE, normalizeInstrumentCode } from './InstrumentRepository';
import { getLocalDateKey } from '../utils/date';

export type ChecklistIssues = {
  failItems: string[];
  unclearItems: string[];
  unansweredItems: string[];
  acknowledgedAt?: string;
};

const checklistKeys: Array<keyof EntryChecklistResult> = ['isRelatedToFocusLine', 'isNotRangeCenter', 'isNotChasing', 'isStopLossLogical', 'hasEnoughReward', 'isNotRevenge', 'isInScenario'];

export function createEmptyEntryChecklist(): EntryChecklistResult {
  return {
    isRelatedToFocusLine: 'Unanswered', isNotRangeCenter: 'Unanswered', isNotChasing: 'Unanswered', isStopLossLogical: 'Unanswered', hasEnoughReward: 'Unanswered', isNotRevenge: 'Unanswered', isInScenario: 'Unanswered', stopLossLogicMemo: '', scenarioMemo: '',
  };
}

export function getChecklistIssues(checks: Record<string, ChecklistStatus>): ChecklistIssues {
  return {
    failItems: Object.entries(checks).filter(([, v]) => v === 'Fail').map(([k]) => k),
    unclearItems: Object.entries(checks).filter(([, v]) => v === 'Unclear').map(([k]) => k),
    unansweredItems: Object.entries(checks).filter(([, v]) => v === 'Unanswered').map(([k]) => k),
  };
}

export function createEmptyTradePlan(): TradePlan {
  return {
    htfDirection: 'Unclear', marketStructure: 'Unclear', rangePosition: 'Unclear', setupType: 'Other', horizontalLineType: 'Other', auxiliaryConditions: [],
    plannedEntryPrice: null, plannedStopLoss: null, plannedTakeProfit: null,
    basicScenario: '', invalidationCondition: '', takeProfitReason: '', skipCondition: '', freeMemo: '',
    entryCheckList: createEmptyEntryChecklist(), entryCheckWarningAcknowledged: false,
  };
}

export function createDraftTrade(input: { id: string; symbol?: string; direction: TradeDirection; existing?: Trade; now?: string; date?: string; plan?: Partial<TradePlan> }): Trade {
  const now = input.now ?? new Date().toISOString();
  const candidateSymbol = normalizeInstrumentCode(input.symbol || DEFAULT_INSTRUMENT_CODE);
  const normalizedSymbol = !candidateSymbol || candidateSymbol === 'UNSET' ? DEFAULT_INSTRUMENT_CODE : candidateSymbol;
  const basePlan = createEmptyTradePlan();
  const plan = { ...basePlan, ...input.existing?.plan, ...input.plan, entryCheckList: { ...basePlan.entryCheckList, ...input.existing?.plan?.entryCheckList, ...input.plan?.entryCheckList } };
  return {
    id: input.id, schemaVersion: 5, createdAt: input.existing?.createdAt ?? now, updatedAt: now, date: input.date ?? input.existing?.date ?? getLocalDateKey(), symbol: normalizedSymbol,
    direction: input.direction, session: input.existing?.session ?? 'Tokyo', status: 'Draft', plan,
  };
}

export function hasProblematicChecklist(checks: Record<string, ChecklistStatus>): boolean {
  const issues = getChecklistIssues(checks);
  return issues.failItems.length + issues.unclearItems.length + issues.unansweredItems.length > 0;
}

export function copyChecksToEntryChecklist(checks: Record<string, ChecklistStatus>, stopLossLogicMemo: string, scenarioMemo: string): EntryChecklistResult {
  const entry = createEmptyEntryChecklist();
  for (const key of checklistKeys) {
    const value = checks[key as string];
    if (value) (entry[key] as ChecklistStatus) = value;
  }
  entry.stopLossLogicMemo = stopLossLogicMemo;
  entry.scenarioMemo = scenarioMemo;
  return entry;
}
