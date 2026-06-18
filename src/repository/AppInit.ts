import { db } from './db';
import { TradingRule } from '../types';
import { instrumentRepository } from './InstrumentRepository';

export const INITIAL_RULES = [
  {
    id: 'f93d395a-b9c1-4b13-a8ee-22a87fa75fb4',
    title: 'Do not enter without a scenario',
    shortBody: 'Verbalize your assumptions on price action',
    detailedDescription: 'Before entering, explain how price should move to validate your scenario, and where it would invalidate it.',
    category: 'Entry',
    priority: 1,
    isPinned: true,
    isActive: true,
    displayOrder: 1,
    isFocusToday: true,
    whyNeeded: 'To prevent impulsive trading',
    problemIfViolated: 'Stop loss becomes ambiguous, increasing losses',
    correctActionExample: 'Decide in advance: "Enter if it breaks high A. Cut if it drops below low B."',
  },
  {
    id: 'a718b534-118c-4a34-a212-32a823ed10ca',
    title: 'Do not enter away from key levels',
    shortBody: 'Stop impulsive entries in random areas',
    detailedDescription: 'Do not enter impulsively in areas unrelated to the predefined key levels.',
    category: 'Entry',
    priority: 1,
    isPinned: true,
    isActive: true,
    displayOrder: 2,
    isFocusToday: false,
    whyNeeded: 'To reduce random losses in areas without an edge',
    problemIfViolated: 'Win rate drops significantly, bleeding capital to fees',
    correctActionExample: 'Set alerts and do not look at the chart until the level is reached',
  },
  {
    id: '45d4a1cf-e1c9-467b-b5b4-ee18fb520c15',
    title: 'Do not enter in the middle of a range',
    shortBody: 'Avoid areas with unclear direction and R:R',
    detailedDescription: 'Avoid areas where direction and Risk:Reward are unclear. Wait for range edges or a clear breakout.',
    category: 'Market Bias',
    priority: 2,
    isPinned: false,
    isActive: true,
    displayOrder: 3,
    isFocusToday: false,
    whyNeeded: 'Unpredictable direction and poor risk to reward',
    problemIfViolated: 'Whipsaws lead to unnecessary stop outs',
    correctActionExample: 'Wait for range high/low, or a confirmed breakout and retest',
  },
  {
    id: '26e632d4-3ab2-4b2d-bd09-90b5aaab0854',
    title: 'Do not buy high, do not sell low',
    shortBody: 'Avoid FOMO entries at extremes',
    detailedDescription: 'Check where the current price is relative to recent highs/lows or within the range.',
    category: 'Market Bias',
    priority: 2,
    isPinned: false,
    isActive: true,
    displayOrder: 4,
    isFocusToday: false,
    whyNeeded: '',
    problemIfViolated: '',
    correctActionExample: '',
  },
  {
    id: '7cc456e7-1422-491c-b5f7-649da5f2081a',
    title: 'Do not chase sharp moves',
    shortBody: 'Do not enter out of FOMO',
    detailedDescription: 'Do not enter because of the fear of missing out. Wait for a pullback or new structure to form.',
    category: 'Psychology',
    priority: 3,
    isPinned: false,
    isActive: true,
    displayOrder: 5,
    isFocusToday: false,
    whyNeeded: '',
    problemIfViolated: '',
    correctActionExample: '',
  },
  {
    id: 'e10fcb93-8f67-4a00-abaf-71dc82ac24cd',
    title: 'Wait for required confirmation',
    shortBody: 'Avoid entering blindly at a level',
    detailedDescription: 'Do not enter just because a level is reached. Wait for the predetermined reversal or structural shift.',
    category: 'Entry',
    priority: 1,
    isPinned: false,
    isActive: true,
    displayOrder: 6,
    isFocusToday: false,
    whyNeeded: '',
    problemIfViolated: '',
    correctActionExample: '',
  },
  {
    id: '6ffc6b54-0555-4428-baab-2b7e9b0151fb',
    title: 'Place stop at invalidation, do not widen',
    shortBody: 'Do not base stop on dollar amount',
    detailedDescription: 'Place stop loss where the scenario is invalidated, and calculate position size from that distance.',
    category: 'Risk Management',
    priority: 1,
    isPinned: true,
    isActive: true,
    displayOrder: 7,
    isFocusToday: false,
    whyNeeded: '',
    problemIfViolated: '',
    correctActionExample: '',
  },
  {
    id: 'd9bdf114-1fbc-4999-9065-27a3c7ef2b7c',
    title: 'Do not enter without sufficient room',
    shortBody: 'Verify Risk vs Reward',
    detailedDescription: 'Check the distance to the next key level or profit target. Avoid trades without sufficient room.',
    category: 'Risk Management',
    priority: 2,
    isPinned: false,
    isActive: true,
    displayOrder: 8,
    isFocusToday: false,
    whyNeeded: '',
    problemIfViolated: '',
    correctActionExample: '',
  },
  {
    id: 'f2ddadd8-fced-42ba-b2cb-23ae8ed22c95',
    title: 'Do not revenge trade',
    shortBody: 'Do not let recent PnL affect you',
    detailedDescription: 'Judge the current setup independently, not based on previous trades.',
    category: 'Psychology',
    priority: 3,
    isPinned: false,
    isActive: true,
    displayOrder: 9,
    isFocusToday: false,
    whyNeeded: '',
    problemIfViolated: '',
    correctActionExample: '',
  },
  {
    id: '3c19e7a8-edcd-4cbb-aebe-0b7c7b049646',
    title: 'Skipping is not failing',
    shortBody: 'Not trading is a valid action',
    detailedDescription: 'Avoiding trades that do not meet your criteria is a correct trading action.',
    category: 'Skip',
    priority: 3,
    isPinned: false,
    isActive: true,
    displayOrder: 10,
    isFocusToday: false,
    whyNeeded: '',
    problemIfViolated: '',
    correctActionExample: '',
  }
];

