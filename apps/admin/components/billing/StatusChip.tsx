'use client'

/**
 * apps/admin/components/billing/StatusChip.tsx
 *
 * Unified status chip for billing and commission/payout statuses.
 * Uses inline styles to avoid Tailwind purge issues with dynamic values.
 */

type StatusChipProps = {
  status: string
  size?: 'sm' | 'md'
}

type ChipStyle = { background: string; color: string; label: string }

const CHIP_MAP: Record<string, ChipStyle> = {
  // Billing subscription statuses
  ACTIVE:   { background: '#d1fae5', color: '#065f46', label: 'Active' },
  TRIALING: { background: '#dbeafe', color: '#1e40af', label: 'Trialing' },
  PAST_DUE: { background: '#fef3c7', color: '#92400e', label: 'Past due' },
  UNPAID:   { background: '#fee2e2', color: '#991b1b', label: 'Unpaid' },
  CANCELED: { background: '#f3f4f6', color: '#6b7280', label: 'Canceled' },
  EXPIRED:  { background: '#f3f4f6', color: '#9ca3af', label: 'Expired' },
  INACTIVE: { background: '#f3f4f6', color: '#9ca3af', label: 'Inactive' },

  // Commission / payout statuses
  PENDING:    { background: '#fef3c7', color: '#92400e', label: 'Pending' },
  APPROVED:   { background: '#d1fae5', color: '#065f46', label: 'Approved' },
  HELD:       { background: '#ffedd5', color: '#9a3412', label: 'Held' },
  PAID:       { background: '#a7f3d0', color: '#064e3b', label: 'Paid' },
  REVERSED:   { background: '#fee2e2', color: '#991b1b', label: 'Reversed' },
  REJECTED:   { background: '#fee2e2', color: '#7f1d1d', label: 'Rejected' },
  VOID:       { background: '#f3f4f6', color: '#9ca3af', label: 'Void' },
  FAILED:     { background: '#fee2e2', color: '#b91c1c', label: 'Failed' },

  // Agent statuses
  SUSPENDED:  { background: '#ffedd5', color: '#9a3412', label: 'Suspended' },
  TERMINATED: { background: '#fee2e2', color: '#7f1d1d', label: 'Terminated' },

  // Attribution / plan statuses
  DRAFT:      { background: '#f3f4f6', color: '#6b7280', label: 'Draft' },
  PROCESSING: { background: '#dbeafe', color: '#1e40af', label: 'Processing' },
  RECEIVED:   { background: '#ede9fe', color: '#5b21b6', label: 'Received' },
  PROCESSED:  { background: '#d1fae5', color: '#065f46', label: 'Processed' },
  IGNORED:    { background: '#f3f4f6', color: '#9ca3af', label: 'Ignored' },
}

export default function StatusChip({ status, size = 'md' }: StatusChipProps) {
  const chip = CHIP_MAP[status?.toUpperCase()] ?? {
    background: '#f3f4f6',
    color: '#6b7280',
    label: status ?? '—',
  }

  const padding = size === 'sm' ? '1px 6px' : '2px 8px'
  const fontSize = size === 'sm' ? '11px' : '12px'

  return (
    <span
      style={{
        display: 'inline-block',
        padding,
        borderRadius: '4px',
        fontSize,
        fontWeight: 500,
        background: chip.background,
        color: chip.color,
        whiteSpace: 'nowrap',
        lineHeight: '1.6',
      }}
    >
      {chip.label}
    </span>
  )
}
