import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const variants = {
  primary: 'bg-[#0A1F44] text-white border border-[#C9A45B]/30',
  secondary: 'bg-white text-[#0A1F44] border border-[#C9A45B]/40',
  gold: 'bg-gradient-to-b from-[#C9A45B] to-[#B8943F] text-white border border-[#C9A45B]/20',
  danger: 'bg-white text-[#c0392b] border border-[#c0392b]/20',
};

const shadows = {
  primary: '0 3px 10px rgba(10,31,68,0.2), 0 1px 3px rgba(10,31,68,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
  secondary: '0 2px 8px rgba(10,31,68,0.06), 0 1px 2px rgba(10,31,68,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
  gold: '0 3px 10px rgba(201,164,91,0.25), 0 1px 3px rgba(201,164,91,0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
  danger: '0 2px 8px rgba(192,57,43,0.08), 0 1px 2px rgba(192,57,43,0.04)',
};

// forwardRef so it can be an AlertDialogTrigger child (asChild).
const PremiumButton = forwardRef(function PremiumButton({ children, variant = 'primary', className, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        'rounded-[12px] px-5 py-3 font-medium text-sm transition-all duration-80 active:translate-y-[0.5px] disabled:opacity-50',
        variants[variant],
        className
      )}
      style={{ boxShadow: shadows[variant] }}
      {...props}
    >
      {children}
    </button>
  );
});

export default PremiumButton;
