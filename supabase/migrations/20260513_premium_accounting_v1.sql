-- ============================================================
-- Migration: Premium Accounting — Spaces + Ledger
-- File:      supabase/migrations/20260513_premium_accounting_v1.sql
-- Sprint:    S1 — DB Schema Foundation
-- Feature:   Tax-ready i/o tracker for solo business
-- ============================================================
--
-- What this migration does:
--   1. Creates the `spaces` table (Personal / Business / Work contexts)
--   2. Creates the `ledger_entries` table (income + expense logbook)
--   3. Adds `subscription_plan` column to `profiles`
--   4. Backfills a PERSONAL space for every existing user
--
-- Safe to run:
--   - Uses IF NOT EXISTS / ON CONFLICT guards throughout
--   - Zero changes to existing tables (claims, expenses, mileage, orgs)
--   - Idempotent: safe to re-run without duplicating data
-- ============================================================


-- ------------------------------------------------------------
-- 1. SPACES TABLE
--    Root container for each financial context per user.
--    PERSONAL  — all tiers (personal expense + tax tracking)
--    BUSINESS  — Premium only (income, bookkeeping, P&L)
--    WORK      — linked to org_members (existing claim system)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS spaces (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id      UUID        REFERENCES organizations(id) ON DELETE SET NULL,
  type        TEXT        NOT NULL CHECK (type IN ('PERSONAL', 'BUSINESS', 'WORK')),
  name        TEXT        NOT NULL,
  currency    TEXT        NOT NULL DEFAULT 'MYR',
  is_default  BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One space per type per user
CREATE UNIQUE INDEX IF NOT EXISTS spaces_user_type_unique
  ON spaces (user_id, type);

CREATE INDEX IF NOT EXISTS spaces_user_id_idx
  ON spaces (user_id);

-- RLS: users can only see and modify their own spaces
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS spaces_select ON spaces;
DROP POLICY IF EXISTS spaces_insert ON spaces;
DROP POLICY IF EXISTS spaces_update ON spaces;
DROP POLICY IF EXISTS spaces_delete ON spaces;

CREATE POLICY spaces_select ON spaces
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY spaces_insert ON spaces
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY spaces_update ON spaces
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY spaces_delete ON spaces
  FOR DELETE USING (user_id = auth.uid());


-- ------------------------------------------------------------
-- 2. LEDGER ENTRIES TABLE
--    The income/expense logbook for Personal and Business spaces.
--    Completely separate from the existing `expenses` table
--    (which belongs to the claim/work system — untouched).
--
--    entry_type = EXPENSE  → money out
--    entry_type = INCOME   → money in (Business space only for now)
--
--    is_tax_deductible + tax_category → drives Personal tax summary
--    income_source                    → for Business income entries
--    payment_method                   → optional label, not a balance
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ledger_entries (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id            UUID         NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id             UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Core fields
  entry_type          TEXT         NOT NULL CHECK (entry_type IN ('EXPENSE', 'INCOME')),
  amount              NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency            TEXT         NOT NULL DEFAULT 'MYR',
  entry_date          DATE         NOT NULL,

  -- Categorisation
  category            TEXT         NOT NULL,
  subcategory         TEXT,
  description         TEXT,

  -- Personal space: tax deduction tracking
  is_tax_deductible   BOOLEAN      NOT NULL DEFAULT false,
  tax_category        TEXT,        -- LHDN relief category (lifestyle, medical, education, …)

  -- Business space: income source label
  income_source       TEXT,        -- GRAB, CLIENT, CASH, BANK, OTHER

  -- Optional payment method tag (label only — no balance tracking)
  payment_method      TEXT         CHECK (
                        payment_method IN ('CASH','CARD','ONLINE_BANKING','EWALLET','OTHER')
                      ),

  -- Attachment
  receipt_url         TEXT,
  attachment_path     TEXT,

  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ledger_entries_space_id_idx
  ON ledger_entries (space_id);

CREATE INDEX IF NOT EXISTS ledger_entries_user_id_idx
  ON ledger_entries (user_id);

CREATE INDEX IF NOT EXISTS ledger_entries_entry_date_idx
  ON ledger_entries (entry_date);

CREATE INDEX IF NOT EXISTS ledger_entries_type_idx
  ON ledger_entries (entry_type);

-- Composite index for the most common query pattern: space + date range
CREATE INDEX IF NOT EXISTS ledger_entries_space_date_idx
  ON ledger_entries (space_id, entry_date DESC);

-- RLS: users can only access their own ledger entries
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ledger_select ON ledger_entries;
DROP POLICY IF EXISTS ledger_insert ON ledger_entries;
DROP POLICY IF EXISTS ledger_update ON ledger_entries;
DROP POLICY IF EXISTS ledger_delete ON ledger_entries;

CREATE POLICY ledger_select ON ledger_entries
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY ledger_insert ON ledger_entries
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY ledger_update ON ledger_entries
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY ledger_delete ON ledger_entries
  FOR DELETE USING (user_id = auth.uid());


-- ------------------------------------------------------------
-- 3. ADD subscription_plan TO profiles
--    FREE     — Personal space only
--    STANDARD — Personal space (reserved for future mid-tier)
--    PREMIUM  — Personal + Business spaces
-- ------------------------------------------------------------

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT NOT NULL DEFAULT 'FREE'
    CHECK (subscription_plan IN ('FREE', 'STANDARD', 'PREMIUM'));


-- ------------------------------------------------------------
-- 4. BACKFILL: create a PERSONAL space for every existing user
--    New users get their space created automatically by the API
--    (/api/spaces GET handler). This covers existing accounts.
-- ------------------------------------------------------------

INSERT INTO spaces (user_id, type, name, is_default)
SELECT id, 'PERSONAL', 'Personal', true
FROM profiles
ON CONFLICT (user_id, type) DO NOTHING;


-- ------------------------------------------------------------
-- Verification queries (run after migration to confirm)
-- ------------------------------------------------------------
--
-- Check tables exist:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_name IN ('spaces','ledger_entries');
--
-- Check subscription_plan column:
--   SELECT column_name, data_type, column_default
--   FROM information_schema.columns
--   WHERE table_name = 'profiles' AND column_name = 'subscription_plan';
--
-- Check backfill count matches profiles:
--   SELECT
--     (SELECT count(*) FROM profiles) AS total_users,
--     (SELECT count(*) FROM spaces WHERE type = 'PERSONAL') AS personal_spaces;
--   -- Both numbers should match.
--
-- Check RLS is on:
--   SELECT tablename, rowsecurity FROM pg_tables
--   WHERE tablename IN ('spaces','ledger_entries');
--
-- ============================================================
