# Deployment

Single Worker deploy from `apps/web`. No Cloudflare Pages.

## Environments

| | Staging | Production |
|---|---|---|
| Git | `develop` | tag `v*` |
| Worker | `baseer-portfolio-staging` | `baseer-portfolio` |
| Domain | `staging.baseer.co.uk` | `baseer.co.uk` |
| Neon | `staging` branch | `main` branch |
| R2 | `baseer-portfolio-staging` | `baseer-portfolio` |

## One-time provision

1. Neon project + `staging` / `main` branches; create Hyperdrive configs pointing at each.
2. R2 buckets `baseer-portfolio-staging` and `baseer-portfolio`.
3. Cloudflare DNS already on `baseer.co.uk` — attach custom domains via `wrangler.toml` routes.
4. Secrets (per env) — sync from a local env file:

```bash
# Cloudflare API creds (once)
cp .env.cloudflare.example .env.cloudflare
# fill CLOUDFLARE_API_TOKEN (+ ACCOUNT_ID)

# Staging Neon (+ auth + optional R2) secrets
cp .env.staging.example .env.staging
# fill DATABASE_URL and BETTER_AUTH_SECRET for the Neon staging branch

npm run secrets:show:staging      # inspect what will upload
npm run secrets:sync:staging      # wrangler secret bulk → staging Worker

# Production
cp .env.production.example .env.production
npm run secrets:sync:production
```

Source file order: `.env.<env>` → `apps/web/.dev.vars` → `.env`.  
Synced keys: `DATABASE_URL`, `BETTER_AUTH_SECRET` (required), optional `RESEND_API_KEY`, `R2_*`.  
`APP_URL` / `OWNER_ID` / `ADMIN_EMAIL` stay in `wrangler.toml` `[vars]` — not uploaded as secrets.

5. Add Hyperdrive binding ids to `wrangler.toml` under each env when ready.
6. Migrate + seed against each Neon branch (includes Better Auth tables + analytics + admin credential):

```bash
DATABASE_URL=... ADMIN_PASSWORD=... BETTER_AUTH_SECRET=... npm run db:migrate
DATABASE_URL=... ADMIN_PASSWORD=... npm run db:seed
```

Migrations: `0000_init.sql`, `0001_better_auth.sql`, `0002_analytics.sql`.

After first seed, store `ADMIN_PASSWORD` in a password manager — re-running seed updates the credential hash from env.

## CI/CD

- `.github/workflows/ci.yml` — check, test, build
- `.github/workflows/deploy-staging.yml` — push `develop`
- `.github/workflows/deploy-production.yml` — tag `v*`

Required GitHub secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

## Manual deploy

```bash
# After migrate/seed + secrets sync for that env:
npm run build
npm run deploy:staging
# or
npm run deploy:production
```
