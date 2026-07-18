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
4. Secrets (per env):

```bash
cd apps/web
npx wrangler secret put DATABASE_URL --env staging
# optional for S3-style presigns:
npx wrangler secret put R2_ACCOUNT_ID --env staging
npx wrangler secret put R2_ACCESS_KEY_ID --env staging
npx wrangler secret put R2_SECRET_ACCESS_KEY --env staging
npx wrangler secret put R2_BUCKET_NAME --env staging
```

`OWNER_ID` is set in `wrangler.toml` `[vars]` (default `seed-user-baseer`). Keep it aligned with the seeded user id.

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
