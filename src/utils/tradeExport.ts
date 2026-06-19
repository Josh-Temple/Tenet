import { Trade } from '../types';

export type TradeExportFormat = 'csv' | 'json';

const CSV_HEADERS = [
  'id',
  'date',
  'createdAt',
  'updatedAt',
  'symbol',
  'direction',
  'session',
  'status',
  'setupType',
  'plannedEntryPrice',
  'plannedStopLoss',
  'plannedTakeProfit',
  'basicScenario',
  'invalidationCondition',
  'actualEntryPrice',
  'actualExitPrice',
  'exitDate',
  'monetaryPnL',
  'fees',
  'realizedR',
  'ruleComplianceLevel',
  'violations',
  'reviewGoodPoints',
  'reviewImprovementPoints',
  'reviewNextAction',
  'reviewNextConcreteAction',
  'reviewedAt'
] as const;

function formatNullableValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const cell = formatNullableValue(value);
  if (!/[",\n\r]/.test(cell)) return cell;
  return `"${cell.replaceAll('"', '""')}"`;
}

function formatViolations(trade: Trade): string {
  return trade.review?.violations
    .map((violation) => `${violation.severity}: ${violation.ruleTitleSnapshot}${violation.memo ? ` (${violation.memo})` : ''}`)
    .join('; ') ?? '';
}

function tradeToCsvRow(trade: Trade): string[] {
  return [
    trade.id,
    trade.date,
    trade.createdAt,
    trade.updatedAt,
    trade.symbol,
    trade.direction,
    trade.session,
    trade.status,
    trade.plan?.setupType,
    trade.plan?.plannedEntryPrice,
    trade.plan?.plannedStopLoss,
    trade.plan?.plannedTakeProfit,
    trade.plan?.basicScenario,
    trade.plan?.invalidationCondition,
    trade.review?.actualEntryPrice,
    trade.review?.actualExitPrice,
    trade.review?.exitDate,
    trade.review?.monetaryPnL,
    trade.review?.fees,
    trade.review?.realizedR,
    trade.review?.ruleComplianceLevel,
    formatViolations(trade),
    trade.review?.reviewGoodPoints,
    trade.review?.reviewImprovementPoints,
    trade.review?.reviewNextAction,
    trade.review?.reviewNextConcreteAction,
    trade.review?.reviewedAt
  ].map(formatNullableValue);
}

export function buildTradeCsv(trades: Trade[]): string {
  const rows = [
    CSV_HEADERS.join(','),
    ...trades.map((trade) => tradeToCsvRow(trade).map(escapeCsvCell).join(','))
  ];
  return rows.join('\n');
}

export function buildTradeJson(trades: Trade[]): string {
  return JSON.stringify({ exportedAt: new Date().toISOString(), trades }, null, 2);
}

export function buildTradeExportFileName(format: TradeExportFormat, exportedAt = new Date()): string {
  const timestamp = exportedAt.toISOString().replace(/[:.]/g, '-');
  return `tenet-trades-${timestamp}.${format}`;
}

export function createTradeExportBlob(trades: Trade[], format: TradeExportFormat): Blob {
  if (format === 'json') {
    return new Blob([buildTradeJson(trades)], { type: 'application/json;charset=utf-8' });
  }

  return new Blob([buildTradeCsv(trades)], { type: 'text/csv;charset=utf-8' });
}
