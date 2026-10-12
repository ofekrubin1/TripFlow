# TripFlow

Trip expense manager (Hebrew, RTL, mobile-first). A static site: no build step.

- `index.html` — the whole app (UI, logic, PDF export).
- `local-backend.js` — provides the `claude.use('db' | 'assets' | 'downloads')` API the app expects, backed by the browser's `localStorage`. Data is stored per browser/device.

## Run locally

Open `index.html` in a browser, or serve the folder (e.g. `npx serve .`).

## Deploy

Any push to `main` redeploys automatically once the repo is connected.

**Netlify:** Add new site → Import an existing project → GitHub → `TripFlow`. Build command: *(empty)*. Publish directory: `.`

**Vercel:** Add New → Project → import `TripFlow`. Framework preset: *Other*. Build command: *(empty)*. Output directory: `.`
