import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, ArrowRight } from 'lucide-react';
import { db } from '../../repository/db';
import { getLocalDateKey } from '../../utils/date';
import { clsx } from 'clsx';
import { TradingRule } from '../../types';

export function RuleQuickModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const rules = useLiveQuery(() => db.rules.orderBy('displayOrder').toArray());

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setSelectedRuleId(null), 300);
    } else {
       const recordLog = async () => {
         await db.ruleLogs.add({
           id: crypto.randomUUID(),
           schemaVersion: 2,
           createdAt: new Date().toISOString(),
           updatedAt: new Date().toISOString(),
           openedFromScreen: 'QuickModal',
           date: getLocalDateKey(),
           checkedAt: new Date().toISOString(),
           focusedRuleIds: []
         });
       };
       recordLog();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const focusRules = rules?.filter(r => r.isFocusToday && r.isActive) || [];
  const otherRules = rules?.filter(r => !r.isFocusToday && r.isActive) || [];

  const selectedRule = rules?.find(r => r.id === selectedRuleId);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white animate-in slide-in-from-bottom-5 duration-300 md:rounded-t-2xl md:top-12 md:shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.1)]">
      <div className="flex justify-center pt-3 pb-1 md:hidden">
         <div className="w-12 h-1 bg-zinc-200 rounded-full" />
      </div>
      
      <div className="flex items-center justify-between px-6 pt-4 pb-2">
        <h2 className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Protocol Check</h2>
        <button onClick={onClose} className="p-2 -mr-2 text-zinc-400 hover:text-zinc-900 transition-colors">
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8 pb-32 custom-scrollbar">
        {selectedRule ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
             <button 
               onClick={() => setSelectedRuleId(null)}
               className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors flex items-center gap-2"
             >
               ← Back to List
             </button>
             
             <div>
               <h3 className="text-2xl font-medium tracking-tight text-zinc-900 leading-tight mb-6">
                 {selectedRule.title}
               </h3>
               
               <div className="space-y-6">
                 <div className="space-y-1">
                   <h4 className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Detail</h4>
                   <p className="text-[13px] font-light text-zinc-600 leading-relaxed">
                     {selectedRule.detailedDescription}
                   </p>
                 </div>
                 
                 {(selectedRule.whyNeeded || selectedRule.problemIfViolated) && (
                   <div className="border-t border-zinc-100 pt-6 space-y-6">
                     {selectedRule.whyNeeded && (
                       <div className="space-y-1">
                         <h4 className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Rationale</h4>
                         <p className="text-[13px] font-light text-zinc-600 leading-relaxed">{selectedRule.whyNeeded}</p>
                       </div>
                     )}
                     {selectedRule.problemIfViolated && (
                       <div className="space-y-1">
                         <h4 className="text-[10px] font-mono text-red-300 uppercase tracking-widest">Risk Factor</h4>
                         <p className="text-[13px] font-light text-zinc-600 leading-relaxed">{selectedRule.problemIfViolated}</p>
                       </div>
                     )}
                   </div>
                 )}
                 
                 {selectedRule.correctActionExample && (
                   <div className="border-t border-zinc-100 pt-6 space-y-1">
                     <h4 className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Execution Example</h4>
                     <p className="text-[13px] font-light text-zinc-600 leading-relaxed">{selectedRule.correctActionExample}</p>
                   </div>
                 )}
               </div>
             </div>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-300">
            {focusRules.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-600 shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
                  <h3 className="text-[10px] font-mono text-zinc-900 uppercase tracking-widest font-bold">Focus Targets</h3>
                </div>
                <div className="space-y-0 divide-y divide-zinc-100">
                  {focusRules.map(rule => (
                    <RuleItem key={rule.id} rule={rule} onClick={() => setSelectedRuleId(rule.id)} isFocus />
                  ))}
                </div>
              </section>
            )}

            {otherRules.length > 0 && (
              <section className="space-y-4">
                <div className="border-b border-zinc-100 pb-2">
                   <h3 className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">General Rules</h3>
                </div>
                <div className="space-y-0 divide-y divide-zinc-100">
                  {otherRules.map(rule => (
                    <RuleItem key={rule.id} rule={rule} onClick={() => setSelectedRuleId(rule.id)} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface RuleItemProps {
  rule: TradingRule;
  onClick: () => void;
  isFocus?: boolean;
}

const RuleItem: React.FC<RuleItemProps> = ({ rule, onClick, isFocus }) => {
  return (
    <button 
      onClick={onClick}
      className="w-full text-left py-4 group pr-2 flex items-center justify-between hover:bg-zinc-50/50 transition-colors -mx-2 px-2"
    >
      <div className="pr-4">
        <h4 className={clsx(
          "font-medium text-sm tracking-tight mb-1 line-clamp-1",
          isFocus ? "text-violet-700" : "text-zinc-700"
        )}>
          {rule.title}
        </h4>
        <p className="text-[11px] font-light text-zinc-400 line-clamp-1">
          {rule.shortBody || rule.detailedDescription}
        </p>
      </div>
      <ArrowRight size={14} className="text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" strokeWidth={1.5} />
    </button>
  );
};
