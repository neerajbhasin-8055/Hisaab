# Hisaab

Private personal and small-business finance tracker. React + TypeScript + Vite PWA. All records stay on the device (IndexedDB via Dexie). No backend, analytics or external APIs.

## Run
1. Install Node.js 18+ from nodejs.org.
2. `npm install`
3. `npm run dev` (development) or `npm run build && npm run preview` (production build with offline support)

## Deploy
`npm run build` creates `dist/`. Upload that folder to any HTTPS static host (Netlify Drop, Cloudflare Pages, GitHub Pages). Open the URL on Android in Chrome, then use the in-app Install banner or Chrome menu > Add to Home screen. Install and offline mode need HTTPS.

## Move data from the earlier single-page Hisaab
Browsers keep each website’s data separate, so it cannot be copied automatically. In the old page tap "Download full backup", then in this app go to Settings > Restore or import a backup. This app uses its own database (`hisaab-app`) and never touches any other.

## Notes
- Data is not encrypted. Clearing site data or losing the phone erases it. Back up regularly.
- "Print or save PDF" uses the browser print dialog. Gmail drafts cannot attach files; attach the saved PDF manually. Nothing is sent by the app.
- Not included yet: accounts/transfers, custom categories, per-category budgets, app lock, automated tests.
