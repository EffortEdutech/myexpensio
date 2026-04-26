// packages/domain/src/invitation.ts
//
// 2-step controlled user provisioning system.
//
// Flow:
//   Team Admin / Agent Admin
//     → submits InvitationRequest (status: PENDING)
//   Console staff (SUPPORT / SUPER_ADMIN)
//     → reviews → APPROVE or REJECT
//   Console system
//     → creates Supabase auth user
//     → creates profiles row
//     → creates org_members row (role as requested)
//     → sends magic link email
//     → status → EXECUTED
//     → writes audit_logs entry
//
// Workspace App: CREATE + READ own org's requests
// Console App:   READ all requests + APPROVE / REJECT / EXECUTE
//
// NEW FILE — 24 Apr 2026

import type { WorkspaceType, OrgRole } from './roles'

// ── Invitation request status lifecycle ───────────────────────────────────────

export const INVITATION_REQUEST_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'EXECUTED',
  'FAILED',
] as const

export type InvitationRequestStatus = (typeof INVITATION_REQUEST_STATUSES)[number]

export function isInvitationRequestStatus(value: unknown): value is InvitationRequestStatus {
  return (
    typeof value === 'string' &&
    INVITATION_REQUEST_STATUSES.includes(value as InvitationRequestStatus)
  )
}

// ── Invitation request shape ──────────────────────────────────────────────────

export type InvitationRequest = {
  id: string
  workspaceId: string
  workspaceType: WorkspaceType
  requestedByUserId: string
  requestedEmail: string
  requestedRole: OrgRole
  status: InvitationRequestStatus
  internalAssignedTo: string | null  // Console staff user_id
  rejectionReason: string | null
  notes: string | null
  createdAt: string
  approvedAt: string | null
  executedAt: string | null
}

// DB row shape (snake_case, from Supabase query)
export type InvitationRequestRow = {
  id: string
  workspace_id: string
  workspace_type: string
  requested_by_user_id: string
  requested_email: string
  requested_role: string
  status: string
  internal_assigned_to: string | null
  rejection_reason: string | null
  notes: string | null
  created_at: string
  approved_at: string | null
  executed_at: string | null
}

export function normalizeInvitationRequest(row: InvitationRequestRow): InvitationRequest {
  return {
    id:                   row.id,
    workspaceId:          row.workspace_id,
    workspaceType:        row.workspace_type as WorkspaceType,
    requestedByUserId:    row.requested_by_user_id,
    requestedEmail:       row.requested_email,
    requestedRole:        row.requested_role as OrgRole,
    status:               row.status as InvitationRequestStatus,
    internalAssignedTo:   row.internal_assigned_to,
    rejectionReason:      row.rejection_reason,
    notes:                row.notes,
    createdAt:            row.created_at,
    approvedAt:           row.approved_at,
    executedAt:           row.executed_at,
  }
}

// ── API payloads ──────────────────────────────────────────────────────────────

// Workspace App → POST /api/invitation-requests
export type CreateInvitationRequestPayload = {
  workspaceId: string
  requestedEmail: string
  requestedRole: OrgRole
  notes?: string
}

// Console App → PATCH /api/console/invitation-requests/:id
export type UpdateInvitationRequestPayload =
  | { action: 'approve'; internalAssignedTo?: string }
  | { action: 'reject'; rejectionReason: string }
  | { action: 'execute' }

// ── Status display helpers ────────────────────────────────────────────────────

export const INVITATION_STATUS_LABELS: Record<InvitationRequestStatus, string> = {
  PENDING:  'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  EXECUTED: 'Completed',
  FAILED:   'Failed',
}

export function getInvitationStatusLabel(status: InvitationRequestStatus): string {
  return INVITATION_STATUS_LABELS[status] ?? status
}
