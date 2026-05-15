-- ============================================================
-- Migration: S12 — Bill Linking, Tax Relief, File Uploads
-- Date: 2026-05-14
--
-- Changes:
--   1. commitment_payments.ledger_entry_id  — links paid bill to auto-created expense
--   2. commitments.is_tax_relief            — marks bill as LHDN tax-deductible
--   3. commitments.tax_category             — LHDN relief category code
--   4. commitments.document_url             — signed URL for agreement/document
--   5. commitments.document_storage_path    — Supabase Storage path
--
-- ledger_entries already has receipt_url + attachment_path from prior migration.
-- No changes needed there.
--
-- STORAGE BUCKETS (create manually in Supabase Dashboard → Storage):
--   • expense-receipts   private  (PDF/image receipts for tax evidence)
--   • bill-documents     private  (PDF agreements, loan letters, policy docs)
--
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. commitment_payments: link to auto-created ledger entry ────────────────

ALTER TABLE commitment_payments
  ADD COLUMN IF NOT EXISTS ledger_entry_id UUID
    REFERENCES ledger_entries(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_commitment_payments_ledger_entry
  ON commitment_payments (ledger_entry_id)
  WHERE ledger_entry_id IS NOT NULL;

-- ── 2. commitments: tax relief fields ────────────────────────────────────────

ALTER TABLE commitments
  ADD COLUMN IF NOT EXISTS is_tax_relief BOOLEAN NOT NULL DEFAULT FALSE;

-- LHDN relief category — same codes used in ledger_entries.tax_category:
--   LIFE_INSURANCE_EPF, EDUCATION, MEDICAL, LIFESTYLE, BOOKS,
--   DISABILITY_EQUIPMENT, OTHER
ALTER TABLE commitments
  ADD COLUMN IF NOT EXISTS tax_category TEXT;

-- ── 3. commitments: document storage ─────────────────────────────────────────

-- Signed URL (regenerated on demand — expires after 1 hour)
ALTER TABLE commitments
  ADD COLUMN IF NOT EXISTS document_url TEXT;

-- Permanent storage path in the 'bill-documents' Supabase Storage bucket
-- Used to regenerate signed URLs and to delete the file when needed
ALTER TABLE commitments
  ADD COLUMN IF NOT EXISTS document_storage_path TEXT;

-- ── 4. Storage bucket RLS policies (SQL reference only) ──────────────────────
--
-- After creating the two buckets in the Dashboard, run these policies:
--
-- Bucket: expense-receipts
--   INSERT policy "Users upload own receipts":
--     (auth.uid()::text) = (storage.foldername(name))[1]
--
--   SELECT policy "Users view own receipts":
--     (auth.uid()::text) = (storage.foldername(name))[1]
--
--   DELETE policy "Users delete own receipts":
--     (auth.uid()::text) = (storage.foldername(name))[1]
--
-- Bucket: bill-documents
--   Same three policies, same rule (folder[1] = user id).
--
-- ── End of migration ─────────────────────────────────────────────────────────
