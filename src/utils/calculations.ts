// リスクリワード関連の計算関数

const isValidPrice = (price: number | null | undefined): price is number => {
  return price !== null && price !== undefined && Number.isFinite(price) && price > 0;
};

export const calculateExpectedRiskReward = (
  direction: 'BUY' | 'SELL',
  entryPrice: number | null | undefined,
  stopLossPrice: number | null | undefined,
  takeProfitPrice: number | null | undefined
): number | null => {
  if (!isValidPrice(entryPrice) || !isValidPrice(stopLossPrice) || !isValidPrice(takeProfitPrice)) return null;

  const risk = Math.abs(entryPrice - stopLossPrice);
  if (risk === 0) return null; // ゼロ除算防止

  let reward = direction === 'BUY' ? takeProfitPrice - entryPrice : entryPrice - takeProfitPrice;

  // 意味のある正の数のみ計算
  if (reward <= 0) return null;

  return reward / risk;
};

export const calculateRealizedR = (
  direction: 'BUY' | 'SELL',
  plannedStopLossPrice: number | null | undefined,
  actualEntryPrice: number | null | undefined,
  actualExitPrice: number | null | undefined
): number | null => {
  if (!isValidPrice(plannedStopLossPrice) || !isValidPrice(actualEntryPrice) || !isValidPrice(actualExitPrice)) return null;
  
  const originalRisk = Math.abs(actualEntryPrice - plannedStopLossPrice);
  if (originalRisk === 0) return null;

  let realizedReward = direction === 'BUY' ? actualExitPrice - actualEntryPrice : actualEntryPrice - actualExitPrice;

  return realizedReward / originalRisk;
};

export const checkEntryPriceConsistency = (
  direction: 'BUY' | 'SELL',
  entryPrice: number | null | undefined,
  stopLossPrice: number | null | undefined,
  takeProfitPrice: number | null | undefined
): string[] => {
  const warnings: string[] = [];
  
  // 3項目すべてが有効な正の数の場合のみ警告を出す
  if (!isValidPrice(entryPrice) || !isValidPrice(stopLossPrice) || !isValidPrice(takeProfitPrice)) {
    return warnings;
  }

  if (direction === 'BUY') {
    if (stopLossPrice >= entryPrice) {
      warnings.push('買い注文ですが、損切り価格がエントリー価格以上になっています。');
    }
    if (takeProfitPrice <= entryPrice) {
      warnings.push('買い注文ですが、利確目標価格がエントリー価格以下になっています。');
    }
  } else {
    if (stopLossPrice <= entryPrice) {
      warnings.push('売り注文ですが、損切り価格がエントリー価格以下になっています。');
    }
    if (takeProfitPrice >= entryPrice) {
      warnings.push('売り注文ですが、利確目標価格がエントリー価格以上になっています。');
    }
  }

  return warnings;
};
