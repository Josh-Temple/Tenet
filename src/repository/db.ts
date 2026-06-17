import Dexie, { Table } from 'dexie';
import { Trade, TradingRule, RuleReviewLog, AppSettings, DataMigration, DailyJournal } from '../types';

export class TradeReviewDatabase extends Dexie {
  trades!: Table<Trade, string>;
  rules!: Table<TradingRule, string>;
  ruleLogs!: Table<RuleReviewLog, string>;
  settings!: Table<AppSettings, string>;
  migrations!: Table<DataMigration, string>;
  dailyJournals!: Table<DailyJournal, string>;

  constructor() {
    super('TradeReviewDB');
    // Schema version 1: Original
    // Schema version 2: Added migrations, updated Trade / Rule structures
    // Schema version 3: Added dailyJournals
    this.version(3).stores({
      trades: 'id, date, symbol, direction, status, createdAt',
      rules: 'id, isActive, isPinned, isFocusToday, displayOrder, category',
      ruleLogs: 'id, date',
      settings: 'id',
      migrations: 'id, schemaVersion, createdAt',
      dailyJournals: 'id, journalDate, status, createdAt'
    }).upgrade(() => {
      // Data migration is handled separately in MigrationService to allow React UI feedback.
    });
    
    // Support downgrades (though usually Dexie handles it, explicit versions map the stores)
    this.version(2).stores({
      trades: 'id, date, symbol, direction, status, createdAt',
      rules: 'id, isActive, isPinned, isFocusToday, displayOrder, category',
      ruleLogs: 'id, date',
      settings: 'id',
      migrations: 'id, schemaVersion, createdAt'
    });
  }
}

export const db = new TradeReviewDatabase();
