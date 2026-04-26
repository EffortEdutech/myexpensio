-- ============================================================
-- Migration: 20260424_workspace_console_v1.sql
-- Apply BEFORE deploying Workspace App or Console App code.
-- ============================================================

-- ============================================================
-- 1. invitation_requests
-- 2-step controlled user provisioning.
-- Team/Agent admins REQUEST → Console staff APPROVE/EXECUTE.
-- Existing `invitations` table kept for backward compat.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.invitation_requests (
  id                    UUID NOT NULL DEFAULT gen_random_uuid(),
  workspace_id          UUID NOT NULL,
  workspace_type        TEXT NOT NULL CHECK (workspace_type IN ('TEAM', 'AGENT', 'INTERNAL')),
  requested_by_user_id  UUID NOT NULL,
  requested_email       TEXT NOT NULL,
  requested_role        TEXT NOT NULL
    CHECK (requested_role IN ('OWNER','ADMIN','MANAGER','EMPLOYEE','SALES','FINANCE','MEMBER')),
  status                TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','APPROVED','REJECTED','EXECUTED','FAILED')),
  internal_assigned_to  UUID,
  rejection_reason      TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at           TIMESTAMPTZ,
  executed_at           TIMESTAMPTZ,
  CONSTRAINT invitation_requests_pkey PRIMARY KEY (id),
  CONSTRAINT invitation_requests_workspace_fkey
    FOREIGN KEY (workspace_id) REFERENCES public.organizations(id),
  CONSTRAINT invitation_requests_requested_by_fkey
    FOREIGN KEY (requested_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT invitation_requests_assigned_to_fkey
    FOREIGN KEY (internal_assigned_to) REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_inv_req_workspace
  ON public.invitation_requests(workspace_id);
CREATE INDEX IF NOT EXISTS idx_inv_req_status
  ON public.invitation_requests(status);
CREATE INDEX IF NOT EXISTS idx_inv_req_email
  ON public.invitation_requests(requested_email);
CREATE INDEX IF NOT EXISTS idx_inv_req_created
  ON public.invitation_requests(created_at DESC);

ALTER TABLE public.invitation_requests ENABLE ROW LEVEL SECURITY;

-- Workspace members can see their own org's requests
CREATE POLICY "inv_req_select_own_workspace"
  ON public.invitation_requests FOR SELECT
  USING (
    workspace_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND status = 'ACTIVE'
    )
  );

-- OWNER/ADMIN/MANAGER can create requests
CREATE POLICY "inv_req_insert_workspace_admin"
  ON public.invitation_requests FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND org_role IN ('OWNER','ADMIN','MANAGER')
        AND status = 'ACTIVE'
    )
    AND requested_by_user_id = auth.uid()
  );

-- Console APPROVE/REJECT/EXECUTE via service role API routes only.

-- ============================================================
-- 2. referrals
-- Agent/Partner individual user recruitment tracking.
--
-- Agent model (LOCKED):
--   Agent recruits INDIVIDUAL USERS to subscribe.
--   Users register under Agent workspace.
--   Users submit their own claims personally.
--   Agent earns commission per user subscription.
--   NO relationship to Team workspaces.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.referrals (
  id                    UUID NOT NULL DEFAULT gen_random_uuid(),
  agent_org_id          UUID NOT NULL,
  referred_by_user_id   UUID NOT NULL,
  customer_email        TEXT NOT NULL,
  customer_name         TEXT,
  referral_code         TEXT,
  status                TEXT NOT NULL DEFAULT 'INVITED'
    CHECK (status IN ('INVITED','SIGNED_UP','SUBSCRIBED','CHURNED')),
  signed_up_at          TIMESTAMPTZ,
  subscribed_at         TIMESTAMPTZ,
  -- If the referred individual joins a Team later, track for analytics only.
  -- Agent has NO access to that team's data.
  subscribed_org_id     UUID,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT referrals_pkey PRIMARY KEY (id),
  CONSTRAINT referrals_agent_org_fkey
    FOREIGN KEY (agent_org_id) REFERENCES public.organizations(id),
  CONSTRAINT referrals_referred_by_fkey
    FOREIGN KEY (referred_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT referrals_subscribed_org_fkey
    FOREIGN KEY (subscribed_org_id) REFERENCES public.organizations(id)
);

-- Prevent duplicate active invite to same email from same agent
CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_agent_email_unique
  ON public.referrals(agent_org_id, customer_email)
  WHERE status NOT IN ('CHURNED');

CREATE INDEX IF NOT EXISTS idx_referrals_agent_org
  ON public.referrals(agent_org_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status
  ON public.referrals(status);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals_select_agent_org"
  ON public.referrals FOR SELECT
  USING (
    agent_org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND status = 'ACTIVE'
    )
  );

-- OWNER and SALES can invite
CREATE POLICY "referrals_insert_agent_owner_sales"
  ON public.referrals FOR INSERT
  WITH CHECK (
    agent_org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND org_role IN ('OWNER','SALES')
        AND status = 'ACTIVE'
    )
    AND referred_by_user_id = auth.uid()
  );

