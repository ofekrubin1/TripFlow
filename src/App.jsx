import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import TripPlan from '@/pages/TripPlan';
import PastTrips from '@/pages/PastTrips';
import SettingsPage from '@/pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 30_000 } },
});

// Refresh screens when data changes anywhere (another phone, another tab).
function LiveSync() {
  const qc = useQueryClient();
  useEffect(() => {
    const unsubs = [
      api.entities.Trip.subscribe(() => qc.invalidateQueries({ queryKey: ['trips'] })),
      api.entities.Expense.subscribe(() => {
        qc.invalidateQueries({ queryKey: ['expenses'] });
        qc.invalidateQueries({ queryKey: ['allExpenses'] });
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, [qc]);
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LiveSync />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/plan" element={<TripPlan />} />
            <Route path="/trips" element={<PastTrips />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
