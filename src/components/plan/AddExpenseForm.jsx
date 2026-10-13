import { useRef, useState } from 'react';
import { parseISO } from 'date-fns';
import { Receipt, Plus, X, ImagePlus, LoaderCircle } from 'lucide-react';
import { api } from '@/api/client';
import { CURRENCIES, convertToILS } from '@/lib/currency';
import { useCustomCategories } from '@/hooks/useCustomCategories';
import PremiumCard from '../ui/PremiumCard';
import PremiumInput from '../ui/PremiumInput';
import PremiumButton from '../ui/PremiumButton';
import TripCalendar from './TripCalendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Full class names so Tailwind can see them at build time.
const TOGGLE_COLORS = {
  gold: { chip: 'bg-[#C9A45B]/15 text-[#C9A45B]', track: 'bg-[#C9A45B]' },
  blue: { chip: 'bg-[#4A7CA5]/15 text-[#4A7CA5]', track: 'bg-[#4A7CA5]' },
};

function Toggle({ on, onClick, color, label }) {
  const c = TOGGLE_COLORS[color];
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ minWidth: 0 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[11px] font-medium transition-colors whitespace-nowrap ${on ? c.chip : 'bg-[#F3F3F4] text-[#50535A]/60 hover:text-[#50535A]'}`}
    >
      <div className={`w-6 h-3.5 rounded-full transition-colors duration-150 flex items-center px-0.5 flex-none ${on ? c.track : 'bg-[#D0D1D3]'}`}>
        <div className={`w-2.5 h-2.5 rounded-full bg-white shadow transition-transform duration-150 ${on ? '-translate-x-2.5' : 'translate-x-0'}`} />
      </div>
      <span>{label}</span>
    </button>
  );
}

export default function AddExpenseForm({ trip, onSave }) {
  const defaultCurrency = trip.currency || 'ILS';
  const tripStart = trip.start_date || null;
  const tripEnd = trip.end_date || null;
  const defaultDate = () => {
    const t = today();
    return !tripStart || (t >= tripStart && (!tripEnd || t <= tripEnd)) ? t : tripStart;
  };

  const blank = (category = 'food') => ({ title: '', amount: '', currency: defaultCurrency, category, date: defaultDate(), notes: '', image_url: '' });
  const [form, setForm] = useState(() => blank());
  const [isPreExpense, setIsPreExpense] = useState(false);
  const [isRefund, setIsRefund] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [calMonth, setCalMonth] = useState(() => {
    const base = tripStart ? parseISO(tripStart) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const fileRef = useRef(null);
  const { options: categoryOptions, addCategory } = useCustomCategories(trip);

  const currency = CURRENCIES.find((c) => c.code === form.currency) || CURRENCIES[0];
  const converted = form.amount ? convertToILS(parseFloat(form.amount), form.currency, trip) : 0;
  const showConversion = form.currency !== 'ILS' && converted > 0;

  const handleAddCategory = async () => {
    const key = await addCategory(newCategoryName);
    if (!key) return;
    setForm((f) => ({ ...f, category: key }));
    setNewCategoryName('');
    setShowAddCategory(false);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      setForm((f) => ({ ...f, image_url: file_url }));
    } catch {
      alert('העלאת התמונה נכשלה');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.amount) return;
    setSaving(true);
    const sign = isRefund ? -1 : 1;
    try {
      await onSave({
        ...form,
        trip_id: trip.id,
        amount: sign * convertToILS(parseFloat(form.amount), form.currency, trip),
        original_expense_amount: sign * parseFloat(form.amount),
        original_expense_currency: form.currency,
        date: isPreExpense ? null : form.date,
      });
      setForm(blank(form.category));
      setIsPreExpense(false);
      setIsRefund(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PremiumCard goldAccent>
      <h3 className="text-xs font-medium text-[#50535A]/60 uppercase tracking-widest mb-4">הוספת הוצאה</h3>
      <div className="space-y-3">
        <PremiumInput label="תיאור" icon={Receipt} placeholder="למשל: ארוחת ערב" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#50535A] tracking-wide">סכום ומטבע</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#50535A]/50">{currency.symbol}</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-white rounded-[10px] border border-[#D0D1D3] pr-8 pl-3 py-3 text-sm text-[#33363D] focus:outline-none focus:border-[#C9A45B]/50 focus:ring-1 focus:ring-[#C9A45B]/20"
                style={{ boxShadow: 'inset 0 2px 4px rgba(10,31,68,0.04)' }}
              />
            </div>
            <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
              <SelectTrigger className="w-12 h-11 rounded-[10px] border-[#D0D1D3] bg-white text-base font-medium flex-shrink-0 justify-center px-0 [&>svg]:hidden" style={{ boxShadow: 'inset 0 2px 4px rgba(10,31,68,0.04)' }} aria-label="מטבע">
                <span>{currency.symbol}</span>
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(({ code, label, symbol }) => (
                  <SelectItem key={code} value={code}>{symbol} {code} — {label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {showConversion && (
            <p className="text-[11px] font-light text-[#C9A45B]">
              ≈ ₪{(isRefund ? -converted : converted).toLocaleString('he-IL', { maximumFractionDigits: 2 })} (לפי שער מוגדר)
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <label className="text-xs font-medium text-[#50535A] tracking-wide">תאריך</label>
            <div className="flex items-center gap-1.5">
              <Toggle on={isPreExpense} onClick={() => setIsPreExpense((v) => !v)} color="gold" label="הוצאה מקדימה" />
              <Toggle on={isRefund} onClick={() => setIsRefund((v) => !v)} color="blue" label="החזר" />
            </div>
          </div>
          {!isPreExpense && (
            <TripCalendar
              tripStart={tripStart}
              tripEnd={tripEnd}
              selected={form.date}
              onSelect={(d) => setForm({ ...form, date: d })}
              calMonth={calMonth}
              setCalMonth={setCalMonth}
            />
          )}
        </div>

        <div className="flex gap-2">
          <div className="space-y-1.5 flex-1 min-w-0">
            <label className="text-xs font-medium text-[#50535A] tracking-wide">קטגוריה</label>
            <Select
              value={form.category}
              onValueChange={(v) => {
                if (v === '__add__') { setShowAddCategory(true); return; }
                setForm({ ...form, category: v });
              }}
            >
              <SelectTrigger className="rounded-[10px] border-[#D0D1D3] bg-white text-sm h-11" style={{ boxShadow: 'inset 0 2px 4px rgba(10,31,68,0.04)' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map(({ key, label }) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
                <SelectItem value="__add__">
                  <span className="flex items-center gap-1.5 text-[#C9A45B] font-medium">
                    <Plus className="w-3.5 h-3.5" />הוסף קטגוריה...
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            <label className="text-xs font-medium text-[#50535A] tracking-wide">
              תמונה <span className="font-light text-[#50535A]/50">(אופציונלי)</span>
            </label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            {form.image_url ? (
              <div className="relative rounded-[10px] overflow-hidden border border-[#D0D1D3] h-11">
                <img src={form.image_url} alt="הוצאה" className="w-full h-full object-cover" />
                <button onClick={() => setForm((f) => ({ ...f, image_url: '' }))} className="absolute top-1 left-1 p-0.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors" aria-label="הסר תמונה">
                  <X className="w-3 h-3" strokeWidth={2} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full h-11 flex items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-[#D0D1D3] text-[#50535A]/50 hover:border-[#C9A45B]/50 hover:text-[#C9A45B] transition-colors text-xs"
              >
                {uploading ? (
                  <><LoaderCircle className="w-3.5 h-3.5 animate-spin" /><span>מעלה...</span></>
                ) : (
                  <><ImagePlus className="w-3.5 h-3.5" strokeWidth={1.5} /><span>הוסף</span></>
                )}
              </button>
            )}
          </div>
        </div>

        {showAddCategory && (
          <div className="flex gap-2 items-center">
            <input
              autoFocus
              className="flex-1 bg-white rounded-[10px] border border-[#C9A45B]/50 px-3 py-2 text-sm text-[#33363D] focus:outline-none"
              placeholder="שם הקטגוריה..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCategory();
                if (e.key === 'Escape') setShowAddCategory(false);
              }}
            />
            <button onClick={handleAddCategory} className="p-2 rounded-[10px] bg-[#C9A45B] text-white" aria-label="שמור קטגוריה">
              <Plus className="w-4 h-4" strokeWidth={2} />
            </button>
            <button onClick={() => setShowAddCategory(false)} className="p-2 rounded-[10px] bg-[#F3F3F4]" aria-label="ביטול">
              <X className="w-4 h-4 text-[#50535A]" strokeWidth={2} />
            </button>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#50535A] tracking-wide">הערות</label>
          <textarea
            placeholder="הערות נוספות..."
            value={form.notes}
            rows={1}
            onChange={(e) => {
              setForm({ ...form, notes: e.target.value });
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            className="w-full bg-white rounded-[10px] border border-[#D0D1D3] px-4 py-3 text-sm text-[#33363D] placeholder:text-[#50535A]/35 focus:outline-none focus:border-[#C9A45B]/50 focus:ring-1 focus:ring-[#C9A45B]/20 transition-all duration-150 resize-none overflow-hidden"
            style={{ boxShadow: 'inset 0 2px 4px rgba(10,31,68,0.04)' }}
          />
        </div>

        <PremiumButton variant="gold" className="w-full mt-2" onClick={handleSave} disabled={!form.title || !form.amount || saving}>
          {saving ? 'שומר...' : 'הוסף הוצאה'}
        </PremiumButton>
      </div>
    </PremiumCard>
  );
}
