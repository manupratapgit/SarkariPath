-- Migrate last_date from text to timestamptz
-- Run in Supabase SQL editor. Rows with unparseable dates will be set to NULL.

alter table public.jobs
  alter column last_date type timestamptz
  using (
    case
      when last_date is null or trim(last_date) = '' then null
      when last_date ~* '^\d{2}-\d{2}-\d{4}$' then
        to_timestamp(last_date, 'DD-MM-YYYY')
      when last_date ~* '^\d{4}-\d{2}-\d{2}' then
        last_date::timestamptz
      else
        null
    end
  );
