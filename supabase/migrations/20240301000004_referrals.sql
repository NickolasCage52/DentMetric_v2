-- Реферальная программа
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.users(id) on delete cascade,
  referee_id uuid references public.users(id) on delete set null,
  code text unique not null,
  status text not null default 'pending',
  bonus_days integer not null default 14,
  created_at timestamptz not null default now(),
  activated_at timestamptz
);

create index if not exists referrals_referrer_id_idx on public.referrals(referrer_id);
create index if not exists referrals_code_idx on public.referrals(code);
alter table public.referrals enable row level security;
