-- User profiles table (extends Supabase auth.users)
-- Run in Supabase SQL editor: https://supabase.com/dashboard/project/impjnmmwjrvhlrrtkomh/sql/new

create table profiles (
  id uuid references auth.users(id) primary key,
  full_name text,
  phone text,
  date_of_birth date,
  age integer,
  gender text,
  state text,
  city text,
  highest_qualification text,
  field_of_study text,
  category text,
  preferred_exams text[],
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Row Level Security
alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);
