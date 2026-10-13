import { cn } from '@/lib/utils';

export default function PremiumInput({ label, icon: Icon, className, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs font-medium text-[#50535A] tracking-wide">{label}</label>}
      <div className="relative">
        {Icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Icon className="w-4 h-4 text-[#50535A]/50" strokeWidth={1.5} />
          </div>
        )}
        <input
          className={cn(
            'w-full bg-white rounded-[10px] border border-[#D0D1D3] px-4 py-3 text-sm text-[#33363D] placeholder:text-[#50535A]/35 font-inter',
            'focus:outline-none focus:border-[#C9A45B]/50 focus:ring-1 focus:ring-[#C9A45B]/20',
            'transition-all duration-150',
            Icon && 'pr-10',
            className
          )}
          style={{ boxShadow: 'inset 0 2px 4px rgba(10,31,68,0.04), inset 0 0 2px rgba(10,31,68,0.02)' }}
          {...props}
        />
      </div>
    </div>
  );
}
