# Handoff

## Context

This branch prepares Tenet for safe, reproducible Vercel deployment without changing the app's UI design, routing model, trade-recording behavior, journal behavior, or IndexedDB schema.

## Changes made

- Added `vercel.json` with an SPA rewrite from all paths to `/index.html` for React Router `BrowserRouter` deep links.
- Added a root `.gitignore` covering Node/Vite outputs, local environment files, Vercel state, OS/editor files, and logs.
- Updated `index.html` to `lang="ja"` and added the requested Japanese description meta tag while preserving the title and viewport.
- Updated `README.md` to describe the current Tenet app, local commands, Vercel settings, IndexedDB limitations, and environment-variable cautions.
- Added `npm test` because Vitest and a test file exist.
- Removed unused direct dependencies after repository-wide usage checks: `@google/genai`, `express`, `dotenv`, `@types/express`, `tsx`, and direct `esbuild`.
- Regenerated `package-lock.json` through npm so the root package name is `tenet` and dependencies match `package.json`.
- Fixed existing TypeScript mismatches required for `npm run lint` to pass: daily journal focus-rule compliance string values, migration status literals, and legacy Japanese status literals in `TradeRepository`.

## Validation performed

Run these again before merging if anything changes:

```bash
npm install
npm run lint
npm run build
npm test
npm audit --omit=dev
```

Also verify Vercel direct route behavior after deployment for `/`, `/record`, `/rules`, `/history`, `/analysis`, `/journals`, `/journal/test-date`, and `/detail/test-id`.

## Notes for next session

- No IndexedDB database name, table name, Dexie schema version, migration structure, or initial rule loading logic was intentionally changed.
- No environment variables are currently required.
- No secrets were found in tracked project files during the repository scan.
- Vercel deployment itself was not performed in this environment.

## Instrument master update

- Added a minimal IndexedDB-backed instrument master with an initial active `XAUUSD` instrument.
- Trade entry now selects from active instruments sorted by `sortOrder`, while preserving legacy draft symbols as temporary options.
- `AppSettings.defaultSymbol` remains the compatibility setting and is initialized or repaired to `XAUUSD` when missing or invalid.
- Existing trade and draft `symbol` values are not rewritten during migration.

## Validation performed for instrument work

```bash
npm test -- --run
npm run lint
npm run build
```

Note: installing `fake-indexeddb` was attempted for repository-level IndexedDB tests, but the registry returned `403 Forbidden`, so tests cover the pure selection/normalization behavior without adding a new dependency.

## Core data integrity and mobile navigation stabilization

- Switched the app shell to dynamic viewport sizing and fixed bottom navigation with explicit safe-area padding, plus content bottom padding to avoid overlap on mobile browsers.
- Added `getLocalDateKey()` and replaced UTC ISO date-key generation for today journals, drafts, plan confirmation, and rule review logs.
- Added journal selection normalization so legacy `Normal`/`Bad`/`Appropriate`/legacy compliance values are migrated or sanitized to the English enum values.
- Added trade factory helpers for consistent draft/plan structure, checklist issue capture, memo placement, local date keys, symbol normalization, and `createdAt` preservation.
- Added migration version 5 cleanup for instrument initialization, journal normalization, and copying legacy `freeMemo` into `entryCheckList.stopLossLogicMemo` without deleting existing data.
- Added not-found/error handling for `/detail/:id` so missing trade IDs do not leave the page in a permanent loading state.
- Review save now uses `Not Evaluated` defaults instead of optimistic positive review values when no explicit review UI exists.
- Vercel Preview verification was not performed in this environment.

## Trade plan cancellation

- Added a `Cancel Plan` action on confirmed trade plans.
- Cancelling keeps the existing trade record and updates `Trade.status` to `Cancelled` instead of deleting data, preserving compatibility with history and future export/analysis work.
