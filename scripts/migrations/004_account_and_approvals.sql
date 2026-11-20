-- Account settings for users, and admin approval for contractors that departments create.
-- Run once in the Supabase SQL editor (after 003). Safe to re-run.

-- Account page: optional phone and an email preference for ticket updates.
alter table public.users add column if not exists phone text;
alter table public.users add column if not exists notify_updates boolean not null default true;

-- Contractors are now proposed by a department and approved by the admin.
-- Existing contractors (from the seed script) stay approved.
alter table contractors add column if not exists status text not null default 'approved';
alter table contractors drop constraint if exists contractors_status_check;
alter table contractors add constraint contractors_status_check
  check (status in ('pending', 'approved', 'rejected'));
alter table contractors add column if not exists requested_by int references public.users(id) on delete set null;
alter table contractors add column if not exists requested_department text;
alter table contractors add column if not exists reviewed_at timestamptz;
alter table contractors add column if not exists review_note text;
