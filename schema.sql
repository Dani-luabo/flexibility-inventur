-- ─── Flexibility Inventur — Supabase Schema ──────────────────────────────────
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query)

create table if not exists products (
  id               text primary key,           -- SKU, e.g. "SKU-001"
  name             text        not null,
  asin             text        not null default '',
  kategorie        text        not null default '',
  lager            integer     not null default 0,
  amazon_fba       integer     not null default 0,
  amazon_reserved  integer     not null default 0,
  bestelleinheit   integer     not null default 1,
  lieferzeit_tage  integer     not null default 14,
  ankunft          date,
  ankunft_menge    integer     not null default 0,
  min_bestand      integer     not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Auto-update updated_at on every row change
create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on products;
create trigger set_updated_at
  before update on products
  for each row execute function handle_updated_at();

-- Row Level Security (open policy — add auth checks when ready)
alter table products enable row level security;

drop policy if exists "public_all" on products;
create policy "public_all" on products
  for all using (true) with check (true);

-- ─── Seed data (the 6 example products) ──────────────────────────────────────
insert into products
  (id, name, asin, kategorie, lager, amazon_fba, amazon_reserved,
   bestelleinheit, lieferzeit_tage, ankunft, ankunft_menge, min_bestand)
values
  ('SKU-001', 'Bluetooth Kopfhörer Pro', 'B08XYZ1234', 'Elektronik', 142, 38, 5,  50,  14, '2026-06-18', 100, 30),
  ('SKU-002', 'USB-C Ladekabel 2m',       'B09ABC5678', 'Zubehör',    8,   12, 2,  200, 21, '2026-06-25', 200, 50),
  ('SKU-003', 'Laptop Ständer Aluminium', 'B07DEF9012', 'Büro',       63,  0,  0,  25,  10, null,         0,   20),
  ('SKU-004', 'Mechanische Tastatur',     'B06GHI3456', 'Elektronik', 0,   3,  3,  10,  30, '2026-07-01', 20,  5),
  ('SKU-005', 'Schreibtisch-Organizer',   'B05JKL7890', 'Büro',       210, 85, 10, 100, 7,  null,         0,   40),
  ('SKU-006', 'Webcam Full HD',           'B04MNO2345', 'Elektronik', 17,  22, 8,  30,  18, '2026-06-20', 30,  15)
on conflict (id) do nothing;
