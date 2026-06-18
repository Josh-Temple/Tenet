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
