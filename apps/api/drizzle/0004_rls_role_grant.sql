-- Allow the connecting DB role to assume `authenticated` for Neon RLS.
-- Without this, SET LOCAL ROLE authenticated fails and (before the savepoint
-- fix) aborted every admin transaction.
DO $$
BEGIN
  EXECUTE format('GRANT authenticated TO %I', current_user);
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Could not GRANT authenticated TO % (insufficient privilege)', current_user;
  WHEN undefined_object THEN
    RAISE NOTICE 'Role authenticated or % missing', current_user;
  WHEN OTHERS THEN
    RAISE NOTICE 'GRANT authenticated TO % skipped: %', current_user, SQLERRM;
END $$;
