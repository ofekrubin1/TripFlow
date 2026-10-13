import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { format, parseISO } from 'date-fns';
import { EllipsisVertical, StickyNote, Image, Pencil, Trash2, X } from 'lucide-react';
import { getCategoryInfo } from './CategoryItem';
import { currencySymbol } from '@/lib/currency';

function linkify(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline break-all">{part}</a>
    ) : (
      <span key={i} className="whitespace-pre-wrap break-words">{part}</span>
    )
  );
}

const MENU_WIDTH = 160;
const menuItemClass = 'w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-[#33363D] hover:bg-[#F3F3F4] transition-colors text-right';

export default function ExpenseItem({ expense, onDelete, onEdit }) {
  const [showNote, setShowNote] = useState(false);
  const [notePos, setNotePos] = useState({ top: 0, left: 0 });
  const [showImage, setShowImage] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const rowRef = useRef(null);
  const config = getCategoryInfo(expense.category);
  const Icon = config.icon;

  useEffect(() => {
    if (!menuOpen && !showNote) return;
    const close = (e) => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setMenuOpen(false);
    };
    // Popups are position:fixed, so close them once the page really scrolls (ignore tiny tap-induced jitter).
    const startY = window.scrollY;
    const onScroll = () => { if (Math.abs(window.scrollY - startY) > 10) { setMenuOpen(false); setShowNote(false); } };
    document.addEventListener('pointerdown', close);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('pointerdown', close);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [menuOpen, showNote]);

  const toggleMenu = (e) => {
    e.stopPropagation();
    if (menuOpen) { setMenuOpen(false); return; }
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      let right = Math.max(0, window.innerWidth - rect.right);
      if (rect.right - MENU_WIDTH < 8) right = window.innerWidth - MENU_WIDTH - 8;
      setMenuPos({ top: rect.bottom + 4, right: Math.max(8, right) });
    }
    setMenuOpen(true);
  };

  const menu = menuOpen && createPortal(
    <div
      ref={menuRef}
      className="fixed bg-white rounded-[12px] border border-[#D0D1D3] py-1.5"
      style={{ boxShadow: '0 12px 32px rgba(10,31,68,0.18), 0 2px 8px rgba(10,31,68,0.10)', top: menuPos.top, right: menuPos.right, zIndex: 99999, minWidth: MENU_WIDTH }}
      dir="rtl"
    >
      {expense.notes && (
        <button
          className={menuItemClass}
          onClick={(e) => {
            e.stopPropagation();
            if (!showNote && rowRef.current) {
              const rect = rowRef.current.getBoundingClientRect();
              setNotePos({ top: rect.bottom + 6, left: Math.max(12, Math.min(rect.left, window.innerWidth - 292)) });
            }
            setShowNote((v) => !v);
            setMenuOpen(false);
          }}
        >
          <StickyNote className="w-3.5 h-3.5 text-[#C9A45B] flex-shrink-0" strokeWidth={1.5} />
          <span>{showNote ? 'הסתר הערה' : 'הצג הערה'}</span>
        </button>
      )}
      {expense.image_url && (
        <button className={menuItemClass} onClick={(e) => { e.stopPropagation(); setShowImage(true); setMenuOpen(false); }}>
          <Image className="w-3.5 h-3.5 text-[#4A7CA5] flex-shrink-0" strokeWidth={1.5} />
          <span>הצג תמונה</span>
        </button>
      )}
      {onEdit && (
        <button className={menuItemClass} onClick={(e) => { e.stopPropagation(); onEdit(expense); setMenuOpen(false); }}>
          <Pencil className="w-3.5 h-3.5 text-[#50535A] flex-shrink-0" strokeWidth={1.5} />
          <span>עריכה</span>
        </button>
      )}
      {onDelete && (
        <>
          <div className="h-px bg-[#E8E8EA] mx-2 my-1" />
          <button
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-right"
            onClick={(e) => { e.stopPropagation(); onDelete(expense.id); setMenuOpen(false); }}
          >
            <Trash2 className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} />
            <span>מחיקה</span>
          </button>
        </>
      )}
    </div>,
    document.body
  );

  const note = showNote && expense.notes && createPortal(
    <div
      className="fixed z-[99998] bg-white rounded-[12px] border border-[#C9A45B]/30 px-4 py-3 shadow-lg"
      style={{ top: notePos.top, left: notePos.left, width: 'min(280px, calc(100vw - 24px))', boxShadow: '0 8px 24px rgba(10,31,68,0.14)' }}
      dir="rtl"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-light text-[#50535A]/80 leading-relaxed min-w-0 flex-1 break-words overflow-hidden">
          {linkify(expense.notes)}
        </div>
        <button onClick={() => setShowNote(false)} className="flex-shrink-0 mt-0.5 p-0.5 rounded hover:bg-[#F3F3F4]">
          <X className="w-3 h-3 text-[#50535A]/40" strokeWidth={2} />
        </button>
      </div>
    </div>,
    document.body
  );

  const image = showImage && expense.image_url && createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/70 p-4" onClick={() => setShowImage(false)}>
      <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <img src={expense.image_url} alt="הוצאה" className="w-full rounded-[14px] object-contain max-h-[80vh]" />
        <button onClick={() => setShowImage(false)} className="absolute top-3 left-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors">
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </div>,
    document.body
  );

  const hasOriginal = expense.original_expense_currency && expense.original_expense_amount != null;

  return (
    <div className="py-3" ref={rowRef}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${config.color}0D` }}>
          <Icon className="w-4 h-4" style={{ color: config.color }} strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#33363D] truncate">{expense.title}</p>
          <p className="text-[11px] font-light text-[#50535A]/50">
            {config.label}
            {expense.date && ` · ${format(parseISO(expense.date), 'dd/MM')}`}
            {hasOriginal && (
              <>
                {' · '}
                <span dir="ltr" className={expense.original_expense_currency !== 'ILS' ? 'text-[#C9A45B] font-semibold' : ''}>
                  {expense.original_expense_amount.toLocaleString()}{' '}
                  {expense.original_expense_currency === 'ILS' ? 'ILS' : currencySymbol(expense.original_expense_currency)}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-semibold text-[#0A1F44] inline-flex items-center gap-0.5" dir="ltr">
            <span>₪</span>
            <span dir="ltr">
              {expense.amount < 0
                ? `-${Math.abs(expense.amount).toLocaleString('he-IL', { maximumFractionDigits: 1 })}`
                : `${(expense.amount ?? 0).toLocaleString('he-IL', { maximumFractionDigits: 1 })}`}
            </span>
          </span>
          <button ref={btnRef} onClick={toggleMenu} className="p-1.5 rounded-[8px] bg-[#0A1F44]/5 hover:bg-[#0A1F44]/10 transition-colors" aria-label="פעולות">
            <EllipsisVertical className="w-4 h-4 text-[#0A1F44]/50" strokeWidth={1.5} />
          </button>
        </div>
      </div>
      {menu}{note}{image}
    </div>
  );
}
