export type TradeDirection = 'BUY' | 'SELL';
export type TradeSession = 'Tokyo' | 'London' | 'New York' | 'Overlap' | 'Other';
export type TradeStatus = 'Draft' | 'Plan Confirmed' | 'Entered' | 'Closed' | 'Reviewed' | 'Cancelled' | 'Skipped';

export type HigherTimeframeDirection = 'Uptrend' | 'Downtrend' | 'Range' | 'Unclear';
export type MarketStructure = 'Higher Highs/Lows' | 'Lower Highs/Lows' | 'Failed to Break High' | 'Failed to Break Low' | 'Range' | 'Unclear';
export type RangePosition = 'Lower Edge' | 'Below Center' | 'Center' | 'Above Center' | 'Upper Edge' | 'Outside Range' | 'Unclear';

export type SetupType = 'Pullback Buy (Uptrend)' | 'Pullback Sell (Downtrend)' | 'Buy at Range Low' | 'Sell at Range High' | 'Breakout Retest' | 'Other';
export type HorizontalLineType = 'Clear Swing High' | 'Clear Swing Low' | 'Previous Day High' | 'Previous Day Low' | 'Range High' | 'Range Low' | 'Origin of Higher High' | 'Origin of Lower Low' | 'Breakout Retest Level' | 'Origin of Sharp Move' | 'Other';
export type AuxiliaryCondition = 'Aligned with HTF' | 'Clear Rejection at Level' | 'Failed to Break High/Low' | 'LTF Structure Shift' | 'Retest after Breakout' | 'Swing Failure Pattern' | 'Liquidity Grab' | 'Overlap with FVG' | 'Overlap with Order Block' | 'Volatility Expansion' | 'Other';

export type RuleComplianceLevel = 'Perfect Compliance' | 'Minor Violation' | 'Major Violation' | 'Cannot Evaluate';

export type MistakeType = 'Entered far from level' | 'Entered in range center' | 'Did not wait for confirmation' | 'Chased sudden move' | 'Widened Stop Loss' | 'Took Profit too early' | 'Insufficient R:R' | 'Traded against HTF' | 'Entered before news' | 'Increased position size after loss' | 'Overtrading' | 'FOMO Entry' | 'Traded outside scenario' | 'Post-rationalized entry' | 'Other';

export type ChecklistStatus = 'Pass' | 'Fail' | 'Unclear' | 'Unanswered';

export interface EntryChecklistResult {
  isRelatedToFocusLine: ChecklistStatus;
  isNotRangeCenter: ChecklistStatus;
  isNotChasing: ChecklistStatus;
  isStopLossLogical: ChecklistStatus;
  stopLossLogicMemo?: string; // Short memo
  hasEnoughReward: ChecklistStatus;
  isNotRevenge: ChecklistStatus;
  isInScenario: ChecklistStatus;
  scenarioMemo?: string; // Short memo
}

export interface RuleViolation {
  ruleId: string;
  ruleTitleSnapshot: string;
  severity: 'Minor' | 'Major';
  memo: string;
}

export interface TradePlan {
  // Market Context
  htfDirection: HigherTimeframeDirection;
  marketStructure: MarketStructure;
  rangePosition: RangePosition;

  // Setup
  setupType: SetupType;
  horizontalLineType: HorizontalLineType;
  auxiliaryConditions: AuxiliaryCondition[];

  // Price Info
  plannedEntryPrice: number | null;
  plannedStopLoss: number | null;
  plannedTakeProfit: number | null;

  // Plan
  basicScenario: string;
  invalidationCondition: string;
  takeProfitReason: string;
  skipCondition: string;
  freeMemo: string;

  entryCheckList: EntryChecklistResult;
  entryCheckWarningAcknowledged?: boolean;
}

export interface TradeReview {
  actualEntryPrice: number | null;
  actualExitPrice: number | null;
  exitDate: string;
  monetaryPnL: number | null;
  fees: number | null;
  realizedR: number | null;

