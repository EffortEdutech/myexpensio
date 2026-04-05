'use client'
// apps/user/app/(app)/settings/page.tsx

import { useEffect, useState, type CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'

type RatesResponse = {
  rate?: {
    mileage_rate_per_km?: number
    meal_rate_morning?: number
    meal_rate_noon?: number
    meal_rate_evening?: number
    meal_rate_full_day?: number
    lodging_rate_default?: number
    perdiem_rate_myr?: number
    effective_from?: string | null
  }
  error?: {
    message?: string
  }
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [effFrom, setEffFrom] = useState<string | null>(null)

  const [mileage, setMileage] = useState('0.60')
  const [morning, setMorning] = useState('20.00')
  const [noon, setNoon] = useState('30.00')
  const [evening, setEvening] = useState('30.00')
  const [fullDay, setFullDay] = useState('60.00')
  const [lodging, setLodging] = useState('120.00')
  const [perdiem, setPerdiem] = useState('0.00')

  const [showPwModal, setShowPwModal] = useState(false)

  useEffect(() => {
    let active = true

    async function loadRates() {
      try {
        const res = await fetch('/api/settings/rates')
        const json: RatesResponse = await res.json()

        if (!active) return

        const r = json.rate ?? {}

        setMileage(f2(r.mileage_rate_per_km ?? 0.6))
        setMorning(f2(r.meal_rate_morning ?? 20))
        setNoon(f2(r.meal_rate_noon ?? 30))
        setEvening(f2(r.meal_rate_evening ?? 30))
        setFullDay(f2(r.meal_rate_full_day ?? 60))
        setLodging(f2(r.lodging_rate_default ?? 120))
        setPerdiem(f2(r.perdiem_rate_myr ?? 0))
        setEffFrom(r.effective_from ?? null)
      } catch {
        if (!active) return
      } finally {
        if (active) setLoading(false)
      }
    }

    loadRates()

    return () => {
      active = false
    }
  }, [])

  function f2(v: unknown) {
    const n = Number(v)
    return Number.isNaN(n) ? '' : n.toFixed(2)
  }

  function num(val: string, set: (v: string) => void) {
    if (val === '' || /^\d*\.?\d*$/.test(val)) set(val)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const res = await fetch('/api/settings/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mileage_rate_per_km: parseFloat(mileage) || 0.6,
          meal_rate_morning: parseFloat(morning) || 20,
          meal_rate_noon: parseFloat(noon) || 30,
          meal_rate_evening: parseFloat(evening) || 30,
          meal_rate_full_day: parseFloat(fullDay) || 60,
          lodging_rate_default: parseFloat(lodging) || 120,
          perdiem_rate_myr: parseFloat(perdiem) || 0,
        }),
      })

      const json: RatesResponse = await res.json()

      if (!res.ok) {
        setError(json.error?.message ?? 'Failed to save.')
        return
      }

      setEffFrom(json.rate?.effective_from ?? null)
      setSaved(true)
      setTimeout(() => setSaved(false), 3500)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={S.loadingWrap}>
        <div style={S.loadingSpinner} />
      </div>
    )
  }

  return (
    <div style={S.page}>
      <h1 style={S.pageTitle}>Settings</h1>

      <form onSubmit={handleSave} style={S.form}>
        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={S.cardIcon}>🚗</span>
            <div>
              <div style={S.cardTitle}>Mileage Rate</div>
              <div style={S.cardSub}>Per kilometre driven</div>
            </div>
          </div>
          <RateRow label="Rate per km" suffix="/km" value={mileage} onChange={(v) => num(v, setMileage)} />
        </div>

        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={S.cardIcon}>🍽️</span>
            <div>
              <div style={S.cardTitle}>Meal Rates</div>
              <div style={S.cardSub}>Fixed-rate amounts when no receipt</div>
            </div>
          </div>

          <div style={S.groupLabel}>Meal Rate — Per Session</div>
          <RateRow label="🌅 Morning (Breakfast)" suffix="/session" value={morning} onChange={(v) => num(v, setMorning)} />
          <div style={S.rowDiv} />
          <RateRow label="🌤 Noon (Lunch)" suffix="/session" value={noon} onChange={(v) => num(v, setNoon)} />
          <div style={S.rowDiv} />
          <RateRow label="🌙 Evening (Dinner)" suffix="/session" value={evening} onChange={(v) => num(v, setEvening)} />

          <div style={S.sep} />

          <div style={S.groupLabel}>Meal Rate — Full Day</div>
          <RateRow label="☀️ Full Day (all sessions)" suffix="/day" value={fullDay} onChange={(v) => num(v, setFullDay)} />
        </div>

        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={S.cardIcon}>🏨</span>
            <div>
              <div style={S.cardTitle}>Lodging Rate</div>
              <div style={S.cardSub}>Per night when no receipt provided</div>
            </div>
          </div>
          <RateRow label="Rate per night" suffix="/night" value={lodging} onChange={(v) => num(v, setLodging)} />
        </div>

        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={S.cardIcon}>📅</span>
            <div>
              <div style={S.cardTitle}>Per Diem Allowance</div>
              <div style={S.cardSub}>Daily travel allowance — auto-fills in claim</div>
            </div>
          </div>

          <RateRow label="Daily allowance rate" suffix="/day" value={perdiem} onChange={(v) => num(v, setPerdiem)} />

          <div style={S.infoBox}>
            💡 Set your org&apos;s standard daily rate here. This pre-fills when adding a Per Diem item to a claim. The user can still change it per-claim if needed. Set to 0 if not applicable.
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={S.cardIcon}>🔐</span>
            <div>
              <div style={S.cardTitle}>Password</div>
              <div style={S.cardSub}>Change your signed-in account password</div>
            </div>
          </div>

          <div style={S.passwordBox}>
            <div>
              <div style={S.passwordTitle}>Change Password</div>
              <div style={S.passwordSub}>Best done while your session is still fresh after login.</div>
            </div>

            <button type="button" onClick={() => setShowPwModal(true)} style={S.btnSecondary}>
              Change Password
            </button>
          </div>
        </div>

        {error && <div style={S.errorBox}>{error}</div>}
        {saved && <div style={S.successBox}>✓ Rates saved — new claims will use these rates.</div>}

        {effFrom && (
          <p style={S.effNote}>
            Current rates effective from{' '}
            <strong>
              {new Date(effFrom).toLocaleDateString('en-MY', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </strong>
            . Saving creates a new version effective today.
          </p>
        )}

        <button type="submit" disabled={saving} style={{ ...S.btnSave, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Save Rates'}
        </button>
      </form>

      {showPwModal && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}
    </div>
  )
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function validatePassword(value: string): string | null {
    if (value.length < 8) return 'Password must be at least 8 characters.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const pwError = validatePassword(password)
    if (pwError) {
      setError(pwError)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSaving(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess('Password updated successfully.')
      setTimeout(() => onClose(), 900)
    } catch {
      setError('Unable to update password right now. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <span style={S.modalTitle}>Change Password</span>
          <button onClick={onClose} style={S.modalCloseBtn} type="button">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={S.modalBody}>
          <p style={S.modalNote}>Enter a new password for your account.</p>

          <PasswordField
            id="new-password"
            label="New password"
            value={password}
            onChange={setPassword}
            placeholder="At least 8 characters"
            show={showPassword}
            onToggle={() => setShowPassword((v) => !v)}
            disabled={saving}
          />

          <PasswordField
            id="confirm-password"
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Re-enter password"
            show={showConfirmPassword}
            onToggle={() => setShowConfirmPassword((v) => !v)}
            disabled={saving}
          />

          {error && <div style={S.errorBox}>{error}</div>}
          {success && <div style={S.successBox}>{success}</div>}

          <div style={S.modalFooter}>
            <button type="button" onClick={onClose} style={S.btnGhost} disabled={saving}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                ...S.btnSave,
                marginTop: 0,
                width: 'auto',
                minWidth: 150,
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving…' : 'Save Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  show,
  onToggle,
  disabled,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  show: boolean
  onToggle: () => void
  disabled?: boolean
}) {
  return (
    <div style={S.field}>
      <label style={S.label} htmlFor={id}>
        {label}
      </label>

      <div style={S.passwordWrap}>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={S.passwordInput}
          autoComplete="new-password"
          required
          disabled={disabled}
        />

        <button
          type="button"
          onClick={onToggle}
          style={{ ...S.eyeBtn, opacity: disabled ? 0.5 : 1 }}
          aria-label={show ? 'Hide password' : 'Show password'}
          title={show ? 'Hide password' : 'Show password'}
          disabled={disabled}
        >
          {show ? '🙈' : '👁'}
        </button>
      </div>
    </div>
  )
}

function RateRow({
  label,
  suffix,
  value,
  onChange,
}: {
  label: string
  suffix: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div style={S.rateRow}>
      <span style={S.rateLabel}>{label}</span>
      <div style={S.rateRight}>
        <span style={S.ratePre}>MYR</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="decimal"
          style={S.rateInput}
        />
        <span style={S.rateSuf}>{suffix}</span>
      </div>
    </div>
  )
}

const S: Record<string, CSSProperties> = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    paddingBottom: 80,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  loadingWrap: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  loadingSpinner: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #0f172a',
  },
  card: {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    paddingTop: 14,
    paddingBottom: 16,
    paddingLeft: 16,
    paddingRight: 16,
    display: 'flex',
    flexDirection: 'column',
  },
  cardHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  cardIcon: {
    fontSize: 22,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0f172a',
  },
  cardSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 10,
    marginTop: 4,
  },
  rateRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 5,
    paddingBottom: 5,
    gap: 12,
  },
  rateLabel: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  rateRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  ratePre: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 600,
  },
  rateInput: {
    width: 76,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 700,
    color: '#0f172a',
    WebkitTextFillColor: '#0f172a',
    outline: 'none',
    backgroundColor: '#fff',
    textAlign: 'right',
  },
  rateSuf: {
    fontSize: 12,
    color: '#94a3b8',
    minWidth: 56,
  },
  rowDiv: {
    height: 1,
    backgroundColor: '#f8fafc',
    marginTop: 2,
    marginBottom: 2,
  },
  sep: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginTop: 14,
    marginBottom: 14,
  },
  infoBox: {
    marginTop: 10,
    padding: '8px 10px',
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: 8,
    fontSize: 11,
    color: '#0369a1',
    lineHeight: 1.6,
  },
  passwordBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '12px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
  },
  passwordTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#0f172a',
  },
  passwordSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
    lineHeight: 1.5,
  },
  btnSecondary: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 14,
    paddingRight: 14,
    borderRadius: 10,
    border: '1px solid #cbd5e1',
    backgroundColor: '#fff',
    color: '#0f172a',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  btnGhost: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 14,
    paddingRight: 14,
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    backgroundColor: '#fff',
    color: '#475569',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  errorBox: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 12,
    paddingRight: 12,
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    fontSize: 13,
    color: '#dc2626',
  },
  successBox: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 12,
    paddingRight: 12,
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 8,
    fontSize: 13,
    color: '#15803d',
    fontWeight: 600,
  },
  effNote: {
    fontSize: 12,
    color: '#94a3b8',
    margin: 0,
    lineHeight: 1.6,
  },
  btnSave: {
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 20,
    paddingRight: 20,
    backgroundColor: '#0f172a',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#fff',
    borderRadius: 16,
    border: '1px solid #e2e8f0',
    boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 20,
    paddingRight: 20,
    borderBottom: '1px solid #f1f5f9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#0f172a',
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: 16,
    cursor: 'pointer',
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 20,
    paddingRight: 20,
  },
  modalNote: {
    margin: 0,
    fontSize: 13,
    color: '#64748b',
    lineHeight: 1.6,
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
  },
  input: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 12,
    paddingRight: 12,
    border: '1.5px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
    WebkitTextFillColor: '#0f172a',
    width: '100%',
  },
  passwordWrap: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 12,
    paddingRight: 42,
    border: '1.5px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
    WebkitTextFillColor: '#0f172a',
    width: '100%',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: 16,
    color: '#64748b',
    padding: 0,
    lineHeight: 1,
  },
}