import { useEffect, useRef } from 'react';

const ITEM_H = 40;

// iOS-style scroll wheel. Native scroll + snap on touch; wheel/drag on desktop.
export default function TimeWheel({ value, onChange, items, label }) {
  const ref = useRef(null);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startTop = useRef(0);
  const settleTimer = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || dragging.current) return;
    const i = items.indexOf(value);
    el.scrollTop = (i >= 0 ? i : 0) * ITEM_H;
  }, [value, items]);

  const settle = () => {
    const el = ref.current;
    if (!el) return;
    const i = Math.max(0, Math.min(Math.round(el.scrollTop / ITEM_H), items.length - 1));
    el.scrollTo({ top: i * ITEM_H, behavior: 'smooth' });
    if (items[i] !== value) onChange(items[i]);
  };

  const onScroll = () => {
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => { if (!dragging.current) settle(); }, 120);
  };

  const onPointerDown = (e) => {
    if (e.pointerType === 'touch') return; // touch uses native scrolling
    dragging.current = true;
    startY.current = e.clientY;
    startTop.current = ref.current?.scrollTop || 0;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging.current || !ref.current) return;
    ref.current.scrollTop = startTop.current + (startY.current - e.clientY);
  };
  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    settle();
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[10px] font-medium text-[#50535A]/50 uppercase tracking-widest">{label}</span>
      <div
        className="relative rounded-[12px] overflow-hidden bg-[#F3F3F4] cursor-ns-resize select-none"
        style={{ width: 64, height: 120 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="absolute inset-x-0 top-0 h-16 pointer-events-none z-10" style={{ background: 'linear-gradient(to bottom, #F3F3F4 0%, transparent 100%)' }} />
        <div className="absolute inset-x-2 pointer-events-none z-10 rounded-[8px] bg-[#C9A45B]/12 border border-[#C9A45B]/30" style={{ top: ITEM_H, height: ITEM_H }} />
        <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none z-10" style={{ background: 'linear-gradient(to top, #F3F3F4 0%, transparent 100%)' }} />
        <div
          ref={ref}
          onScroll={onScroll}
          className="h-full overflow-y-scroll [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', scrollSnapType: 'y mandatory' }}
          tabIndex={0}
          aria-label={label}
        >
          <div style={{ height: ITEM_H }} />
          {items.map((item) => (
            <div
              key={item}
              className={`flex items-center justify-center transition-all duration-100 ${item === value ? 'text-[#0A1F44] font-bold text-lg' : 'text-[#50535A]/35 text-sm font-normal'}`}
              style={{ height: ITEM_H, scrollSnapAlign: 'center' }}
            >
              {String(item).padStart(2, '0')}
            </div>
          ))}
          <div style={{ height: ITEM_H }} />
        </div>
      </div>
    </div>
  );
}