export const TARGET_SCHEMA_VERSION = 5;

export async function runMigrationsAndInit() {
  const migrations = await db.migrations.toArray();
  const sortedMigrations = migrations.sort((a, b) => a.schemaVersion - b.schemaVersion);
  let currentVersion = 1;
  if (sortedMigrations.length > 0) {
    currentVersion = sortedMigrations[sortedMigrations.length - 1].schemaVersion;
  }

  // Version 2 migration
  if (currentVersion < 2) {
    console.log("Migrating to Schema Version 2...");
    
    await db.transaction('rw', db.rules, db.trades, db.settings, db.migrations, async () => {
      // 1. Initial Rules Fix
      const existingRules = await db.rules.toArray();
      const now = new Date().toISOString();

      // De-duplicate matching titles
      const ruleMapByTitle = new Map<string, TradingRule[]>();
      existingRules.forEach(r => {
        const list = ruleMapByTitle.get(r.title) || [];
        list.push(r);
        ruleMapByTitle.set(r.title, list);
      });

      for (const [, copies] of ruleMapByTitle.entries()) {
        if (copies.length > 1) {
          // Sort to keep newest
          copies.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
          const toKeep = copies[0];
          const toDelete = copies.slice(1).map(c => c.id);
          
          Object.assign(toKeep, { schemaVersion: 2, updatedAt: now });
          await db.rules.put(toKeep);
          await db.rules.bulkDelete(toDelete);
        } else {
          Object.assign(copies[0], { schemaVersion: 2, updatedAt: now });
          await db.rules.put(copies[0]);
        }
      }

      // Reload unique rules
      const uniqueRules = await db.rules.toArray();
      // Add missing default rules
      for (const defaultRule of INITIAL_RULES) {
        const match = uniqueRules.find(ur => ur.title === defaultRule.title);
        if (!match) {
          const newRule: TradingRule = {
            ...defaultRule,
            category: defaultRule.category as any,
            schemaVersion: 2,
            createdAt: now,
            updatedAt: now
          };
          await db.rules.put(newRule);
        } else if (match.id !== defaultRule.id) {
          // Keep pinned/focus state if user changed it. Use fixed ID.
          const newRule: TradingRule = {
            ...defaultRule,
            category: defaultRule.category as any, // fallback fix
            schemaVersion: 2,
            isPinned: match.isPinned,
            isFocusToday: match.isFocusToday,
            isActive: match.isActive,
            createdAt: match.createdAt,
            updatedAt: now
          };
          await db.rules.delete(match.id);
          await db.rules.put(newRule);
        }
      }

      // 2. Trades Fix (0 -> null for price, set schemaVersion, map to new types)
      const existingTrades = await db.trades.toArray();
      for (const t of existingTrades) {
        const currentData: any = t;
        
        // Convert old structure if needed
        if (!currentData.schemaVersion || currentData.schemaVersion < 2) {
            
            const newTrade: any = {
                id: currentData.id,
                schemaVersion: 2,
                createdAt: currentData.createdAt,
                updatedAt: currentData.updatedAt || new Date().toISOString(),
                date: currentData.date,
                symbol: currentData.symbol,
                direction: currentData.direction,
                session: currentData.session,
                status: currentData.status === '計画中' ? '計画確定' : currentData.status
            };

            const convertPrice = (p: any) => p === 0 ? null : p;
            
            newTrade.plan = {
                htfDirection: currentData.htfDirection || '判断不能',
                marketStructure: currentData.marketStructure || '判断不能',
                rangePosition: currentData.rangePosition || '判断不能',
                setupType: currentData.setupType || 'その他',
                horizontalLineType: currentData.horizontalLineType || 'その他',
                auxiliaryConditions: currentData.auxiliaryConditions || [],
                plannedEntryPrice: convertPrice(currentData.plannedEntryPrice),
                plannedStopLoss: convertPrice(currentData.plannedStopLoss),
                plannedTakeProfit: convertPrice(currentData.plannedTakeProfit),
                basicScenario: currentData.basicScenario || '',
                invalidationCondition: currentData.invalidationCondition || '',
                takeProfitReason: currentData.takeProfitReason || '',
                skipCondition: currentData.skipCondition || '',
                freeMemo: currentData.freeMemo || '',
                entryCheckList: {
                    isRelatedToFocusLine: currentData.entryCheckList?.isRelatedToFocusLine ? '問題なし' : '未回答',
                    isNotRangeCenter: currentData.entryCheckList?.isNotRangeCenter ? '問題なし' : '未回答',
                    isNotChasing: currentData.entryCheckList?.isNotChasing ? '問題なし' : '未回答',
                    isStopLossLogical: currentData.entryCheckList?.isStopLossLogical ? '問題なし' : '未回答',
                    hasEnoughReward: currentData.entryCheckList?.hasEnoughReward ? '問題なし' : '未回答',
                    isNotRevenge: currentData.entryCheckList?.isNotRevenge ? '問題なし' : '未回答',
                    isInScenario: currentData.entryCheckList?.isInScenario ? '問題なし' : '未回答',
                },
                entryCheckWarningAcknowledged: currentData.entryCheckWarningAcknowledged || false
            };

            if (currentData.status === '決済済み') {
                newTrade.review = {
                    actualEntryPrice: convertPrice(currentData.actualEntryPrice),
                    actualExitPrice: convertPrice(currentData.actualExitPrice),
                    exitDate: currentData.exitDate || '',
                    monetaryPnL: convertPrice(currentData.monetaryPnL),
                    fees: convertPrice(currentData.fees),
                    realizedR: convertPrice(currentData.realizedR),
                    evaluationAnalysis: currentData.evaluationAnalysis || '判断不能',
                    evaluationEntryPosition: currentData.evaluationEntryPosition || '許容範囲',
                    evaluationStopLoss: currentData.evaluationStopLoss || '計画どおり',
                    evaluationTakeProfit: currentData.evaluationTakeProfit || '計画どおり',
                    evaluationOverall: currentData.evaluationOverall || '改善が必要',
                    ruleComplianceLevel: currentData.ruleComplianceLevel || '評価不能',
                    violations: currentData.violatedRuleIds ? currentData.violatedRuleIds.map((rid: string) => ({ ruleId: rid, ruleTitleSnapshot: 'ルール', severity: '軽微', memo: ''})) : [],
                    reviewGoodPoints: currentData.reviewGoodPoints || '',
                    reviewImprovementPoints: currentData.reviewImprovementPoints || '',
                    reviewNextAction: currentData.reviewNextAction || '判断不能',
                    reviewNextConcreteAction: currentData.reviewNextConcreteAction || '',
                    reviewedAt: currentData.updatedAt || new Date().toISOString()
                };
                newTrade.status = 'レビュー済み'; // Best guess mapping
            }

            await db.trades.put(newTrade as any);
        }
      }

      await db.migrations.put({
        id: crypto.randomUUID(),
        schemaVersion: 2,
        createdAt: now,
        updatedAt: now,
        executedAt: now,
        status: 'Success'
      });
    });
    
    console.log("Migration 2 complete.");
  }
  
  // Version 3 migration
  if (currentVersion < 3) {
    console.log("Migrating to Schema Version 3...");
    const now = new Date().toISOString();
    
    await db.transaction('rw', db.migrations, async () => {
      await db.migrations.put({
        id: crypto.randomUUID(),
        schemaVersion: 3,
        createdAt: now,
        updatedAt: now,
        executedAt: now,
        status: 'Success'
      });
    });
    console.log("Migration 3 complete.");
  }

  // Version 4 migration (English Translation)
  if (currentVersion < 4) {
    console.log("Migrating to Schema Version 4 (English)...");
    const now = new Date().toISOString();
    
    // Map function
    const t = (val: string | null | undefined): any => {
      if (!val) return val;
      const map: Record<string, string> = {
        // TradeSession
        '東京': 'Tokyo', 'ロンドン': 'London', 'ニューヨーク': 'New York', 'セッション重複': 'Overlap', 'その他': 'Other',
        // TradeStatus
        '下書き': 'Draft', '計画確定': 'Plan Confirmed', 'エントリー済み': 'Entered', '決済済み': 'Closed', 'レビュー済み': 'Reviewed', 'キャンセル': 'Cancelled', '見送り': 'Skipped',
        // HigherTimeframeDirection
        '上昇': 'Uptrend', '下降': 'Downtrend', 'レンジ': 'Range', '判断不能': 'Unclear',
        // MarketStructure
        '高値・安値切り上げ': 'Higher Highs/Lows', '高値・安値切り下げ': 'Lower Highs/Lows', '高値更新失敗': 'Failed to Break High', '安値更新失敗': 'Failed to Break Low',
        // RangePosition
        'レンジ下部': 'Lower Edge', '中央より下': 'Below Center', '中央付近': 'Center', '中央より上': 'Above Center', 'レンジ上部': 'Upper Edge', 'レンジ外': 'Outside Range',
        // SetupType
        '上昇トレンド中の水平線への押し目買い': 'Pullback Buy (Uptrend)', '下降トレンド中の水平線への戻り売り': 'Pullback Sell (Downtrend)', 'レンジ下限での買い': 'Buy at Range Low', 'レンジ上限での売り': 'Sell at Range High', 'ブレイク後の再テスト': 'Breakout Retest',
        // HorizontalLineType
        '明確なスイング高値': 'Clear Swing High', '明確なスイング安値': 'Clear Swing Low', '前日高値': 'Previous Day High', '前日安値': 'Previous Day Low', 'レンジ上限': 'Range High', 'レンジ下限': 'Range Low', '高値更新の起点となった安値': 'Origin of Higher High', '安値更新の起点となった高値': 'Origin of Lower Low', 'ブレイク後の戻り候補': 'Breakout Retest Level', '急騰・急落の起点': 'Origin of Sharp Move',
        // AuxiliaryCondition
        '上位足方向と一致': 'Aligned with HTF', '水平線での明確な拒否反応': 'Clear Rejection at Level', '下位足の構造転換': 'LTF Structure Shift', 'Swing Failure Pattern': 'Swing Failure Pattern', 'Liquidity grab': 'Liquidity Grab', 'FVGとの重なり': 'Overlap with FVG', 'オーダーブロックとの重なり': 'Overlap with Order Block', 'ボラティリティ拡大': 'Volatility Expansion',
        // RuleComplianceLevel
        'すべて守った': 'Perfect Compliance', '軽微な違反があった': 'Minor Violation', '重大な違反があった': 'Major Violation', '評価不能': 'Cannot Evaluate',
        // ChecklistStatus
        '問題なし': 'Pass', '問題あり': 'Fail', '判断できない': 'Unclear', '未回答': 'Unanswered',
        // Severities
        '軽微': 'Minor', '重大': 'Major',
        // Misc
        '適切': 'Accurate', '一部適切': 'Partially Accurate', '不適切': 'Inaccurate',
        '良い': 'Good', '許容範囲': 'Acceptable', '早い': 'Early', '遅い': 'Late', '入るべきではなかった': 'Should not have entered',
        '計画どおり': 'As Planned', '狭すぎた': 'Too Tight', '広すぎた': 'Too Wide', '後から広げた': 'Widened Later', '根拠が曖昧だった': 'Unclear Logic',
        '早すぎた': 'Too Early', '遅すぎた': 'Too Late', '目標が非現実的だった': 'Unrealistic Target', '計画外に変更した': 'Changed Arbitrarily',
        '良いトレード': 'Good Trade', '許容できるトレード': 'Acceptable Trade', '改善が必要': 'Needs Improvement', '実行してはいけないトレード': 'Should not have executed',
        '実行する': 'Execute', '条件を変更して実行する': 'Execute with Tweaks', '実行しない': 'Do Not Execute',
        '上昇傾向': 'Uptrend', '下降傾向': 'Downtrend',
        '良好': 'Good', '普通': 'Neutral', '不調': 'Poor',
        '適切だった': 'Accurate', '一部適切だった': 'Partially Accurate', '適切ではなかった': 'Inaccurate',
        '守れた': 'Followed strictly', '一部守れなかった': 'Minor slip-up', '守れなかった': 'Failed to follow', '評価できない': 'Cannot Evaluate'
      };
      return map[val] || val;
    };

    await db.transaction('rw', db.rules, db.trades, db.dailyJournals, db.migrations, async () => {
      // Trades
      const trades = await db.trades.toArray();
      for (const trade of trades) {
        let updated = false;
        if (trade.session) { trade.session = t(trade.session); updated = true; }
        if (trade.status) { trade.status = t(trade.status); updated = true; }
        
        if (trade.plan) {
          trade.plan.htfDirection = t(trade.plan.htfDirection);
          trade.plan.marketStructure = t(trade.plan.marketStructure);
          trade.plan.rangePosition = t(trade.plan.rangePosition);
          trade.plan.setupType = t(trade.plan.setupType);
          trade.plan.horizontalLineType = t(trade.plan.horizontalLineType);
          if (trade.plan.auxiliaryConditions) {
            trade.plan.auxiliaryConditions = trade.plan.auxiliaryConditions.map(c => t(c));
          }
          if (trade.plan.entryCheckList) {
            trade.plan.entryCheckList.isRelatedToFocusLine = t(trade.plan.entryCheckList.isRelatedToFocusLine);
            trade.plan.entryCheckList.isNotRangeCenter = t(trade.plan.entryCheckList.isNotRangeCenter);
            trade.plan.entryCheckList.isNotChasing = t(trade.plan.entryCheckList.isNotChasing);
            trade.plan.entryCheckList.isStopLossLogical = t(trade.plan.entryCheckList.isStopLossLogical);
            trade.plan.entryCheckList.hasEnoughReward = t(trade.plan.entryCheckList.hasEnoughReward);
            trade.plan.entryCheckList.isNotRevenge = t(trade.plan.entryCheckList.isNotRevenge);
            trade.plan.entryCheckList.isInScenario = t(trade.plan.entryCheckList.isInScenario);
          }
        }
        
        if (trade.review) {
          trade.review.evaluationAnalysis = t(trade.review.evaluationAnalysis);
          trade.review.evaluationEntryPosition = t(trade.review.evaluationEntryPosition);
          trade.review.evaluationStopLoss = t(trade.review.evaluationStopLoss);
          trade.review.evaluationTakeProfit = t(trade.review.evaluationTakeProfit);
          trade.review.evaluationOverall = t(trade.review.evaluationOverall);
          trade.review.ruleComplianceLevel = t(trade.review.ruleComplianceLevel);
          trade.review.reviewNextAction = t(trade.review.reviewNextAction);
          if (trade.review.violations) {
            trade.review.violations.forEach(v => {
              v.severity = t(v.severity);
            });
          }
        }

        if (updated) {
          trade.schemaVersion = 4;
          await db.trades.put(trade);
        }
      }

      // Daily Journals
      const journals = await db.dailyJournals.toArray();
      for (const journal of journals) {
        let updated = false;
        if (journal.marketCondition) { journal.marketCondition = t(journal.marketCondition); updated = true; }
        if (journal.personalCondition) { journal.personalCondition = t(journal.personalCondition); updated = true; }
        if (journal.marketAssessment) { journal.marketAssessment = t(journal.marketAssessment); updated = true; }
        if (journal.focusRuleCompliance) { journal.focusRuleCompliance = t(journal.focusRuleCompliance); updated = true; }

        if (updated) {
          journal.schemaVersion = 4;
          await db.dailyJournals.put(journal);
        }
      }

      await db.migrations.put({
        id: crypto.randomUUID(),
        schemaVersion: 4,
        createdAt: now,
        updatedAt: now,
        executedAt: now,
        status: 'Success'
      });
    });
    console.log("Migration 4 complete.");
  }

  if (currentVersion < 5) {
    console.log("Migrating to Schema Version 5 (Instruments)...");
    const now = new Date().toISOString();
    await instrumentRepository.ensureInitialInstruments();
    await db.migrations.put({
      id: crypto.randomUUID(),
      schemaVersion: 5,
      createdAt: now,
      updatedAt: now,
      executedAt: now,
      status: 'Success'
    });
    console.log("Migration 5 complete.");
  } else {
    await instrumentRepository.ensureInitialInstruments();
  }
}
