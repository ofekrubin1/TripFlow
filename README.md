# TripFlow

Trip expense manager (Hebrew, RTL, mobile-first). Rebuild of the Base44 app at https://trip-flow-pro-app.base44.app with the same structure and design, running on Firebase + Netlify.

## Stack

React 18 + Vite, Tailwind CSS, TanStack Query, Radix UI (select, alert dialog), lucide icons, date-fns. Data in Firebase Firestore.

```
src/
  api/          client.js (data layer: api.entities.Trip/Expense/ReminderSettings over Firestore), firebase.js, firebaseConfig.js
  components/
    ui/         PremiumCard, PremiumButton, PremiumInput, select, alert-dialog
    layout/     Layout, BottomNav
    dashboard/  TripSummaryCard, CategoryItem, ExpenseItem, EditExpenseModal, ExportPDFButton
    plan/       AddExpenseForm, TripCalendar
    trips/      TripCard, NewTripForm, CurrencyRatesEditor, DateInput
    settings/   TimeWheel
  hooks/        useCustomCategories
  lib/          currency, utils
  pages/        Dashboard (/), TripPlan (/plan), PastTrips (/trips), SettingsPage (/settings)
```

## Differences from the Base44 version

- Exchange rates and custom categories are stored on the trip in the database (Base44 kept them in each browser, so phones and computers disagreed).
- Live sync: changes on one device show up on the others without refreshing.
- Trip delete, reset, rate recalculation and duplicate use batched writes.
- Works offline from the local cache.
- No login, same as Base44 (`public_without_login`): anyone with the link shares the same data.

## Data

Firebase project `tripflow-2026`. Collections: `trips`, `expenses`, `reminder_settings`. Images are compressed and stored inline in the expense.

`firestore.rules` holds the access rules. Paste into Firebase console → Firestore → Rules → Publish whenever it changes.

## Daily email reminder

`netlify/functions/daily-reminder.mjs` runs every 15 minutes. Once a day, at the time set in Settings (Israel time), it emails the saved address a summary of today's expenses for each active trip, only on days inside an active trip's dates. `netlify/functions/send-test-reminder.mjs` backs the "שלח מייל בדיקה" button.

Email is sent through Gmail. Netlify environment variables (Project configuration → Environment variables):

- `GMAIL_USER`: the Gmail address that sends the reminders
- `GMAIL_APP_PASSWORD`: a Google app password for that account (myaccount.google.com/apppasswords)
- `REMINDER_TZ` (optional): time zone, default `Asia/Jerusalem`

## Develop

```
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs dist/
```

## Deploy

Netlify builds from `netlify.toml` (`npm run build`, publish `dist`). Every push to `main` redeploys.
