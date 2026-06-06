-- Sprint 13: Create missing tables and apply RLS
-- Tables: tng_statement_batches, tng_transactions, receipts, commitments, commitment_payments
-- All tables need RLS enforcing user_id = auth.uid()

-- ── TNG Statement Batches ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tng_statement_batches (
  id                  TEXT PRIMARY KEY NOT NULL,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label               TEXT,
  source_file_name    TEXT,
  imported_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  transaction_count   INTEGER NOT NULL DEFAULT 0,
  total_amount_cents  INTEGER NOT NULL DEFAULT 0,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);

ALTER TABLE public.tng_statement_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tng_batches_select ON public.tng_statement_batches;
DROP POLICY IF EXISTS tng_batches_insert ON public.tng_statement_batches;
DROP POLICY IF EXISTS tng_batches_update ON public.tng_statement_batches;
DROP POLICY IF EXISTS tng_batches_delete ON public.tng_statement_batches;

CREATE POLICY tng_batches_select ON public.tng_statement_batches
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY tng_batches_insert ON public.tng_statement_batches
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY tng_batches_update ON public.tng_statement_batches
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY tng_batches_delete ON public.tng_statement_batches
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_tng_batches_user ON public.tng_statement_batches (user_id);

-- ── TNG Transactions ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tng_transactions (
  id                  TEXT PRIMARY KEY NOT NULL,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  statement_id        TEXT REFERENCES public.tng_statement_batches(id) ON DELETE SET NULL,
  trans_no            TEXT,
  sector              TEXT,
  amount_cents        INTEGER NOT NULL DEFAULT 0,
  currency            TEXT NOT NULL DEFAULT 'MYR',
  transaction_date    TIMESTAMPTZ,
  entry_location      TEXT,
  exit_location       TEXT,
  claimed             BOOLEAN NOT NULL DEFAULT false,
  claim_item_id       TEXT,
  link_status         TEXT,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);

ALTER TABLE public.tng_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tng_txn_select ON public.tng_transactions;
DROP POLICY IF EXISTS tng_txn_insert ON public.tng_transactions;
DROP POLICY IF EXISTS tng_txn_update ON public.tng_transactions;
DROP POLICY IF EXISTS tng_txn_delete ON public.tng_transactions;

CREATE POLICY tng_txn_select ON public.tng_transactions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY tng_txn_insert ON public.tng_transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY tng_txn_update ON public.tng_transactions
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY tng_txn_delete ON public.tng_transactions
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_tng_txn_user ON public.tng_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_tng_txn_statement ON public.tng_transactions (statement_id);
CREATE INDEX IF NOT EXISTS idx_tng_txn_claimed ON public.tng_transactions (user_id, claimed);

-- ── Receipts ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.receipts (
  id                  TEXT PRIMARY KEY NOT NULL,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_entity_type   TEXT NOT NULL,   -- 'claim_item' | 'expense' | 'ledger_entry'
  owner_entity_id     TEXT NOT NULL,
  storage_path        TEXT,            -- Supabase Storage object path
  mime_type           TEXT,
  file_size           INTEGER,
  upload_status       TEXT NOT NULL DEFAULT 'pending',  -- pending | uploaded | failed
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS receipts_select ON public.receipts;
DROP POLICY IF EXISTS receipts_insert ON public.receipts;
DROP POLICY IF EXISTS receipts_update ON public.receipts;
DROP POLICY IF EXISTS receipts_delete ON public.receipts;

CREATE POLICY receipts_select ON public.receipts
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY receipts_insert ON public.receipts
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY receipts_update ON public.receipts
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY receipts_delete ON public.receipts
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_receipts_user ON public.receipts (user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_owner ON public.receipts (owner_entity_type, owner_entity_id);

-- ── Commitments ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.commitments (
  id            TEXT PRIMARY KEY NOT NULL,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  amount_cents  INTEGER NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'MYR',
  category      TEXT NOT NULL DEFAULT 'OTHER',
  due_day       INTEGER NOT NULL DEFAULT 1,
  start_date    DATE,
  end_date      DATE,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  notes         TEXT,
  is_tax_relief BOOLEAN NOT NULL DEFAULT false,
  tax_category  TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS commitments_select ON public.commitments;
DROP POLICY IF EXISTS commitments_insert ON public.commitments;
DROP POLICY IF EXISTS commitments_update ON public.commitments;
DROP POLICY IF EXISTS commitments_delete ON public.commitments;

CREATE POLICY commitments_select ON public.commitments
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY commitments_insert ON public.commitments
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY commitments_update ON public.commitments
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY commitments_delete ON public.commitments
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_commitments_user ON public.commitments (user_id);

-- ── Commitment Payments ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.commitment_payments (
  id                      TEXT PRIMARY KEY NOT NULL,
  commitment_id           TEXT NOT NULL REFERENCES public.commitments(id) ON DELETE CASCADE,
  year                    INTEGER NOT NULL,
  month                   INTEGER NOT NULL,
  due_date                DATE,
  expected_amount_cents   INTEGER NOT NULL DEFAULT 0,
  status                  TEXT NOT NULL DEFAULT 'PENDING',
  paid_date               DATE,
  paid_amount_cents       INTEGER,
  notes                   TEXT,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.commitment_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS commitment_payments_select ON public.commitment_payments;
DROP POLICY IF EXISTS commitment_payments_insert ON public.commitment_payments;
DROP POLICY IF EXISTS commitment_payments_update ON public.commitment_payments;
DROP POLICY IF EXISTS commitment_payments_delete ON public.commitment_payments;

-- RLS via join to commitments (which is already user-scoped)
CREATE POLICY commitment_payments_select ON public.commitment_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.commitments c
      WHERE c.id = commitment_id AND c.user_id = auth.uid()
    )
  );
CREATE POLICY commitment_payments_insert ON public.commitment_payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.commitments c
      WHERE c.id = commitment_id AND c.user_id = auth.uid()
    )
  );
CREATE POLICY commitment_payments_update ON public.commitment_payments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.commitments c
      WHERE c.id = commitment_id AND c.user_id = auth.uid()
    )
  );
CREATE POLICY commitment_payments_delete ON public.commitment_payments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.commitments c
      WHERE c.id = commitment_id AND c.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_commitment_payments_commitment ON public.commitment_payments (commitment_id);
