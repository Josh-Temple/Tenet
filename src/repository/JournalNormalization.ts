import { DailyJournal, DailyMarketAssessment, DailyPersonalCondition, DailyRuleCompliance } from '../types';

export const PERSONAL_CONDITION_VALUES = ['Good', 'Neutral', 'Poor'] as const;
export const MARKET_ASSESSMENT_VALUES = ['Accurate', 'Partially Accurate', 'Inaccurate', 'Unclear'] as const;
export const RULE_COMPLIANCE_VALUES = ['Followed', 'Partially Followed', 'Did Not Follow', 'Cannot Evaluate'] as const;

export function normalizePersonalCondition(value: unknown): DailyPersonalCondition | null {
  const map: Record<string, DailyPersonalCondition> = { Good: 'Good', Neutral: 'Neutral', Poor: 'Poor', Normal: 'Neutral', Bad: 'Poor' };
  return typeof value === 'string' ? map[value] ?? null : null;
}

export function normalizeMarketAssessment(value: unknown): DailyMarketAssessment | null {
  const map: Record<string, DailyMarketAssessment> = {
    Accurate: 'Accurate', 'Partially Accurate': 'Partially Accurate', Inaccurate: 'Inaccurate', Unclear: 'Unclear',
    Appropriate: 'Accurate', 'Partially Appropriate': 'Partially Accurate', Inappropriate: 'Inaccurate',
  };
  return typeof value === 'string' ? map[value] ?? null : null;
}

export function normalizeRuleCompliance(value: unknown): DailyRuleCompliance | null {
  const map: Record<string, DailyRuleCompliance> = {
    Followed: 'Followed', 'Partially Followed': 'Partially Followed', 'Did Not Follow': 'Did Not Follow', 'Cannot Evaluate': 'Cannot Evaluate',
    'Followed strictly': 'Followed', 'Minor slip-up': 'Partially Followed', 'Failed to follow': 'Did Not Follow',
  };
  return typeof value === 'string' ? map[value] ?? null : null;
}

export function normalizeJournalSelections<T extends Partial<DailyJournal>>(journal: T): T {
  return {
    ...journal,
    personalCondition: normalizePersonalCondition(journal.personalCondition),
    marketAssessment: normalizeMarketAssessment(journal.marketAssessment),
    focusRuleCompliance: normalizeRuleCompliance(journal.focusRuleCompliance),
  };
}
