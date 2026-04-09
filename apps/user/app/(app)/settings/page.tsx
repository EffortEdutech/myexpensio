'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'

type TemplateOption = {
  id: string
  template_name: string | null
  effective_from: string | null
  currency: string
  mileage_rate_per_km: number
  meal_rate_default: number
  meal_rate_per_session: number
  meal_rate_morning: number
  meal_rate_noon: number
  meal_rate_evening: number
  meal_rate_full_day: number
  lodging_rate_default: number
  perdiem_rate_myr: number
  rate_label: string | null
  notes: string | null
}

type RatePayload = {
  id: string | null
  template_name: string | null
  effective_from: string | null
  currency: string
  mileage_rate_per_km: number
  meal_rate_default: number
  meal_rate_per_session: number
  meal_rate_morning: number
  meal_rate_noon: number
  meal_rate_evening: number
  meal_rate_full_day: number
  lodging_rate_default: number
  perdiem_rate_myr: number
  rate_label: string | null
  notes: string | null
}

type RatesResponse = {
  rate?: RatePayload
  defaults?: Partial<RatePayload>
  templates?: TemplateOption[]
  error?: {
    message?: string
  }
}

function f2(v: unknown) {
  const n = Number(v)
  return Number.isNaN(n) ? '' : n.toFixed(2)
}

