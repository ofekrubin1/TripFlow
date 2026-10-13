// Decides whether the daily reminder is due and builds its email. Pure functions: no I/O.

export const DEFAULT_TZ = 'Asia/Jerusalem';
// Runs every 15 minutes; a reminder may go out up to this long after its set time (covers late runs).
const SEND_WINDOW_MIN = 60;

// Wall-clock date/time in the given time zone.
export function localNow(now = new Date(), timeZone = DEFAULT_TZ) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(now).map((p) => [p.type, p.value])
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour), minute: Number(parts.minute) };
}

export function isDue(settings, local) {
  if (!settings?.email || settings.enabled === false) return false;
  if (settings.last_sent_date === local.date) return false;
  const target = (settings.hour ?? 20) * 60 + (settings.minute ?? 0);
  const current = local.hour * 60 + local.minute;
  return current >= target && current < target + SEND_WINDOW_MIN;
}

// "Only on days within an active trip": status active and today inside its dates.
export function tripsActiveOn(trips, date) {
  return trips.filter((t) => t.status === 'active' && (!t.start_date || t.start_date <= date) && (!t.end_date || date <= t.end_date));
}

const ils = (n) => `₪${(n || 0).toLocaleString('he-IL', { maximumFractionDigits: 0 })}`;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dayNumber = (start, date) => Math.round((Date.parse(date) - Date.parse(start)) / 86400000) + 1;

function tripSummary(trip, expenses, date) {
  const tripExpenses = expenses.filter((e) => e.trip_id === trip.id);
  const today = tripExpenses.filter((e) => e.date === date);
  const total = tripExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const todayTotal = today.reduce((s, e) => s + (e.amount || 0), 0);
  const days = trip.start_date && trip.end_date ? dayNumber(trip.start_date, trip.end_date) : null;
  const day = trip.start_date ? dayNumber(trip.start_date, date) : null;
  return { trip, todayCount: today.length, todayTotal, total, budget: trip.budget || 0, day, days };
}

function row(label, value, color = '#0A1F44') {
  return `<tr><td style="padding:6px 0;color:#50535A;font-size:13px;">${label}</td><td style="padding:6px 0;color:${color};font-size:14px;font-weight:bold;text-align:left;">${value}</td></tr>`;
}

function tripBlock(s) {
  const remaining = s.budget - s.total;
  return `<div style="background:#FFFFFF;border-radius:14px;padding:18px 20px;margin:0 0 14px;border:1px solid #E8E8EA;">
    <div style="font-size:17px;font-weight:bold;color:#33363D;">${esc(s.trip.name)}</div>
    ${s.trip.destination ? `<div style="font-size:12px;color:#8A8C92;margin-top:2px;">${esc(s.trip.destination)}</div>` : ''}
    ${s.day && s.days ? `<div style="font-size:12px;color:#C9A45B;margin-top:6px;">יום ${s.day} מתוך ${s.days}</div>` : ''}
    <table style="width:100%;border-collapse:collapse;margin-top:10px;border-top:1px solid #F3F3F4;">
      ${row('הוצאות היום', s.todayCount ? `${ils(s.todayTotal)} (${s.todayCount})` : 'עדיין לא הוזנו הוצאות', s.todayCount ? '#0A1F44' : '#C9A45B')}
      ${row('סה״כ בטיול', ils(s.total))}
      ${s.budget > 0 ? row('נותר מהתקציב', ils(remaining), remaining < 0 ? '#c0392b' : '#0A1F44') : ''}
    </table>
  </div>`;
}

export function buildEmail({ trips, expenses, date, appUrl, test = false }) {
  const summaries = trips.map((t) => tripSummary(t, expenses, date));
  const noTrips = summaries.length === 0;
  const subject = `${test ? '[בדיקה] ' : ''}TripFlow · תזכורת להזנת הוצאות${summaries.length === 1 ? ` — ${summaries[0].trip.name}` : ''}`;
  const link = `${appUrl.replace(/\/$/, '')}/plan`;
  const html = `<!doctype html><html lang="he" dir="rtl"><body style="margin:0;background:#F3F3F4;font-family:Arial,Helvetica,sans-serif;direction:rtl;">
  <div style="max-width:480px;margin:0 auto;padding:24px 16px;">
    <div style="background:#0A1F44;border-radius:14px 14px 0 0;padding:18px 20px;border-bottom:2px solid #C9A45B;">
      <div style="color:#FFFFFF;font-size:18px;font-weight:bold;">TripFlow</div>
      <div style="color:#C9A45B;font-size:12px;margin-top:2px;">תזכורת יומית · ${date.split('-').reverse().join('/')}</div>
    </div>
    <div style="padding:18px 0 4px;">
      <p style="margin:0 0 14px;color:#33363D;font-size:14px;line-height:1.6;">
        ${noTrips ? 'זהו מייל בדיקה. אין היום טיול פעיל, לכן תזכורות רגילות לא יישלחו היום.' : 'זה הזמן לעדכן את ההוצאות של היום, כדי שהדוח יישאר מדויק.'}
      </p>
      ${summaries.map(tripBlock).join('')}
      <div style="text-align:center;margin:18px 0 6px;">
        <a href="${esc(link)}" style="display:inline-block;background:#0A1F44;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:12px;">הוסף הוצאה</a>
      </div>
      <p style="margin:18px 0 0;color:#A0A2A8;font-size:11px;text-align:center;line-height:1.6;">
        אפשר לשנות את שעת התזכורת או לכבות אותה בטאב "הגדרות" באפליקציה.
      </p>
    </div>
  </div></body></html>`;
  const text = [
    `TripFlow — תזכורת יומית (${date})`,
    noTrips ? 'מייל בדיקה: אין היום טיול פעיל.' : 'זה הזמן לעדכן את ההוצאות של היום.',
    ...summaries.map((s) => `${s.trip.name}: היום ${ils(s.todayTotal)}, סה"כ ${ils(s.total)}${s.budget > 0 ? `, נותר ${ils(s.budget - s.total)}` : ''}`),
    link,
  ].join('\n');
  return { subject, html, text };
}
