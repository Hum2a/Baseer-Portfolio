# Architecture

Baseer Portfolio is a single-tenant marketing CV site: React SPA + Hono API on **one Cloudflare Worker** with Static Assets.

## Request flow

1. Browser hits `baseer.co.uk` (or staging).
2. Worker entry (`apps/web/src/worker.ts`):
   - `/api/*` → Hono app from `@baseer-portfolio/api`
   - `/sitemap.xml` → generated from published case studies
   - HTML navigations → load `index.html` from assets, inject OG/meta tags, short Cache API TTL
   - Everything else → Static Assets (SPA `not_found_handling`)
3. SPA calls same-origin `/api/...`. Admin writes use fixed `OWNER_ID` (no login).

## Packages

| Package | Role |
|---|---|
| `apps/web` | Only deployable Worker + Vite SPA |
| `apps/api` | Hono routes, Drizzle schema, R2 helpers (library) |
| `packages/shared` | Zod schemas / shared constants |

## Data

Neon Postgres via Hyperdrive (or `DATABASE_URL` locally). Content tables use Neon `crudPolicy` RLS keyed to `OWNER_ID` via `withOwnerRls`. Public JSON routes filter `published` in handlers; they do not relax RLS.

## Auth

None. There is no login, session, or Better Auth. Admin CMS at `/admin` is open; mutations run as `OWNER_ID` from Worker env (same pattern as Docket).

## Media

Cloudflare R2 binding `MEDIA`. Uploads via validated presigned PUT (or Worker proxy when R2 S3 credentials are absent).