function averageMeal(morning: string, noon: string, evening: string) {
  const values = [morning, noon, evening].map((v) => Number(v) || 0)
  return ((values[0] + values[1] + values[2]) / 3).toFixed(2)
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [templates, setTemplates] = useState<TemplateOption[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [effFrom, setEffFrom] = useState<string | null>(null)

  const [rateLabel, setRateLabel] = useState('Personal Rate')
  const [notes, setNotes] = useState('')
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

        const rate = json.rate
        setTemplates(json.templates ?? [])
        setRateLabel(rate?.rate_label ?? 'Personal Rate')
        setNotes(rate?.notes ?? '')
        setMileage(f2(rate?.mileage_rate_per_km ?? 0.6))
        setMorning(f2(rate?.meal_rate_morning ?? 20))
        setNoon(f2(rate?.meal_rate_noon ?? 30))
        setEvening(f2(rate?.meal_rate_evening ?? 30))
        setFullDay(f2(rate?.meal_rate_full_day ?? 60))
        setLodging(f2(rate?.lodging_rate_default ?? 120))
        setPerdiem(f2(rate?.perdiem_rate_myr ?? 0))
        setEffFrom(rate?.effective_from ?? null)
      } catch {
        if (!active) return
        setError('Failed to load your personal rates.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadRates()
    return () => {
      active = false
    }
  }, [])

  const mealAverage = useMemo(() => averageMeal(morning, noon, evening), [morning, noon, evening])

  function num(val: string, set: (v: string) => void) {
    if (val === '' || /^\d*\.?\d*$/.test(val)) set(val)
  }

  function applyTemplate(templateId: string) {
    setSelectedTemplateId(templateId)
    const template = templates.find((item) => item.id === templateId)
    if (!template) return

    setRateLabel(`Copied from ${template.template_name ?? 'Template'}`)
    setMileage(f2(template.mileage_rate_per_km))
    setMorning(f2(template.meal_rate_morning))
    setNoon(f2(template.meal_rate_noon))
    setEvening(f2(template.meal_rate_evening))
    setFullDay(f2(template.meal_rate_full_day))
    setLodging(f2(template.lodging_rate_default))
    setPerdiem(f2(template.perdiem_rate_myr))
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
          template_id: selectedTemplateId || undefined,
          mileage_rate_per_km: parseFloat(mileage) || 0.6,
          meal_rate_default: parseFloat(mealAverage) || 0,
          meal_rate_per_session: parseFloat(mealAverage) || 0,
          meal_rate_morning: parseFloat(morning) || 0,
          meal_rate_noon: parseFloat(noon) || 0,
          meal_rate_evening: parseFloat(evening) || 0,
          meal_rate_full_day: parseFloat(fullDay) || 0,
          lodging_rate_default: parseFloat(lodging) || 0,
          perdiem_rate_myr: parseFloat(perdiem) || 0,
          rate_label: rateLabel,
          notes,
        }),
      })

      const json: RatesResponse = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Failed to save.')
        return
      }

      setEffFrom(json.rate?.effective_from ?? null)
      setRateLabel(json.rate?.rate_label ?? rateLabel)
      setNotes(json.rate?.notes ?? notes)
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
            <span style={S.cardIcon}>📚</span>
            <div>
              <div style={S.cardTitle}>Rate Template Reference</div>
              <div style={S.cardSub}>Optional. Choose a reference template, then adjust your own personal rates.</div>
            </div>
          </div>

          <label style={S.label}>Reference Template</label>
          <select
            value={selectedTemplateId}
            onChange={(e) => applyTemplate(e.target.value)}
            style={S.select}
          >
            <option value="">Use my current personal rates</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {(template.template_name ?? 'Template')} · {(template.effective_from ?? '').toString()}
              </option>
            ))}
          </select>

          <div style={S.infoBox}>
            Templates are admin-managed references only. Your saved personal rate below is the actual rate used for new claims.
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={S.cardIcon}>🧾</span>
            <div>
              <div style={S.cardTitle}>Personal Rate Profile</div>
              <div style={S.cardSub}>This is your own rate record for claim calculations.</div>
            </div>
          </div>

          <div style={S.field}>
            <label style={S.label}>Rate Label</label>
            <input value={rateLabel} onChange={(e) => setRateLabel(e.target.value)} style={S.input} />
          </div>

          <div style={S.field}>
            <label style={S.label}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={S.textarea} rows={3} />
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={S.cardIcon}>🚗</span>
            <div>
              <div style={S.cardTitle}>Mileage Rate</div>
              <div style={S.cardSub}>Used for mileage claim item calculation.</div>
            </div>
          </div>
          <RateRow label="Rate per km" suffix="/km" value={mileage} onChange={(v) => num(v, setMileage)} />
        </div>

        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={S.cardIcon}>🍽️</span>
            <div>
              <div style={S.cardTitle}>Meal Rates</div>
              <div style={S.cardSub}>Personal fixed-rate values when no receipt is used.</div>
            </div>
          </div>

          <RateRow label="🌅 Morning" suffix="/session" value={morning} onChange={(v) => num(v, setMorning)} />
          <div style={S.rowDiv} />
          <RateRow label="🌤 Noon" suffix="/session" value={noon} onChange={(v) => num(v, setNoon)} />
          <div style={S.rowDiv} />
          <RateRow label="🌙 Evening" suffix="/session" value={evening} onChange={(v) => num(v, setEvening)} />
          <div style={S.sep} />
          <RateRow label="☀️ Full Day" suffix="/day" value={fullDay} onChange={(v) => num(v, setFullDay)} />

          <div style={S.infoBox}>Calculated meal average per session: <strong>MYR {mealAverage}</strong></div>
        </div>

        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={S.cardIcon}>🏨</span>
            <div>
              <div style={S.cardTitle}>Lodging Rate</div>
              <div style={S.cardSub}>Personal default for lodging without receipt override.</div>
            </div>
          </div>
          <RateRow label="Rate per night" suffix="/night" value={lodging} onChange={(v) => num(v, setLodging)} />
        </div>

        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={S.cardIcon}>📅</span>
            <div>
              <div style={S.cardTitle}>Per Diem Allowance</div>
              <div style={S.cardSub}>Personal default daily travel allowance.</div>
            </div>
          </div>
          <RateRow label="Daily allowance rate" suffix="/day" value={perdiem} onChange={(v) => num(v, setPerdiem)} />
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
        {saved && <div style={S.successBox}>✓ Personal rates saved.</div>}

        {effFrom && (
          <p style={S.effNote}>
            Current personal rate effective from{' '}
            <strong>
              {new Date(effFrom).toLocaleDateString('en-MY', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </strong>
            .
          </p>
        )}

        <button type="submit" disabled={saving} style={{ ...S.btnSave, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Save Personal Rates'}
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
          <button onClick={onClose} style={S.modalCloseBtn} type="button">✕</button>
        </div>

        <form onSubmit={handleSubmit} style={S.modalBody}>
          <p style={S.modalNote}>Enter a new password for your account.</p>

          <PasswordField id="new-password" label="New password" value={password} onChange={setPassword} placeholder="At least 8 characters" show={showPassword} onToggle={() => setShowPassword((v) => !v)} disabled={saving} />
          <PasswordField id="confirm-password" label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Re-enter password" show={showConfirmPassword} onToggle={() => setShowConfirmPassword((v) => !v)} disabled={saving} />

          {error && <div style={S.errorBox}>{error}</div>}
          {success && <div style={S.successBox}>{success}</div>}

          <div style={S.modalFooter}>
            <button type="button" onClick={onClose} style={S.btnGhost} disabled={saving}>Cancel</button>
            <button type="submit" disabled={saving} style={{ ...S.btnSave, marginTop: 0, width: 'auto', minWidth: 150, opacity: saving ? 0.6 : 1 }}>
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
      <label style={S.label} htmlFor={id}>{label}</label>
      <div style={S.passwordWrap}>
        <input id={id} type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={S.passwordInput} autoComplete="new-password" required disabled={disabled} />
        <button type="button" onClick={onToggle} style={{ ...S.eyeBtn, opacity: disabled ? 0.5 : 1 }} aria-label={show ? 'Hide password' : 'Show password'} title={show ? 'Hide password' : 'Show password'} disabled={disabled}>
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
  page: { display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 80 },
  pageTitle: { fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  loadingWrap: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 },
  loadingSpinner: {
    width: 32, height: 32, borderRadius: '50%', border: '3px solid #e2e8f0', borderTop: '3px solid #0f172a',
  },
  card: {
    backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
  },
  cardHead: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 },
  cardIcon: { fontSize: 22 },
  cardTitle: { fontSize: 14, fontWeight: 700, color: '#0f172a' },
  cardSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, color: '#0f172a', boxSizing: 'border-box',
  },
  textarea: {
    width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, color: '#0f172a', boxSizing: 'border-box', resize: 'vertical',
  },
  select: {
    width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, color: '#0f172a', backgroundColor: '#fff',
  },
  rateRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 5, paddingBottom: 5, gap: 12 },
  rateLabel: { fontSize: 13, color: '#374151', flex: 1 },
  rateRight: { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 },
  ratePre: { fontSize: 12, color: '#64748b', fontWeight: 600 },
  rateInput: {
    width: 76, padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, fontWeight: 700, color: '#0f172a', backgroundColor: '#fff', textAlign: 'right',
  },
  rateSuf: { fontSize: 12, color: '#94a3b8', minWidth: 56 },
  rowDiv: { height: 1, backgroundColor: '#f8fafc', marginTop: 2, marginBottom: 2 },
  sep: { height: 1, backgroundColor: '#e2e8f0', marginTop: 10, marginBottom: 10 },
  infoBox: {
    marginTop: 4, padding: '8px 10px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, fontSize: 11, color: '#0369a1', lineHeight: 1.6,
  },
  errorBox: {
    padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626',
  },
  successBox: {
    padding: '10px 12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13, color: '#15803d', fontWeight: 600,
  },
  effNote: { fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.6 },
  btnSave: {
    padding: '14px 20px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },

  passwordBox: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 10, backgroundColor: '#f8fafc',
  },
  passwordTitle: { fontSize: 13, fontWeight: 700, color: '#0f172a' },
  passwordSub: { fontSize: 11, color: '#64748b', marginTop: 3, lineHeight: 1.5 },
  btnSecondary: {
    paddingTop: 10, paddingBottom: 10, paddingLeft: 14, paddingRight: 14, borderRadius: 10, border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#0f172a', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  btnGhost: {
    paddingTop: 10, paddingBottom: 10, paddingLeft: 14, paddingRight: 14, borderRadius: 10, border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000, padding: 16,
  },
  modal: {
    width: '100%', maxWidth: 460, backgroundColor: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.12)', overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 16, paddingLeft: 20, paddingRight: 20, borderBottom: '1px solid #f1f5f9',
  },
  modalTitle: { fontSize: 16, fontWeight: 700, color: '#0f172a' },
  modalCloseBtn: { background: 'none', border: 'none', color: '#94a3b8', fontSize: 16, cursor: 'pointer' },
  modalBody: { display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 16, paddingBottom: 16, paddingLeft: 20, paddingRight: 20 },
  modalNote: { margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.6 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  passwordWrap: { position: 'relative', width: '100%' },
  passwordInput: {
    paddingTop: 10, paddingBottom: 10, paddingLeft: 12, paddingRight: 42, border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, color: '#0f172a', backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box', WebkitTextFillColor: '#0f172a', width: '100%',
  },
  eyeBtn: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, color: '#64748b', padding: 0, lineHeight: 1,
  },
}

