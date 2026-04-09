
'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PwaInstallCard } from '@/components/PwaInstallCard'

type TemplateOption = {
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

type ProfilePayload = {
  id?: string
  email: string
  display_name: string
  department: string
  location: string
  company_name: string
}

type RatesResponse = {
  rate?: TemplateOption
  templates?: TemplateOption[]
  error?: { message?: string }
}

type ProfileResponse = {
  profile?: ProfilePayload
  note?: string
  error?: { message?: string }
}

function f2(v: unknown) {
  const n = Number(v)
  return Number.isNaN(n) ? '' : n.toFixed(2)
}

function averageMeal(morning: string, noon: string, evening: string) {
  const values = [morning, noon, evening].map((v) => Number(v) || 0)
  return ((values[0] + values[1] + values[2]) / 3).toFixed(2)
}

function fmtTemplate(template: TemplateOption) {
  const name = template.template_name ?? 'Template'
  return template.effective_from ? `${name} · ${template.effective_from}` : name
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)

  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileNote, setProfileNote] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfilePayload>({
    email: '',
    display_name: '',
    department: '',
    location: '',
    company_name: '',
  })

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
    async function loadAll() {
      try {
        const [profileRes, ratesRes] = await Promise.all([
          fetch('/api/settings/profile'),
          fetch('/api/settings/rates'),
        ])
        const profileJson: ProfileResponse = await profileRes.json()
        const ratesJson: RatesResponse = await ratesRes.json()
        if (!active) return

        if (profileRes.ok && profileJson.profile) {
          setProfile(profileJson.profile)
          setProfileNote(profileJson.note ?? null)
        } else {
          setProfileError(profileJson.error?.message ?? 'Failed to load profile.')
        }

        if (ratesRes.ok) {
          const rate = ratesJson.rate
          setTemplates(ratesJson.templates ?? [])
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
        } else {
          setError(ratesJson.error?.message ?? 'Failed to load personal rates.')
        }
      } catch {
        if (!active) return
        setProfileError('Failed to load profile.')
        setError('Failed to load personal rates.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadAll()
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
    setRateLabel(template.rate_label ?? `Copied from ${template.template_name ?? 'Template'}`)
    setNotes(template.notes ?? '')
    setMileage(f2(template.mileage_rate_per_km))
    setMorning(f2(template.meal_rate_morning))
    setNoon(f2(template.meal_rate_noon))
    setEvening(f2(template.meal_rate_evening))
    setFullDay(f2(template.meal_rate_full_day))
    setLodging(f2(template.lodging_rate_default))
    setPerdiem(f2(template.perdiem_rate_myr))
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileSaved(false)
    setProfileError(null)

    try {
      const res = await fetch('/api/settings/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      const json: ProfileResponse = await res.json()
      if (!res.ok) {
        setProfileError(json.error?.message ?? 'Failed to save profile.')
        return
      }
      setProfile(json.profile ?? profile)
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3200)
    } catch {
      setProfileError('Network error. Please try again.')
    } finally {
      setProfileSaving(false)
    }
  }

  async function handleSaveRates(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)

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
        setError(json.error?.message ?? 'Failed to save personal rates.')
        return
      }
      setEffFrom(json.rate?.effective_from ?? null)
      setSaved(true)
      setTimeout(() => setSaved(false), 3200)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={S.loading}>Loading…</div>

  return (
    <div style={S.page}>
      <h1 style={S.pageTitle}>Settings</h1>

      <form onSubmit={handleSaveProfile} style={S.form}>
        <Card icon="👤" title="Claimant Profile" sub="Used in PDF header and claimant declaration. Company here means your employer company, not the organization / agent managing your enrolment.">
          <Field label="Full Name"><input value={profile.display_name} onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))} style={S.input} /></Field>
          <Field label="Email">
            <input value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} style={S.input} />
          </Field>
          {profileNote && <div style={S.info}>{profileNote}</div>}
          <div style={S.grid2}>
            <Field label="Department"><input value={profile.department} onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))} style={S.input} /></Field>
            <Field label="Location"><input value={profile.location} onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))} style={S.input} /></Field>
          </div>
          <Field label="Company Name"><input value={profile.company_name} onChange={(e) => setProfile((p) => ({ ...p, company_name: e.target.value }))} style={S.input} /></Field>
          {profileError && <div style={S.error}>{profileError}</div>}
          {profileSaved && <div style={S.success}>✓ Profile saved.</div>}
          <button type="submit" disabled={profileSaving} style={S.btnPrimary}>{profileSaving ? 'Saving…' : 'Save Profile'}</button>
        </Card>
      </form>

      <form onSubmit={handleSaveRates} style={S.form}>
        <Card icon="📲" title="App Install" sub="Install myexpensio on your device for a faster, more app-like experience.">
          <PwaInstallCard />
        </Card>

        <Card icon="📚" title="Rate Template Reference" sub="Choose any company standard template created by admin. Selecting one only fills the form below. Click Save Personal Rates to make it yours.">
          <Field label="Reference Template">
            <select value={selectedTemplateId} onChange={(e) => applyTemplate(e.target.value)} style={S.input}>
              <option value="">Use my current personal rates</option>
              {templates.map((template) => (
                <option key={`${template.id ?? 'x'}-${template.effective_from ?? ''}`} value={template.id ?? ''}>
                  {fmtTemplate(template)}
                </option>
              ))}
            </select>
          </Field>
          <div style={S.info}>Templates are company standard claim-rate references managed by admin. Your saved personal rate is the actual rate used for new claims.</div>
        </Card>

        <Card icon="🧾" title="Personal Rate Profile" sub="This is your own rate record for claim calculations.">
          <Field label="Rate Label"><input value={rateLabel} onChange={(e) => setRateLabel(e.target.value)} style={S.input} /></Field>
          <Field label="Notes"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={S.textarea} /></Field>
        </Card>

        <Card icon="🚗" title="Mileage Rate" sub="Used for mileage claim item calculation.">
          <RateRow label="Rate per km" suffix="/km" value={mileage} onChange={(v) => num(v, setMileage)} />
        </Card>

        <Card icon="🍽️" title="Meal Rates" sub="Personal fixed-rate values when no receipt is used.">
          <RateRow label="Morning" suffix="/session" value={morning} onChange={(v) => num(v, setMorning)} />
          <RateRow label="Noon" suffix="/session" value={noon} onChange={(v) => num(v, setNoon)} />
          <RateRow label="Evening" suffix="/session" value={evening} onChange={(v) => num(v, setEvening)} />
          <RateRow label="Full Day" suffix="/day" value={fullDay} onChange={(v) => num(v, setFullDay)} />
          <div style={S.info}>Calculated meal average per session: <strong>MYR {mealAverage}</strong></div>
        </Card>

        <Card icon="🏨" title="Lodging Rate" sub="Personal default for lodging without receipt override.">
          <RateRow label="Rate per night" suffix="/night" value={lodging} onChange={(v) => num(v, setLodging)} />
        </Card>

        <Card icon="📅" title="Per Diem Allowance" sub="Personal default daily travel allowance.">
          <RateRow label="Daily allowance rate" suffix="/day" value={perdiem} onChange={(v) => num(v, setPerdiem)} />
        </Card>

        <Card icon="🔐" title="Password" sub="Change your signed-in account password.">
          <div style={S.passwordBox}>
            <div>
              <div style={S.passwordTitle}>Change Password</div>
              <div style={S.passwordSub}>Best done while your session is still fresh after login.</div>
            </div>
            <button type="button" onClick={() => setShowPwModal(true)} style={S.btnSecondary}>Change Password</button>
          </div>
        </Card>

        {error && <div style={S.error}>{error}</div>}
        {saved && <div style={S.success}>✓ Personal rates saved.</div>}
        {effFrom && <div style={S.note}>Current personal rate effective from <strong>{effFrom}</strong>.</div>}

        <button type="submit" disabled={saving} style={S.btnPrimary}>{saving ? 'Saving…' : 'Save Personal Rates'}</button>
      </form>

      {showPwModal && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}
    </div>
  )
}

