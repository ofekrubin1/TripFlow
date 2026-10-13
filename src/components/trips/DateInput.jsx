import { Calendar, X } from 'lucide-react';

// Native date picker under a styled dd/mm/yyyy face (consistent look on iOS and Android).
export default function DateInput({ value, onChange, min, onInvalidDate }) {
  const display = (v) => {
    if (!v) return '';
    const [y, m, d] = v.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="relative w-full min-w-0" style={{ height: 48 }}>
      <div className="absolute inset-0 rounded-[10px] bg-white border border-[#D0D1D3] pointer-events-none overflow-hidden" style={{ boxShadow: 'inset 0 2px 4px rgba(10,31,68,0.04)' }}>
        <span className="absolute inset-y-0 right-9 left-3 flex items-center truncate" style={{ color: value ? '#33363D' : '#D0D1D3', fontSize: '16px' }}>
          {value ? display(value) : 'dd/mm/yyyy'}
        </span>
      </div>
      {value ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(''); }}
          className="absolute top-1/2 -translate-y-1/2 right-2.5 p-0.5 rounded-full hover:bg-[#F3F3F4]"
          style={{ zIndex: 10 }}
          aria-label="נקה תאריך"
        >
          <X className="w-4 h-4 text-[#50535A]/50" strokeWidth={1.5} />
        </button>
      ) : (
        <Calendar className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-[#50535A]/40 pointer-events-none" strokeWidth={1.5} />
      )}
      <input
        type="date"
        value={value || ''}
        min={min || undefined}
        onChange={(e) => {
          const v = e.target.value;
          if (min && v && v < min) { onInvalidDate?.(); return; }
          onChange(v);
        }}
        className="absolute inset-0 w-full min-w-0"
        style={{ opacity: 0, fontSize: '16px', boxSizing: 'border-box', zIndex: 1 }}
      />
    </div>
  );
}
