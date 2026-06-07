-- Tracked jobs table for authenticated users
-- Run in Supabase SQL editor

create table tracked_jobs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  job_id      uuid references jobs(id) on delete cascade not null,
  title       text not null,
  organization text not null,
  status      text not null default 'saved'
                check (status in ('saved', 'applied', 'admit-card', 'result')),
  last_date   timestamptz,
  notes       text default '',
  created_at  timestamptz default now(),
  unique (user_id, job_id)
);

alter table tracked_jobs enable row level security;

create policy "Users manage own tracked jobs"
  on tracked_jobs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
