# AGENTS.md — Baseer Portfolio

Single source of truth for coding agents working on Baseer Portfolio.

## What this is

Marketing CV / portfolio site for Baseer. Single-owner CMS (no login — fixed `OWNER_ID`), own Neon DB, one Cloudflare Worker deploy (Static Assets + Hono API). No billing, no multi-tenant licensing.

**Domains (zone `baseer.co.uk`):** `baseer.co.uk` / `staging.baseer.co.uk` — SPA and `/api` on the same origin. Single-level subdomains on the zone (free Universal SSL wildcard). No Cloudflare Pages.

## Stack

- Frontend: React 19 + Vite SPA, Tailwind v4
- API: Hono mounted under `/api` on the same Worker
- DB: Neon Postgres via Hyperdrive, Drizzle ORM, RLS on every app table
- Auth: none — fixed `OWNER_ID` env for all admin writes
- Files: Cloudflare R2 (presigned URLs / Worker proxy)
- Monorepo: npm workspaces + Turborepo (never pnpm/yarn)
- Tests: Vitest (unit/RLS), Playwright (e2e)

## Hard rules

1. TypeScript strict throughout.
2. All DB access through Drizzle — never raw SQL in route handlers.
3. All file access through `apps/api/src/lib/r2.ts` — never construct bucket URLs inline.
4. Every content table gets RLS (`owner_id = auth.user_id()`) before any route touches it.
5. Hyperdrive: pool/reuse connections; do not open a new client per request.
6. No login — all admin API routes use `OWNER_ID` + RLS claim mapping.
7. One Worker only — no Pages, no separate API Worker / `api*.baseer.co.uk`.
8. Free tier only: no Cloudflare Containers/Queues; no nested subdomains needing Advanced Certificate Manager.
9. Factories per request: `createDb(env)`, `createApp(env)` — no module-level env singletons.
10. npm scripts use `<domain>:<action>`; bare names only for top-level aggregates.
11. Keep `.cursor/rules` as the canonical rules; run `npm run rules:sync` after edits.
12. Markdown rendered with sanitisation on render.
13. Drag-reorder persists a full `display_order` resequence on drop.

## Layout

```
apps/web          React + Vite SPA + Worker entry (only deployable)
apps/api          Hono app library (schema, routes) — not deployed alone
packages/shared   Shared Zod schemas / types
docs/             ARCHITECTURE, RLS, DEPLOYMENT
```

## Environments

| | Staging | Production |
|---|---|---|
| Branch | `develop` | `main` (tag `v*`) |
| Neon | `staging` | `main` |
| R2 | `baseer-portfolio-staging` | `baseer-portfolio` |
| Site | `staging.baseer.co.uk` | `baseer.co.uk` |
| API | `/api` (same origin) | `/api` (same origin) |
| Worker | `baseer-portfolio-staging` | `baseer-portfolio` |

## Local setup

```bash
npm install
npm run setup          # .env, apps/web/.dev.vars, apps/web/.env, rules sync
npm run db:migrate
npm run db:seed
npm run dev
```

## Verification

```bash
npm run check
npm test
npm run test:e2e
npm run doctor
npm run ship-it
```
