// Scheduled every 15 minutes. Sends the daily reminder email once a day at the time set in Settings,
// only on days inside an active trip.
import { listCollection, updateFields } from '../lib/firestore-rest.mjs';
import { localNow, isDue, tripsActiveOn, buildEmail, DEFAULT_TZ } from '../lib/reminder.mjs';
import { sendMail } from '../lib/mailer.mjs';

export default async () => {
  const local = localNow(new Date(), process.env.REMINDER_TZ || DEFAULT_TZ);
  const settingsList = await listCollection('reminder_settings');
  const due = settingsList.filter((s) => isDue(s, local));
  if (!due.length) return Response.json({ sent: 0, reason: 'not due', local });

  const trips = tripsActiveOn(await listCollection('trips'), local.date);
  if (!trips.length) return Response.json({ sent: 0, reason: 'no active trip today', local });

  const expenses = await listCollection('expenses');
  const email = buildEmail({ trips, expenses, date: local.date, appUrl: process.env.URL || 'https://tripflow-pro.netlify.app' });

  let sent = 0;
  for (const s of due) {
    await sendMail({ to: s.email, ...email });
    // Recorded only after a successful send, so a failure retries on the next run.
    await updateFields('reminder_settings', s.id, { last_sent_date: local.date });
    sent++;
  }
  console.log(`daily-reminder: sent ${sent} for ${local.date} ${local.hour}:${local.minute}`);
  return Response.json({ sent, local });
};

export const config = { schedule: '*/15 * * * *' };
