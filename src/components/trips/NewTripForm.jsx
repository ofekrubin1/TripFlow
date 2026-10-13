import { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { CURRENCIES } from '@/lib/currency';
import PremiumCard from '../ui/PremiumCard';
import PremiumButton from '../ui/PremiumButton';
import DateInput from './DateInput';
import CurrencyRatesEditor from './CurrencyRatesEditor';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';

const inputClass = 'w-full bg-white rounded-[10px] border border-[#D0D1D3] px-3 py-3 text-sm text-[#33363D] focus:outline-none focus:border-[#C9A45B]/50';
const inset = { boxShadow: 'inset 0 2px 4px rgba(10,31,68,0.04)' };

export default function NewTripForm({ tripData, setTripData, onSave, saving }) {
  const [showRates, setShowRates] = useState(false);
  const [badEndDate, setBadEndDate] = useState(false);
  const symbol = (CURRENCIES.find((c) => c.code === (tripData.currency || 'ILS')) || CURRENCIES[0]).symbol;

  return (
    <PremiumCard goldAccent>
      <h3 className="text-xs font-medium text-[#50535A]/60 uppercase tracking-widest mb-4">טיול חדש</h3>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#50535A] tracking-wide">שם הטיול</label>
          <input className={inputClass} placeholder="למשל: רומא 2025" value={tripData.name} onChange={(e) => setTripData({ ...tripData, name: e.target.value })} style={inset} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#50535A] tracking-wide">יעד</label>
          <input className={inputClass} placeholder="עיר / מדינה" value={tripData.destination} onChange={(e) => setTripData({ ...tripData, destination: e.target.value })} style={inset} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 min-w-0">
            <label className="text-xs font-medium text-[#50535A] tracking-wide">תאריך התחלה</label>
            <DateInput
              value={tripData.start_date}
              onChange={(v) => setTripData((p) => ({ ...p, start_date: v, end_date: p.end_date && p.end_date < v ? v : p.end_date }))}
            />
          </div>
          <div className="space-y-1 min-w-0">
            <label className="text-xs font-medium text-[#50535A] tracking-wide">תאריך סיום</label>
            <DateInput
              value={tripData.end_date}
              min={tripData.start_date || undefined}
              onChange={(v) => { setBadEndDate(false); setTripData((p) => ({ ...p, end_date: v })); }}
              onInvalidDate={() => setBadEndDate(true)}
            />
            {badEndDate && <p className="text-[11px] text-red-500 font-medium">תאריך סיום לא תקין. נסה שוב!</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="grid grid-cols-4 gap-2 items-end">
            <div className="space-y-1">
              <span className="text-[9px] font-light text-[#50535A]/40 whitespace-nowrap block text-right">תקציב</span>
              <input
                type="number"
                inputMode="decimal"
                className="w-full bg-white rounded-[10px] border border-[#D0D1D3] px-2 py-3 text-sm text-[#33363D] focus:outline-none focus:border-[#C9A45B]/50 h-11"
                placeholder="0"
                value={tripData.budget || ''}
                onChange={(e) => setTripData({ ...tripData, budget: parseFloat(e.target.value) || 0 })}
                style={inset}
              />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-light text-[#50535A]/40 whitespace-nowrap block text-right">ברירת מחדל</span>
              <Select value={tripData.currency || 'ILS'} onValueChange={(v) => setTripData({ ...tripData, currency: v })}>
                <SelectTrigger className="w-full h-11 rounded-[10px] border-[#D0D1D3] bg-white text-base font-medium justify-center px-0 [&>svg]:hidden" style={inset} aria-label="מטבע ברירת מחדל">
                  <span>{symbol}</span>
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(({ code, label, symbol: s }) => <SelectItem key={code} value={code}>{s} {code} — {label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 col-span-2">
              <span className="text-[9px] font-light text-[#50535A]/40 whitespace-nowrap block text-right">שערי מטבע</span>
              <button
                type="button"
                onClick={() => setShowRates((v) => !v)}
                className={`w-full flex items-center justify-center gap-1.5 h-11 px-3 rounded-[10px] border transition-colors duration-150 ${showRates ? 'bg-[#C9A45B] border-[#C9A45B] text-white' : 'bg-[#C9A45B]/10 border-[#C9A45B]/40 text-[#C9A45B] hover:bg-[#C9A45B]/20'}`}
                style={{ boxShadow: showRates ? '0 3px 10px rgba(201,164,91,0.25)' : 'inset 0 2px 4px rgba(10,31,68,0.04)' }}
              >
                <DollarSign className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} />
                <span className="text-xs font-medium whitespace-nowrap">שערי מטבע</span>
              </button>
            </div>
          </div>
          {showRates && (
            <CurrencyRatesEditor rates={tripData.rates} onChange={(rates) => setTripData((p) => ({ ...p, rates }))} />
          )}
        </div>

        <PremiumButton variant="primary" className="w-full mt-2" onClick={onSave} disabled={!tripData.name || saving}>
          {saving ? 'יוצר...' : 'צור טיול'}
        </PremiumButton>
      </div>
    </PremiumCard>
  );
}
