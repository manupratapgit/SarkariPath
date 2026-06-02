-- Run this in the Supabase SQL editor to create the jobs table

create table if not exists public.jobs (
  id              uuid primary key,
  title           text not null,
  organization    text not null,
  category        text not null default 'General',
  exam_type       text not null,
  vacancies       integer,
  eligibility     text,
  last_date       text,
  ai_summary      text,
  location        text not null default 'All India',
  status          text not null default 'Open'
                    check (status in ('Open','Closing Soon','Result Out','Admit Card Out')),
  notification_url text,
  apply_url        text,
  age_limit        text,
  source           text,
  created_at       timestamptz default now()
);

-- Allow public read access
alter table public.jobs enable row level security;

create policy "Public read" on public.jobs
  for select using (true);
