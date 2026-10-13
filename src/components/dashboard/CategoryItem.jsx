import { Plane, Hotel, Utensils, Car, Ticket, ShoppingBag, Shield, Ellipsis } from 'lucide-react';

export const categoryConfig = {
  flights: { icon: Plane, label: 'טיסות', color: '#0A1F44' },
  accommodation: { icon: Hotel, label: 'לינה', color: '#2C5F7C' },
  food: { icon: Utensils, label: 'אוכל', color: '#C9A45B' },
  transport: { icon: Car, label: 'תחבורה', color: '#50535A' },
  attractions: { icon: Ticket, label: 'אטרקציות', color: '#6B7280' },
  shopping: { icon: ShoppingBag, label: 'קניות', color: '#8B6F47' },
  insurance: { icon: Shield, label: 'ביטוח', color: '#374151' },
  other: { icon: Ellipsis, label: 'אחר', color: '#9CA3AF' },
};

export function getCategoryInfo(category) {
  if (category?.startsWith('custom_')) {
    return { icon: Ellipsis, label: category.replace('custom_', ''), color: '#8B7355' };
  }
  return categoryConfig[category] || categoryConfig.other;
}

export default function CategoryItem({ category, amount, total }) {
  const config = getCategoryInfo(category);
  const Icon = config.icon;
  const percentage = total > 0 ? ((amount / total) * 100).toFixed(0) : 0;

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div
        className="w-9 h-9 rounded-[10px] flex items-center justify-center"
        style={{ backgroundColor: `${config.color}0D`, boxShadow: `inset 0 1px 2px ${config.color}08` }}
      >
        <Icon className="w-4 h-4" style={{ color: config.color }} strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#33363D]">{config.label}</span>
          <span className="text-sm font-semibold text-[#0A1F44]">
            ₪{amount.toLocaleString('he-IL', { maximumFractionDigits: 1 })}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1 bg-[#F3F3F4] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(0, percentage)}%`, backgroundColor: config.color }}
            />
          </div>
          <span className="text-[10px] font-light text-[#50535A]/50 w-8 text-left">{percentage}%</span>
        </div>
      </div>
    </div>
  );
}
