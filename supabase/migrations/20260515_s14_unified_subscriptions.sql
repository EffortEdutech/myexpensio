-- ============================================================
-- Migration: S14-DB-1 — Unified Subscriptions Table
-- File:      supabase/migrations/20260515_s14_unified_subscriptions.sql
-- Sprint:    S14 — Subscription Consolidation
-- ============================================================
--
-- What this migration does:
--   1.  Create the unified `subscriptions` table (USER + ORG entities)
--   2.  Migrate existing PREMIUM users from profiles.subscription_plan
--   3.  Migrate existing FREE users → TRIALING (or EXPIRED if > 3 months old)
--   4.  Migrate org-level data from subscription_status (if it exists)
--   5.  Update handle_new_user trigger → auto-create FREE trial on signup
--   6.  Expand org_members role constraint (add ADMIN, EMPLOYEE, SALES, FINANCE)
--   7.  Add get_user_subscription() helper RPC
--   8.  Add get_org_subscription() helper RPC
--   9.  Update get_active_org() RPC → reads tier from subscriptions
--   10. Update bootstrap_personal_org() RPC → reads tier from subscriptions
--   11. Drop profiles.subscription_plan column (data migrated)
--   12. Drop subscription_status table (data migrated)
--
-- Tier model:
--   FREE     — 3-month trial only (status = TRIALING → EXPIRED)
--   PRO      — RM18/month (individual or per-seat for teams)
--   PREMIUM  — RM29/month (individual or per-seat for teams)
--
-- Entity model:
--   entity_type = 'USER' → individual user subscription (Agent Subscriber, solo)
--   entity_type = 'ORG'  → workspace subscription (Team or Agent workspace)
--
-- Safe to run: uses IF NOT EXISTS, ON CONFLICT, IF EXISTS guards throughout.
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 1.  subscriptions TABLE
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What this subscription covers
  entity_type             TEXT        NOT NULL
    CHECK (entity_type IN ('USER', 'ORG')),
  entity_id               UUID        NOT NULL,   -- profiles.id  OR  organizations.id

  -- Plan
  tier                    TEXT        NOT NULL DEFAULT 'FREE'
    CHECK (tier IN ('FREE', 'PRO', 'PREMIUM')),

  -- Billing status
  status                  TEXT        NOT NULL DEFAULT 'TRIALING'
    CHECK (status IN ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED')),

  -- Trial window (only meaningful when status = 'TRIALING')
  trial_expires_at        TIMESTAMPTZ,

  -- Per-seat count for ORG subscriptions (Team / Agent workspaces)
  seat_count              INTEGER     NOT NULL DEFAULT 1
    CHECK (seat_count >= 1),

  -- Stripe references
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT        UNIQUE,
  stripe_price_id         TEXT,       -- which price was purchased

  -- Billing window
  current_period_end      TIMESTAMPTZ,
  cancelled_at            TIMESTAMPTZ,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One subscription per entity — enforces single active plan per user/org
  UNIQUE (entity_type, entity_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_entity
  ON public.subscriptions (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer
  ON public.subscriptions (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub
  ON public.subscriptions (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON public.subscriptions (status);

-- updated_at auto-stamp
CREATE OR REPLACE FUNCTION public.set_subscriptions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE PROCEDURE public.set_subscriptions_updated_at();

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sub_select_own" ON public.subscriptions;
CREATE POLICY "sub_select_own" ON public.subscriptions
  FOR SELECT
  USING (
    -- Users can see their own USER subscription
    (entity_type = 'USER' AND entity_id = auth.uid())
    OR
    -- Members can see their org's ORG subscription
    (entity_type = 'ORG' AND entity_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND status = 'ACTIVE'
    ))
  );
-- All writes (INSERT, UPDATE, DELETE) are via service role only
-- (Stripe webhook handler, Console API) — no user-facing write policies.


-- ─────────────────────────────────────────────────────────────
-- 2.  MIGRATE: profiles.subscription_plan → subscriptions (USER)
-- ─────────────────────────────────────────────────────────────

-- PREMIUM users → ACTIVE (already paid, no trial window)
INSERT INTO public.subscriptions (entity_type, entity_id, tier, status, trial_expires_at)
SELECT
  'USER',
  p.id,
  'PREMIUM',
  'ACTIVE',
  NULL
FROM public.profiles p
WHERE p.subscription_plan = 'PREMIUM'
ON CONFLICT (entity_type, entity_id) DO NOTHING;

-- FREE / STANDARD users → TRIALING or EXPIRED
-- Trial window = account created_at + 3 months.
-- If their 3 months already elapsed, mark EXPIRED immediately.
INSERT INTO public.subscriptions (entity_type, entity_id, tier, status, trial_expires_at)
SELECT
  'USER',
  p.id,
  'FREE',
  CASE
    WHEN (p.created_at + INTERVAL '3 months') > now() THEN 'TRIALING'
    ELSE 'EXPIRED'
  END,
  p.created_at + INTERVAL '3 months'
FROM public.profiles p
WHERE p.subscription_plan IN ('FREE', 'STANDARD')
ON CONFLICT (entity_type, entity_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 3.  MIGRATE: subscription_status → subscriptions (ORG)
--     Only runs if the table exists (it may not in all environments).
-- ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'subscription_status'
  ) THEN
    INSERT INTO public.subscriptions (
      entity_type,
      entity_id,
      tier,
      status,
      seat_count,
      stripe_customer_id,
      stripe_subscription_id,
      stripe_price_id
    )
    SELECT
      'ORG',
      ss.org_id,
      CASE UPPER(COALESCE(ss.tier::TEXT, 'FREE'))
        WHEN 'PRO'     THEN 'PRO'
        WHEN 'PREMIUM' THEN 'PREMIUM'
        ELSE 'FREE'
      END,
      'ACTIVE',
      1,                          -- seat_count unknown; Console will correct
      ss.stripe_customer_id,
      ss.stripe_subscription_id,
      ss.plan_code
    FROM public.subscription_status ss
    WHERE ss.org_id IS NOT NULL
    ON CONFLICT (entity_type, entity_id) DO NOTHING;
  END IF;
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- 4.  UPDATE handle_new_user TRIGGER
--     Auto-creates a FREE / TRIALING subscription on signup.
--     The 3-month trial clock starts at registration.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile row
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (NEW.id, NEW.email, now())
  ON CONFLICT (id) DO UPDATE SET email = excluded.email;

  -- Create 3-month FREE trial subscription
  INSERT INTO public.subscriptions (
    entity_type, entity_id, tier, status, trial_expires_at
  )
  VALUES (
    'USER', NEW.id, 'FREE', 'TRIALING', now() + INTERVAL '3 months'
  )
  ON CONFLICT (entity_type, entity_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger was created in 001_init_core — function body is now updated above.
-- Re-create trigger to be safe.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ─────────────────────────────────────────────────────────────
-- 5.  EXPAND org_members ROLE CONSTRAINT
--     Previous: OWNER | MANAGER | MEMBER
--     New:      OWNER | MANAGER | ADMIN | EMPLOYEE | MEMBER | SALES | FINANCE
--     Matches the invitation_requests.requested_role constraint already in place.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.org_members
  DROP CONSTRAINT IF EXISTS org_members_org_role_check;

ALTER TABLE public.org_members
  ADD CONSTRAINT org_members_org_role_check
    CHECK (org_role IN (
      'OWNER', 'MANAGER', 'ADMIN', 'EMPLOYEE', 'MEMBER', 'SALES', 'FINANCE'
    ));


-- ─────────────────────────────────────────────────────────────
-- 6.  RPC: get_user_subscription(user_id)
DROP FUNCTION IF EXISTS public.get_user_subscription(UUID);
--     Returns full subscription state for an individual user.
--     Used by lib/subscription.ts in the User App.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_user_subscription(p_user_id UUID)
RETURNS TABLE (
  tier                TEXT,
  status              TEXT,
  trial_expires_at    TIMESTAMPTZ,
  is_active           BOOLEAN,    -- true if user can access paid gated features
  is_trial            BOOLEAN,    -- true if currently in free trial window
  trial_days_left     INTEGER,    -- 0 when expired
  stripe_customer_id  TEXT,
  current_period_end  TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.tier,
    s.status,
    s.trial_expires_at,

    -- is_active: ACTIVE subscription, OR still within trial window
    (
      s.status = 'ACTIVE'
      OR (s.status = 'TRIALING' AND s.trial_expires_at > now())
    ) AS is_active,

    -- is_trial: within trial window only
    (s.status = 'TRIALING' AND s.trial_expires_at > now()) AS is_trial,

    -- trial_days_left: positive while in trial, 0 once expired
    GREATEST(0,
      EXTRACT(DAY FROM (s.trial_expires_at - now()))::INTEGER
    ) AS trial_days_left,

    s.stripe_customer_id,
    s.current_period_end

  FROM public.subscriptions s
  WHERE s.entity_type = 'USER'
    AND s.entity_id   = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_subscription(UUID) TO service_role;


-- ─────────────────────────────────────────────────────────────
-- 7.  RPC: get_org_subscription(org_id)
DROP FUNCTION IF EXISTS public.get_org_subscription(UUID);
--     Returns subscription state for a workspace (Team / Agent).
--     Used by Console when managing workspace tiers and seat counts.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_org_subscription(p_org_id UUID)
RETURNS TABLE (
  tier                TEXT,
  status              TEXT,
  seat_count          INTEGER,
  is_active           BOOLEAN,
  stripe_customer_id  TEXT,
  stripe_subscription_id TEXT,
  current_period_end  TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.tier,
    s.status,
    s.seat_count,
    (s.status IN ('ACTIVE', 'TRIALING')) AS is_active,
    s.stripe_customer_id,
    s.stripe_subscription_id,
    s.current_period_end
  FROM public.subscriptions s
  WHERE s.entity_type = 'ORG'
    AND s.entity_id   = p_org_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_org_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_org_subscription(UUID) TO service_role;


-- ─────────────────────────────────────────────────────────────
-- 8.  UPDATE RPC: get_active_org(user_id)
--     Now resolves tier from subscriptions instead of subscription_status.
--     Tier resolution order:
--       1. ORG subscription (Team / Agent workspace the user belongs to)
--       2. USER subscription (individual plan — Agent Subscriber / solo user)
-- ─────────────────────────────────────────────────────────────

-- Drop first — return type may differ from the version in the DB
DROP FUNCTION IF EXISTS public.get_active_org(UUID);

CREATE OR REPLACE FUNCTION public.get_active_org(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id   UUID;
  v_org_name TEXT;
  v_org_role TEXT;
  v_tier     TEXT;
BEGIN
  -- Find the user's earliest active org membership (personal workspace first)
  SELECT m.org_id, o.name, m.org_role
  INTO   v_org_id, v_org_name, v_org_role
  FROM   public.org_members m
  JOIN   public.organizations o ON o.id = m.org_id
  WHERE  m.user_id = p_user_id
    AND  m.status  = 'ACTIVE'
  ORDER BY m.created_at ASC
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 1. Try ORG-level subscription (Team or Agent workspace)
  SELECT s.tier INTO v_tier
  FROM   public.subscriptions s
  WHERE  s.entity_type = 'ORG'
    AND  s.entity_id   = v_org_id
    AND  s.status IN ('ACTIVE', 'TRIALING')
  LIMIT 1;

  -- 2. Fall back to USER-level subscription (solo / Agent Subscriber)
  IF v_tier IS NULL THEN
    SELECT s.tier INTO v_tier
    FROM   public.subscriptions s
    WHERE  s.entity_type = 'USER'
      AND  s.entity_id   = p_user_id
      AND  s.status IN ('ACTIVE', 'TRIALING')
    LIMIT 1;
  END IF;

  RETURN json_build_object(
    'org_id',   v_org_id,
    'org_name', v_org_name,
    'org_role', v_org_role,
    'tier',     COALESCE(v_tier, 'FREE')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_org(UUID) TO authenticated;


-- ─────────────────────────────────────────────────────────────
-- 9.  UPDATE RPC: bootstrap_personal_org(user_id, email, display_name)
--     Idempotent — creates personal org on first login.
--     Now resolves tier from subscriptions, not profiles.subscription_plan.
-- ─────────────────────────────────────────────────────────────

-- Drop first — return type may differ from the version in the DB
DROP FUNCTION IF EXISTS public.bootstrap_personal_org(UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.bootstrap_personal_org(
  p_user_id      UUID,
  p_email        TEXT,
  p_display_name TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id   UUID;
  v_org_name TEXT;
  v_org_role TEXT;
  v_tier     TEXT;
BEGIN
  -- Upsert profile
  INSERT INTO public.profiles (id, email, display_name, created_at)
  VALUES (p_user_id, p_email, p_display_name, now())
  ON CONFLICT (id) DO UPDATE
    SET email        = excluded.email,
        display_name = COALESCE(excluded.display_name, profiles.display_name);

  -- Ensure subscription row exists (idempotent — trigger covers new signups,
  -- but this catches any edge cases from existing users without a row)
  INSERT INTO public.subscriptions (entity_type, entity_id, tier, status, trial_expires_at)
  SELECT 'USER', p_user_id, 'FREE', 'TRIALING', p.created_at + INTERVAL '3 months'
  FROM   public.profiles p WHERE p.id = p_user_id
  ON CONFLICT (entity_type, entity_id) DO NOTHING;

  -- Find or create personal workspace org
  SELECT m.org_id INTO v_org_id
  FROM   public.org_members m
  WHERE  m.user_id = p_user_id AND m.status = 'ACTIVE'
  ORDER BY m.created_at ASC
  LIMIT 1;

  IF v_org_id IS NULL THEN
    -- First login: create the personal workspace
    INSERT INTO public.organizations (name)
    VALUES (COALESCE(p_display_name, p_email, 'My Workspace'))
    RETURNING id INTO v_org_id;

    INSERT INTO public.org_members (org_id, user_id, org_role, status)
    VALUES (v_org_id, p_user_id, 'OWNER', 'ACTIVE');

    -- Seed a default mileage rate
    INSERT INTO public.rate_versions (
      org_id, effective_from, mileage_rate_per_km, created_by_user_id
    )
    VALUES (v_org_id, CURRENT_DATE, 0.30, p_user_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Get org name and role
  SELECT o.name, m.org_role
  INTO   v_org_name, v_org_role
  FROM   public.organizations o
  JOIN   public.org_members m ON m.org_id = o.id
  WHERE  m.user_id = p_user_id AND m.status = 'ACTIVE'
  ORDER BY m.created_at ASC
  LIMIT 1;

  -- Resolve tier: prefer ORG subscription, fall back to USER
  SELECT s.tier INTO v_tier
  FROM   public.subscriptions s
  WHERE  s.entity_type = 'ORG' AND s.entity_id = v_org_id
    AND  s.status IN ('ACTIVE', 'TRIALING')
  LIMIT 1;

  IF v_tier IS NULL THEN
    SELECT s.tier INTO v_tier
    FROM   public.subscriptions s
    WHERE  s.entity_type = 'USER' AND s.entity_id = p_user_id
      AND  s.status IN ('ACTIVE', 'TRIALING')
    LIMIT 1;
  END IF;

  RETURN json_build_object(
    'org_id',   v_org_id,
    'org_name', v_org_name,
    'org_role', v_org_role,
    'tier',     COALESCE(v_tier, 'FREE')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.bootstrap_personal_org(UUID, TEXT, TEXT) TO authenticated;


-- ─────────────────────────────────────────────────────────────
-- 10. DROP old objects (data already migrated above)
-- ─────────────────────────────────────────────────────────────

-- Remove subscription_plan column from profiles
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS subscription_plan;

-- Drop subscription_status (Stripe data migrated to subscriptions)
-- Drops dependent index first if it exists.
DROP INDEX  IF EXISTS idx_subscription_status_stripe_customer;
DROP TABLE  IF EXISTS public.subscription_status;


-- ─────────────────────────────────────────────────────────────
-- Verification queries (run after applying in Supabase SQL Editor)
-- ─────────────────────────────────────────────────────────────
--
-- 1. Check table exists and row counts:
--    SELECT entity_type, tier, status, COUNT(*)
--    FROM subscriptions
--    GROUP BY entity_type, tier, status
--    ORDER BY entity_type, tier;
--
-- 2. Confirm subscription_plan column is gone from profiles:
--    SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'profiles' AND column_name = 'subscription_plan';
--    -- Should return 0 rows.
--
-- 3. Confirm subscription_status table is gone:
--    SELECT table_name FROM information_schema.tables
--    WHERE table_name = 'subscription_status';
--    -- Should return 0 rows.
--
-- 4. Check org_members role constraint:
--    SELECT conname, pg_get_constraintdef(oid)
--    FROM pg_constraint
--    WHERE conname = 'org_members_org_role_check';
--    -- Should include ADMIN, EMPLOYEE, SALES, FINANCE.
--
-- 5. Check new trigger exists:
--    SELECT trigger_name FROM information_schema.triggers
--    WHERE event_object_table = 'users'
--    AND trigger_name = 'on_auth_user_created';
--
-- 6. Smoke-test an RPC:
--    SELECT * FROM get_user_subscription('<your-user-uuid>');
--
-- ============================================================

COMMIT;
