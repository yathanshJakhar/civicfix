-- Links each issue to the account that reported it (null = guest / reported before accounts existed).
alter table issues add column if not exists reported_by integer references users(id) on delete set null;
create index if not exists issues_reported_by_idx on issues(reported_by);
