# TripFlow

Trip expense manager (Hebrew, RTL, mobile-first). running on Firebase + Netlify.

## Stack

React 18 + Vite, Tailwind CSS, TanStack Query, Radix UI (select, alert dialog), lucide icons, date-fns. Data in Firebase Firestore.

## Data

Firebase project `tripflow-2026`. `firestore.rules` holds the access rules.

## Deploy

Netlify builds from `netlify.toml` (`npm run build`, publish `dist`). Every push to `main` redeploys.
