// apps/admin/lib/types.ts
//
// TypeScript types for the admin app.
// Mirrors DB schema — keep in sync with 13MAR2026_12_07pm_DATABASE_SCHEMA.

// ── Org ───────────────────────────────────────────────────────────────────────
export type Org = {
  id: string
  name: string
  status: 'ACTIVE' | string
  created_at: string
}

// ── Profile ───────────────────────────────────────────────────────────────────
export type Profile = {
  id: string
  email: string | null
  display_name: string | null
  role: 'USER' | 'ADMIN'
  created_at: string
}

// ── OrgMember ─────────────────────────────────────────────────────────────────
export type OrgRole = 'OWNER' | 'MANAGER' | 'MEMBER'
export type MemberStatus = 'ACTIVE' | 'REMOVED'

export type OrgMember = {
  org_id: string
  user_id: string
  org_role: OrgRole
  status: MemberStatus
  created_at: string
}

// Joined: member with profile
export type OrgMemberWithProfile = OrgMember & {
  profiles: Pick<Profile, 'id' | 'email' | 'display_name'>
}

// ── Invitation ────────────────────────────────────────────────────────────────
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'

export type Invitation = {
  id: string
  org_id: string
  email: string
  org_role: OrgRole
  status: InvitationStatus
  token: string
  invited_by_user_id: string | null
  accepted_by_user_id: string | null
  expires_at: string
  created_at: string
}

// ── Rate Version ──────────────────────────────────────────────────────────────
export type RateVersion = {
  id: string
  org_id: string
  effective_from: string          // date string YYYY-MM-DD
  currency: 'MYR'
  mileage_rate_per_km: number
  meal_rate_per_session: number | null
  meal_rate_full_day: number | null
  meal_rate_morning: number | null
  meal_rate_noon: number | null
  meal_rate_evening: number | null
  perdiem_rate_myr: number
  lodging_rate_default: number | null
  created_by_user_id: string | null
  created_at: string
}

// ── Claim ─────────────────────────────────────────────────────────────────────
export type ClaimStatus = 'DRAFT' | 'SUBMITTED'

export type Claim = {
  id: string
  org_id: string
  user_id: string
  status: ClaimStatus
  title: string | null
  total_amount: number
  currency: 'MYR'
  period_start: string | null
  period_end: string | null
  submitted_at: string | null
  created_at: string
  updated_at: string
}

export type ClaimWithUser = Claim & {
  profiles: Pick<Profile, 'id' | 'email' | 'display_name'>
}

// ── Claim Item ────────────────────────────────────────────────────────────────
export type ClaimItemType =
  | 'MILEAGE' | 'MEAL' | 'LODGING'
  | 'TOLL' | 'PARKING' | 'TAXI' | 'GRAB'
  | 'TRAIN' | 'FLIGHT' | 'BUS' | 'PER_DIEM'

export type ClaimItem = {
  id: string
  org_id: string
  claim_id: string
  type: ClaimItemType
  amount: number
  currency: 'MYR'
  claim_date: string | null
  merchant: string | null
  notes: string | null
  receipt_url: string | null
  trip_id: string | null
  qty: number | null
  unit: string | null
  rate: number | null
  paid_via_tng: boolean
  tng_transaction_id: string | null
  perdiem_rate_myr: number | null
  perdiem_days: number | null
  perdiem_destination: string | null
  created_at: string
}

// ── Export Job ────────────────────────────────────────────────────────────────
export type ExportFormat = 'CSV' | 'XLSX' | 'PDF'
export type ExportStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED'

export type ExportJob = {
  id: string
  org_id: string
  user_id: string
  format: ExportFormat
  status: ExportStatus
  file_url: string | null
  row_count: number | null
  error_message: string | null
  created_at: string
  completed_at: string | null
  // Phase B — nullable until migration applied
  template_id: string | null
}

export type ExportJobWithUser = ExportJob & {
  profiles: Pick<Profile, 'id' | 'email' | 'display_name'>
}

// ── Report Template (Phase B — tables don't exist yet) ───────────────────────
export type TemplatePreset = 'STANDARD' | 'COMPLETE' | 'ORIGINAL_HIGHLIGHT'

export type ReportTemplate = {
  id: string
  org_id: string
  name: string
  description: string | null
  schema: { version: number; preset: TemplatePreset; columns?: string[] }
  is_active: boolean
  is_default: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

// ── Audit Log ─────────────────────────────────────────────────────────────────
export type AuditLog = {
  id: string
  org_id: string | null
  actor_user_id: string | null
  entity_type: string
  entity_id: string | null
  action: string
  metadata: Record<string, unknown>
  created_at: string
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────
export type DashboardStats = {
  totalMembers: number
  activeMembers: number
  draftClaims: number
  submittedClaims: number
  exportsThisMonth: number
  routeCallsUsed: number
  routeCallsLimit: number | null  // null = unlimited (PRO tier)
  subscriptionTier: 'FREE' | 'PRO'
}

// ── Subscription ──────────────────────────────────────────────────────────────
export type SubscriptionStatus = {
  org_id: string
  tier: 'FREE' | 'PRO'
  period_start: string | null
  period_end: string | null
  updated_at: string
}
