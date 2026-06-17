import { db } from './db';
import { TradingRule } from '../types';

export class TradingRuleRepository {
  async getAllActiveRules(): Promise<TradingRule[]> {
    return db.rules.filter(r => r.isActive).toArray();
  }

  async getFocusRules(): Promise<TradingRule[]> {
    return db.rules.filter(r => r.isActive && r.isFocusToday).toArray();
  }
  
  async getPinnedRules(): Promise<TradingRule[]> {
    return db.rules.filter(r => r.isActive && r.isPinned && !r.isFocusToday).toArray();
  }

  async getOtherRules(): Promise<TradingRule[]> {
    return db.rules.filter(r => r.isActive && !r.isPinned && !r.isFocusToday).toArray();
  }

  async setRuleFocus(ruleId: string, isFocus: boolean): Promise<void> {
    await db.rules.update(ruleId, { isFocusToday: isFocus, updatedAt: new Date().toISOString() });
  }

  async saveRule(rule: TradingRule): Promise<void> {
    await db.rules.put(rule);
  }

  async initRules(rules: TradingRule[]): Promise<void> {
    await db.rules.bulkPut(rules);
  }

  async findAll(): Promise<TradingRule[]> {
    return db.rules.toArray();
  }
}

export const ruleRepository = new TradingRuleRepository();
