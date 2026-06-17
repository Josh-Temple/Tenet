import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../repository/db';
import { Plus, X } from 'lucide-react';
import { clsx } from 'clsx';
import { TradingRule, RuleCategory } from '../types';

export default function Rules() {
  const rules = useLiveQuery(() => db.rules.orderBy('displayOrder').toArray());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [shortBody, setShortBody] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');
  const [category, setCategory] = useState<RuleCategory>('Other');

  const toggleFocus = async (rule: TradingRule) => {
    if (!rule.isFocusToday) {
      // Dexie boolean index issue check: actually we might have to filter
      const allRules = await db.rules.toArray();
      const currentFocusCount = allRules.filter(r => r.isFocusToday).length;
      if (currentFocusCount >= 3) {
        alert('You can have a maximum of 3 focus rules for today.');
        return;
      }
    }
    await db.rules.update(rule.id, { isFocusToday: !rule.isFocusToday });
  };

  const togglePin = async (rule: TradingRule) => {
    await db.rules.update(rule.id, { isPinned: !rule.isPinned });
  };

  const openNewForm = () => {
    setEditingRuleId(null);
    setTitle('');
    setShortBody('');
    setDetailedDescription('');
    setCategory('Other');
    setIsFormOpen(true);
  };

  const openEditForm = (rule: TradingRule) => {
    setEditingRuleId(rule.id);
    setTitle(rule.title);
    setShortBody(rule.shortBody);
    setDetailedDescription(rule.detailedDescription);
    setCategory(rule.category);
    setIsFormOpen(true);
  };

  const saveRule = async () => {
    if (!title.trim()) return;

    if (editingRuleId) {
      await db.rules.update(editingRuleId, {
        title,
        shortBody,
        detailedDescription,
        category,
        updatedAt: new Date().toISOString()
      });
    } else {
      await db.rules.add({
        id: crypto.randomUUID(),
        schemaVersion: 4,
        title,
        shortBody,
        detailedDescription,
        category,
        priority: 1,
        isPinned: false,
        isActive: true,
        displayOrder: (rules?.length || 0) + 1,
        isFocusToday: false,
        whyNeeded: '',
        problemIfViolated: '',
        correctActionExample: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    setIsFormOpen(false);
  };

  if (!rules) return <div className="py-8 text-center text-[10px] font-mono text-zinc-400 tracking-widest">LOADING...</div>;

  const focusRules = rules.filter(r => r.isFocusToday && r.isActive);
  const pinnedRules = rules.filter(r => r.isPinned && !r.isFocusToday && r.isActive);
  const otherRules = rules.filter(r => !r.isPinned && !r.isFocusToday && r.isActive);

  const renderRuleGroup = (groupTitle: string, groupRules: TradingRule[]) => {
    if (groupRules.length === 0) return null;
    return (
      <div className="space-y-2 mb-8">
        <h2 className="text-[10px] uppercase font-mono text-zinc-400 tracking-widest mb-2">{groupTitle}</h2>
        <div className="space-y-0">
          {groupRules.map(rule => (
            <div key={rule.id} className="group relative py-5 border-t border-zinc-100 last:border-b hover:bg-zinc-50/50 transition-colors -mx-2 px-2">
              <div className="flex justify-between items-start mb-1.5 pr-8">
                <h3 className={clsx(
                  "font-medium text-sm tracking-tight",
                  rule.isFocusToday ? "text-violet-700" : "text-zinc-900 group-hover:text-violet-600 transition-colors"
                 )}>
                  {rule.title}
                </h3>
              </div>
              
              <p className="text-[13px] font-light text-zinc-500 leading-relaxed max-w-[90%]">
                {rule.shortBody || rule.detailedDescription}
              </p>
              
              <div className="absolute right-2 top-6 flex gap-2">
                {rule.isFocusToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-600 shadow-[0_0_8px_rgba(124,58,237,0.5)]" title="Focus Target" />
                )}
              </div>

              <div className="flex gap-6 mt-4 pt-1">
                  <button 
                    onClick={() => toggleFocus(rule)}
                    className={clsx("text-[10px] font-mono tracking-widest transition-colors", rule.isFocusToday ? "text-violet-600 font-medium" : "text-zinc-400 hover:text-zinc-900")}
                  >
                    FOCUS
                  </button>
                  <button 
                    onClick={() => togglePin(rule)}
                    className={clsx("text-[10px] font-mono tracking-widest transition-colors", rule.isPinned ? "text-zinc-900 font-medium" : "text-zinc-400 hover:text-zinc-900")}
                  >
                    PIN
                  </button>
                  <button 
                    onClick={() => openEditForm(rule)}
                    className="text-[10px] font-mono tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    EDIT
                  </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-8 relative">
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-2xl font-medium tracking-tight text-zinc-900">Rules</h1>
          <p className="text-xs text-zinc-500 font-light">Core trading principles</p>
        </div>
        <button 
          onClick={openNewForm}
          className="text-zinc-500 hover:text-violet-600 transition-colors p-2 -mr-2"
        >
          <Plus size={20} strokeWidth={1.5} />
        </button>
      </header>

      <div>
        {renderRuleGroup('FOCUS RULES TODAY', focusRules)}
        {renderRuleGroup('PINNED RULES', pinnedRules)}
        {renderRuleGroup('OTHER RULES', otherRules)}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white animate-in fade-in duration-200">
           <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-white/90 backdrop-blur">
             <h2 className="text-xs font-mono tracking-widest text-zinc-400">{editingRuleId ? 'EDIT RULE' : 'NEW RULE'}</h2>
             <button onClick={() => setIsFormOpen(false)} className="p-2 -mr-2 text-zinc-400 hover:text-zinc-900 transition-colors">
               <X size={20} strokeWidth={1.5} />
             </button>
           </div>
           <div className="flex-1 px-6 py-8 space-y-8 overflow-y-auto custom-scrollbar">
             <div className="space-y-2">
               <label className="block text-[10px] font-mono text-zinc-500 tracking-wider">TITLE</label>
               <input 
                 type="text" value={title} onChange={e => setTitle(e.target.value)}
                 className="w-full bg-transparent border-b border-zinc-200 py-3 text-xl font-medium focus:border-violet-600 outline-none transition-colors rounded-none placeholder-zinc-300"
                 placeholder="e.g. Do not chase price"
               />
             </div>
             <div className="space-y-2">
               <label className="block text-[10px] font-mono text-zinc-500 tracking-wider">SHORT DESCRIPTION (OPTIONAL)</label>
               <input 
                 type="text" value={shortBody} onChange={e => setShortBody(e.target.value)}
                 className="w-full bg-transparent border-b border-zinc-200 py-2 text-sm focus:border-violet-600 outline-none transition-colors rounded-none placeholder-zinc-300"
               />
             </div>
             <div className="space-y-2">
               <label className="block text-[10px] font-mono text-zinc-500 tracking-wider">DETAILS</label>
               <textarea 
                 value={detailedDescription} onChange={e => setDetailedDescription(e.target.value)}
                 rows={5}
                 className="w-full bg-transparent border-b border-zinc-200 py-2 text-sm focus:border-violet-600 outline-none transition-colors rounded-none placeholder-zinc-300 resize-none leading-relaxed"
               />
             </div>
             
             <div className="pt-8">
               <button 
                 onClick={saveRule}
                 disabled={!title.trim()}
                 className="w-full bg-zinc-900 hover:bg-violet-600 text-white font-medium text-sm py-4 rounded-xl disabled:opacity-50 shadow-md hover:shadow-lg disabled:shadow-none active:scale-[0.98] transition-all"
               >
                 SAVE RULE
               </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
