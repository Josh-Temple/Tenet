import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../repository/db';
import { TradeStatus } from '../types';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Filter } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function History() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filterStatus, setFilterStatus] = useState<TradeStatus | 'ALL'>('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam === 'planning') setFilterStatus('Plan Confirmed');
    else if (statusParam === 'active') setFilterStatus('Entered');
    else if (statusParam === 'review') setFilterStatus('Closed');
    else setFilterStatus('ALL');
  }, [searchParams]);

  // We are skipping draft records from default history feed
  const trades = useLiveQuery(async () => {
    let collection = db.trades.orderBy('createdAt').reverse();
    const data = await collection.toArray();
    
    // For planning state, also include draft to be consistent with counts in home.
    return data.filter(t => {
       if (filterStatus === 'Plan Confirmed') {
          return t.status === 'Plan Confirmed' || t.status === 'Draft';
       }
       return t.status !== 'Draft' && (filterStatus === 'ALL' || t.status === filterStatus);
    });
  }, [filterStatus]);

  const STALE_STATUSES: TradeStatus[] = ['Plan Confirmed', 'Entered', 'Closed', 'Reviewed', 'Skipped', 'Cancelled'];

  return (
    <div className="space-y-6 pb-8">
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-2xl font-medium tracking-tight text-zinc-900">Trade History</h1>
          <p className="text-xs text-zinc-500 font-light">Past records and current status</p>
        </div>
        <button 
           onClick={() => setIsFilterOpen(!isFilterOpen)}
           className={clsx("p-2 -mr-2 transition-colors hover:text-violet-600", isFilterOpen || filterStatus !== 'ALL' ? 'text-violet-600' : 'text-zinc-400')}
        >
          <Filter size={20} strokeWidth={1.5} />
        </button>
      </header>

      {isFilterOpen && (
        <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 flex flex-wrap gap-2 animate-in fade-in zoom-in-95 duration-200">
          <button 
             onClick={() => setFilterStatus('ALL')}
             className={clsx("text-[11px] px-3 py-1.5 rounded-full transition-colors", filterStatus === 'ALL' ? "bg-violet-600 text-white" : "bg-white border text-zinc-600 hover:border-zinc-300")}
          >
             All
          </button>
          {STALE_STATUSES.map(s => (
             <button 
               key={s}
               onClick={() => setFilterStatus(s)}
               className={clsx("text-[11px] px-3 py-1.5 rounded-full transition-colors border", filterStatus === s ? "bg-violet-600 border-violet-600 text-white" : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400")}
             >
               {s}
             </button>
          ))}
        </div>
      )}

      <div className="space-y-0 divide-y divide-zinc-100 mt-6">
        {trades?.length === 0 && (
          <p className="text-center py-10 font-mono text-zinc-400 text-sm">No records found</p>
        )}
        {trades?.map((trade) => (
          <div key={trade.id} onClick={() => trade.status === 'Draft' ? navigate('/record') : navigate(`/detail/${trade.id}`)} className="py-5 flex justify-between items-center group cursor-pointer hover:bg-zinc-50/50 active:bg-zinc-50 transition-colors px-1">
             <div className="space-y-1.5">
                 <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-mono tracking-widest font-medium ${trade.direction === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {trade.direction === 'BUY' ? 'BUY' : 'SELL'}
                    </span>
                    <span className="text-sm font-medium tracking-tight text-zinc-900 group-hover:text-violet-600 transition-colors">{trade.symbol}</span>
                 </div>
                 <div className="text-xs text-zinc-400 font-light flex gap-4">
                     <span>{format(new Date(trade.createdAt), 'MMM d, HH:mm', { locale: enUS })}</span>
                     <span>{trade.plan?.setupType !== 'Other' && trade.plan?.setupType}</span>
                 </div>
             </div>
             
             <div className="text-right flex flex-col items-end gap-1.5">
                 <span className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase">
                     {trade.status}
                 </span>
                 {trade.review?.realizedR != null ? (
                    <span className={clsx("text-sm font-mono font-medium", trade.review.realizedR > 0 ? 'text-zinc-900' : 'text-zinc-400')}>
                        {trade.review.realizedR > 0 ? '+' : ''}{trade.review.realizedR.toFixed(2)} R
                    </span>
                 ) : (
                    <span className="text-sm font-mono text-zinc-200 font-medium">-</span>
                 )}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
