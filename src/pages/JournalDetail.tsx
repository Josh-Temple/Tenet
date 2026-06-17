import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { dailyJournalRepository } from '../repository/DailyJournalRepository';
import { db } from '../repository/db';
import { DailyJournal, TradingRule, Trade } from '../types';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ChevronLeft, Edit2, CheckCircle2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

export default function JournalDetail() {
  const { dateParam } = useParams<{ dateParam: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const autoOpenReview = searchParams.get('review') === '1';

  const journalDate = dateParam === 'today' ? new Date().toISOString().split('T')[0] : dateParam || '';
  
  const [journal, setJournal] = useState<Partial<DailyJournal>>({ journalDate });
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isEditingPreMarket, setIsEditingPreMarket] = useState(false);

  // Reference data
  const [activeRules, setActiveRules] = useState<TradingRule[]>([]);
  const [dayTrades, setDayTrades] = useState<Trade[]>([]);
  const [tradeStats, setTradeStats] = useState({ count: 0, skipped: 0, r: 0, reviewed: 0, minorViolations: 0, majorViolations: 0 });

  useEffect(() => {
    const loadData = async () => {
      // Load rules
      const rules = await db.rules.where('isActive').equals('true').toArray();
      setActiveRules(rules);

      // Load journal
      const existing = await dailyJournalRepository.getJournalByDate(journalDate);
      if (existing) {
        setJournal(existing);
      } else {
        // Initialize with default focus rules
        const focusIds = rules.filter(r => r.isFocusToday).map(r => r.id).slice(0, 3);
        setJournal({ journalDate, focusRuleIds: focusIds, status: 'draft' });
      }

      // Load trades for the day
      const trades = await db.trades.where('date').equals(journalDate).toArray();
      const relevantTrades = trades.filter(t => t.status !== 'Draft' && t.status !== 'Plan Confirmed');
      setDayTrades(relevantTrades);
      
      let count = 0, skipped = 0, r = 0, reviewed = 0, minor = 0, major = 0;
      relevantTrades.forEach(t => {
        if (t.status === 'Skipped') {
          skipped++;
        } else {
          count++;
          if (t.review) {
            reviewed++;
            if (t.review.realizedR != null) r += t.review.realizedR;
            t.review.violations?.forEach(v => {
              if (v.severity === 'Minor') minor++;
              if (v.severity === 'Major') major++;
            });
          }
        }
      });
      setTradeStats({ count, skipped, r, reviewed, minorViolations: minor, majorViolations: major });
      setIsLoaded(true);
      
      if (!existing && autoOpenReview) {
          // Can't review without pre-market, normally blocked by UI flow
      } else if (existing?.status === 'preMarketCompleted' && autoOpenReview) {
          // Open review section naturally
      }
    };
    loadData();
  }, [journalDate]);

  // Auto-save
  useEffect(() => {
    if (!isLoaded) return;
    const saveTimer = setTimeout(async () => {
      if (!journal.status || !journal.journalDate) return; // Prevent initial double save if not fully init
      try {
        setSaveState('saving');
        const updated = await dailyJournalRepository.createOrUpdateDraft(journal as Partial<DailyJournal> & { journalDate: string });
        // Only update id/status if changed
        setJournal(prev => ({...prev, id: updated.id, status: prev.status || updated.status}));
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
      } catch (err) {
        console.error(err);
        setSaveState('error');
      }
    }, 1500);

    return () => clearTimeout(saveTimer);
  }, [journal, isLoaded]); // Depends on journal state

  const handleChange = (field: keyof DailyJournal, value: any) => {
    setJournal(prev => ({ ...prev, [field]: value }));
  };

  const toggleFocusRule = (id: string, section: 'pre' | 'post') => {
    if (section === 'pre') {
      const current = journal.focusRuleIds || [];
      if (current.includes(id)) {
        handleChange('focusRuleIds', current.filter(x => x !== id));
      } else if (current.length < 3) {
        handleChange('focusRuleIds', [...current, id]);
        // Sync to global focus rules
        db.rules.update(id, { isFocusToday: true, updatedAt: new Date().toISOString() });
      }
    } else {
      const current = journal.violatedRuleIds || [];
      if (current.includes(id)) {
        handleChange('violatedRuleIds', current.filter(x => x !== id));
      } else {
        handleChange('violatedRuleIds', [...current, id]);
      }
    }
  };

  const handleCompletePreMarket = async () => {
    if (!journal.journalDate) return;
    const updated = await dailyJournalRepository.createOrUpdateDraft({...journal, status: 'preMarketCompleted'} as Partial<DailyJournal> & { journalDate: string });
    setJournal(updated);
    setIsEditingPreMarket(false);
  };

  const handleCompleteJournal = async () => {
    if (!journal.journalDate) return;
    const updated = await dailyJournalRepository.createOrUpdateDraft({...journal, status: 'completed'} as Partial<DailyJournal> & { journalDate: string });
    setJournal(updated);
    navigate(-1);
  };

  if (!isLoaded) return <div className="p-8 text-center text-sm font-mono text-zinc-400">Loading...</div>;

  const showPreMarketEdit = journal.status === 'draft' || isEditingPreMarket;
  const showPostMarket = journal.status === 'preMarketCompleted' || journal.status === 'completed';

  return (
    <div className="space-y-8 pb-8">
      <header className="flex items-center gap-4 pb-2 border-b border-zinc-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-400 hover:text-zinc-900 transition-colors">
          <ChevronLeft size={24} strokeWidth={1.5} />
        </button>
        <div>
          <h1 className="text-xl font-medium tracking-tight text-zinc-900">
            {format(new Date(journalDate), 'MMM d, yyyy', { locale: enUS })} Journal
          </h1>
        </div>
        <div className="ml-auto text-[10px] font-mono flex items-center gap-1">
          {saveState === 'saving' && <span className="text-zinc-400">Saving...</span>}
          {saveState === 'saved' && <span className="text-zinc-400 flex items-center gap-1"><CheckCircle2 size={12}/> Saved</span>}
          {saveState === 'error' && <span className="text-red-500 flex items-center gap-1"><AlertCircle size={12} /> Save Error</span>}
        </div>
      </header>

      {/* --- Pre-Market Section --- */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-900 border-l-2 border-violet-600 pl-2">1. Pre-Market Plan</h2>
          {!showPreMarketEdit && (
            <button onClick={() => setIsEditingPreMarket(true)} className="text-[10px] text-zinc-500 flex items-center gap-1 hover:text-violet-600">
              <Edit2 size={12} /> Edit
            </button>
          )}
        </div>

        {showPreMarketEdit ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-2">
              <label className="block text-[10px] font-mono text-zinc-500 tracking-wider">Market Context Today</label>
              <div className="grid grid-cols-2 gap-2">
                {['Uptrend', 'Downtrend', 'Range', 'Unclear'].map(opt => (
                  <button key={opt} onClick={() => handleChange('marketCondition', opt)} className={clsx("py-2 px-3 text-xs rounded-lg border transition-colors", journal.marketCondition === opt ? "bg-violet-600 text-white border-violet-600" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300")}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-mono text-zinc-500 tracking-wider">Basic Scenario Today</label>
              <textarea value={journal.preMarketScenario || ''} onChange={(e) => handleChange('preMarketScenario', e.target.value)} rows={3} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-sm focus:border-violet-600 outline-none transition-colors" placeholder="e.g. In uptrend, wait for pullback to 1.1000 support to buy." />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-mono text-zinc-500 tracking-wider">Do Not Trade If...</label>
              <textarea value={journal.noTradeConditions || ''} onChange={(e) => handleChange('noTradeConditions', e.target.value)} rows={2} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-sm focus:border-violet-600 outline-none transition-colors" placeholder="e.g. Major news release coming, or price stays in tight range." />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-mono text-zinc-500 tracking-wider">My Condition Today</label>
              <div className="flex gap-2">
                 {['Good', 'Normal', 'Bad'].map(opt => (
                  <button key={opt} onClick={() => handleChange('personalCondition', opt)} className={clsx("flex-1 py-2 px-3 text-xs rounded-lg border transition-colors", journal.personalCondition === opt ? "bg-violet-600 text-white border-violet-600" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300")}>
                    {opt}
                  </button>
                ))}
              </div>
              <input type="text" value={journal.personalConditionNote || ''} onChange={(e) => handleChange('personalConditionNote', e.target.value)} className="w-full bg-transparent border-b border-zinc-200 py-2 text-sm focus:border-violet-600 outline-none mt-2 placeholder-zinc-300" placeholder="Note (e.g. Lack of sleep)" />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-mono text-zinc-500 tracking-wider">Focus Rules Today (Max 3)</label>
              <div className="space-y-2">
                 {activeRules.map(rule => {
                    const isSelected = (journal.focusRuleIds || []).includes(rule.id);
                    return (
                      <div key={rule.id} onClick={() => toggleFocusRule(rule.id, 'pre')} className={clsx("p-3 rounded-lg border text-sm cursor-pointer transition-colors", isSelected ? "bg-violet-50 border-violet-300 shadow-sm" : "bg-white border-zinc-200 hover:border-zinc-300", (journal.focusRuleIds || []).length >= 3 && !isSelected && "opacity-50 pointer-events-none")}>
                        <div className="flex items-center gap-2">
                           <div className={clsx("w-4 h-4 rounded-full border flex items-center justify-center shrink-0", isSelected ? "border-violet-600 bg-violet-600" : "border-zinc-300")}>
                              {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                           </div>
                           <span className={clsx("font-medium", isSelected ? "text-violet-900" : "text-zinc-700")}>{rule.title}</span>
                        </div>
                      </div>
                    );
                 })}
              </div>
            </div>

            {journal.status === 'draft' && (
               <button onClick={handleCompletePreMarket} className="w-full bg-zinc-900 hover:bg-violet-600 text-white py-4 rounded-xl text-sm font-medium transition-colors">
                  Complete Pre-Market Plan
               </button>
            )}
            {isEditingPreMarket && journal.status !== 'draft' && (
               <button onClick={() => setIsEditingPreMarket(false)} className="w-full bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 py-4 rounded-xl text-sm font-medium transition-colors">
                  Finish Editing
               </button>
            )}

          </div>
        ) : (
          <div className="space-y-6 pl-4 border-l-2 border-violet-100">
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <p className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase mb-1">Market</p>
                  <p className="text-sm font-medium text-zinc-900">{journal.marketCondition || '-'}</p>
               </div>
               <div>
                  <p className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase mb-1">My State</p>
                  <p className="text-sm font-medium text-zinc-900">{journal.personalCondition || '-'} <span className="text-xs text-zinc-400 font-light ml-1">{journal.personalConditionNote}</span></p>
               </div>
             </div>
             
             <div>
                <p className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase mb-1">Basic Scenario</p>
                <p className="text-[13px] text-zinc-800 break-words font-light leading-relaxed">{journal.preMarketScenario || '-'}</p>
             </div>
             
             {journal.noTradeConditions && (
                <div>
                   <p className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase mb-1">No Trade Conditions</p>
                   <p className="text-[13px] text-zinc-800 break-words font-light leading-relaxed">{journal.noTradeConditions}</p>
                </div>
             )}

             {journal.focusRuleIds && journal.focusRuleIds.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase mb-2">Focus Rules</p>
                  <ul className="space-y-2">
                    {journal.focusRuleIds.map(id => {
                      const r = activeRules.find(x => x.id === id);
                      return (
                        <li key={id} className="flex items-start gap-2 text-[13px] text-zinc-800 font-light">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-600 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
                          {r?.title || 'Unknown Rule'}
                        </li>
                      );
                    })}
                  </ul>
                </div>
             )}
          </div>
        )}
      </section>

      {/* --- Post-Market Section --- */}
      {showPostMarket && (
        <section className="space-y-6 pt-4 border-t border-zinc-200 animate-in fade-in slide-in-from-bottom-4">
           <h2 className="text-sm font-medium text-zinc-900 border-l-2 border-violet-600 pl-2">2. Daily Review</h2>

           <div className="bg-zinc-900 text-white p-4 rounded-xl">
             <h3 className="text-[10px] font-mono tracking-widest text-zinc-400 mb-3">TODAY'S SUMMARY</h3>
             <div className="grid grid-cols-3 gap-y-4 gap-x-2">
                <div>
                   <p className="text-[10px] text-zinc-400">Trades</p>
                   <p className="text-lg font-mono">{tradeStats.count}</p>
                </div>
                <div>
                   <p className="text-[10px] text-zinc-400">Total R</p>
                   <p className={clsx("text-lg font-mono", tradeStats.r > 0 ? "text-emerald-400" : tradeStats.r < 0 ? "text-rose-400" : "")}>{tradeStats.r > 0 ? '+' : ''}{tradeStats.r.toFixed(2)}</p>
                </div>
                <div>
                   <p className="text-[10px] text-zinc-400">Skipped</p>
                   <p className="text-lg font-mono">{tradeStats.skipped}</p>
                </div>
                <div>
                   <p className="text-[10px] text-rose-300">Violations</p>
                   <p className="text-lg font-mono text-rose-200">{tradeStats.majorViolations}</p>
                </div>
             </div>
           </div>

           <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-mono text-zinc-500 tracking-wider">Was my market bias accurate?</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Appropriate', 'Partially Appropriate', 'Inappropriate', 'Unclear'].map(opt => (
                    <button key={opt} onClick={() => handleChange('marketAssessment', opt)} className={clsx("py-2 px-3 text-xs rounded-lg border transition-colors", journal.marketAssessment === opt ? "bg-violet-600 text-white border-violet-600" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300")}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-mono text-zinc-500 tracking-wider">What I did well</label>
                <textarea value={journal.goodDecisions || ''} onChange={(e) => handleChange('goodDecisions', e.target.value)} rows={2} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-sm focus:border-violet-600 outline-none transition-colors" />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-mono text-zinc-500 tracking-wider">What to improve</label>
                <textarea value={journal.improvements || ''} onChange={(e) => handleChange('improvements', e.target.value)} rows={2} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-sm focus:border-violet-600 outline-none transition-colors" />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-mono text-zinc-500 tracking-wider">Did I follow my focus rules?</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Followed', 'Partially Followed', 'Did Not Follow', 'Cannot Evaluate'].map(opt => (
                    <button key={opt} onClick={() => handleChange('focusRuleCompliance', opt)} className={clsx("py-2 px-3 text-xs rounded-lg border transition-colors", journal.focusRuleCompliance === opt ? "bg-violet-600 text-white border-violet-600" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300")}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {(journal.focusRuleCompliance === 'Partially Followed' || journal.focusRuleCompliance === 'Did Not Follow') && (
                 <div className="space-y-2 bg-rose-50 p-4 rounded-xl border border-rose-100">
                    <label className="block text-[10px] font-mono text-rose-600 tracking-wider">Select Violated Rules</label>
                    <div className="space-y-1">
                      {activeRules.map(rule => {
                        const isSelected = (journal.violatedRuleIds || []).includes(rule.id);
                        return (
                          <label key={rule.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-rose-100 transition-colors">
                            <input type="checkbox" checked={isSelected} onChange={() => toggleFocusRule(rule.id, 'post')} className="rounded border-rose-300 text-rose-600 focus:ring-rose-500" />
                            <span className="text-xs text-rose-900">{rule.title}</span>
                          </label>
                        );
                      })}
                    </div>
                 </div>
              )}

              <div className="space-y-2">
                <label className="block text-[10px] font-mono text-zinc-500 tracking-wider">Focus for the next session</label>
                <input type="text" value={journal.nextSessionFocus || ''} onChange={(e) => handleChange('nextSessionFocus', e.target.value)} className="w-full bg-transparent border-b border-zinc-200 py-2 text-sm focus:border-violet-600 outline-none mt-2 placeholder-zinc-300" placeholder="One brief sentence" />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-mono text-zinc-500 tracking-wider">Daily summary in one line</label>
                <input type="text" value={journal.dailySummary || ''} onChange={(e) => handleChange('dailySummary', e.target.value)} className="w-full bg-transparent border-b border-zinc-200 py-2 text-sm focus:border-violet-600 outline-none mt-2 placeholder-zinc-300" placeholder="e.g. Bias was good, but missed entry because I didn't wait for pullback." />
                <p className="text-[10px] text-zinc-400">Note: This will be displayed in the Journals list.</p>
              </div>

              <button onClick={handleCompleteJournal} className="w-full bg-zinc-900 hover:bg-violet-600 text-white py-4 rounded-xl text-sm font-medium mt-6 transition-colors shadow-md hover:shadow-lg">
                  Complete Review
              </button>

           </div>
        </section>
      )}

      {/* --- Related Trades Section --- */}
      <section className="pt-8 space-y-4">
        <h2 className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase">Trades Logged Today</h2>
        {dayTrades.length > 0 ? (
           <div className="space-y-0 divide-y divide-zinc-100 border-t border-zinc-100 pt-2">
             {dayTrades.map(trade => (
               <div key={trade.id} onClick={() => navigate(`/detail/${trade.id}`)} className="py-4 flex justify-between items-center cursor-pointer group hover:bg-zinc-50/50 active:bg-zinc-50 transition-colors px-1">
                  <div className="space-y-1.5">
                     <div className="flex items-center gap-3">
                       <span className={`text-[10px] font-mono tracking-widest font-medium ${trade.direction === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {trade.direction === 'BUY' ? 'BUY' : 'SELL'}
                       </span>
                       <span className="text-sm font-medium text-zinc-900 group-hover:text-violet-600 transition-colors">{format(new Date(trade.createdAt), 'HH:mm')} - {trade.symbol}</span>
                     </div>
                     <p className="text-[11px] text-zinc-500 font-light">{trade.plan?.setupType === 'Other' ? (trade.status === 'Skipped' ? 'Skipped' : 'Other') : trade.plan?.setupType}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                     <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400">{trade.status}</span>
                     {trade.review?.realizedR != null && (
                        <span className={clsx("text-sm font-mono font-medium", trade.review.realizedR > 0 ? 'text-zinc-900' : 'text-zinc-400')}>
                          {trade.review.realizedR > 0 ? '+' : ''}{trade.review.realizedR.toFixed(2)} R
                        </span>
                     )}
                     {trade.status === 'Skipped' && <span className="text-[10px] font-mono text-zinc-300">-</span>}
                  </div>
               </div>
             ))}
           </div>
        ) : (
           <p className="text-xs text-zinc-400 italic">No trades logged today.</p>
        )}
      </section>

    </div>
  );
}
