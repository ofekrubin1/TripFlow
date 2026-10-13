import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Info, Bell, ChevronDown, Check, Trash2, Send } from 'lucide-react';
import { api } from '@/api/client';
import PremiumCard from '../components/ui/PremiumCard';
import PremiumButton from '../components/ui/PremiumButton';
import TimeWheel from '../components/settings/TimeWheel';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [resetting, setResetting] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [hour, setHour] = useState(20);
  const [minute, setMinute] = useState(0);
  const [settingsId, setSettingsId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testState, setTestState] = useState({ status: 'idle', message: '' });

  useEffect(() => {
    api.entities.ReminderSettings.list('-created_date', 1).then((list) => {
      if (!list.length) return;
      const s = list[0];
      setEmail(s.email || '');
      setEnabled(s.enabled !== false);
      setHour(s.hour ?? 20);
      const m = s.minute ?? 0;
      setMinute(MINUTES.reduce((best, k) => (Math.abs(k - m) < Math.abs(best - m) ? k : best)));
      setSettingsId(s.id);
    }).catch((err) => console.error(err));
  }, []);

  const saveReminder = async () => {
    if (!email) return;
    setSaving(true);
    try {
      const data = { email, enabled, hour, minute };
      if (settingsId) await api.entities.ReminderSettings.update(settingsId, data);
      else setSettingsId((await api.entities.ReminderSettings.create(data)).id);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const TEST_ERRORS = {
    no_email: 'שמור קודם כתובת אימייל.',
    too_soon: 'נשלח מייל בדיקה לפני רגע. נסה שוב בעוד דקה.',
  };

  const sendTest = async () => {
    setTestState({ status: 'sending', message: '' });
    try {
      const res = await fetch('/api/send-test-reminder', { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok) setTestState({ status: 'ok', message: `נשלח מייל בדיקה אל ${body.to}` });
      else setTestState({ status: 'error', message: TEST_ERRORS[body.error] || `השליחה נכשלה: ${body.error || res.status}` });
    } catch {
      setTestState({ status: 'error', message: 'השליחה נכשלה. בדוק את החיבור לאינטרנט.' });
    }
  };

  const resetAll = async () => {
    setResetting(true);
    try {
      const [expenses, trips] = await Promise.all([api.entities.Expense.list(), api.entities.Trip.list()]);
      await api.entities.Expense.bulkDelete(expenses.map((e) => e.id));
      await api.entities.Trip.bulkDelete(trips.map((t) => t.id));
      localStorage.removeItem('lastSelectedTripId');
      queryClient.invalidateQueries();
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="px-5 pt-14 pb-4 space-y-4" dir="rtl">
      <div className="mb-2">
        <p className="text-[10px] font-light text-[#50535A]/40 uppercase tracking-[0.2em]">הגדרות</p>
        <h1 className="text-xl font-semibold text-[#33363D] tracking-tight">ניהול</h1>
      </div>

      <PremiumCard goldAccent>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-[#0A1F44]/5 flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-[#0A1F44]/50" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#33363D] mb-0.5">מנהל הוצאות טיולים</h3>
            <p className="text-xs font-light text-[#50535A]/50 leading-relaxed">גרסת Premium Business — ניהול יוקרתי ומקצועי של הוצאות הטיולים שלך.</p>
          </div>
        </div>
      </PremiumCard>

      <PremiumCard>
        <button className="w-full flex items-center gap-2 text-right" onClick={() => setReminderOpen((v) => !v)} aria-expanded={reminderOpen}>
          <Bell className="w-4 h-4 text-[#C9A45B] flex-shrink-0" strokeWidth={1.5} />
          <h3 className="flex-1 text-xs font-medium text-[#0A1F44] uppercase tracking-widest">תזכורת יומית</h3>
          <ChevronDown
            className="w-4 h-4 text-[#50535A]/40 transition-transform duration-200 flex-shrink-0"
            style={{ transform: reminderOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            strokeWidth={1.5}
          />
        </button>
        {reminderOpen && (
          <div className="mt-4 border-t border-[#0A1F44]/10 pt-4 space-y-4">
            <div className="space-y-0">
              <p className="text-xs font-light text-[#50535A]/60 leading-relaxed">תזכורת תישלח למייל בשעה שהוגדרה — רק בימים שנמצאים בטווח טיול פעיל.</p>
              <p className="text-[11px] text-[#C9A45B]/80 px-3 py-2 leading-relaxed">⚠️ שים לב, עדכון השעה יכול לקחת כמה דקות.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#50535A] tracking-wide">כתובת אימייל</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white rounded-[10px] border border-[#D0D1D3] px-3 py-2.5 text-sm text-[#33363D] focus:outline-none focus:border-[#C9A45B]/50 focus:ring-1 focus:ring-[#C9A45B]/20"
                style={{ boxShadow: 'inset 0 2px 4px rgba(10,31,68,0.04)', direction: 'ltr' }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#50535A] tracking-wide">שעת שליחה</label>
              <div className="flex items-center justify-center gap-3 py-2" dir="ltr">
                <TimeWheel value={hour} onChange={setHour} items={HOURS} label="שעה" />
                <span className="text-2xl font-light text-[#50535A]/30 mt-5">:</span>
                <TimeWheel value={minute} onChange={setMinute} items={MINUTES} label="דקות" />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-medium text-[#50535A] flex-1">הפעל תזכורות</span>
              <div dir="ltr" className="flex-shrink-0">
                <button
                  onClick={() => setEnabled((v) => !v)}
                  role="switch"
                  aria-checked={enabled}
                  aria-label="הפעל תזכורות"
                  className={`w-10 h-6 rounded-full transition-colors duration-150 flex items-center px-0.5 ${enabled ? 'bg-[#C9A45B]' : 'bg-[#D0D1D3]'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-150 ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
            <button
              onClick={saveReminder}
              disabled={saving || !email}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] bg-[#0A1F44] text-white text-sm font-medium disabled:opacity-50 transition-colors hover:bg-[#0A1F44]/90"
            >
              {saved ? (<><Check className="w-4 h-4" strokeWidth={2} /><span>נשמר!</span></>) : saving ? 'שומר...' : 'שמור הגדרות תזכורת'}
            </button>
            <button
              onClick={sendTest}
              disabled={!settingsId || testState.status === 'sending'}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] bg-white text-[#0A1F44] border border-[#C9A45B]/40 text-sm font-medium disabled:opacity-50"
            >
              <Send className="w-4 h-4" strokeWidth={1.5} />
              {testState.status === 'sending' ? 'שולח...' : 'שלח מייל בדיקה'}
            </button>
            {testState.message && (
              <p className={`text-[11px] text-center leading-relaxed ${testState.status === 'ok' ? 'text-[#2E8B57]' : 'text-[#c0392b]'}`}>{testState.message}</p>
            )}
          </div>
        )}
      </PremiumCard>

      <PremiumCard>
        <div className="border-b border-[#0A1F44]/10 pb-3 mb-4">
          <h3 className="text-xs font-medium text-[#0A1F44] uppercase tracking-widest">אזור מתקדם</h3>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <PremiumButton variant="danger" className="w-full" disabled={resetting}>
              <div className="flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" />
                <span>{resetting ? 'מאפס...' : 'איפוס כל הנתונים'}</span>
              </div>
            </PremiumButton>
          </AlertDialogTrigger>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>איפוס כל הנתונים</AlertDialogTitle>
              <AlertDialogDescription>פעולה זו תמחק את כל הטיולים וההוצאות. לא ניתן לשחזר את הנתונים לאחר המחיקה.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex gap-2 justify-end">
              <AlertDialogCancel>ביטול</AlertDialogCancel>
              <AlertDialogAction onClick={resetAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">אפס נתונים</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PremiumCard>
    </div>
  );
}
