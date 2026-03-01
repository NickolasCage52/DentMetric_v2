-- Users table for DentMetric account module (ТЗ-3)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint unique not null,
  telegram_username text,
  name text not null default '',
  phone text not null default '',
  phone_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_telegram_user_id_idx on public.users(telegram_user_id);

-- RLS: users can read/update own row via service role
-- For Edge Functions using service_role_key, RLS is bypassed
alter table public.users enable row level security;
