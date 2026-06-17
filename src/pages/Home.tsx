import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db } from '../repository/db';
import { ArrowRight, AlertCircle, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

import { Trade } from '../types';

function RecentTradeItem({ trade, onClick }: { trade: Trade; onClick: () => void }) {
  return (
    <div className="py-5 flex justify-between items-center group cursor-pointer border-b border-zinc-100 last:border-0" onClick={onClick}>
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-mono tracking-widest font-medium ${trade.direction === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trade.direction === 'BUY' ? 'BUY' : 'SELL'}
          </span>
          <span className="text-sm font-medium tracking-tight text-zinc-900 group-hover:text-violet-600 transition-colors">{trade.symbol}</span>
        </div>
        <p className="text-xs text-zinc-400 font-light line-clamp-1">{trade.plan?.setupType || 'Other'}</p>
      </div>
      <div className="text-right flex flex-col items-end gap-1.5">
        <span className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase">
          {trade.status}
        </span>
        {trade.review?.realizedR != null ? (
          <span className={`text-sm font-mono font-medium ${trade.review.realizedR > 0 ? 'text-zinc-900' : 'text-zinc-400'}`}>
            {trade.review.realizedR > 0 ? '+' : ''}{trade.review.realizedR.toFixed(2)} R
          </span>
        ) : (
          <span className="text-sm font-mono font-medium text-zinc-200">-</span>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const rules = useLiveQuery(() => db.rules.toArray());
  const trades = useLiveQuery(() => db.trades.orderBy('createdAt').reverse().toArray());
  
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayJournal = useLiveQuery(() => db.dailyJournals.where('journalDate').equals(todayDateStr).first());

  const focusRules = rules?.filter(r => r.isFocusToday && r.isActive) || [];

  const draftTrade = trades?.find(t => t.status === 'Draft');
  const planningCount = trades?.filter(t => t.status === 'Draft' || t.status === 'Plan Confirmed').length || 0;
  const activeCount = trades?.filter(t => t.status === 'Entered').length || 0;
  const reviewPendingCount = trades?.filter(t => t.status === 'Closed').length || 0;

  const getRecentTrades = () => {
    return trades?.filter(t => t.status !== 'Draft').slice(0, 5) || [];
  };

  return (
    <div className="space-y-16 pb-12">
      <header className="space-y-2 pt-4">
        <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
          {format(new Date(), 'MMM d, yyyy', { locale: enUS })}
        </p>
        <h1 className="text-3xl font-medium tracking-tight text-zinc-900">Today</h1>
      </header>

      {draftTrade && (
        <section className="pl-4 py-1 border-l border-violet-500">
          <div className="flex justify-between items-start">
             <div>
               <h3 className="text-sm font-medium text-zinc-900 tracking-tight">Draft in progress</h3>
               <p className="text-xs text-zinc-400 mt-1 font-light">
                 {draftTrade.symbol ? draftTrade.symbol : 'No Symbol'}
               </p>
             </div>
             <button
               onClick={() => navigate('/record')}
               className="text-[10px] font-mono tracking-widest uppercase text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
             >
               Resume <ArrowUpRight size={12} />
             </button>
          </div>
        </section>
      )}

      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase">Daily Journal</h2>
          <button onClick={() => navigate('/journals')} className="text-[10px] uppercase tracking-widest font-mono text-zinc-400 hover:text-zinc-900 transition-colors">
            View All
          </button>
        </div>
        
        <div className="px-1">
          {!todayJournal ? (
            <div className="flex flex-col space-y-5">
              <p className="text-sm text-zinc-400 font-light leading-relaxed">No thoughts recorded yet today. Take a moment to set you bias and rules.</p>
              <button 
                 onClick={() => navigate('/journal/today')} 
                 className="self-start text-[11px] font-mono tracking-widest uppercase text-zinc-900 hover:text-violet-600 font-medium flex items-center gap-2 transition-colors group"
               >
                 Write Entry <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ) : todayJournal.status === 'preMarketCompleted' ? (
            <div className="space-y-5">
               <div>
                 <p className="text-xs font-mono text-zinc-400 tracking-widest uppercase mb-2">Pre-market Summary</p>
                 <p className="text-sm font-medium text-zinc-900 leading-relaxed max-w-[90%]">
                   Market Context: <span className="text-zinc-500 font-light">{todayJournal.marketCondition || '-'}</span>
                 </p>
               </div>
               <div className="flex gap-6 items-center">
                 <button onClick={() => navigate('/journal/today')} className="text-[11px] font-mono tracking-widest uppercase text-zinc-400 hover:text-zinc-900 font-medium transition-colors">
                    Edit
                 </button>
                 <button onClick={() => navigate('/journal/today?review=1')} className="text-[11px] font-mono tracking-widest uppercase text-violet-600 hover:text-violet-700 font-medium flex items-center gap-2 group transition-colors">
                    Review Day <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                 </button>
               </div>
            </div>
          ) : todayJournal.status === 'completed' ? (
            <div className="space-y-5">
               <div>
                 <p className="text-sm font-medium text-zinc-900 line-clamp-2 leading-relaxed max-w-[90%]">
                   {todayJournal.dailySummary || 'No summary provided.'}
                 </p>
                 <p className="text-xs text-zinc-400 mt-2 font-mono tracking-widest">{todayJournal.marketAssessment || '-'}</p>
               </div>
               <button onClick={() => navigate('/journal/today')} className="text-[11px] font-mono tracking-widest uppercase text-zinc-400 hover:text-zinc-900 font-medium transition-colors">
                  View full entry
               </button>
            </div>
          ) : (
             <div className="flex flex-col space-y-4">
              <p className="text-sm text-zinc-400 font-light italic">Drafting in progress...</p>
              <button 
                 onClick={() => navigate('/journal/today')} 
                 className="self-start text-[11px] font-mono tracking-widest uppercase text-violet-600 hover:text-violet-700 font-medium flex items-center gap-2 transition-colors group"
               >
                 Continue <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-3 divide-x divide-zinc-100 py-2">
        <div className="flex flex-col pr-4 cursor-pointer group" onClick={() => navigate('/history?status=planning')}>
          <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 mb-2 group-hover:text-zinc-600 transition-colors">Plan</span>
          <span className="text-2xl font-mono text-zinc-900">{planningCount}</span>
        </div>
        <div className="flex flex-col px-4 cursor-pointer group" onClick={() => navigate('/history?status=active')}>
          <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 mb-2 group-hover:text-zinc-600 transition-colors">Active</span>
          <span className="text-2xl font-mono text-zinc-900">{activeCount}</span>
        </div>
        <div className="flex flex-col pl-4 cursor-pointer group" onClick={() => navigate('/history?status=review')}>
          <div className="flex items-center gap-1.5 mb-2">
            <span className={`text-[10px] uppercase font-mono tracking-widest ${reviewPendingCount > 0 ? 'text-violet-600' : 'text-zinc-400 group-hover:text-zinc-600'} transition-colors`}>Review</span>
            {reviewPendingCount > 0 && <AlertCircle size={10} className="text-violet-500" />}
          </div>
          <span className={`text-2xl font-mono ${reviewPendingCount > 0 ? 'text-violet-700' : 'text-zinc-900'}`}>{reviewPendingCount}</span>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase">Focus Rules</h2>
        </div>
        {focusRules.length > 0 ? (
          <div className="space-y-6 px-1">
            {focusRules.map(rule => (
              <div key={rule.id} className="group">
                <h3 className="font-medium text-zinc-900 text-sm mb-1.5 leading-snug tracking-tight">{rule.title}</h3>
                <p className="text-[13px] text-zinc-500 font-light leading-relaxed max-w-[90%]">{rule.shortBody || rule.detailedDescription}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-400 font-light italic px-1">No focus rules selected.</p>
        )}
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase">Recent Trades</h2>
          <button onClick={() => navigate('/history')} className="text-[10px] uppercase tracking-widest font-mono text-zinc-400 hover:text-zinc-900 flex items-center gap-1 transition-colors">
            All Records
          </button>
        </div>
        <div className="space-y-0 px-1 border-t border-zinc-100">
          {getRecentTrades().length > 0 ? (
            getRecentTrades().map((trade) => (
                <RecentTradeItem key={trade.id} trade={trade} onClick={() => navigate(`/detail/${trade.id}`)} />
            ))
          ) : (
            <p className="text-sm text-zinc-400 font-light italic pt-6">
              No recent trades.
            </p>
          )}
        </div>
      </section>

      <section className="pt-8">
        <button 
          onClick={() => navigate('/record')}
          className="w-full bg-zinc-900 hover:bg-violet-600 text-white font-medium text-sm py-4 tracking-wide flex items-center justify-center gap-3 transition-colors rounded-none"
        >
          <span>NEW ENTRY</span>
          <ArrowRight size={16} strokeWidth={1.5} />
        </button>
      </section>
    </div>
  );
}
