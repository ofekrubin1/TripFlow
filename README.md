# TripFlow

Trip expense manager (Hebrew, RTL, mobile-first). Port of the Base44 app at https://trip-flow-pro-app.base44.app. A static site: no build step.

- `index.html` — the whole app: dashboard, add expense, trips, settings, PDF export.
- `backend.js` — Firebase Firestore behind the `claude.use('db' | 'assets' | 'downloads')` API the app expects.
- `firestore.rules` — database access rules. Paste into Firebase console → Firestore → Rules → Publish whenever it changes.
- `manifest.json`, `icons/` — lets phones install it to the home screen.
- `netlify.toml` — Netlify deploy config.

## Data

Firebase project `tripflow-db`. Collections `trips`, `expenses`, doc `settings/reminder`. Images are compressed and stored inline in the expense doc.

No login, same as the Base44 app (`public_without_login`): everyone with the link shares the same data.

## Run locally

Serve the folder over http, e.g. `python -m http.server 8000`, then open http://localhost:8000.

## Deploy

Netlify is connected to this repo; every push to `main` redeploys.

## Install on a phone

Open the site → iPhone: Share → Add to Home Screen. Android: menu → Install app.
