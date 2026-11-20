-- Allow the 'contractor' role on users. The original table only allowed citizen/authority/admin,
-- so contractor sign-in failed with "Could not sign you in". Safe to re-run.
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check
  check (role in ('citizen', 'authority', 'admin', 'contractor'));
