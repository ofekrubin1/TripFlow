import { cn } from '@/lib/utils';

export default function PremiumCard({ children, className, goldAccent = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-[14px] p-5 relative transition-all duration-150',
        onClick && 'cursor-pointer active:scale-[0.995]',
        className
      )}
      style={{ boxShadow: '0 2px 12px rgba(10,31,68,0.06), 0 1px 3px rgba(10,31,68,0.04), inset 0 1px 0 rgba(255,255,255,0.8)' }}
    >
      {goldAccent && (
        <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#C9A45B]/40 to-transparent" />
      )}
      {children}
    </div>
  );
}
