import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderArchive, Plus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { DEFAULT_RATES } from '@/lib/currency';
import Spinner from '../components/ui/Spinner';
import TripCard from '../components/trips/TripCard';
import NewTripForm from '../components/trips/NewTripForm';

const STATUS_ORDER = { active: 0, completed: 1, planned: 2 };
const emptyTrip = () => ({ name: '', destination: '', start_date: '', end_date: '', budget: 0, currency: 'ILS', rates: { ...DEFAULT_RATES } });

export default function PastTrips() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showNew, setShowNew] = useState(false);
  const [tripData, setTripData] = useState(emptyTrip);

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: () => base44.entities.Trip.list('-updated_date'),
  });
  const { data: allExpenses = [] } = useQuery({
    queryKey: ['allExpenses'],
    queryFn: () => base44.entities.Expense.list('-created_date'),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['trips'] });
    queryClient.invalidateQueries({ queryKey: ['allExpenses'] });
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
  };

  const createTrip = useMutation({
    mutationFn: (data) => base44.entities.Trip.create({ ...data, status: 'active', customCategories: [] }),
    onSuccess: () => { refresh(); setShowNew(false); setTripData(emptyTrip()); },
  });

  const updateTrip = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Trip.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });

  const deleteTrip = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Expense.bulkDelete(allExpenses.filter((e) => e.trip_id === id).map((e) => e.id));
      await base44.entities.Trip.delete(id);
    },
    onSuccess: refresh,
  });

  const duplicateTrip = useMutation({
    mutationFn: async (trip) => {
      const { id, created_date, updated_date, ...rest } = trip;
      const copy = await base44.entities.Trip.create({ ...rest, name: `${rest.name} (עותק)`, status: 'planned' });
      const expenses = allExpenses
        .filter((e) => e.trip_id === id)
        .map(({ id: _id, created_date: _c, updated_date: _u, ...e }) => ({ ...e, trip_id: copy.id }));
      if (expenses.length) await base44.entities.Expense.bulkCreate(expenses);
      return copy;
    },
    onSuccess: refresh,
  });

  const totalFor = (tripId) => allExpenses.filter((e) => e.trip_id === tripId).reduce((s, e) => s + (e.amount || 0), 0);

  if (isLoading) return <Spinner />;

  const showTrip = (id) => {
    localStorage.setItem('lastSelectedTripId', id);
    navigate(`/?trip=${id}`);
  };

  const sorted = [...trips].sort((a, b) => {
    const sa = STATUS_ORDER[a.status] ?? 2, sb = STATUS_ORDER[b.status] ?? 2;
    if (sa !== sb) return sa - sb;
    if (a.status === 'completed' && b.status === 'completed') return (b.end_date || '').localeCompare(a.end_date || '');
    return 0;
  });

  return (
    <div className="px-5 pt-14 pb-24 space-y-4">
      <div className="mb-2">
        <p className="text-[10px] font-light text-[#50535A]/40 uppercase tracking-[0.2em]">ארכיון</p>
        <h1 className="text-xl font-semibold text-[#33363D] tracking-tight">כל הטיולים</h1>
      </div>

      {showNew && (
        <NewTripForm tripData={tripData} setTripData={setTripData} onSave={() => createTrip.mutate(tripData)} saving={createTrip.isPending} />
      )}

      {trips.length === 0 && !showNew ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#0A1F44]/5 flex items-center justify-center mb-4">
            <FolderArchive className="w-6 h-6 text-[#0A1F44]/30" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-light text-[#50535A]/50">אין טיולים עדיין</p>
          <p className="text-xs font-light text-[#50535A]/30 mt-1">לחץ + כדי ליצור טיול</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              expenses={allExpenses.filter((e) => e.trip_id === trip.id)}
              totalExpenses={totalFor(trip.id)}
              onDuplicate={(t) => duplicateTrip.mutate(t)}
              onUpdate={(id, data) => updateTrip.mutateAsync({ id, data })}
              onDelete={(id) => deleteTrip.mutate(id)}
              onExpensesUpdated={refresh}
              onTripClick={showTrip}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => { if (showNew) setTripData(emptyTrip()); setShowNew((v) => !v); }}
        className="fixed left-5 rounded-full bg-[#0A1F44] flex items-center justify-center z-40 transition-transform duration-200 active:scale-95"
        style={{ boxShadow: '0 4px 16px rgba(10,31,68,0.35)', width: 52, height: 52, bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
        aria-label={showNew ? 'סגור' : 'טיול חדש'}
      >
        {showNew ? <X className="w-5 h-5 text-white" strokeWidth={2} /> : <Plus className="w-5 h-5 text-white" strokeWidth={2} />}
      </button>
    </div>
  );
}
