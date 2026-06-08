-- ============================================================
-- Summit Gear / Jainsons Billing — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Products (inventory catalogue)
CREATE TABLE IF NOT EXISTS products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,
  subcategory     TEXT NOT NULL,
  variant         TEXT,
  selling_price   NUMERIC NOT NULL,
  stock_quantity  INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Stock log (quick / bulk-imported items)
CREATE TABLE IF NOT EXISTS stock_log (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  category              TEXT NOT NULL,
  subcategory           TEXT NOT NULL,
  approx_price          NUMERIC NOT NULL,
  quantity              INTEGER NOT NULL DEFAULT 0,
  source                TEXT NOT NULL DEFAULT 'manual',
  last_used_price       NUMERIC NOT NULL DEFAULT 0,
  times_used            INTEGER NOT NULL DEFAULT 0,
  promoted_to_catalogue BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Customers
CREATE TABLE IF NOT EXISTS customers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  phone               TEXT NOT NULL UNIQUE,
  total_visits        INTEGER NOT NULL DEFAULT 0,
  total_spent         NUMERIC NOT NULL DEFAULT 0,
  last_purchase_date  TIMESTAMPTZ,
  categories_bought   TEXT[] NOT NULL DEFAULT '{}',
  sales_ids           TEXT[] NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Sales (header)
CREATE TABLE IF NOT EXISTS sales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number     TEXT NOT NULL UNIQUE,
  customer_id     UUID REFERENCES customers(id),
  customer_name   TEXT NOT NULL,
  customer_phone  TEXT NOT NULL,
  grand_total     NUMERIC NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Sale items (line items for each sale)
CREATE TABLE IF NOT EXISTS sale_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id     UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  category    TEXT NOT NULL,
  quantity    INTEGER NOT NULL,
  unit_price  NUMERIC NOT NULL,
  line_total  NUMERIC NOT NULL,
  source      TEXT NOT NULL,
  source_id   TEXT
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales (customer_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items (sale_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers (phone);
CREATE INDEX IF NOT EXISTS idx_stock_log_promoted ON stock_log (promoted_to_catalogue);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products (stock_quantity);
