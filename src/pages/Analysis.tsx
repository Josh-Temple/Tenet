import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../repository/db';
import { clsx } from 'clsx';

export default function Analysis() {
  const trades = useLiveQuery(() => db.trades.toArray());

  const calculateStats = () => {
    if (!trades) return null;

    const finishedTrades = trades.filter(t => t.status === 'Reviewed' || t.status === 'Closed');
    const reviewedTrades = trades.filter(t => t.status === 'Reviewed');
    const skippedTrades = trades.filter(t => t.status === 'Skipped');

    const totalTrades = finishedTrades.length;
    const reviewCount = reviewedTrades.length;
    const reviewRate = totalTrades > 0 ? (reviewCount / totalTrades) * 100 : 0;

    let totalR = 0;
    let validRCount = 0;
    let complianceCount = 0;

    reviewedTrades.forEach(t => {
      if (t.review?.realizedR != null) {
        totalR += t.review.realizedR;
        validRCount++;
      }
      if (t.review?.ruleComplianceLevel === 'Perfect Compliance' || t.review?.ruleComplianceLevel === 'Minor Violation') {
        complianceCount++;
      }
    });

    const averageR = validRCount > 0 ? totalR / validRCount : 0;
    const complianceRate = reviewCount > 0 ? (complianceCount / reviewCount) * 100 : 0;

    return {
      total: totalTrades,
      reviewed: reviewCount,
      reviewRate,
      skipped: skippedTrades.length,
      totalR,
      averageR,
      complianceRate
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-8 pb-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-medium tracking-tight text-zinc-900">Analysis</h1>
        <p className="text-xs text-zinc-500 font-light">Performance metrics and stats</p>
      </header>

      {stats ? (
        <div className="grid grid-cols-2 divide-x divide-y divide-zinc-100 border-t border-b border-zinc-100">
          <StatBox label="Trades Logged" value={`${stats.total}`} />
          <StatBox label="Skipped Setups" value={`${stats.skipped}`} />
          <StatBox label="Review Rate" value={`${stats.reviewRate.toFixed(1)} %`} />
          <StatBox label="Rule Compliance" value={`${stats.complianceRate.toFixed(1)} %`} />
          <StatBox label="Total Executed R" value={`${stats.totalR > 0 ? '+' : ''}${stats.totalR.toFixed(2)}`} highlight={stats.totalR !== 0} positive={stats.totalR > 0} />
          <StatBox label="Average R/Trade" value={`${stats.averageR > 0 ? '+' : ''}${stats.averageR.toFixed(2)}`} highlight={stats.averageR !== 0} positive={stats.averageR > 0} />
        </div>
      ) : (
        <p className="text-center py-10 font-mono text-zinc-400">Loading metrics...</p>
      )}

      <div className="pt-8">
        <p className="text-xs text-zinc-400 leading-relaxed text-center font-mono uppercase tracking-widest">
           More advanced analysis<br/>coming in future updates.
        </p>
      </div>
    </div>
  );
}

function StatBox({ label, value, highlight, positive }: { label: string, value: string, highlight?: boolean, positive?: boolean }) {
  return (
    <div className="p-4 space-y-2 flex flex-col items-center justify-center text-center">
      <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 leading-tight">{label}</p>
      <p className={clsx("text-2xl font-mono", highlight ? (positive ? 'text-emerald-500' : 'text-rose-500') : 'text-zinc-900')}>
        {value}
      </p>
    </div>
  );
}
