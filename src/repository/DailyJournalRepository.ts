import { db } from './db';
import { DailyJournal, DailyJournalStatus } from '../types';
import { normalizeJournalSelections } from './JournalNormalization';

export class DailyJournalRepository {
  async getJournalByDate(date: string): Promise<DailyJournal | undefined> {
    return await db.dailyJournals.where('journalDate').equals(date).first();
  }

  async getAllJournals(): Promise<DailyJournal[]> {
    return await db.dailyJournals.orderBy('journalDate').reverse().toArray();
  }

  async createOrUpdateDraft(journalData: Partial<DailyJournal> & { journalDate: string }): Promise<DailyJournal> {
    const normalizedJournalData = normalizeJournalSelections(journalData);
    const existing = await this.getJournalByDate(journalData.journalDate);
    
    if (existing) {
      const updated = {
        ...existing,
        ...normalizedJournalData,
        updatedAt: new Date().toISOString()
      };
      await db.dailyJournals.put(updated);
      return updated;
    } else {
      const newJournal: DailyJournal = {
        id: crypto.randomUUID(),
        schemaVersion: 3,
        status: 'draft',
        marketCondition: null,
        preMarketScenario: '',
        noTradeConditions: '',
        personalCondition: null,
        personalConditionNote: '',
        focusRuleIds: [],
        marketAssessment: null,
        goodDecisions: '',
        improvements: '',
        focusRuleCompliance: null,
        violatedRuleIds: [],
        nextSessionFocus: '',
        dailySummary: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preMarketCompletedAt: null,
        completedAt: null,
        ...normalizedJournalData
      };
      await db.dailyJournals.add(newJournal);
      return newJournal;
    }
  }

  async updateStatus(id: string, status: DailyJournalStatus): Promise<void> {
    const updates: Partial<DailyJournal> = { 
      status, 
      updatedAt: new Date().toISOString() 
    };
    
    if (status === 'preMarketCompleted') {
      updates.preMarketCompletedAt = new Date().toISOString();
    } else if (status === 'completed') {
      updates.completedAt = new Date().toISOString();
    }

    await db.dailyJournals.update(id, updates);
  }

  async deleteJournal(id: string): Promise<void> {
    await db.dailyJournals.delete(id);
  }
}

export const dailyJournalRepository = new DailyJournalRepository();
