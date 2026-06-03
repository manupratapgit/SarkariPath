-- Newsletter subscriptions table
-- Run this in the Supabase SQL editor

create table if not exists public.subscriptions (
  id           uuid primary key default gen_random_uuid(),
  email        text not null unique,
  name         text,
  preferences  jsonb not null default '[]'::jsonb,
  subscribed_at timestamptz not null default now(),
  is_active    boolean not null default true
);

-- Index for fast lookups by email
create index if not exists subscriptions_email_idx on public.subscriptions (email);

-- Index to quickly fetch active subscribers for digest
create index if not exists subscriptions_active_idx on public.subscriptions (is_active) where is_active = true;

-- Enable Row Level Security
alter table public.subscriptions enable row level security;

-- Service role can do everything (used by API routes with service key)
create policy "Service role full access" on public.subscriptions
  for all
  using (true)
  with check (true);
