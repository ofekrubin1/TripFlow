import { format, parseISO } from 'date-fns';
import { MapPin, Calendar } from 'lucide-react';
import PremiumCard from '../ui/PremiumCard';

export default function TripSummaryCard({ trip, totalExpenses, exportButton, totalDecimals }) {
  return (
    <PremiumCard goldAccent className="relative">
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[14px] bg-gradient-to-r from-[#0A1F44] via-[#C9A45B]/60 to-[#0A1F44]" />
      <div className="pt-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            {trip.destination ? (
              <div className="flex items-center gap-1.5 text-[#50535A]/70">
                <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="text-xs font-light">{trip.destination}</span>
              </div>
            ) : <div />}
          </div>
          <p className="text-[10px] font-light text-[#50535A]/50 uppercase tracking-widest flex-shrink-0">סה״כ</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-lg font-semibold text-[#33363D] tracking-tight truncate leading-none">{trip.name}</h2>
            {exportButton}
          </div>
          <p className="text-lg font-semibold text-[#0A1F44] tracking-tight whitespace-nowrap flex-shrink-0">
            ₪{totalExpenses.toLocaleString('he-IL', { maximumFractionDigits: totalDecimals ?? 2 })}
          </p>
        </div>

        {(trip.start_date || trip.end_date) && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[#D0D1D3]/40">
            <Calendar className="w-3.5 h-3.5 text-[#C9A45B]/70" strokeWidth={1.5} />
            <span className="text-[11px] font-light text-[#50535A]/60">
              {trip.start_date && format(parseISO(trip.start_date), 'dd/MM/yyyy')}
              {trip.end_date && ` — ${format(parseISO(trip.end_date), 'dd/MM/yyyy')}`}
            </span>
          </div>
        )}

        {trip.budget > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] font-light text-[#50535A]/50 mb-1">
              <span>תקציב</span>
              <span>₪{trip.budget?.toLocaleString()}</span>
            </div>
            <div className="h-1.5 bg-[#F3F3F4] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((totalExpenses / trip.budget) * 100, 100)}%`,
                  background: totalExpenses > trip.budget
                    ? 'linear-gradient(90deg, #c0392b, #e74c3c)'
                    : 'linear-gradient(90deg, #0A1F44, #C9A45B)',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </PremiumCard>
  );
}
