// "Send test email" button in Settings. Sends to the saved reminder address only, at most once a minute.
import { listCollection, updateFields } from '../lib/firestore-rest.mjs';
import { localNow, tripsActiveOn, buildEmail, DEFAULT_TZ } from '../lib/reminder.mjs';
import { sendMail } from '../lib/mailer.mjs';

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const [settings] = (await listCollection('reminder_settings')).sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''));
  if (!settings?.email) return Response.json({ ok: false, error: 'no_email' }, { status: 400 });
  if (settings.last_test_at && Date.now() - Date.parse(settings.last_test_at) < 60_000) {
    return Response.json({ ok: false, error: 'too_soon' }, { status: 429 });
  }

  const local = localNow(new Date(), process.env.REMINDER_TZ || DEFAULT_TZ);
  const [trips, expenses] = await Promise.all([listCollection('trips'), listCollection('expenses')]);
  const email = buildEmail({
    trips: tripsActiveOn(trips, local.date),
    expenses,
    date: local.date,
    appUrl: process.env.URL || 'https://tripflow-pro.netlify.app',
    test: true,
  });

  try {
    await updateFields('reminder_settings', settings.id, { last_test_at: new Date().toISOString() });
    await sendMail({ to: settings.email, ...email });
    return Response.json({ ok: true, to: settings.email });
  } catch (err) {
    console.error(err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
};

export const config = { path: '/api/send-test-reminder' };
