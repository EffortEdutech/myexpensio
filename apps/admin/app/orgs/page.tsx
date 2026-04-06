// apps\admin\app\orgs\page.tsx

'use client'

import { useMemo, useState } from 'react'

const BETA_ORG = {
  id: '9ea0f094-bd28-49ad-bc25-756eaabb860b',
  name: 'Beta Organisation',
  status: 'ACTIVE',
}

type OrgRole = 'OWNER' | 'MANAGER' | 'MEMBER'

type ProvisionResponse = {
  success?: boolean
  mode?: 'CREATED' | 'RESET' | 'ALREADY_EXISTS'
  user?: {
    id: string
    email: string
    display_name: string
  }
  org?: {
    id: string
    name: string
    org_role: OrgRole
  }
  credentials?: {
    email: string
    temp_password: string | null
    note?: string
  }
  error?: {
    code?: string
    message?: string
  }
}

export default function OrgsListPage() {
  const [showModal, setShowModal] = useState(false)
  const [provisionCount, setProvisionCount] = useState(0)

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Organizations</h1>
          <p style={S.subtitle}>
            Beta rollout console — direct beta access provisioning for the first 30 users.
          </p>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.cardTop}>
          <div>
            <div style={S.cardTitle}>{BETA_ORG.name}</div>
            <div style={S.cardMeta}>Org ID: {BETA_ORG.id}</div>
          </div>

          <span
            style={{
              ...S.badge,
              backgroundColor: BETA_ORG.status === 'ACTIVE' ? '#f0fdf4' : '#fef2f2',
              color: BETA_ORG.status === 'ACTIVE' ? '#15803d' : '#dc2626',
            }}
          >
            {BETA_ORG.status}
          </span>
        </div>

        <div style={S.infoGrid}>
          <InfoBox label="Rollout Mode" value="Direct Beta Access" sub="No email invite required" />
          <InfoBox label="Target Users" value="30" sub="Single-org beta cohort" />
          <InfoBox label="Provisioned This Session" value={String(provisionCount)} sub="Browser session count" />
        </div>

        <div style={S.actions}>
          <button type="button" onClick={() => setShowModal(true)} style={S.primaryBtn}>
            + Add Beta User
          </button>
        </div>
      </div>

      <div style={S.noteCard}>
        <div style={S.noteTitle}>How this beta path works</div>
        <div style={S.noteText}>
          Admin pre-provisions the user under <strong>Beta Organisation</strong>, returns a temporary password once,
          and the user logs in directly with email + temporary password. After login, the user changes password in
          Settings.
        </div>
      </div>

      {showModal && (
        <ProvisionBetaUserModal
          orgId={BETA_ORG.id}
          orgName={BETA_ORG.name}
          onClose={() => setShowModal(false)}
          onProvisioned={() => setProvisionCount((n) => n + 1)}
        />
      )}
    </div>
  )
}

function InfoBox({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={S.infoBox}>
      <div style={S.infoValue}>{value}</div>
      <div style={S.infoLabel}>{label}</div>
      <div style={S.infoSub}>{sub}</div>
    </div>
  )
}