  evaluationAnalysis: 'Accurate' | 'Partially Accurate' | 'Inaccurate' | 'Unclear';
  evaluationEntryPosition: 'Good' | 'Acceptable' | 'Early' | 'Late' | 'Should not have entered';
  evaluationStopLoss: 'As Planned' | 'Too Tight' | 'Too Wide' | 'Widened Later' | 'Unclear Logic';
  evaluationTakeProfit: 'As Planned' | 'Too Early' | 'Too Late' | 'Unrealistic Target' | 'Changed Arbitrarily';
  evaluationOverall: 'Good Trade' | 'Acceptable Trade' | 'Needs Improvement' | 'Should not have executed';

  ruleComplianceLevel: RuleComplianceLevel;
  violations: RuleViolation[];

  reviewGoodPoints: string;
  reviewImprovementPoints: string;
  reviewNextAction: 'Execute' | 'Execute with Tweaks' | 'Do Not Execute' | 'Unclear';
  reviewNextConcreteAction: string;
  reviewedAt: string;
}

export interface Trade {
  id: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  
  // Basic Info
  date: string;
  symbol: string;
  direction: TradeDirection;
  session: TradeSession;
  status: TradeStatus;

  plan?: TradePlan;
  review?: TradeReview;
}

export type RuleCategory = 'Entry' | 'Market Bias' | 'Risk Management' | 'Exit' | 'Psychology' | 'Skip' | 'Other';

export interface TradingRule {
  id: string;
  schemaVersion: number;
  title: string;
  shortBody: string;
  detailedDescription: string;
  category: RuleCategory;
  priority: number;
  isPinned: boolean;
  isActive: boolean;
  displayOrder: number;
  isFocusToday: boolean;
  whyNeeded: string;
  problemIfViolated: string;
  correctActionExample: string;
  createdAt: string;
  updatedAt: string;
}

export interface RuleReviewLog {
  id: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  date: string;
  checkedAt: string;
  focusedRuleIds: string[];
  openedFromScreen: string;
  tradeId?: string;
}

export interface AppSettings {
  id: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  defaultSymbol: string;
}

export interface DataMigration {
  id: string;
  schemaVersion: number; // version after migration
  createdAt: string;
  updatedAt: string;
  executedAt: string;
  status: 'Success' | 'Failed';
  errorMessage?: string;
}

export interface TradeFilters {
  startDate?: string;
  endDate?: string;
  symbol?: string;
  direction?: TradeDirection;
  setupType?: SetupType;
  status?: TradeStatus;
  ruleViolation?: 'Yes' | 'No';
  isReviewed?: boolean;
}

export type DailyJournalStatus = 'draft' | 'preMarketCompleted' | 'completed';
export type DailyMarketCondition = 'Uptrend' | 'Downtrend' | 'Range' | 'Unclear';
export type DailyPersonalCondition = 'Good' | 'Neutral' | 'Poor';
export type DailyMarketAssessment = 'Accurate' | 'Partially Accurate' | 'Inaccurate' | 'Unclear';
export type DailyRuleCompliance = 'Followed strictly' | 'Minor slip-up' | 'Failed to follow' | 'Cannot Evaluate';

export interface DailyJournal {
  id: string;
  schemaVersion: number;
  journalDate: string; // YYYY-MM-DD (unique per day)
  status: DailyJournalStatus;
  
  // Pre-market
  marketCondition: DailyMarketCondition | null;
  preMarketScenario: string;
  noTradeConditions: string;
  personalCondition: DailyPersonalCondition | null;
  personalConditionNote: string;
  focusRuleIds: string[];
  
  // Post-market
  marketAssessment: DailyMarketAssessment | null;
  goodDecisions: string;
  improvements: string;
  focusRuleCompliance: DailyRuleCompliance | null;
  violatedRuleIds: string[];
  nextSessionFocus: string;
  dailySummary: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  preMarketCompletedAt: string | null;
  completedAt: string | null;
}

