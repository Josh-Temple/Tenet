# Tenet

Tenet is a personal trade-recording and review app. It focuses on trade planning, rule checks, post-trade review, and daily journals so that traders can review decisions and rule adherence, not only profit and loss.

## App overview

Tenet currently supports:

- A home dashboard with today's status, focus rules, draft/resume links, and recent trade records.
- Trade planning and recording, including instrument selection from a local master, planned entry, stop loss, take profit, scenario notes, and entry checklist items.
- Trade detail and review flow for updating trade status, recording actual entry/exit prices, realized R, and rule violations.
- Rule management, including initial rules, pinned rules, and up to three focus rules for the day.
- Trade history with status filters and CSV/JSON trade-record exports.
- Basic analysis metrics for logged trades, review rate, rule compliance, skipped setups, total R, and average R.
- Daily journal list and daily journal detail pages for pre-market planning and post-session reflection.

Tenet is intentionally local-first. Its goal is to help review judgment quality, scenario discipline, and rule adherence in addition to outcome metrics.

## Technology stack

This repository currently uses:

- React
- TypeScript
- Vite
- React Router (`BrowserRouter`)
- Dexie
- IndexedDB
- Tailwind CSS
- dexie-react-hooks
- date-fns
- lucide-react
- Vitest

Version numbers are managed in `package.json` and `package-lock.json`.

## Local development

```bash
npm install
npm run dev
```

The Vite dev server is configured to listen on port `3000` and host `0.0.0.0`.

## Checks, build, and tests

```bash
npm run lint
npm run build
npm test
```

- `npm run lint` runs TypeScript with `tsc --noEmit`.
- `npm run build` creates the production build in `dist`.
- `npm test` runs Vitest once with `vitest run`.

## Vercel deployment

Import the GitHub repository into Vercel with these settings:

- Framework Preset: `Vite`
- Root Directory: repository root
- Install Command: standard npm install
- Build Command: `npm run build`
- Output Directory: `dist`

This app uses React Router with `BrowserRouter`. The repository includes `vercel.json` so direct access or reloads for SPA routes such as `/history`, `/analysis`, `/journals`, `/journal/:dateParam`, and `/detail/:id` are rewritten to `/index.html` and then handled by React Router.

Do not switch this app to `HashRouter` for Vercel deployment.

## IndexedDB data notes

Tenet stores current app data in the browser's IndexedDB via Dexie.

Important limitations:

- Data is stored in the current browser only.
- Data is not synced to a server or cloud database.
- Data is not shared across different devices, browsers, or domains.
- Vercel Production URLs and Preview URLs use separate browser storage areas.
- Deleting browser site data may delete Tenet records.
- For real records, use the stable Vercel Production URL instead of Preview URLs.
- Trade records can be exported from the Trade History screen as CSV for spreadsheets or JSON for structured backups.

The current IndexedDB database name, table names, schema versions, migrations, and initial rule loading are part of the existing local data model and should not be changed for deployment-only work.

## Environment variables and secrets

Tenet currently does not require environment variables for local development or Vercel deployment.

If API integrations are added in the future, do not store secrets such as API keys in client-side `VITE_` environment variables. Variables prefixed with `VITE_` can be included in the browser bundle. Secrets should be handled on a server side boundary such as Vercel Functions.

## Current implementation status

Implemented:

- Local IndexedDB persistence with Dexie.
- Minimal instrument master initialization for the default XAUUSD instrument.
- Initial trading rule setup and migration tracking.
- Trade draft, plan confirmation, entry, close, review, skip, and cancel status flows.
- Rule list, create/edit, pin, and focus-today controls.
- Trade history list, status filtering, and trade-record export downloads.
- Basic analysis cards.
- Daily journal list and detail pages with pre-market and review fields.
- Vercel SPA rewrite configuration for direct route access.

Not currently implemented:

- Cloud sync or server-side storage.
- Authentication.
- Gemini API or other AI integration.
- Vercel Functions.
- Import/restore from exported files.
- PWA, service worker, notifications, or offline install support.
- Advanced chart/image storage.
