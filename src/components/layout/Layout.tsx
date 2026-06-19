import { ReactNode, useState } from 'react';
import { BottomNav } from './BottomNav';
import { RuleQuickModal } from '../rules/RuleQuickModal';
import { BookOpen } from 'lucide-react';

export function Layout({ children }: { children: ReactNode }) {
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

  return (
    <div className="flex justify-center bg-zinc-100 app-viewport text-zinc-900 font-sans selection:bg-zinc-200">
      <div className="w-full max-w-md bg-white flex flex-col app-viewport relative shadow-2xl shadow-zinc-200/50">
        <header className="sticky top-0 w-full px-4 pt-6 pb-2 z-30 bg-gradient-to-b from-white via-white to-transparent pointer-events-none flex justify-end">
          <button 
            onClick={() => setIsRuleModalOpen(true)}
            className="pointer-events-auto flex items-center gap-2 bg-white text-zinc-900 px-4 py-2 rounded-full shadow-sm active:scale-95 transition-transform border border-zinc-200 hover:bg-zinc-50"
          >
            <BookOpen size={16} className="text-zinc-500" />
            <span className="text-xs font-medium tracking-wide">Rules</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto pb-bottom-nav pt-4 px-6 custom-scrollbar">
          {children}
        </main>

        <BottomNav />
        <RuleQuickModal isOpen={isRuleModalOpen} onClose={() => setIsRuleModalOpen(false)} />
      </div>
    </div>
  );
}
