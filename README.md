# Baseer Portfolio

Marketing CV site for Baseer — case studies across automotive, charity, and education, with an admin CMS (Better Auth login) and first-party analytics.

**Stack:** React 19 + Vite, Hono, Neon + Drizzle (RLS), Better Auth, R2, single Cloudflare Worker (Static Assets + `/api`).

See [AGENTS.md](./AGENTS.md) and [docs/](./docs/).

## Quick start

```bash
npm install
npm run setup
# set DATABASE_URL in .env, then:
npm run setup
npm run db:migrate
npm run db:seed
npm run dev
```

In another terminal (API + Worker locally):

```bash
npm run dev:worker
```

Admin CMS: `/admin/login` (seed credentials from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`).

## Sync secrets to Cloudflare

```bash
cp .env.cloudflare.example .env.cloudflare   # CLOUDFLARE_API_TOKEN
cp .env.staging.example .env.staging         # DATABASE_URL + BETTER_AUTH_SECRET
npm run secrets:show:staging
npm run secrets:sync:staging
```

Production: `.env.production` + `npm run secrets:sync:production`.

Remember to run `db:migrate` / `db:seed` against each Neon branch before relying on login or analytics.
