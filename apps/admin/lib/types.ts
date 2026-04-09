// apps/admin/lib/types.ts
// TypeScript types for the admin app.
// Updated for global rate templates + personal user rates.

export type Org = {
  id: string
  name: string
  status: 'ACTIVE' | string
  created_at: string
}

export type Profile = {
  id: string
  email: string | null
  display_name: string | null
  role: 'USER' | 'ADMIN'
  created_at: string
}

export type OrgRole = 'OWNER' | 'MANAGER' | 'MEMBER'
export type MemberStatus = 'ACTIVE' | 'REMOVED'

export type OrgMember = {
  org_id: string
  user_id: string
  org_role: OrgRole
  status: MemberStatus
  created_at: string
}

export type OrgMemberWithProfile = OrgMember & {
  profiles: Pick<Profile, 'id' | 'email' | 'display_name'>
}

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

// Global template library row
export type RateVersion = {
  id: string
  template_name: string
  effective_from: string
  currency: 'MYR' | string
  mileage_rate_per_km: number
  meal_rate_default: number | null
  meal_rate_per_session: number | null
  meal_rate_full_day: number | null
  meal_rate_morning: number | null
  meal_rate_noon: number | null
  meal_rate_evening: number | null
  perdiem_rate_myr: number
  lodging_rate_default: number | null
  created_by_user_id: string | null
  created_at: string
  updated_at: string
}

// Personal user-owned rate snapshot row
export type UserRateVersion = {
  id: string
  org_id: string
  user_id: string
  source_rate_version_id: string | null
  effective_from: string
  currency: 'MYR' | string
  mileage_rate_per_km: number
  meal_rate_default: number | null
  meal_rate_per_session: number | null
  meal_rate_full_day: number | null
  meal_rate_morning: number | null
  meal_rate_noon: number | null
  meal_rate_evening: number | null
  perdiem_rate_myr: number
  lodging_rate_default: number | null
  rate_label: string | null
  notes: string | null
  created_by_user_id: string | null
  created_at: string
  updated_at: string
}

export type ClaimStatus = 'DRAFT' | 'SUBMITTED'

export type Claim = {
  id: string
  org_id: string
  user_id: string
  status: ClaimStatus
  title: string | null
  total_amount: number
  currency: 'MYR' | string
  period_start: string | null
  period_end: string | null
  submitted_at: string | null
  rate_version_id: string | null
  user_rate_version_id: string | null
  created_at: string
  updated_at: string
}

export type ClaimWithUser = Claim & {
  profiles: Pick<Profile, 'id' | 'email' | 'display_name'>
}

export type ClaimItemType =
  | 'MILEAGE' | 'MEAL' | 'LODGING'
  | 'TOLL' | 'PARKING' | 'TAXI' | 'GRAB'
  | 'TRAIN' | 'FLIGHT' | 'BUS' | 'PER_DIEM'
  | 'MISC'

export type ClaimItem = {
  id: string
  org_id: string
  claim_id: string
  type: ClaimItemType
  amount: number
  currency: 'MYR' | string
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
  template_id: string | null
}

export type ExportJobWithUser = ExportJob & {
  profiles: Pick<Profile, 'id' | 'email' | 'display_name'>
}

export type TemplatePreset = 'STANDARD' | 'COMPLETE' | 'ORIGINAL_HIGHLIGHT' | 'CUSTOM'

export type ReportTemplate = {
  id: string
  name: string
  description: string | null
  schema: {
    version: number
    preset: TemplatePreset
    columns: string[]
    pdf_layout?: Record<string, unknown>
  }
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export type OrgTemplateAssignment = {
  org_id: string
  template_id: string
  is_default: boolean
  assigned_at: string
}

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

export type DashboardStats = {
  totalMembers: number
  activeMembers: number
  draftClaims: number
  submittedClaims: number
  exportsThisMonth: number
  routeCallsUsed: number
  routeCallsLimit: number | null
  subscriptionTier: 'FREE' | 'PRO'
}

export type SubscriptionStatus = {
  org_id: string
  tier: 'FREE' | 'PRO'
  period_start: string | null
  period_end: string | null
  updated_at: string
}
