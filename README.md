# TripFlow

Trip expense manager (Hebrew, RTL, mobile-first). Rebuild of the Base44 app at https://trip-flow-pro-app.base44.app with the same structure and design, running on Firebase + Netlify.

## Stack

React 18 + Vite, Tailwind CSS, TanStack Query, Radix UI (select, alert dialog), lucide icons, date-fns. Data in Firebase Firestore.

```
src/
  api/          firebase.js (config), base44Client.js (Base44-style entities API over Firestore)
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
- Daily email reminder: settings are saved, sending is not implemented yet.

## Data

Firebase project `tripflow-db`. Collections: `trips`, `expenses`, `reminder_settings`. Images are compressed and stored inline in the expense.

`firestore.rules` holds the access rules. Paste into Firebase console → Firestore → Rules → Publish whenever it changes.

## Develop

```
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs dist/
```

## Deploy

Netlify builds from `netlify.toml` (`npm run build`, publish `dist`). Every push to `main` redeploys.
