# TripFlow

Trip expense manager (Hebrew, RTL, mobile-first). A static site: no build step.

- `index.html` — the whole app (UI, logic, PDF export).
- `backend.js` — Firebase setup (Google sign-in + Firestore) behind the `claude.use('db' | 'assets' | 'downloads')` API the app expects.
- `firestore.rules` — who may read/write. Paste into Firebase console → Firestore → Rules → Publish whenever it changes.
- `netlify.toml` — Netlify deploy config.

## Firebase

Project `tripflow-db`. Data: collections `trips`, `expenses`, doc `settings/reminder`. Images are stored inline (compressed) in the expense doc.

To give someone access: add their Google email to `firestore.rules` and publish the rules.

When deploying to a new domain, add it in Firebase console → Authentication → Settings → Authorized domains, or Google sign-in fails.

## Run locally

Serve the folder over http (Google sign-in does not work from `file://`), e.g. `python -m http.server 8000`, then open http://localhost:8000.

## Deploy

Netlify is connected to this repo; every push to `main` redeploys.
