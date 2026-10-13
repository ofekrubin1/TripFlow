import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { categoryConfig } from '@/components/dashboard/CategoryItem';

// Custom categories are stored on the trip (Base44 kept them per browser in localStorage).
export function useCustomCategories(trip) {
  const queryClient = useQueryClient();
  const custom = trip?.customCategories || [];

  const options = [
    ...Object.entries(categoryConfig).map(([key, { label }]) => ({ key, label })),
    ...custom.map((name) => ({ key: `custom_${name}`, label: name })),
  ];

  const addCategory = async (name) => {
    const clean = name.trim().replace(/\s+/g, ' ');
    if (!clean) return null;
    if (trip?.id && !custom.includes(clean)) {
      await api.entities.Trip.update(trip.id, { customCategories: [...custom, clean] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    }
    return `custom_${clean}`;
  };

  return { options, addCategory };
}