-- ============================================================
-- 3. commissions
-- Per referral per month. Written by Console only.
-- Agent earns commission per individual user subscription period.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.commissions (
  id                    UUID NOT NULL DEFAULT gen_random_uuid(),
  agent_org_id          UUID NOT NULL,
  referral_id           UUID NOT NULL,
  subscription_period   TEXT NOT NULL,  -- 'YYYY-MM'
  gross_amount          NUMERIC NOT NULL CHECK (gross_amount >= 0),
  commission_rate       NUMERIC NOT NULL CHECK (commission_rate > 0 AND commission_rate <= 1),
  commission_amount     NUMERIC NOT NULL CHECK (commission_amount >= 0),
  currency              TEXT NOT NULL DEFAULT 'MYR',
  status                TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','APPROVED','PAID')),
  payout_id             UUID,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at               TIMESTAMPTZ,
  CONSTRAINT commissions_pkey PRIMARY KEY (id),
  CONSTRAINT commissions_agent_org_fkey
    FOREIGN KEY (agent_org_id) REFERENCES public.organizations(id),
  CONSTRAINT commissions_referral_fkey
    FOREIGN KEY (referral_id) REFERENCES public.referrals(id),
  CONSTRAINT commissions_referral_period_unique
    UNIQUE (referral_id, subscription_period)
);

CREATE INDEX IF NOT EXISTS idx_commissions_agent_org
  ON public.commissions(agent_org_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status
  ON public.commissions(status);

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Agent org members can read (OWNER + FINANCE roles typically)
CREATE POLICY "commissions_select_agent_org"
  ON public.commissions FOR SELECT
  USING (
    agent_org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND status = 'ACTIVE'
    )
  );

-- All writes via service role (Console) only.

-- ============================================================
-- 4. agent_payout_settings
-- Bank/payout details for Agent commission payouts.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.agent_payout_settings (
  org_id              UUID NOT NULL,
  bank_name           TEXT,
  bank_account_name   TEXT,
  bank_account_number TEXT,
  payout_method       TEXT NOT NULL DEFAULT 'BANK_TRANSFER'
    CHECK (payout_method IN ('BANK_TRANSFER','TOYYIBPAY','MANUAL')),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by          UUID,
  CONSTRAINT agent_payout_settings_pkey PRIMARY KEY (org_id),
  CONSTRAINT agent_payout_settings_org_fkey
    FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT agent_payout_settings_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES public.profiles(id)
);

ALTER TABLE public.agent_payout_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payout_settings_select"
  ON public.agent_payout_settings FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND status = 'ACTIVE'
    )
  );

CREATE POLICY "payout_settings_write_owner"
  ON public.agent_payout_settings FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND org_role = 'OWNER'
        AND status = 'ACTIVE'
    )
  );

-- ============================================================
-- 5. Extend org_members.org_role to support all workspace roles
-- Adds: ADMIN, EMPLOYEE (Team), SALES, FINANCE (Agent)
-- Keeps: OWNER, MANAGER, MEMBER (existing)
-- ============================================================

ALTER TABLE public.org_members
  DROP CONSTRAINT IF EXISTS org_members_org_role_check;

ALTER TABLE public.org_members
  ADD CONSTRAINT org_members_org_role_check
  CHECK (org_role IN (
    'OWNER',     -- Team + Agent: workspace owner
    'ADMIN',     -- Team: admin (finance/HR)
    'MANAGER',   -- Team: manager/approver
    'EMPLOYEE',  -- Team: employee submitting claims
    'SALES',     -- Agent: recruits individual users
    'FINANCE',   -- Agent: views commission dashboard
    'MEMBER'     -- Legacy: backward compat
  ));

-- ============================================================
-- 6. Performance indexes (safe — no data changes)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_organizations_workspace_type
  ON public.organizations(workspace_type);

CREATE INDEX IF NOT EXISTS idx_organizations_status
  ON public.organizations(status);

CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON public.profiles(email);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created
  ON public.audit_logs(org_id, created_at DESC);

-- ============================================================
-- SUMMARY
-- New tables: invitation_requests, referrals, commissions,
--             agent_payout_settings
-- Modified:   org_members.org_role constraint (added roles)
-- Indexes:    organizations, profiles, audit_logs
-- ============================================================
