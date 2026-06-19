import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../repository/db';
import { Trade, TradeStatus, RuleViolation } from '../types';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { calculateRealizedR, calculateExpectedRiskReward } from '../utils/calculations';
import { ChevronLeft, Plus, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { clsx } from 'clsx';

export default function TradeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'found' | 'notFound' | 'error'>('loading');

  // Review states
  const [actualEntryPrice, setActualEntryPrice] = useState('');
  const [actualExitPrice, setActualExitPrice] = useState('');
  const [reviewNextConcreteAction, setReviewNextConcreteAction] = useState('');
  const [violations, setViolations] = useState<RuleViolation[]>([]);

  // Rule picking
  const rules = useLiveQuery(() => db.rules.orderBy('displayOrder').toArray());
  const [isRulePickerOpen, setIsRulePickerOpen] = useState(false);

  useEffect(() => {
    if (id) {
      setLoadState('loading');
      db.trades.get(id).then(t => {
        if (t) {
          setLoadState('found');
          setTrade(t);
          if (t.review) {
            setActualEntryPrice(t.review.actualEntryPrice?.toString() || '');
            setActualExitPrice(t.review.actualExitPrice?.toString() || '');
            setReviewNextConcreteAction(t.review.reviewNextConcreteAction || '');
            setViolations(t.review.violations || []);
          }
        } else {
          setLoadState('notFound');
        }
      }).catch(() => setLoadState('error'));
    } else {
      setLoadState('notFound');
    }
  }, [id]);

  const addViolation = (ruleId: string, ruleTitle: string) => {
    if (violations.find(v => v.ruleId === ruleId)) return;
    setViolations([...violations, { ruleId, ruleTitleSnapshot: ruleTitle, severity: 'Minor', memo: '' }]);
    setIsRulePickerOpen(false);
  };

  const removeViolation = (ruleId: string) => {
    setViolations(violations.filter(v => v.ruleId !== ruleId));
  };

  if (loadState === 'loading') return <div className="p-8 text-center text-sm font-mono text-zinc-400">Loading...</div>;
  if (loadState === 'notFound' || loadState === 'error' || !trade) {
    return (
      <div className="p-8 text-center space-y-5">
        <h1 className="text-xl font-medium text-zinc-900">記録が見つかりません</h1>
        <p className="text-sm text-zinc-500">指定されたトレード記録は存在しないか、削除されています。</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/history')} className="px-4 py-2 text-xs font-mono bg-zinc-900 text-white rounded-lg">履歴へ戻る</button>
          <button onClick={() => navigate('/')} className="px-4 py-2 text-xs font-mono border border-zinc-200 rounded-lg">ホームへ戻る</button>
        </div>
      </div>
    );
  }

  const updateStatus = async (newStatus: TradeStatus) => {
    await db.trades.update(trade.id, { status: newStatus, updatedAt: new Date().toISOString() });
    setTrade({ ...trade, status: newStatus });
  };

  const handleCancelPlan = async () => {
    const confirmed = window.confirm('Cancel this trade plan? The record will be kept with Cancelled status.');
    if (!confirmed) return;
    await updateStatus('Cancelled');
  };

  const handleSaveReview = async () => {
    const rR = calculateRealizedR(
      trade.direction,
      trade.plan?.plannedStopLoss,
      parseFloat(actualEntryPrice),
      parseFloat(actualExitPrice)
    );

    const updatedTrade: Trade = {
      ...trade,
      status: 'Reviewed' as TradeStatus,
      updatedAt: new Date().toISOString(),
      review: {
        ...trade.review,
        actualEntryPrice: parseFloat(actualEntryPrice) || null,
        actualExitPrice: parseFloat(actualExitPrice) || null,
        exitDate: new Date().toISOString(),
        monetaryPnL: null,
        fees: null,
        realizedR: rR,
        evaluationAnalysis: 'Unclear',
        evaluationEntryPosition: 'Not Evaluated',
        evaluationStopLoss: 'Not Evaluated',
        evaluationTakeProfit: 'Not Evaluated',
        evaluationOverall: 'Not Evaluated',
        ruleComplianceLevel: 'Not Evaluated',
        violations,
        reviewGoodPoints: '',
        reviewImprovementPoints: '',
        reviewNextAction: 'Unclear',
        reviewNextConcreteAction,
        reviewedAt: new Date().toISOString(),
      }
    };

    await db.trades.put(updatedTrade as any);
    navigate(-1);
  };

  const isReviewMode = trade.status === 'Closed' || trade.status === 'Reviewed';

  return (
    <div className="space-y-8 pb-8">
      <header className="flex items-center gap-4 border-b border-zinc-100 pb-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-400 hover:text-zinc-900 transition-colors">
          <ChevronLeft size={24} strokeWidth={1.5} />
        </button>
        <div>
          <h1 className="text-xl font-medium tracking-tight text-zinc-900">{trade.symbol}</h1>
          <p className="text-[10px] text-zinc-500 font-mono tracking-wider">{format(new Date(trade.createdAt), 'MMM d, yyyy HH:mm', { locale: enUS })}</p>
        </div>
        <div className="ml-auto">
            <span className={clsx("text-xs font-medium tracking-wide px-3 py-1.5 rounded-full", 
                trade.status === 'Plan Confirmed' ? "bg-zinc-100 text-zinc-600" :
                trade.status === 'Entered' ? "bg-violet-600 text-white" :
                trade.status === 'Closed' ? "bg-violet-100 text-violet-700" :
                "bg-zinc-50 text-zinc-500 border border-zinc-200"
            )}>
                {trade.status}
            </span>
        </div>
      </header>

      <section className="space-y-6">
        <h2 className="text-[10px] font-mono text-zinc-500 tracking-wider mb-2">TRADE PLAN</h2>
        <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-xl space-y-4">
            <div className="flex gap-8">
                <div>
                   <p className="text-[10px] text-zinc-400 mb-1">Direction</p>
                   <p className="text-sm font-medium">{trade.direction === 'BUY' ? 'LONG (BUY)' : 'SHORT (SELL)'}</p>
                </div>
                <div>
                   <p className="text-[10px] text-zinc-400 mb-1">Expected R:R</p>
                   <p className="text-sm font-medium font-mono border-b border-zinc-200 pb-1 text-violet-700">
                      {calculateExpectedRiskReward(trade.direction, trade.plan?.plannedEntryPrice, trade.plan?.plannedStopLoss, trade.plan?.plannedTakeProfit)?.toFixed(2) || '-'}
                   </p>
                </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 border-t border-zinc-200 pt-4">
                <div>
                   <p className="text-[10px] text-zinc-400 mb-1">ENTRY</p>
                   <p className="text-sm font-mono">{trade.plan?.plannedEntryPrice || '-'}</p>
                </div>
                <div>
                   <p className="text-[10px] text-zinc-400 mb-1">SL</p>
                   <p className="text-sm font-mono text-rose-600">{trade.plan?.plannedStopLoss || '-'}</p>
                </div>
                <div>
                   <p className="text-[10px] text-zinc-400 mb-1">TP</p>
                   <p className="text-sm font-mono text-emerald-600">{trade.plan?.plannedTakeProfit || '-'}</p>
                </div>
            </div>

            {trade.plan?.freeMemo && (
                <div className="border-t border-zinc-200 pt-4">
                   <p className="text-[10px] text-zinc-400 mb-1">Stop Loss Reasoning</p>
                   <p className="text-xs text-zinc-700">{trade.plan.freeMemo}</p>
                </div>
            )}
            {trade.plan?.basicScenario && (
                <div className="border-t border-zinc-200 pt-4">
                   <p className="text-[10px] text-zinc-400 mb-1">Scenario</p>
                   <p className="text-xs text-zinc-700">{trade.plan.basicScenario}</p>
                </div>
            )}
        </div>
      </section>

      {trade.status === 'Plan Confirmed' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button onClick={() => updateStatus('Entered')} className="bg-zinc-900 hover:bg-violet-600 text-white py-4 rounded-xl text-sm font-medium transition-colors sm:col-span-1">Entered Trade</button>
              <button onClick={() => updateStatus('Skipped')} className="bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 py-4 rounded-xl text-sm font-medium transition-colors sm:col-span-1">Skip</button>
              <button onClick={handleCancelPlan} className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 py-4 rounded-xl text-sm font-medium transition-colors sm:col-span-1">Cancel Plan</button>
          </div>
      )}

      {trade.status === 'Entered' && (
          <button onClick={() => updateStatus('Closed')} className="w-full bg-violet-600 hover:bg-violet-700 transition-colors text-white py-4 rounded-xl text-sm font-medium shadow-md">
              Position Closed (Go to Review)
          </button>
      )}

      {isReviewMode && (
          <section className="space-y-6 pt-4 border-t border-zinc-200 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-medium tracking-tight text-zinc-900">Post-Trade Review</h2>

              <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="block text-[10px] font-mono text-zinc-500 tracking-wider">Actual Entry</label>
                          <input type="number" step="0.01" inputMode="decimal" value={actualEntryPrice} onChange={e => setActualEntryPrice(e.target.value)} className="w-full bg-transparent border-b border-zinc-200 py-2 text-lg font-mono focus:border-violet-600 outline-none transition-colors rounded-none placeholder-zinc-300" placeholder="0.00" />
                      </div>
                      <div className="space-y-1">
                          <label className="block text-[10px] font-mono text-zinc-500 tracking-wider">Actual Exit</label>
                          <input type="number" step="0.01" inputMode="decimal" value={actualExitPrice} onChange={e => setActualExitPrice(e.target.value)} className="w-full bg-transparent border-b border-zinc-200 py-2 text-lg font-mono focus:border-violet-600 outline-none transition-colors rounded-none placeholder-zinc-300" placeholder="0.00" />
                      </div>
                  </div>

                  {actualEntryPrice && actualExitPrice && trade.plan?.plannedStopLoss && (
                      <div className="flex justify-between items-center bg-zinc-50 border border-zinc-100 p-4 rounded-xl">
                          <span className="text-xs text-zinc-500">Realized R (Risk/Reward)</span>
                          <span className={clsx("font-mono font-medium text-lg", (() => {
                                 const rr = calculateRealizedR(trade.direction, trade.plan.plannedStopLoss, parseFloat(actualEntryPrice), parseFloat(actualExitPrice));
                                 return rr !== null ? (rr > 0 ? 'text-emerald-600' : 'text-rose-600') : 'text-zinc-900';
                             })())}>
                             {(() => {
                                 const rr = calculateRealizedR(trade.direction, trade.plan.plannedStopLoss, parseFloat(actualEntryPrice), parseFloat(actualExitPrice));
                                 return rr !== null ? `${rr > 0 ? '+' : ''}${rr.toFixed(2)} R` : '-';
                             })()}
                          </span>
                      </div>
                  )}

                  <div className="space-y-4 pt-4 border-t border-zinc-100">
                      <div className="flex items-center justify-between">
                         <label className="block text-[10px] font-mono text-zinc-500 tracking-wider">Rule Violations</label>
                         <button onClick={() => setIsRulePickerOpen(true)} className="text-[10px] font-mono text-zinc-600 border border-zinc-200 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-zinc-50 transition-colors">
                            <Plus size={12} />Add Violation
                         </button>
                      </div>
                      
                      {violations.length > 0 ? (
                          <div className="space-y-2">
                             {violations.map(v => (
                                 <div key={v.ruleId} className="flex items-center justify-between bg-rose-50 text-rose-700 px-3 py-2 rounded-lg text-xs border border-rose-100">
                                     <span className="font-medium line-clamp-1">{v.ruleTitleSnapshot}</span>
                                     <button onClick={() => removeViolation(v.ruleId)} className="text-rose-400 hover:text-rose-700 p-1 -mr-1">
                                        <X size={14} />
                                     </button>
                                 </div>
                             ))}
                          </div>
                      ) : (
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                              <p className="text-xs text-emerald-600 font-medium tracking-wide">✨ No Rule Violations</p>
                          </div>
                      )}
                  </div>

                  <div className="space-y-2 pt-4">
                      <label className="block text-[10px] font-mono text-zinc-500 tracking-wider">Concrete Action for Next Trade</label>
                      <textarea rows={4} value={reviewNextConcreteAction} onChange={e => setReviewNextConcreteAction(e.target.value)} className="w-full bg-transparent border-b border-zinc-200 py-2 text-sm focus:border-violet-600 outline-none transition-colors rounded-none placeholder-zinc-300 resize-none leading-relaxed" placeholder="e.g. Set an alert and don't look at chart until it rings." />
                  </div>

                  <div className="pt-6">
                      <button onClick={handleSaveReview} disabled={!actualEntryPrice || !actualExitPrice} className="w-full bg-zinc-900 hover:bg-violet-600 transition-colors text-white text-sm font-medium py-4 rounded-xl disabled:opacity-50">
                          Save Review
                      </button>
                  </div>
              </div>
          </section>
      )}

      {isRulePickerOpen && (
         <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-100">
                <p className="text-xs font-mono tracking-widest text-zinc-500">SELECT BROKEN RULE</p>
                <button onClick={() => setIsRulePickerOpen(false)} className="p-2 -mr-2 text-zinc-400 hover:text-zinc-900">
                    <X size={20} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2 divide-y divide-zinc-100 custom-scrollbar">
                {rules?.map(r => (
                    <button 
                       key={r.id} 
                       onClick={() => addViolation(r.id, r.title)}
                       disabled={violations.some(v => v.ruleId === r.id)}
                       className="w-full text-left py-4 text-sm font-medium text-zinc-800 disabled:opacity-30 disabled:text-zinc-400 hover:text-violet-600 transition-colors"
                    >
                        {r.title}
                    </button>
                ))}
            </div>
         </div>
      )}
    </div>
  );
}
