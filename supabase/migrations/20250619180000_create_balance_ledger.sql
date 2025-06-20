-- Create balance_ledger table for per-labour running balance tracking
create table if not exists balance_ledger (
  id uuid primary key default gen_random_uuid(),
  labour_id uuid references labour_master(id) on delete cascade,
  user_id uuid not null, -- Add user_id for multi-user isolation
  type text check (type in ('entry', 'payment')) not null,
  amount numeric not null,
  date timestamp with time zone not null default now(),
  balance_after numeric not null,
  notes text
);

create index if not exists idx_balance_ledger_labour_id on balance_ledger(labour_id);
create index if not exists idx_balance_ledger_user_id on balance_ledger(user_id);
