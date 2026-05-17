-- ============================================================
-- Migration: 20260515_pdpa_consent_columns.sql
--
-- Adds PDPA consent tracking to the profiles table.
-- Consent is captured on the accept-invite page when the user
-- first joins a workspace. Required under Malaysian PDPA 2010.
--
-- Columns added:
--   consent_terms      BOOLEAN  — did user tick the required ToS/Privacy checkbox?
--   consent_marketing  BOOLEAN  — did user opt in to marketing emails? (optional)
--   consent_terms_at   TIMESTAMPTZ — timestamp of consent (for audit trail)
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS consent_terms       BOOLEAN,
  ADD COLUMN IF NOT EXISTS consent_marketing   BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_terms_at    TIMESTAMPTZ;

-- Index for compliance audits / data subject access requests
CREATE INDEX IF NOT EXISTS idx_profiles_consent_terms_at
  ON public.profiles(consent_terms_at)
  WHERE consent_terms IS NOT NULL;

COMMENT ON COLUMN public.profiles.consent_terms
  IS 'PDPA: user explicitly agreed to Terms of Service and Privacy Policy on accept-invite';

COMMENT ON COLUMN public.profiles.consent_marketing
  IS 'PDPA: user opted in to marketing communications (optional, separate consent)';

COMMENT ON COLUMN public.profiles.consent_terms_at
  IS 'PDPA: UTC timestamp when consent_terms was recorded (audit trail)';
