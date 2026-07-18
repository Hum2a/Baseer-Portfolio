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

# Staging Neon (+ optional R2) secrets
cp .env.staging.example .env.staging
# fill DATABASE_URL for the Neon staging branch

npm run secrets:show:staging      # inspect what will upload
npm run secrets:sync:staging      # wrangler secret bulk → staging Worker

# Production
cp .env.production.example .env.production
npm run secrets:sync:production
```

Source file order: `.env.<env>` → `apps/web/.dev.vars` → `.env`.  
Synced keys: `DATABASE_URL` (required), optional `R2_*`.  
`APP_URL` / `OWNER_ID` stay in `wrangler.toml` `[vars]` — not uploaded as secrets.

5. Add Hyperdrive binding ids to `wrangler.toml` under each env when ready.
6. Migrate + seed against each Neon branch:

```bash
DATABASE_URL=... npm run db:migrate
DATABASE_URL=... npm run db:seed
```

## CI/CD

- `.github/workflows/ci.yml` — check, test, build
- `.github/workflows/deploy-staging.yml` — push `develop`
- `.github/workflows/deploy-production.yml` — tag `v*`

Required GitHub secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

## Manual deploy

```bash
npm run build
npm run deploy:staging
# or
npm run deploy:production
```
