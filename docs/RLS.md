# RLS

Every content table has `owner_id` and Neon-style policies:

- `ENABLE ROW LEVEL SECURITY`
- SELECT / INSERT / UPDATE / DELETE for role `authenticated`
- Predicate: `(select auth.user_id()) = owner_id`

## `auth.user_id()`

Defined in `apps/api/drizzle/0000_init.sql`. Reads JWT claim `sub` from:

- `request.jwt.claim.sub`, or
- `request.jwt.claims` JSON `sub`

## Application mapping

Admin handlers call `withOwnerRls(db, env.OWNER_ID, fn)` (via `withOwner` middleware) which, inside a transaction:

1. `set_config('request.jwt.claims', …)`
2. `set_config('request.jwt.claim.sub', ownerId, true)`
3. `SET LOCAL ROLE authenticated` (best-effort)

Public reads use the Neon owner connection (bypasses RLS) and **must** filter `published = true` in application code for case studies.

## Verification

```bash
npm run db:rls:check
npm run test:rls
```