function ProvisionBetaUserModal({
  orgId,
  orgName,
  onClose,
  onProvisioned,
}: {
  orgId: string
  orgName: string
  onClose: () => void
  onProvisioned: () => void
}) {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [orgRole, setOrgRole] = useState<OrgRole>('MEMBER')
  const [resetIfExists, setResetIfExists] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ProvisionResponse | null>(null)
  const [copied, setCopied] = useState<'email' | 'password' | 'all' | null>(null)

  const trimmedEmail = useMemo(() => email.trim().toLowerCase(), [email])

  function suggestedDisplayName() {
    return trimmedEmail || displayName
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)

    if (!trimmedEmail) {
      setError('Email is required.')
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/beta/provision-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          org_role: orgRole,
          display_name: displayName.trim() || trimmedEmail,
          reset_if_exists: resetIfExists,
          send_email: true,
        }),
      })

      const json: ProvisionResponse = await res.json()

      if (!res.ok) {
        setError(json.error?.message ?? 'Failed to provision beta user.')
        return
      }

      setResult(json)
      onProvisioned()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function copyText(kind: 'email' | 'password' | 'all') {
    if (!result?.credentials?.email) return

    let text = ''

    if (kind === 'email') {
      text = result.credentials.email
    } else if (kind === 'password') {
      text = result.credentials.temp_password ?? ''
    } else {
      text = [
        `Organisation: ${result.org?.name ?? orgName}`,
        `Email: ${result.credentials.email}`,
        `Temporary password: ${result.credentials.temp_password ?? '(not reset)'}`,
      ].join('\n')
    }

    if (!text) return

    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      setTimeout(() => setCopied(null), 1200)
    } catch {
      setCopied(null)
    }
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <div>
            <div style={S.modalTitle}>Add Beta User</div>
            <div style={S.modalSub}>{orgName}</div>
          </div>

          <button type="button" onClick={onClose} style={S.closeBtn}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={S.modalBody}>
          <div style={S.field}>
            <label style={S.label} htmlFor="beta-email">
              Email
            </label>
            <input
              id="beta-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tester@example.com"
              style={S.input}
              disabled={saving}
              required
            />
          </div>

          <div style={S.field}>
            <label style={S.label} htmlFor="beta-display-name">
              Display Name
            </label>
            <input
              id="beta-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={trimmedEmail ? trimmedEmail : 'Defaults to email'}
              style={S.input}
              disabled={saving}
            />
            <div style={S.hint}>Default for beta: email address</div>
          </div>

          <div style={S.field}>
            <label style={S.label} htmlFor="beta-role">
              Organisation Role
            </label>
            <select
              id="beta-role"
              value={orgRole}
              onChange={(e) => setOrgRole(e.target.value as OrgRole)}
              style={S.select}
              disabled={saving}
            >
              <option value="MEMBER">MEMBER</option>
              <option value="MANAGER">MANAGER</option>
              <option value="OWNER">OWNER</option>
            </select>
          </div>

          <label style={S.checkboxRow}>
            <input
              type="checkbox"
              checked={resetIfExists}
              onChange={(e) => setResetIfExists(e.target.checked)}
              disabled={saving}
            />
            <span>Reset temporary password if user already exists</span>
          </label>

          <div style={S.summaryBox}>
            <div style={S.summaryTitle}>Provision Summary</div>
            <div style={S.summaryText}>Organisation: <strong>{orgName}</strong></div>
            <div style={S.summaryText}>Org ID: <strong>{orgId}</strong></div>
            <div style={S.summaryText}>Email: <strong>{trimmedEmail || '—'}</strong></div>
            <div style={S.summaryText}>Display Name: <strong>{displayName.trim() || suggestedDisplayName() || '—'}</strong></div>
            <div style={S.summaryText}>Role: <strong>{orgRole}</strong></div>
          </div>

          {error && <div style={S.errorBox}>{error}</div>}

          {result?.success && (
            <div style={S.resultCard}>
              <div style={S.resultTitle}>
                {result.mode === 'CREATED'
                  ? 'Beta user created'
                  : result.mode === 'RESET'
                    ? 'Temporary password reset'
                    : 'User already exists'}
              </div>

              <div style={S.resultRow}>
                <span style={S.resultLabel}>Email</span>
                <span style={S.resultValue}>{result.credentials?.email ?? '—'}</span>
              </div>

              <div style={S.resultRow}>
                <span style={S.resultLabel}>Temp Password</span>
                <span style={S.resultValueMono}>{result.credentials?.temp_password ?? 'Not reset'}</span>
              </div>

              <div style={S.resultRow}>
                <span style={S.resultLabel}>Role</span>
                <span style={S.resultValue}>{result.org?.org_role ?? orgRole}</span>
              </div>

              {result.credentials?.note && (
                <div style={S.resultNote}>{result.credentials.note}</div>
              )}

              <div style={S.resultActions}>
                <button type="button" onClick={() => copyText('email')} style={S.copyBtn}>
                  {copied === 'email' ? 'Copied Email' : 'Copy Email'}
                </button>
                <button
                  type="button"
                  onClick={() => copyText('password')}
                  style={S.copyBtn}
                  disabled={!result.credentials?.temp_password}
                >
                  {copied === 'password' ? 'Copied Password' : 'Copy Password'}
                </button>
                <button type="button" onClick={() => copyText('all')} style={S.copyBtn}>
                  {copied === 'all' ? 'Copied All' : 'Copy All'}
                </button>
              </div>
            </div>
          )}

          <div style={S.modalFooter}>
            <button type="button" onClick={onClose} style={S.secondaryBtn} disabled={saving}>
              Close
            </button>
            <button type="submit" style={{ ...S.primaryBtn, minWidth: 170, opacity: saving ? 0.65 : 1 }} disabled={saving}>
              {saving ? 'Provisioning…' : 'Provision Beta User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    margin: 0,
    color: '#111827',
  },
  subtitle: {
    margin: '6px 0 0',
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 1.6,
  },
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    padding: 20,
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 18,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: '#111827',
  },
  cardMeta: {
    marginTop: 6,
    fontSize: 12,
    color: '#6b7280',
    wordBreak: 'break-all',
  },
  badge: {
    padding: '6px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 12,
    marginBottom: 18,
  },
  infoBox: {
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 14,
    background: '#f9fafb',
  },
  infoValue: {
    fontSize: 22,
    fontWeight: 800,
    color: '#111827',
  },
  infoLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: 700,
    color: '#374151',
  },
  infoSub: {
    marginTop: 4,
    fontSize: 11,
    color: '#6b7280',
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  primaryBtn: {
    border: 'none',
    background: '#111827',
    color: '#fff',
    padding: '12px 16px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  secondaryBtn: {
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#111827',
    padding: '12px 16px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  noteCard: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 14,
    padding: 16,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: '#111827',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 1.7,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(17,24,39,0.45)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  modal: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '90vh',
    overflow: 'auto',
    background: '#fff',
    borderRadius: 18,
    border: '1px solid #e5e7eb',
    boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    padding: 20,
    borderBottom: '1px solid #f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: '#111827',
  },
  modalSub: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b7280',
  },
  closeBtn: {
    border: 'none',
    background: 'transparent',
    color: '#6b7280',
    fontSize: 18,
    cursor: 'pointer',
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    padding: 20,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 700,
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: '11px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 10,
    fontSize: 14,
    color: '#111827',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '11px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 10,
    fontSize: 14,
    color: '#111827',
    background: '#fff',
    boxSizing: 'border-box',
  },
  hint: {
    fontSize: 11,
    color: '#6b7280',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 13,
    color: '#374151',
  },
  summaryBox: {
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 14,
    background: '#f9fafb',
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: '#111827',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 12,
    color: '#4b5563',
    lineHeight: 1.7,
  },
  errorBox: {
    border: '1px solid #fecaca',
    background: '#fef2f2',
    color: '#b91c1c',
    borderRadius: 10,
    padding: '12px 14px',
    fontSize: 13,
    lineHeight: 1.5,
  },
  resultCard: {
    border: '1px solid #bbf7d0',
    background: '#f0fdf4',
    borderRadius: 12,
    padding: 14,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: '#166534',
    marginBottom: 10,
  },
  resultRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    padding: '6px 0',
    borderBottom: '1px dashed #d1fae5',
  },
  resultLabel: {
    fontSize: 12,
    color: '#166534',
    fontWeight: 700,
  },
  resultValue: {
    fontSize: 12,
    color: '#14532d',
    textAlign: 'right',
  },
  resultValueMono: {
    fontSize: 12,
    color: '#14532d',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    textAlign: 'right',
  },
  resultNote: {
    marginTop: 10,
    fontSize: 12,
    color: '#166534',
    lineHeight: 1.6,
  },
  resultActions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 12,
  },
  copyBtn: {
    border: '1px solid #86efac',
    background: '#fff',
    color: '#166534',
    padding: '8px 10px',
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
}