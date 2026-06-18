import { db } from './db';
import { Trade, TradeStatus } from '../types';

export class TradeRepository {
  async save(trade: Trade): Promise<void> {
    await db.trades.put(trade);
  }

  async getDraft(): Promise<Trade | undefined> {
    return db.trades.where('status').equals('Draft').first();
  }

  async getById(id: string): Promise<Trade | undefined> {
    return db.trades.get(id);
  }

  async getAll(): Promise<Trade[]> {
    return db.trades.orderBy('createdAt').reverse().toArray();
  }

  async getByStatus(status: TradeStatus): Promise<Trade[]> {
    return db.trades.where('status').equals(status).toArray();
  }

  async getPlanningTrades(): Promise<Trade[]> {
    return db.trades.filter(t => t.status === 'Draft' || t.status === 'Plan Confirmed').toArray();
  }

  async getActiveTrades(): Promise<Trade[]> {
    return db.trades.where('status').equals('Entered').toArray();
  }

  async getReviewPendingTrades(): Promise<Trade[]> {
    return db.trades.where('status').equals('Closed').toArray();
  }

  async delete(id: string): Promise<void> {
    await db.trades.delete(id);
  }
}

export const tradeRepository = new TradeRepository();
