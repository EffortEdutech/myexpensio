'use client'

/**
 * apps/admin/components/billing/ConfirmActionModal.tsx
 *
 * Confirmation modal for finance-affecting or destructive admin actions.
 * Complies with Doc 08 §3.5 audit pattern:
 *   - confirmation modal
 *   - optional rationale text area
 *   - loading state during async operation
 */

import { useState } from 'react'

type ConfirmActionModalProps = {
  title: string
  description: string
  confirmLabel?: string
  confirmVariant?: 'danger' | 'primary'
  requireReason?: boolean
  reasonLabel?: string
  loading?: boolean
  onConfirm: (reason?: string) => void | Promise<void>
  onCancel: () => void
}

export default function ConfirmActionModal({
  title,
  description,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  requireReason = false,
  reasonLabel = 'Reason',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmActionModalProps) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const canConfirm = !requireReason || reason.trim().length > 0

  async function handleConfirm() {
    if (!canConfirm || busy) return
    setBusy(true)
    try {
      await onConfirm(requireReason ? reason.trim() : undefined)
    } finally {
      setBusy(false)
    }
  }

  const confirmBg = confirmVariant === 'danger' ? '#dc2626' : '#4f46e5'
  const confirmHoverBg = confirmVariant === 'danger' ? '#b91c1c' : '#4338ca'

  return (
    /* Backdrop */
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      {/* Panel */}
      <div
        style={{
          background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '440px',
          padding: '28px 28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#111827' }}>
          {title}
        </h2>
        <p style={{ margin: '10px 0 0', fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>
          {description}
        </p>

        {requireReason && (
          <div style={{ marginTop: '16px' }}>
            <label
              style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}
            >
              {reasonLabel} <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Required before proceeding"
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1px solid #d1d5db', borderRadius: '6px',
                padding: '8px 10px', fontSize: '14px', resize: 'vertical',
                fontFamily: 'inherit', color: '#111827',
              }}
            />
          </div>
        )}

        <div style={{ marginTop: '24px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={busy || loading}
            style={{
              padding: '8px 18px', borderRadius: '6px', fontSize: '14px',
              fontWeight: 500, border: '1px solid #d1d5db', background: '#fff',
              color: '#374151', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || busy || loading}
            style={{
              padding: '8px 18px', borderRadius: '6px', fontSize: '14px',
              fontWeight: 500, border: 'none',
              background: canConfirm ? confirmBg : '#e5e7eb',
              color: canConfirm ? '#fff' : '#9ca3af',
              cursor: canConfirm ? 'pointer' : 'not-allowed',
            }}
          >
            {busy || loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
