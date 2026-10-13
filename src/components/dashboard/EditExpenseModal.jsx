import { useState } from 'react';
import { X, Check, Calendar, Plus } from 'lucide-react';
import { api } from '@/api/client';
import { CURRENCIES, convertToILS } from '@/lib/currency';
import { useCustomCategories } from '@/hooks/useCustomCategories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const inputClass = 'w-full bg-[#F8F8F9] rounded-[10px] border border-[#D0D1D3] px-3 py-2.5 text-sm text-[#33363D] focus:outline-none focus:border-[#C9A45B]/50';

export default function EditExpenseModal({ expense, trip, onClose, onSaved }) {
  const original = expense.original_expense_amount ?? expense.amount ?? '';
  const [form, setForm] = useState({
    title: expense.title || '',
    amount: original !== '' ? Math.abs(Number(original)) : '',
    currency: expense.original_expense_currency || 'ILS',
    category: expense.category || 'other',
    date: expense.date || '',
    notes: expense.notes || '',
  });
  const [isPreExpense, setIsPreExpense] = useState(!expense.date);
  const [isRefund, setIsRefund] = useState(Number(original) < 0);
  const [saving, setSaving] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const { options: categoryOptions, addCategory } = useCustomCategories(trip);

  const currency = CURRENCIES.find((c) => c.code === form.currency) || CURRENCIES[0];
  const converted = form.amount ? convertToILS(parseFloat(form.amount), form.currency, trip) : 0;
  const showConversion = form.currency !== 'ILS' && converted > 0;
  // Keep a custom category visible even if it was removed from the trip's list.
  const options = categoryOptions.some((o) => o.key === form.category)
    ? categoryOptions
    : [...categoryOptions, { key: form.category, label: form.category.replace('custom_', '') }];

  const handleAddCategory = async () => {
    const key = await addCategory(newCategoryName);
    if (!key) return;
    setForm((f) => ({ ...f, category: key }));
    setNewCategoryName('');
    setShowAddCategory(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.amount) return;
    setSaving(true);
    const sign = isRefund ? -1 : 1;
    try {
      await api.entities.Expense.update(expense.id, {
        title: form.title,
        amount: sign * convertToILS(parseFloat(form.amount), form.currency, trip),
        original_expense_amount: sign * parseFloat(form.amount),
        original_expense_currency: form.currency,
        category: form.category,
        date: isPreExpense ? null : form.date || null,
        notes: form.notes,
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-[18px] w-full max-w-sm max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 24px 60px rgba(10,31,68,0.18)' }}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#F3F3F4]">
          <h3 className="text-sm font-semibold text-[#33363D]">עריכת הוצאה</h3>
          <button onClick={onClose} className="p-1.5 rounded-[8px] hover:bg-[#F3F3F4]">
            <X className="w-4 h-4 text-[#50535A]" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#50535A] tracking-wide">תיאור</label>
            <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#50535A] tracking-wide">סכום ומטבע</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#50535A]/50">{currency.symbol}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  className={`${inputClass} pr-8 pl-3`}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger className="w-28 rounded-[10px] border-[#D0D1D3] bg-[#F8F8F9] text-sm h-10 flex-shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(({ code, label }) => (
                    <SelectItem key={code} value={code}>{code} — {label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {showConversion && (
              <p className="text-[11px] text-[#C9A45B]">
                ≈ ₪{(isRefund ? -converted : converted).toLocaleString('he-IL', { maximumFractionDigits: 2 })}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#50535A] tracking-wide">קטגוריה</label>
            <Select
              value={form.category}
              onValueChange={(v) => {
                if (v === '__add__') { setShowAddCategory(true); return; }
                setForm({ ...form, category: v });
              }}
            >
              <SelectTrigger className="rounded-[10px] border-[#D0D1D3] bg-[#F8F8F9] text-sm h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map(({ key, label }) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
                <SelectItem value="__add__">
                  <span className="flex items-center gap-1.5 text-[#C9A45B] font-medium">
                    <Plus className="w-3.5 h-3.5" />הוסף קטגוריה...
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            {showAddCategory && (
              <div className="flex gap-2 items-center mt-1">
                <input
                  autoFocus
                  className="flex-1 bg-[#F8F8F9] rounded-[10px] border border-[#C9A45B]/50 px-3 py-2 text-sm text-[#33363D] focus:outline-none"
                  placeholder="שם הקטגוריה..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCategory();
                    if (e.key === 'Escape') setShowAddCategory(false);
                  }}
                />
                <button onClick={handleAddCategory} className="p-2 rounded-[10px] bg-[#C9A45B] text-white">
                  <Plus className="w-4 h-4" strokeWidth={2} />
                </button>
                <button onClick={() => setShowAddCategory(false)} className="p-2 rounded-[10px] bg-[#F3F3F4]">
                  <X className="w-4 h-4 text-[#50535A]" strokeWidth={2} />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#50535A] tracking-wide">תאריך</label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsPreExpense((v) => !v)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-[7px] text-[10px] font-medium transition-colors ${isPreExpense ? 'bg-[#C9A45B]/15 text-[#C9A45B]' : 'bg-[#F3F3F4] text-[#50535A]/60'}`}
                >
                  ללא תאריך
                </button>
                <button
                  type="button"
                  onClick={() => setIsRefund((v) => !v)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-[7px] text-[10px] font-medium transition-colors ${isRefund ? 'bg-[#4A7CA5]/15 text-[#4A7CA5]' : 'bg-[#F3F3F4] text-[#50535A]/60'}`}
                >
                  החזר
                </button>
              </div>
            </div>
            {!isPreExpense && (
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#50535A]/40 pointer-events-none" strokeWidth={1.5} />
                <input
                  type="date"
                  value={form.date}
                  min={trip?.start_date || undefined}
                  max={trip?.end_date || undefined}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className={`${inputClass} pr-9 pl-3 appearance-none`}
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#50535A] tracking-wide">הערות</label>
            <input
              className={inputClass}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="הערות נוספות..."
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={!form.title || !form.amount || saving}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-[#C9A45B] text-white text-sm font-medium disabled:opacity-50"
            >
              <Check className="w-4 h-4" strokeWidth={2} />
              {saving ? 'שומר...' : 'שמור שינויים'}
            </button>
            <button onClick={onClose} className="px-4 py-2.5 rounded-[10px] bg-[#F3F3F4] text-[#50535A] text-sm font-medium">
              ביטול
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
