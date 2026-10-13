import { useState } from 'react';
import { Check, RefreshCw } from 'lucide-react';
import { api } from '@/api/client';
import { CURRENCIES, getRates } from '@/lib/currency';
import PremiumButton from '../ui/PremiumButton';

function RateRows({ rates, onChange }) {
  return CURRENCIES.filter((c) => c.code !== 'ILS').map(({ code, symbol, label }) => (
    <div key={code} className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-[8px] bg-[#0A1F44]/5 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-semibold text-[#0A1F44]">{symbol}</span>
      </div>
      <span className="text-xs text-[#50535A] flex-shrink-0">1 {code} =</span>
      <input
        type="number"
        step="0.01"
        inputMode="decimal"
        aria-label={`שער ${label}`}
        className="w-0 flex-1 min-w-0 bg-white rounded-[8px] border border-[#D0D1D3] px-2 py-1.5 text-sm text-[#33363D] focus:outline-none focus:border-[#C9A45B]/50"
        value={rates[code] ?? ''}
        onChange={(e) => onChange({ ...rates, [code]: parseFloat(e.target.value) || 0 })}
        style={{ boxShadow: 'inset 0 1px 3px rgba(10,31,68,0.04)' }}
      />
      <span className="text-xs text-[#50535A]/40 flex-shrink-0">₪</span>
    </div>
  ));
}

// New trip: controlled, rates are saved with the trip. Existing trip: saves to the trip and recalculates its expenses.
export default function CurrencyRatesEditor({ trip, rates: controlledRates, onChange, onClose, onSaved }) {
  const [rates, setRates] = useState(() => getRates(trip));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!trip) {
    return (
      <div className="mt-3 pt-3 border-t border-[#D0D1D3]/60 space-y-3">
        <p className="text-[11px] font-light text-[#50535A]/50">שערי מטבע עבור הטיול הזה (₪ ל-1 יחידה)</p>
        <RateRows rates={controlledRates} onChange={onChange} />
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const newRates = { ...rates, ILS: 1 };
      await api.entities.Trip.update(trip.id, { rates: newRates });
      const expenses = await api.entities.Expense.filter({ trip_id: trip.id });
      const changes = expenses
        .filter((e) => e.original_expense_currency && e.original_expense_currency !== 'ILS' && e.original_expense_amount)
        .map((e) => ({ id: e.id, data: { amount: e.original_expense_amount * (newRates[e.original_expense_currency] ?? 1) } }))
        .filter((c, i, all) => c.data.amount !== expenses.find((e) => e.id === c.id).amount);
      if (changes.length) await api.entities.Expense.bulkUpdate(changes);
      onSaved?.();
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose?.(); }, 1200);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-[#D0D1D3]/60 space-y-3">
      <p className="text-[11px] font-light text-[#50535A]/50">שערי מטבע עבור הטיול הזה (₪ ל-1 יחידה)</p>
      <RateRows rates={rates} onChange={setRates} />
      <div className="flex gap-2">
        <PremiumButton variant={saved ? 'secondary' : 'gold'} className="flex-1 py-2" onClick={handleSave} disabled={saving}>
          <div className="flex items-center justify-center gap-1.5">
            {saved ? <Check className="w-3.5 h-3.5" /> : <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />}
            <span className="text-xs">{saving ? 'מעדכן...' : saved ? 'נשמר!' : 'שמור שערים'}</span>
          </div>
        </PremiumButton>
        {onClose && (
          <PremiumButton variant="secondary" className="px-4 py-2" onClick={onClose}>
            <span className="text-xs">סגור</span>
          </PremiumButton>
        )}
      </div>
    </div>
  );
}