function Card({ icon, title, sub, children }: { icon: string; title: string; sub: string; children: React.ReactNode }) {
  return (
    <div style={S.card}>
      <div style={S.cardHead}>
        <span style={S.cardIcon}>{icon}</span>
        <div>
          <div style={S.cardTitle}>{title}</div>
          <div style={S.cardSub}>{sub}</div>
        </div>
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={S.field}>
      <label style={S.label}>{label}</label>
      {children}
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
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
          <Field label="New password">
            <div style={S.passwordWrap}>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} style={S.passwordInput} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} style={S.eyeBtn}>{showPassword ? '🙈' : '👁'}</button>
            </div>
          </Field>
          <Field label="Confirm new password">
            <div style={S.passwordWrap}>
              <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={S.passwordInput} />
              <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} style={S.eyeBtn}>{showConfirmPassword ? '🙈' : '👁'}</button>
            </div>
          </Field>
          {error && <div style={S.error}>{error}</div>}
          {success && <div style={S.success}>{success}</div>}
          <div style={S.modalFooter}>
            <button type="button" onClick={onClose} style={S.btnSecondary}>Cancel</button>
            <button type="submit" disabled={saving} style={S.btnPrimary}>{saving ? 'Saving…' : 'Save Password'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RateRow({ label, suffix, value, onChange }: { label: string; suffix: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={S.rateRow}>
      <span style={S.rateLabel}>{label}</span>
      <div style={S.rateRight}>
        <span style={S.ratePre}>MYR</span>
        <input value={value} onChange={(e) => onChange(e.target.value)} inputMode="decimal" style={S.rateInput} />
        <span style={S.rateSuf}>{suffix}</span>
      </div>
    </div>
  )
}

const S: Record<string, CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 80 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  pageTitle: { fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 },
  loading: { padding: 24, color: '#64748b' },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 },
  card: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 },
  cardHead: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 },
  cardIcon: { fontSize: 22 },
  cardTitle: { fontSize: 14, fontWeight: 700, color: '#0f172a' },
  cardSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, color: '#0f172a', boxSizing: 'border-box', backgroundColor: '#fff' },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, color: '#0f172a', boxSizing: 'border-box', backgroundColor: '#fff', resize: 'vertical' },
  info: { padding: '8px 10px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, fontSize: 11, color: '#0369a1', lineHeight: 1.5 },
  error: { padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626' },
  success: { padding: '10px 12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13, color: '#15803d' },
  note: { fontSize: 12, color: '#64748b' },
  btnPrimary: { padding: '14px 20px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  btnSecondary: { padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#0f172a', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  rateRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rateLabel: { fontSize: 13, color: '#374151', flex: 1 },
  rateRight: { display: 'flex', alignItems: 'center', gap: 6 },
  ratePre: { fontSize: 12, color: '#64748b', fontWeight: 600 },
  rateInput: { width: 76, padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, fontWeight: 700, color: '#0f172a', backgroundColor: '#fff', textAlign: 'right' },
  rateSuf: { fontSize: 12, color: '#94a3b8', minWidth: 56 },
  passwordBox: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 10, backgroundColor: '#f8fafc' },
  passwordTitle: { fontSize: 13, fontWeight: 700, color: '#0f172a' },
  passwordSub: { fontSize: 11, color: '#64748b', marginTop: 3 },
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal: { width: '100%', maxWidth: 460, backgroundColor: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.12)', overflow: 'hidden' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottom: '1px solid #f1f5f9' },
  modalTitle: { fontSize: 16, fontWeight: 700, color: '#0f172a' },
  modalCloseBtn: { background: 'none', border: 'none', color: '#94a3b8', fontSize: 16, cursor: 'pointer' },
  modalBody: { display: 'flex', flexDirection: 'column', gap: 14, padding: 20 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 8 },
  passwordWrap: { position: 'relative', width: '100%' },
  passwordInput: { width: '100%', padding: '10px 42px 10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, color: '#0f172a', backgroundColor: '#fff', boxSizing: 'border-box' },
  eyeBtn: { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, color: '#64748b', padding: 0, lineHeight: 1 },
}
