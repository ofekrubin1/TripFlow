import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet } from 'lucide-react';
import { api } from '@/api/client';
import Spinner from '../components/ui/Spinner';
import AddExpenseForm from '../components/plan/AddExpenseForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TripPlan() {
  const queryClient = useQueryClient();
  const [selectedTripId, setSelectedTripId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('trip') || localStorage.getItem('lastSelectedTripId') || null;
  });

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: () => api.entities.Trip.list('-updated_date'),
  });

  const trip = (selectedTripId && trips.find((t) => t.id === selectedTripId)) || trips[0];

  const createExpense = useMutation({
    mutationFn: (data) => api.entities.Expense.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });

  if (isLoading) return <Spinner />;

  if (trips.length === 0) {
    return (
      <div className="px-5 pt-14 flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#0A1F44]/5 flex items-center justify-center mb-5" style={{ boxShadow: '0 2px 12px rgba(10,31,68,0.06)' }}>
          <Wallet className="w-7 h-7 text-[#0A1F44]/40" strokeWidth={1.5} />
        </div>
        <h2 className="text-lg font-semibold text-[#33363D] mb-1">אין טיולים עדיין</h2>
        <p className="text-sm font-light text-[#50535A]/60">צור טיול חדש בטאב "טיולים" וחזור לכאן</p>
      </div>
    );
  }

  return (
    <div className="px-5 pt-14 pb-4 space-y-4">
      <div className="mb-2">
        <p className="text-[10px] font-light text-[#50535A]/40 uppercase tracking-[0.2em]">תכנון</p>
        <h1 className="text-xl font-semibold text-[#33363D] tracking-tight">ניהול הוצאות</h1>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#50535A] tracking-wide">בחר טיול</label>
        <Select
          value={trip?.id || ''}
          onValueChange={(id) => {
            setSelectedTripId(id);
            localStorage.setItem('lastSelectedTripId', id);
          }}
        >
          <SelectTrigger className="rounded-[10px] border-[#D0D1D3] bg-white text-sm h-11" style={{ boxShadow: 'inset 0 2px 4px rgba(10,31,68,0.04)' }}>
            <SelectValue placeholder="בחר טיול" />
          </SelectTrigger>
          <SelectContent>
            {trips.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {trip && (trip.status === 'completed' ? (
        <div className="bg-[#C9A45B]/8 border border-[#C9A45B]/20 rounded-[12px] px-4 py-3 text-center">
          <p className="text-xs font-light text-[#C9A45B]">הטיול הושלם — לא ניתן להוסיף הוצאות חדשות</p>
        </div>
      ) : (
        <AddExpenseForm
          key={`${trip.id}-${trip.currency || 'ILS'}`}
          trip={trip}
          onSave={(data) => createExpense.mutateAsync(data)}
        />
      ))}
    </div>
  );
}
