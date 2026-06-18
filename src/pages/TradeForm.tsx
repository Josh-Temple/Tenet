import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../repository/db';
import { TradeDirection, ChecklistStatus, Instrument } from '../types';
import { checkEntryPriceConsistency, calculateExpectedRiskReward } from '../utils/calculations';
import { AlertCircle, FileEdit } from 'lucide-react';
import { clsx } from 'clsx';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_INSTRUMENT_CODE, instrumentRepository, normalizeInstrumentCode } from '../repository/InstrumentRepository';

export default function TradeForm() {
  const navigate = useNavigate();
  const [tradeId, setTradeId] = useState<string>(uuidv4());
  
  const [symbol, setSymbol] = useState(DEFAULT_INSTRUMENT_CODE);
  const [activeInstruments, setActiveInstruments] = useState<Instrument[]>([]);
  const [direction, setDirection] = useState<TradeDirection>('BUY');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  
  const [checks, setChecks] = useState<{ [key: string]: ChecklistStatus }>({
    isRelatedToFocusLine: 'Unanswered',
    isNotRangeCenter: 'Unanswered',
    isNotChasing: 'Unanswered',
    isStopLossLogical: 'Unanswered',
    hasEnoughReward: 'Unanswered',
    isNotRevenge: 'Unanswered',
    isInScenario: 'Unanswered',
  });
  const [stopLossLogicMemo, setStopLossLogicMemo] = useState('');
  const [scenarioMemo, setScenarioMemo] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load existing draft
  useEffect(() => {
    let mounted = true;
    const loadDraft = async () => {
      await instrumentRepository.ensureInitialInstruments();
      const [draft, active, settings] = await Promise.all([
        db.trades.where('status').equals('Draft').first(),
        instrumentRepository.getActive(),
        db.settings.toCollection().first(),
      ]);
      if (!mounted) return;

      setActiveInstruments(active);
      const initialSymbol = resolveInitialTradeSymbol({
        draftSymbol: draft?.symbol,
        defaultSymbol: settings?.defaultSymbol,
        activeInstruments: active,
      });
      setSymbol(initialSymbol);

      if (draft) {
        setTradeId(draft.id);
        setDirection(draft.direction);
        setEntryPrice(draft.plan?.plannedEntryPrice?.toString() || '');
        setStopLoss(draft.plan?.plannedStopLoss?.toString() || '');
        setTakeProfit(draft.plan?.plannedTakeProfit?.toString() || '');
        if (draft.plan?.entryCheckList) {
           setChecks({
             isRelatedToFocusLine: draft.plan.entryCheckList.isRelatedToFocusLine,
             isNotRangeCenter: draft.plan.entryCheckList.isNotRangeCenter,
             isNotChasing: draft.plan.entryCheckList.isNotChasing,
             isStopLossLogical: draft.plan.entryCheckList.isStopLossLogical,
             hasEnoughReward: draft.plan.entryCheckList.hasEnoughReward,
             isNotRevenge: draft.plan.entryCheckList.isNotRevenge,
             isInScenario: draft.plan.entryCheckList.isInScenario,
           });
        }
        setStopLossLogicMemo(draft.plan?.freeMemo || '');
        setScenarioMemo(draft.plan?.basicScenario || '');
      }
      if (mounted) setIsInitializing(false);
    };
    loadDraft();
    return () => { mounted = false; };
  }, []);

  const saveDraft = async () => {
    if (isInitializing) return;
    
    // Check if we have anything to save (at least one field edited)
    const normalizedSymbol = normalizeInstrumentCode(symbol);
    if (!normalizedSymbol && !entryPrice && !stopLoss && !takeProfit && Object.values(checks).every(v => v === 'Unanswered') && !stopLossLogicMemo && !scenarioMemo) {
       return; 
    }

    const tradeData: any = {
      id: tradeId,
      schemaVersion: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      symbol: normalizedSymbol,
      direction: direction,
      session: 'Tokyo',
      status: 'Draft',
      plan: {
        plannedEntryPrice: parseFloat(entryPrice) || null,
        plannedStopLoss: parseFloat(stopLoss) || null,
        plannedTakeProfit: parseFloat(takeProfit) || null,
        setupType: 'Other',
        horizontalLineType: 'Other',
        basicScenario: scenarioMemo,
        freeMemo: stopLossLogicMemo,
        entryCheckList: checks,
        entryCheckWarningAcknowledged: false,
      }
    };

    // Replace if exists, else create
    await db.trades.put(tradeData);
    setLastSaved(new Date());
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft();
    }, 1500); // Debounce interval
    return () => clearTimeout(timer);
  }, [symbol, direction, entryPrice, stopLoss, takeProfit, checks, stopLossLogicMemo, scenarioMemo, isInitializing]);

  const handleUpdateCheck = (key: string, val: ChecklistStatus) => {
    setChecks(prev => ({ ...prev, [key]: val }));
  };

  const handleCommitPlan = async () => {
    const issueKeys = Object.entries(checks).filter(([, v]) => v === 'Fail' || v === 'Unclear');
    const unansweredKeys = Object.entries(checks).filter(([, v]) => v === 'Unanswered');

    if (unansweredKeys.length > 0) {
       alert('There are unanswered checklist items. Please fill all fields.');
       return;
    }

    let warningAcknowledged = false;
    if (issueKeys.length > 0) {
      const confirmed = window.confirm('Some answers indicate "Fail" or "Unclear" conditions.\nThis suggests a high-uncertainty trade.\nAre you sure you want to confirm this plan?');
      if (!confirmed) return;
      warningAcknowledged = true;
    }

    const normalizedSymbol = normalizeInstrumentCode(symbol);
    if (!normalizedSymbol || normalizedSymbol === 'UNSET') {
      alert('Please select a valid symbol.');
      return;
    }

    const existingId = tradeId;
    const tradeData: any = {
      id: existingId,
      schemaVersion: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      symbol: normalizedSymbol,
      direction: direction,
      session: 'Tokyo',
      status: 'Plan Confirmed',
      plan: {
        plannedEntryPrice: parseFloat(entryPrice) || null,
        plannedStopLoss: parseFloat(stopLoss) || null,
        plannedTakeProfit: parseFloat(takeProfit) || null,
        setupType: 'Other',
        horizontalLineType: 'Other',
        basicScenario: scenarioMemo,
        freeMemo: stopLossLogicMemo,
        entryCheckList: checks,
        entryCheckWarningAcknowledged: warningAcknowledged,
      }
    };
    await db.trades.put(tradeData);
    navigate('/');
  };

  const currentRR = calculateExpectedRiskReward(direction, parseFloat(entryPrice), parseFloat(stopLoss), parseFloat(takeProfit));
  const warnings = checkEntryPriceConsistency(direction, parseFloat(entryPrice), parseFloat(stopLoss), parseFloat(takeProfit));

  if (isInitializing) {
     return <div className="text-center py-10 font-mono text-zinc-400">Loading...</div>;
  }

  return (
    <div className="space-y-10 pb-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-medium tracking-tight text-zinc-900">Trade Plan</h1>
        <p className="text-xs text-zinc-500 font-light">Pre-entry setup and condition checks.</p>
        {lastSaved && (
           <p className="text-[10px] text-zinc-400 font-mono mt-2 flex items-center gap-1">
             <FileEdit size={10} /> Draft saved ({lastSaved.toLocaleTimeString()})
           </p>
        )}
      </header>

      <section className="space-y-6">
        <h2 className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase">Parameters</h2>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="block text-[10px] font-mono text-zinc-400 tracking-widest uppercase">Symbol</label>
            <select
               value={symbol}
               onChange={e => setSymbol(e.target.value)}
               className="w-full bg-transparent border-b border-zinc-200 py-2 text-xl font-medium focus:border-violet-600 outline-none transition-colors rounded-none"
            >
              {buildInstrumentOptions(activeInstruments, symbol).map(option => (
                <option key={option.code} value={option.code}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-mono text-zinc-400 tracking-widest uppercase">Direction</label>
            <div className="flex p-1 bg-zinc-100 rounded-none w-full">
              <button 
                onClick={() => setDirection('BUY')}
                className={clsx(
                  "flex-1 py-2 text-[11px] font-medium transition-all tracking-widest",
                  direction === 'BUY' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                BUY
              </button>
              <button 
                onClick={() => setDirection('SELL')}
                className={clsx(
                  "flex-1 py-2 text-[11px] font-medium transition-all tracking-widest",
                  direction === 'SELL' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                SELL
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="block text-[10px] font-mono text-zinc-400 tracking-widest uppercase mb-1">Entry</label>
            <input 
              type="number" step="0.01" inputMode="decimal"
              value={entryPrice} onChange={e => setEntryPrice(e.target.value)}
              className="w-full bg-transparent border-b border-zinc-200 py-2 text-xl font-mono focus:border-violet-600 outline-none transition-colors rounded-none placeholder-zinc-300"
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-mono text-zinc-400 tracking-widest uppercase mb-1">Stop Loss</label>
            <input 
              type="number" step="0.01" inputMode="decimal"
              value={stopLoss} onChange={e => setStopLoss(e.target.value)}
              className="w-full bg-transparent border-b border-zinc-200 py-2 text-xl font-mono focus:border-violet-600 outline-none transition-colors rounded-none placeholder-zinc-300"
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-mono text-zinc-400 tracking-widest uppercase mb-1">Take Profit</label>
            <input 
              type="number" step="0.01" inputMode="decimal"
              value={takeProfit} onChange={e => setTakeProfit(e.target.value)}
              className="w-full bg-transparent border-b border-zinc-200 py-2 text-xl font-mono focus:border-violet-600 outline-none transition-colors rounded-none placeholder-zinc-300"
              placeholder="0.00"
            />
          </div>
        </div>

        {currentRR !== null && (
          <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
            <span className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase">Expected R:R</span>
            <span className={clsx("font-mono font-medium text-lg", currentRR >= 2 ? 'text-violet-600' : 'text-zinc-900')}>
              1 : {currentRR.toFixed(2)}
            </span>
          </div>
        )}
        
        {warnings.length > 0 && (
          <div className="border border-orange-200 p-4 space-y-3 bg-white">
            {warnings.map((w, i) => (
              <p key={i} className="text-[13px] font-light text-orange-800 flex items-start gap-3 leading-relaxed">
                <AlertCircle size={14} className="shrink-0 mt-0.5 text-orange-600" />
                <span>{w}</span>
              </p>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-6 pt-8">
        <h2 className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase">Context & Checklist</h2>
        
        <div className="divide-y divide-zinc-100 border-t border-b border-zinc-100">
          <ChecklistRow 
             label="Related to the predefined focus line?" 
             value={checks.isRelatedToFocusLine} 
             onChange={(v) => handleUpdateCheck('isRelatedToFocusLine', v)} 
          />
          <ChecklistRow 
             label="Avoided a meaningless trade in middle of range?" 
             value={checks.isNotRangeCenter} 
             onChange={(v) => handleUpdateCheck('isNotRangeCenter', v)} 
          />
          <ChecklistRow 
             label="Avoided chasing a sharp move (FOMO)?" 
             value={checks.isNotChasing} 
             onChange={(v) => handleUpdateCheck('isNotChasing', v)} 
          />
          
          <div className="py-4 space-y-4">
              <ChecklistRow 
                 label="Does Stop Loss invalidate the scenario cleanly?" 
                 value={checks.isStopLossLogical} 
                 onChange={(v) => handleUpdateCheck('isStopLossLogical', v)} 
                 noSeparator
              />
              <div className="pl-4 border-l-2 border-violet-100 ml-2">
                  <label className="block text-xs font-light text-zinc-500 mb-1">What is invalidated if this stop is hit?</label>
                  <input type="text" value={stopLossLogicMemo} onChange={e => setStopLossLogicMemo(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-sm focus:border-violet-600 outline-none" placeholder="e.g. Broken uptrend structure..." />
              </div>
          </div>

          <ChecklistRow 
             label="Sufficient distance to the take profit target?" 
             value={checks.hasEnoughReward} 
             onChange={(v) => handleUpdateCheck('hasEnoughReward', v)} 
          />
          <ChecklistRow 
             label="Ensured this is not revenge trading?" 
             value={checks.isNotRevenge} 
             onChange={(v) => handleUpdateCheck('isNotRevenge', v)} 
          />

          <div className="py-4 space-y-4">
              <ChecklistRow 
                 label="Fully matches the pre-planned scenario?" 
                 value={checks.isInScenario} 
                 onChange={(v) => handleUpdateCheck('isInScenario', v)} 
                 noSeparator
              />
              <div className="pl-4 border-l-2 border-violet-100 ml-2">
                  <label className="block text-xs font-light text-zinc-500 mb-1">State predicted price action in one sentence</label>
                  <input type="text" value={scenarioMemo} onChange={e => setScenarioMemo(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-sm focus:border-violet-600 outline-none" placeholder="e.g. Retesting support then breaking recent high" />
              </div>
          </div>
        </div>
      </section>

      <div className="pt-8">
        <button 
           onClick={handleCommitPlan}
           className="w-full bg-zinc-900 border border-zinc-900 hover:bg-white hover:text-zinc-900 text-white font-mono tracking-widest text-[11px] uppercase py-5 transition-all shadow-md active:translate-y-px"
        >
          Confirm Plan 
        </button>
      </div>
    </div>
  );
}

function ChecklistRow({ label, value, onChange, noSeparator = false }: { label: string, value: ChecklistStatus, onChange: (v: ChecklistStatus) => void, noSeparator?: boolean }) {
    const options: ChecklistStatus[] = ['Pass', 'Fail', 'Unclear'];
    return (
        <div className={clsx(!noSeparator && "py-6")}>
            <p className="text-[14px] text-zinc-900 tracking-tight font-light mb-4">{label}</p>
            <div className="flex gap-4">
                {options.map(opt => (
                    <button
                        key={opt}
                        onClick={() => onChange(opt)}
                        className={clsx(
                            "flex-1 py-3 text-[11px] font-mono uppercase tracking-widest transition-colors cursor-pointer border-b",
                            value === opt 
                                ? opt === 'Pass' 
                                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50'
                                    : 'border-rose-500 text-rose-600 bg-rose-50/50'
                                : 'border-zinc-200 text-zinc-400 bg-transparent hover:border-zinc-300 hover:text-zinc-600'
                        )}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
}


export function resolveInitialTradeSymbol({ draftSymbol, defaultSymbol, activeInstruments }: { draftSymbol?: string; defaultSymbol?: string; activeInstruments: Instrument[] }): string {
  const activeCodes = new Set(activeInstruments.filter(instrument => instrument.isActive).map(instrument => instrument.code));
  const normalizedDraftSymbol = draftSymbol ? normalizeInstrumentCode(draftSymbol) : '';
  if (normalizedDraftSymbol) return normalizedDraftSymbol;

  const normalizedDefaultSymbol = defaultSymbol ? normalizeInstrumentCode(defaultSymbol) : '';
  if (normalizedDefaultSymbol && activeCodes.has(normalizedDefaultSymbol)) return normalizedDefaultSymbol;
  if (activeCodes.has(DEFAULT_INSTRUMENT_CODE)) return DEFAULT_INSTRUMENT_CODE;
  return activeInstruments.find(instrument => instrument.isActive)?.code ?? DEFAULT_INSTRUMENT_CODE;
}

export function buildInstrumentOptions(activeInstruments: Instrument[], selectedSymbol: string): Array<{ code: string; label: string }> {
  const options = activeInstruments
    .filter(instrument => instrument.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code))
    .map(instrument => ({ code: instrument.code, label: `${instrument.code} — ${instrument.displayName}` }));

  const normalizedSelectedSymbol = normalizeInstrumentCode(selectedSymbol);
  if (normalizedSelectedSymbol && !options.some(option => option.code === normalizedSelectedSymbol)) {
    return [{ code: normalizedSelectedSymbol, label: `${normalizedSelectedSymbol} — 保存済み銘柄` }, ...options];
  }

  return options;
}
