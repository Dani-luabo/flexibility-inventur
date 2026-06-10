-- ─── Flexibility Inventur — Supabase Schema ──────────────────────────────────
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query)

-- ─── DISABLE RLS ON ALL TABLES (run this first if you get RLS errors) ────────
ALTER TABLE products      DISABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries    DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings      DISABLE ROW LEVEL SECURITY;

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
  meldebestand_fba integer     not null default 0,
  nachschub_menge  integer     not null default 0,
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

-- RLS is disabled — see top of file

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

-- ─── Deliveries table (Wareneingang) ─────────────────────────────────────────
create table if not exists deliveries (
  id                uuid        default gen_random_uuid() primary key,
  product_id        text        references products(id),
  arrival_date      date,
  ordered_quantity  integer     not null default 0,
  received_quantity integer     not null default 0,
  received_date     date,
  created_at        timestamptz not null default now()
);

-- RLS is disabled — see top of file

-- ─── Migration: add reorder alert columns (run if table already exists) ─────
alter table products add column if not exists meldebestand_fba integer not null default 0;
alter table products add column if not exists nachschub_menge  integer not null default 0;

-- ─── Settings table (key/value store for credentials & config) ────────────────
create table if not exists settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

-- RLS is disabled — see top of file

drop trigger if exists settings_updated_at on settings;
create trigger settings_updated_at
  before update on settings
  for each row execute function handle_updated_at();

-- ─── Migration: tags, notes, lagerort, einkaufspreis, image_url, image_data ──
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags         text[]  DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS notes        text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS lagerort     text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS einkaufspreis numeric DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url    text;
-- image_data stores base64-encoded JPEG (resized to max 600px client-side)
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_data   text;

-- ─── Stock History table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_history (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id  text        REFERENCES products(id) ON DELETE CASCADE,
  field       text        NOT NULL,
  old_value   integer     NOT NULL DEFAULT 0,
  new_value   integer     NOT NULL DEFAULT 0,
  reason      text,
  changed_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE stock_history DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS stock_history_product_id_idx ON stock_history(product_id, changed_at DESC);

-- ─── Migration: delivery date fields ─────────────────────────────────────────
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS order_date date;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS planned_arrival_date date;

-- ─── Migration: purchase price per delivery ───────────────────────────────────
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS einkaufspreis_pro_stueck numeric;

-- ─── FBA Shipments table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fba_shipments (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id          text        REFERENCES products(id) ON DELETE CASCADE,
  sent_quantity       integer     NOT NULL,
  confirmed_quantity  integer,
  tracking_reference  text,
  expected_arrival    date,
  sent_date           date        DEFAULT current_date,
  status              text        NOT NULL DEFAULT 'pending',
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE fba_shipments DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS fba_shipments_product_id_idx ON fba_shipments(product_id, created_at DESC);
