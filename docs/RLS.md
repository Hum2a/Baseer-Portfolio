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

Admin handlers call `withOwnerRls(db, session.user.id, fn)` (via `requireAdmin` middleware) which, inside a transaction:

1. `set_config('request.jwt.claims', …)`
2. `set_config('request.jwt.claim.sub', userId, true)`
3. `SET LOCAL ROLE authenticated` (best-effort)

The Better Auth user id must equal content `owner_id` (seed uses `OWNER_ID`, default `seed-user-baseer`).

Public reads use the Neon owner connection (bypasses RLS) and **must** filter `published = true` in application code for case studies.

`analytics_events` has no content RLS — public beacon inserts only; admin summary is session-gated in the API.

## Verification

```bash
npm run db:rls:check
npm run test:rls
```
