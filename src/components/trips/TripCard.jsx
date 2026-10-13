import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { format, parseISO } from 'date-fns';
import {
  MapPin, Calendar, Check, X, EllipsisVertical, Pencil, RotateCcw, CircleCheck, DollarSign,
  CreditCard, CalendarRange, Copy, Trash2,
} from 'lucide-react';
import { api } from '@/api/client';
import { CURRENCIES } from '@/lib/currency';
import PremiumCard from '../ui/PremiumCard';
import CurrencyRatesEditor from './CurrencyRatesEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const STATUS_LABELS = { active: 'פעיל', completed: 'הושלם', planned: 'מתוכנן' };
const STATUS_STYLES = {
  active: 'bg-[#0A1F44]/10 text-[#0A1F44]',
  completed: 'bg-[#C9A45B]/10 text-[#C9A45B]',
  planned: 'bg-[#50535A]/10 text-[#50535A]',
};
const MENU_WIDTH = 208;
const itemClass = 'w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-[#33363D] hover:bg-[#F3F3F4] transition-colors text-right';
const dateInputClass = 'w-full bg-white rounded-[9px] border border-[#D0D1D3] px-2 py-2 text-sm text-[#33363D] focus:outline-none focus:border-[#C9A45B]/50';

export default function TripCard({ trip, expenses, totalExpenses, onDuplicate, onUpdate, onDelete, onExpensesUpdated, onTripClick }) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(trip.name);
  const [menuOpen, setMenuOpen] = useState(false);
  const [statusMenu, setStatusMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showRates, setShowRates] = useState(false);
  const [showCurrency, setShowCurrency] = useState(false);
  const [currency, setCurrency] = useState(trip.currency || 'ILS');
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [showDates, setShowDates] = useState(false);
  const [dates, setDates] = useState({ start_date: trip.start_date || '', end_date: trip.end_date || '' });
  const [savingDates, setSavingDates] = useState(false);
  const [confirmDates, setConfirmDates] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  // A tap that only dismisses the open menu shouldn't also open the trip.
  const dismissingMenu = useRef(false);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      dismissingMenu.current = true;
      setTimeout(() => { dismissingMenu.current = false; }, 400);
      setMenuOpen(false); setStatusMenu(false);
    };
    const startY = window.scrollY;
    const onScroll = () => { if (Math.abs(window.scrollY - startY) > 10) { setMenuOpen(false); setStatusMenu(false); } };
    document.addEventListener('pointerdown', close);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('pointerdown', close);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [menuOpen]);

  const toggleMenu = (e) => {
    e.stopPropagation();
    if (menuOpen) { setMenuOpen(false); setStatusMenu(false); return; }
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      let right = Math.max(0, window.innerWidth - rect.right);
      if (rect.right - MENU_WIDTH < 8) right = window.innerWidth - MENU_WIDTH - 8;
      setMenuPos({ top: rect.bottom + 4, right: Math.max(8, right) });
    }
    setMenuOpen(true);
    setStatusMenu(false);
  };

  const pick = (fn) => (e) => { e.stopPropagation(); fn(); setMenuOpen(false); };

  const saveName = () => {
    if (name.trim()) onUpdate(trip.id, { name: name.trim() });
    setRenaming(false);
  };

  const outOfRange = () => expenses.filter((e) =>
    e.date && ((dates.start_date && e.date < dates.start_date) || (dates.end_date && e.date > dates.end_date)));

  const saveDates = async (removeOutOfRange = false) => {
    setSavingDates(true);
    try {
      if (removeOutOfRange) {
        await api.entities.Expense.bulkDelete(outOfRange().map((e) => e.id));
        onExpensesUpdated?.();
      }
      await onUpdate(trip.id, dates);
      setShowDates(false);
    } finally {
      setSavingDates(false);
    }
  };

  // Tapping the card opens the trip on the dashboard, unless the card is busy with an edit, menu or dialog.
  // (Dialogs and menus are portals, but their clicks still bubble here through React.)
  const busy = renaming || menuOpen || showRates || showCurrency || showDates || confirmDelete || confirmDates;
  const openTrip = onTripClick && !busy
    ? () => { if (!dismissingMenu.current) onTripClick(trip.id); }
    : undefined;

  const otherStatuses = ['active', 'completed'].filter((s) => s !== trip.status);

  const menu = menuOpen && createPortal(
    <div
      ref={menuRef}
      className="fixed w-52 bg-white rounded-[14px] border border-[#D0D1D3] py-1.5"
      style={{ boxShadow: '0 12px 32px rgba(10,31,68,0.18), 0 2px 8px rgba(10,31,68,0.10)', top: menuPos.top, right: menuPos.right, zIndex: 99999 }}
      dir="rtl"
    >
      <button className={itemClass} onClick={pick(() => { setName(trip.name); setRenaming(true); })}>
        <Pencil className="w-3.5 h-3.5 text-[#50535A] flex-shrink-0" strokeWidth={1.5} />
        <span>שנה שם</span>
      </button>
      {statusMenu ? (
        <div className="bg-[#F8F8F9] mx-1.5 rounded-[8px] py-1 mb-1">
          <p className="text-[10px] font-medium text-[#50535A]/50 uppercase tracking-widest px-3 py-1">בחר סטטוס</p>
          {otherStatuses.map((s) => (
            <button
              key={s}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#33363D] hover:bg-white rounded-[6px] transition-colors text-right"
              onClick={(e) => { e.stopPropagation(); onUpdate(trip.id, { status: s }); setMenuOpen(false); setStatusMenu(false); }}
            >
              <CircleCheck className="w-3 h-3 text-[#C9A45B] flex-shrink-0" strokeWidth={1.5} />
              <span>{STATUS_LABELS[s]}</span>
            </button>
          ))}
          <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#50535A]/50 hover:text-[#50535A] transition-colors text-right" onClick={(e) => { e.stopPropagation(); setStatusMenu(false); }}>
            ← חזור
          </button>
        </div>
      ) : (
        <button className={itemClass} onClick={(e) => { e.stopPropagation(); setStatusMenu(true); }}>
          <RotateCcw className="w-3.5 h-3.5 text-[#50535A] flex-shrink-0" strokeWidth={1.5} />
          <span>שינוי סטטוס</span>
        </button>
      )}
      <button className={itemClass} onClick={pick(() => setShowRates(true))}>
        <DollarSign className="w-3.5 h-3.5 text-[#C9A45B] flex-shrink-0" strokeWidth={1.5} />
        <span>עדכון שערי מטבע</span>
      </button>
      <button className={itemClass} onClick={pick(() => { setCurrency(trip.currency || 'ILS'); setShowCurrency(true); })}>
        <CreditCard className="w-3.5 h-3.5 text-[#C9A45B] flex-shrink-0" strokeWidth={1.5} />
        <span>עדכון מטבע ברירת מחדל</span>
      </button>
      <button className={itemClass} onClick={pick(() => { setDates({ start_date: trip.start_date || '', end_date: trip.end_date || '' }); setShowDates(true); })}>
        <CalendarRange className="w-3.5 h-3.5 text-[#50535A] flex-shrink-0" strokeWidth={1.5} />
        <span>שינוי תאריכים</span>
      </button>
      <button className={itemClass} onClick={pick(() => onDuplicate(trip))}>
        <Copy className="w-3.5 h-3.5 text-[#50535A] flex-shrink-0" strokeWidth={1.5} />
        <span>שכפל טיול</span>
      </button>
      <div className="h-px bg-[#E8E8EA] mx-2 my-1" />
      <button className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-right" onClick={pick(() => setConfirmDelete(true))}>
        <Trash2 className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} />
        <span>מחק טיול</span>
      </button>
    </div>,
    document.body
  );

  return (
    <PremiumCard goldAccent className="transition-transform duration-150" onClick={openTrip}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {renaming ? (
              <div className="flex items-center gap-1.5 flex-1">
                <input
                  className="flex-1 min-w-0 text-sm font-semibold text-[#33363D] bg-[#F3F3F4] rounded-[8px] px-2 py-1 border border-[#C9A45B]/40 focus:outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveName();
                    if (e.key === 'Escape') setRenaming(false);
                  }}
                />
                <button onClick={saveName} className="p-1 rounded-lg bg-[#0A1F44]/10 hover:bg-[#0A1F44]/20" aria-label="שמור">
                  <Check className="w-3.5 h-3.5 text-[#0A1F44]" strokeWidth={2} />
                </button>
                <button onClick={() => setRenaming(false)} className="p-1 rounded-lg bg-[#F3F3F4] hover:bg-[#E8E8E8]" aria-label="ביטול">
                  <X className="w-3.5 h-3.5 text-[#50535A]" strokeWidth={2} />
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-base font-semibold text-[#33363D] truncate">{trip.name}</h3>
                <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLES[trip.status] || STATUS_STYLES.planned}`}>
                  {STATUS_LABELS[trip.status] || 'מתוכנן'}
                </span>
              </>
            )}
          </div>
          {trip.destination && (
            <div className="flex items-center gap-1.5 text-[#50535A]/60 mb-2">
              <MapPin className="w-3 h-3" strokeWidth={1.5} />
              <span className="text-xs font-light">{trip.destination}</span>
            </div>
          )}
          <div className="flex items-center gap-4">
            <p className="text-lg font-semibold text-[#0A1F44]">₪{totalExpenses.toLocaleString('he-IL', { maximumFractionDigits: 2 })}</p>
            {trip.start_date && (
              <div className="flex items-center gap-1 text-[#50535A]/40">
                <Calendar className="w-3 h-3" strokeWidth={1.5} />
                <span className="text-[10px] font-light">
                  {format(parseISO(trip.start_date), 'dd/MM/yy')}
                  {trip.end_date && ` — ${format(parseISO(trip.end_date), 'dd/MM/yy')}`}
                </span>
              </div>
            )}
          </div>
        </div>
        {!renaming && (
          <button ref={btnRef} onClick={toggleMenu} className="flex-shrink-0 p-2 rounded-[10px] bg-[#0A1F44]/5 hover:bg-[#0A1F44]/10 transition-colors duration-150" aria-label="פעולות">
            <EllipsisVertical className="w-4 h-4 text-[#0A1F44]/60" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {menu}

      {showRates && <CurrencyRatesEditor trip={trip} onClose={() => setShowRates(false)} onSaved={onExpensesUpdated} />}

      {showCurrency && (
        <div className="mt-3 pt-3 border-t border-[#D0D1D3]/60" dir="rtl">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-medium text-[#50535A]/60 flex-shrink-0">מטבע ברירת מחדל:</p>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="h-8 text-xs rounded-[8px] border-[#D0D1D3] bg-white px-2" style={{ minWidth: 72 }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(({ code }) => <SelectItem key={code} value={code}>{code}</SelectItem>)}
              </SelectContent>
            </Select>
            <button
              disabled={savingCurrency}
              onClick={async () => {
                setSavingCurrency(true);
                try { await onUpdate(trip.id, { currency }); setShowCurrency(false); } finally { setSavingCurrency(false); }
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] bg-[#C9A45B] text-white text-xs font-medium disabled:opacity-50 flex-shrink-0"
            >
              <Check className="w-3 h-3" strokeWidth={2} />
              {savingCurrency ? '...' : 'שמור'}
            </button>
            <button onClick={() => setShowCurrency(false)} className="p-1.5 rounded-[8px] bg-[#F3F3F4] text-[#50535A] flex-shrink-0" aria-label="סגור">
              <X className="w-3 h-3" strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {showDates && (
        <div className="mt-3 pt-3 border-t border-[#D0D1D3]/60 space-y-3" dir="rtl">
          <p className="text-[11px] font-medium text-[#50535A]/60 uppercase tracking-widest">שינוי תאריכי טיול</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1 min-w-0">
              <label className="text-[10px] font-medium text-[#50535A]">תאריך התחלה</label>
              <input
                type="date"
                className={dateInputClass}
                value={dates.start_date}
                onChange={(e) => {
                  const v = e.target.value;
                  setDates((d) => ({ start_date: v, end_date: d.end_date && d.end_date < v ? v : d.end_date }));
                }}
                style={{ colorScheme: 'light' }}
              />
            </div>
            <div className="space-y-1 min-w-0">
              <label className="text-[10px] font-medium text-[#50535A]">תאריך סיום</label>
              <input
                type="date"
                className={dateInputClass}
                value={dates.end_date}
                min={dates.start_date || undefined}
                onChange={(e) => setDates((d) => ({ ...d, end_date: e.target.value }))}
                style={{ colorScheme: 'light' }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              disabled={savingDates}
              onClick={() => (outOfRange().length > 0 ? setConfirmDates(true) : saveDates())}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[9px] bg-[#C9A45B] text-white text-xs font-medium disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" strokeWidth={2} />
              {savingDates ? 'שומר...' : 'שמור תאריכים'}
            </button>
            <button onClick={() => setShowDates(false)} className="px-3 py-2 rounded-[9px] bg-[#F3F3F4] text-[#50535A] text-xs font-medium">
              ביטול
            </button>
          </div>
        </div>
      )}

      <AlertDialog open={confirmDates} onOpenChange={setConfirmDates}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>שינוי תאריכי טיול</AlertDialogTitle>
            <AlertDialogDescription>ישנן הוצאות מחוץ לטווחי הטיול. האם אתה בטוח שברצונך לשנות את תאריכי הטיול?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 justify-end">
            <AlertDialogCancel onClick={() => setShowDates(false)}>לא</AlertDialogCancel>
            <AlertDialogAction onClick={() => saveDates(true)} className="bg-[#C9A45B] text-white hover:bg-[#B8943F]">כן, שנה ומחק</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת טיול</AlertDialogTitle>
            <AlertDialogDescription>האם למחוק את הטיול "{trip.name}"? כל ההוצאות המשויכות אליו יימחקו גם הן.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 justify-end">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(trip.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">מחק</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PremiumCard>
  );
}
