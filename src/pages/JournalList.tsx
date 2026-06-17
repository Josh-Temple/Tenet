import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { dailyJournalRepository } from '../repository/DailyJournalRepository';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ChevronLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { db } from '../repository/db';
import { useEffect, useState } from 'react';

export default function JournalList() {
  const navigate = useNavigate();
  const journals = useLiveQuery(() => dailyJournalRepository.getAllJournals());
  
  // Aggregate stats per day (simplified for list)
  const [tradeStats, setTradeStats] = useState<Record<string, {count: number, r: number}>>({});

  useEffect(() => {
    if (!journals) return;
    const fetchStats = async () => {
      const stats: Record<string, {count: number, r: number}> = {};
      for (const j of journals) {
        const trades = await db.trades.where('date').equals(j.journalDate).toArray();
        const validTrades = trades.filter(t => t.status !== 'Draft' && t.status !== 'Plan Confirmed');
        
        let r = 0;
        let count = 0;
        validTrades.forEach(t => {
          if (t.status === 'Skipped') return; // Skip
          count++;
          if (t.review?.realizedR != null) {
            r += t.review.realizedR;
          }
        });
        stats[j.journalDate] = { count, r };
      }
      setTradeStats(stats);
    };
    fetchStats();
  }, [journals]);

  return (
    <div className="space-y-6 pb-8">
      <header className="flex items-center gap-4 pb-2 border-b border-zinc-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-400 hover:text-zinc-900 transition-colors">
          <ChevronLeft size={24} strokeWidth={1.5} />
        </button>
        <div>
          <h1 className="text-xl font-medium tracking-tight text-zinc-900">Journals</h1>
        </div>
      </header>

      <div className="space-y-0 divide-y divide-zinc-100 mt-6">
        {journals?.length === 0 && (
          <p className="text-center py-10 font-mono text-zinc-400 text-sm">No records found</p>
        )}
        
        {journals?.map(journal => {
          const stats = tradeStats[journal.journalDate] || { count: 0, r: 0 };
          return (
            <div 
              key={journal.id} 
              onClick={() => navigate(`/journal/${journal.journalDate}`)}
              className="py-5 flex flex-col gap-3 group hover:bg-zinc-50/50 active:bg-zinc-50 transition-colors cursor-pointer px-1"
            >
              <div className="flex justify-between items-center">
                  <span className="font-medium tracking-tight text-zinc-900 group-hover:text-violet-600 transition-colors text-lg">
                    {format(new Date(journal.journalDate), 'MMM d, yyyy', { locale: enUS })}
                  </span>
                  <span className={clsx("text-[10px] font-mono tracking-widest uppercase", 
                      journal.status === 'completed' ? "text-zinc-500" :
                      journal.status === 'preMarketCompleted' ? "text-violet-600" :
                      "text-zinc-400"
                  )}>
                      {journal.status === 'completed' ? 'Completed' : journal.status === 'preMarketCompleted' ? 'Pre-Market' : 'Draft'}
                  </span>
              </div>
              
              <div className="text-xs text-zinc-500 flex flex-wrap gap-x-6 gap-y-2">
                 <div>Market <span className="font-medium text-zinc-900 ml-1">{journal.marketCondition || '-'}</span></div>
                 <div>Rules <span className="font-medium text-zinc-900 ml-1">{journal.focusRuleCompliance || '-'}</span></div>
                 <div>Trades <span className="font-mono text-zinc-900 ml-1">{stats.count}</span></div>
                 <div>R <span className={clsx("font-mono ml-1", stats.r > 0 ? "text-zinc-900" : "text-zinc-400")}>{stats.r > 0 ? '+' : ''}{stats.r.toFixed(2)}</span></div>
              </div>

              {journal.dailySummary && (
                 <div className="mt-1">
                    <p className="text-[13px] text-zinc-500 font-light leading-relaxed line-clamp-1">{journal.dailySummary}</p>
                 </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
