import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Wallet, Filter, X } from 'lucide-react';
import { api } from '@/api/client';
import PremiumCard from '../components/ui/PremiumCard';
import PremiumButton from '../components/ui/PremiumButton';
import Spinner from '../components/ui/Spinner';
import TripSummaryCard from '../components/dashboard/TripSummaryCard';
import CategoryItem, { getCategoryInfo } from '../components/dashboard/CategoryItem';
import ExpenseItem from '../components/dashboard/ExpenseItem';
import EditExpenseModal from '../components/dashboard/EditExpenseModal';
import ExportPDFButton from '../components/dashboard/ExportPDFButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const toggleIn = (set, value) => {
  const next = new Set(set);
  next.has(value) ? next.delete(value) : next.add(value);
  return next;
};

export default function Dashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedTripId, setSelectedTripId] = useState(() => {
    // Check URL param first, then localStorage
    const params = new URLSearchParams(window.location.search);
    return params.get('trip') || localStorage.getItem('lastSelectedTripId') || null;
  });
  const [dateFilters, setDateFilters] = useState(new Set());
  const [categoryFilters, setCategoryFilters] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: () => api.entities.Trip.list('-updated_date'),
  });

  const activeTrip = (selectedTripId && trips.find((t) => t.id === selectedTripId))
    || trips.find((t) => t.status === 'active')
    || trips[0];

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', activeTrip?.id],
    queryFn: () => api.entities.Expense.filter({ trip_id: activeTrip.id }, '-created_date'),
    enabled: !!activeTrip?.id,
  });

  const deleteExpense = useMutation({
    mutationFn: (id) => api.entities.Expense.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });

  // Only dates that have actual expenses
  const tripDates = [...new Set(expenses.map((e) => e.date).filter(Boolean))].sort();
  const hasUndatedExpenses = expenses.some((e) => !e.date);

  const filteredExpenses = expenses.filter((e) => {
    if (dateFilters.size > 0) {
      const undatedMatch = dateFilters.has('__undated__') && !e.date;
      const dateMatch = e.date && dateFilters.has(e.date);
      if (!undatedMatch && !dateMatch) return false;
    }
    return !(categoryFilters.size > 0 && !categoryFilters.has(e.category));
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const byCategory = filteredExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + (e.amount || 0);
    return acc;
  }, {});
  const positiveTotal = Object.values(byCategory).filter((v) => v > 0).reduce((s, v) => s + v, 0);
  const tripCategories = [...new Set(expenses.map((e) => e.category).filter(Boolean))];
  const hasActiveFilters = dateFilters.size > 0 || categoryFilters.size > 0;

  const clearFilters = () => { setDateFilters(new Set()); setCategoryFilters(new Set()); };

  if (tripsLoading || (activeTrip && expensesLoading)) return <Spinner />;

  if (!trips.length) {
    return (
      <div className="px-5 pt-14 flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#0A1F44]/5 flex items-center justify-center mb-5" style={{ boxShadow: '0 2px 12px rgba(10,31,68,0.06)' }}>
          <Wallet className="w-7 h-7 text-[#0A1F44]/40" strokeWidth={1.5} />
        </div>
        <h2 className="text-lg font-semibold text-[#33363D] mb-1">אין טיולים עדיין</h2>
        <p className="text-sm font-light text-[#50535A]/60 mb-6">צור את הטיול הראשון שלך בטאב "טיולים"</p>
        <Link to="/trips">
          <PremiumButton variant="primary">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>צור טיול חדש</span>
            </div>
          </PremiumButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="px-5 pt-14 pb-4 space-y-4">
      <div className="mb-2">
        <p className="text-[10px] font-light text-[#50535A]/40 uppercase tracking-[0.2em]">דשבורד</p>
        <h1 className="text-xl font-semibold text-[#33363D] tracking-tight">מנהל הוצאות</h1>
      </div>

      {trips.length > 1 && (
        <Select
          value={activeTrip?.id || ''}
          onValueChange={(id) => {
            setSelectedTripId(id);
            localStorage.setItem('lastSelectedTripId', id);
            clearFilters();
            setShowFilters(false);
          }}
        >
          <SelectTrigger className="rounded-[10px] border-[#D0D1D3] bg-white text-sm h-11" style={{ boxShadow: 'inset 0 2px 4px rgba(10,31,68,0.04)' }}>
            <SelectValue placeholder="בחר טיול" />
          </SelectTrigger>
          <SelectContent>
            {trips.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {activeTrip && (
        <TripSummaryCard
          trip={activeTrip}
          totalExpenses={totalExpenses}
          exportButton={<ExportPDFButton trip={activeTrip} expenses={expenses} />}
          totalDecimals={0}
        />
      )}

      {Object.keys(byCategory).length > 0 && (
        <PremiumCard goldAccent>
          <h3 className="text-xs font-medium text-[#50535A]/60 uppercase tracking-widest mb-2">קטגוריות</h3>
          <div className="divide-y divide-[#F3F3F4]">
            {Object.entries(byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, amount]) => <CategoryItem key={cat} category={cat} amount={amount} total={positiveTotal} />)}
          </div>
        </PremiumCard>
      )}

      <PremiumCard>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium text-[#50535A]/60 uppercase tracking-widest">הוצאות</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-light text-[#C9A45B]">{filteredExpenses.length} פריטים</span>
            <button
              onClick={() => { setShowFilters((v) => !v); if (showFilters) clearFilters(); }}
              className={`flex items-center gap-1 px-2 py-1 rounded-[8px] transition-colors ${hasActiveFilters || showFilters ? 'bg-[#C9A45B]/15 text-[#C9A45B]' : 'bg-[#0A1F44]/5 text-[#0A1F44]/50 hover:bg-[#0A1F44]/10'}`}
              aria-label="סינון"
            >
              <Filter className="w-3.5 h-3.5" strokeWidth={1.5} />
              {hasActiveFilters && <span className="text-[10px] font-medium">סינון פעיל</span>}
            </button>
            <button
              onClick={() => navigate(`/plan${activeTrip ? `?trip=${activeTrip.id}` : ''}`)}
              className="flex items-center gap-1 px-2 py-1 rounded-[8px] bg-[#0A1F44]/5 hover:bg-[#0A1F44]/10 transition-colors"
            >
              <Plus className="w-3 h-3 text-[#0A1F44]/60" strokeWidth={2} />
              <span className="text-[11px] font-medium text-[#0A1F44]/60">הוסף</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-3 space-y-2 bg-[#F8F8F9] rounded-[10px] p-3">
            {(tripDates.length > 0 || hasUndatedExpenses) && (
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-[#50535A]/60 uppercase tracking-wider">סינון לפי תאריך</label>
                <div className="flex flex-wrap gap-1.5">
                  {tripDates.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDateFilters((s) => toggleIn(s, d))}
                      className={`px-2.5 py-1 rounded-[7px] text-xs font-medium transition-colors ${dateFilters.has(d) ? 'bg-[#C9A45B] text-white' : 'bg-white text-[#50535A] border border-[#D0D1D3] hover:border-[#C9A45B]/40'}`}
                    >
                      {d.slice(8)}/{d.slice(5, 7)}
                    </button>
                  ))}
                  {hasUndatedExpenses && (
                    <button
                      onClick={() => setDateFilters((s) => toggleIn(s, '__undated__'))}
                      className={`px-2.5 py-1 rounded-[7px] text-xs font-medium transition-colors ${dateFilters.has('__undated__') ? 'bg-[#0A1F44] text-white' : 'bg-white text-[#50535A] border border-[#D0D1D3] hover:border-[#0A1F44]/30'}`}
                    >
                      הוצאה מקדימה
                    </button>
                  )}
                </div>
              </div>
            )}
            {tripCategories.length > 0 && (
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-[#50535A]/60 uppercase tracking-wider">סינון לפי קטגוריה</label>
                <div className="flex flex-wrap gap-1.5">
                  {tripCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilters((s) => toggleIn(s, cat))}
                      className={`px-2.5 py-1 rounded-[7px] text-xs font-medium transition-colors ${categoryFilters.has(cat) ? 'bg-[#0A1F44] text-white' : 'bg-white text-[#50535A] border border-[#D0D1D3] hover:border-[#0A1F44]/30'}`}
                    >
                      {getCategoryInfo(cat).label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-[11px] text-[#C9A45B] font-medium">
                <X className="w-3 h-3" strokeWidth={2} />
                נקה סינון
              </button>
            )}
          </div>
        )}

        {filteredExpenses.length === 0 ? (
          <p className="text-sm font-light text-[#50535A]/40 text-center py-6">
            {hasActiveFilters ? 'אין הוצאות עם הסינון הנוכחי' : 'אין הוצאות עדיין'}
          </p>
        ) : (
          <div className="divide-y divide-[#F3F3F4]">
            {filteredExpenses.map((e) => (
              <ExpenseItem key={e.id} expense={e} onDelete={(id) => deleteExpense.mutate(id)} onEdit={() => setEditingExpense(e)} />
            ))}
          </div>
        )}
      </PremiumCard>

      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          trip={activeTrip}
          onClose={() => setEditingExpense(null)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ['expenses'] })}
        />
      )}
    </div>
  );
}
