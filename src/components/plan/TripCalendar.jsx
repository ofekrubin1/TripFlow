import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isWithinInterval,
  parseISO, startOfMonth, startOfWeek, subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAY_NAMES = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

export default function TripCalendar({ tripStart, tripEnd, selected, onSelect, calMonth, setCalMonth }) {
  const start = tripStart ? parseISO(tripStart) : null;
  const end = tripEnd ? parseISO(tripEnd) : null;
  const selectedDate = selected ? parseISO(selected) : null;
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(calMonth), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(calMonth), { weekStartsOn: 0 }),
  });

  const inTrip = (d) => (!start || !end ? true : isWithinInterval(d, { start, end }));
  const inMonth = (d) => d.getMonth() === calMonth.getMonth();
  const canPrev = () => !start || endOfMonth(subMonths(calMonth, 1)) >= start;
  const canNext = () => !end || startOfMonth(addMonths(calMonth, 1)) <= end;

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div className="bg-white rounded-[12px] border border-[#D0D1D3] p-3" style={{ boxShadow: 'inset 0 2px 4px rgba(10,31,68,0.04)' }}>
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => setCalMonth(subMonths(calMonth, 1))} disabled={!canPrev()} className="p-1 rounded-[8px] hover:bg-[#F3F3F4] disabled:opacity-20 transition-colors" aria-label="חודש קודם">
          <ChevronRight className="w-4 h-4 text-[#33363D]" strokeWidth={1.5} />
        </button>
        <span className="text-xs font-semibold text-[#33363D]">{format(calMonth, 'MMMM yyyy')}</span>
        <button type="button" onClick={() => setCalMonth(addMonths(calMonth, 1))} disabled={!canNext()} className="p-1 rounded-[8px] hover:bg-[#F3F3F4] disabled:opacity-20 transition-colors" aria-label="חודש הבא">
          <ChevronLeft className="w-4 h-4 text-[#33363D]" strokeWidth={1.5} />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d) => <div key={d} className="text-center text-[10px] font-medium text-[#50535A]/50 py-1">{d}</div>)}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {week.map((day, di) => {
            const enabled = inTrip(day);
            const current = inMonth(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            return (
              <button
                key={di}
                type="button"
                disabled={!enabled || !current}
                onClick={() => enabled && current && onSelect(format(day, 'yyyy-MM-dd'))}
                className={[
                  'h-8 w-full rounded-[7px] text-xs font-medium transition-colors',
                  isSelected ? 'bg-[#C9A45B] text-white' : '',
                  !isSelected && enabled && current ? 'text-[#33363D] hover:bg-[#C9A45B]/10' : '',
                  !isSelected && (!current || !enabled) ? 'text-[#D0D1D3] cursor-not-allowed' : '',
                ].join(' ')}
              >
                {current && (
                  <span className="relative">
                    {format(day, 'd')}
                    {enabled && !isSelected && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#C9A45B]/60 -mb-1 block" />
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
      {selected && <p className="text-[11px] font-light text-[#C9A45B] text-center mt-2">{format(parseISO(selected), 'dd/MM/yyyy')}</p>}
    </div>
  );
}
