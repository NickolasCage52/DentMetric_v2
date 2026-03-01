-- Payments table (ТЗ-3)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount integer not null default 0,
  currency text not null default 'RUB',
  plan text not null,
  status text not null default 'pending',
  provider text not null default 'mock',
  external_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payments_user_id_idx on public.payments(user_id);
alter table public.payments enable row level security;
