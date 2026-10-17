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

## Premium UI refresh

This version refreshes the visual design while preserving the existing React/Vite/TypeScript structure, transaction flows, IndexedDB storage, report and backup logic, and PWA configuration. The redesign uses a warm ivory and forest-green palette, refined cards, a floating mobile navigation bar, clearer financial summaries, category icons, and responsive layouts. It intentionally uses system font stacks rather than remote fonts so the interface does not need an external font request to render.

To use this updated version, replace the old project files with the contents of this project (keep your original local financial data backed up first), then run:

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
```

The build could not be independently re-run in the editing environment because the npm registry dependencies were not fully available there. Please run the build locally before redeploying.
