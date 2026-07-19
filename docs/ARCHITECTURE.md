# Architecture

Baseer Portfolio is a single-tenant marketing CV site: React SPA + Hono API on **one Cloudflare Worker** with Static Assets.

## Request flow

1. Browser hits `baseer.co.uk` (or staging).
2. Worker entry (`apps/web/src/worker.ts`):
   - `/api/*` → Hono app from `@baseer-portfolio/api`
   - `/sitemap.xml` → generated from published case studies
   - HTML navigations → load `index.html` from assets, inject OG/meta tags, short Cache API TTL
   - Everything else → Static Assets (SPA `not_found_handling`)
3. SPA calls same-origin `/api/...`. Public routes are open; admin mutations require a Better Auth session cookie. Public pages POST lightweight beacons to `/api/analytics/beacon`.

## Packages

| Package | Role |
|---|---|
| `apps/web` | Only deployable Worker + Vite SPA |
| `apps/api` | Hono routes, Drizzle schema, R2 helpers (library) |
| `packages/shared` | Zod schemas / shared constants |

## Data

Neon Postgres via Hyperdrive (or `DATABASE_URL` locally). Content tables use Neon `crudPolicy` RLS keyed to the session user id via `withOwnerRls`. Public JSON routes filter `published` in handlers; they do not relax RLS.

`analytics_events` is append-only first-party telemetry (no PII); not under content RLS.

## Auth

Better Auth (email/password) at `/api/auth`, same origin. Sign-up disabled. Single admin seeded with `OWNER_ID` / `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Admin SPA gated by `AdminRequire`; API admin routes use `requireAdmin` (optional `ADMIN_EMAIL` allowlist).

## Analytics

Client `trackPageView` on public route changes → `POST /api/analytics/beacon`. Admin summary at `GET /api/analytics/admin/summary?range=7d|30d|90d`.

## Headless CMS / page builder

Admin-owned site chrome and page composition (no third-party CMS):

- **`site_settings`** — brand, SEO, default theme (`defaultThemeId`), visitor theme toggle, nav/footer JSON, about bio, contact/CV
- **`sectors`** — slug/label/intro metadata for automotive/charity/education
- **`pages` + `page_blocks`** — ordered, toggleable blocks (`hero`, `spec_strip`, `sector_grid`, …) per page key (`home`, `about`, `contact`, `sector:{slug}`, `work`)
- Public SPA loads `/api/pages/public/:key` and renders via `BlockRenderer`; empty DB falls back to seeded defaults
- Theme: admin default applies when localStorage has no override; if `allowVisitorThemes` is false, public `ThemeSwitcher` is hidden and the site default is forced

Admin areas: Site, Navigation, Pages, Sectors (plus existing case studies / testimonials / skills / timeline / analytics).

## Media

Cloudflare R2 binding `MEDIA`. Uploads via validated presigned PUT (or Worker proxy when R2 S3 credentials are absent). Presign/proxy require an admin session.
