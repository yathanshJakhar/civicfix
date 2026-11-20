-- Email-code login, authority/department mapping, contractors and assignment.
-- Run once against the database (Supabase SQL editor or psql). Safe to re-run.

create table if not exists email_otps (
  id          serial primary key,
  email       text not null,
  portal      text not null,
  code_hash   text not null,
  expires_at  timestamptz not null,
  attempts    int not null default 0,
  consumed_at timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists email_otps_email_idx on email_otps (email, created_at desc);

-- Which email belongs to which department. department null = admin (sees everything).
create table if not exists authority_emails (
  email      text primary key,
  department text
);

create table if not exists contractors (
  id          serial primary key,
  user_id     int unique references users(id) on delete cascade,
  email       text not null unique,
  name        text not null,
  phone       text,
  departments text[] not null default '{}',
  lat         double precision not null,
  lng         double precision not null,
  radius_km   double precision not null default 10
);

alter table issues add column if not exists department text;
alter table issues add column if not exists assigned_contractor_id int references contractors(id) on delete set null;
alter table issues add column if not exists assigned_at timestamptz;
alter table issues add column if not exists progress_note text;
create index if not exists issues_department_idx on issues (department);
create index if not exists issues_contractor_idx on issues (assigned_contractor_id);

alter table status_history add column if not exists changed_by int references users(id) on delete set null;
alter table status_history add column if not exists note text;

-- Passwords are no longer used.
alter table users alter column password_hash drop not null;

-- Contractors sign in as users too.
alter table users drop constraint if exists users_role_check;
alter table users add constraint users_role_check
  check (role in ('citizen', 'authority', 'admin', 'contractor'));

-- Backfill the department of existing tickets from their category.
update issues set department = case category
  when 'Pothole' then 'Roads (MCD/PWD)'
  when 'Garbage' then 'Sanitation (MCD)'
  when 'Water Leakage' then 'Delhi Jal Board'
  when 'Sewage' then 'Delhi Jal Board'
  when 'Streetlight' then 'Street Lighting'
  when 'Traffic' then 'Traffic Police'
  else 'General Services'
end
where department is null;

insert into authority_emails (email, department) values
  ('admin@civicfix.in',      null),
  ('roads@civicfix.in',      'Roads (MCD/PWD)'),
  ('sanitation@civicfix.in', 'Sanitation (MCD)'),
  ('djb@civicfix.in',        'Delhi Jal Board'),
  ('lights@civicfix.in',     'Street Lighting'),
  ('traffic@civicfix.in',    'Traffic Police'),
  ('general@civicfix.in',    'General Services')
on conflict (email) do update set department = excluded.department;
