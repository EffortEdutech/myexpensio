'use client'
// apps/admin/app/(protected)/rates/WorkspaceRatesClient.tsx
//
// Full team rates editor for TEAM workspace OWNER/ADMIN.
//
// Layout:
//   Rate Template Reference  -- pick a global template to pre-fill the form
//   Team Rate Profile        -- editable rate fields; Save Team Rates to persist
//
// Rates are stored in admin_settings.settings.team_rate (per-org JSONB).
// Team employees in the user app apply these rates when submitting claims.

import { useState, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type GlobalTemplate = {
  id: string
  template_name: string | null
  effective_from: string
  currency: string
  mileage_rate_per_km:    number | null
  motorcycle_rate_per_km: number | null
  meal_rate_default:      number | null
  meal_rate_per_session:  number | null
  meal_rate_full_day:     number | null
  meal_rate_morning:      number | null
  meal_rate_noon:         number | null
  meal_rate_evening:      number | null
  lodging_rate_default:   number | null
  perdiem_rate_myr:       number | null
}

type FormState = {
  mileage_rate_per_km:    string
  motorcycle_rate_per_km: string
  meal_rate_morning:      string
  meal_rate_noon:         string
  meal_rate_evening:      string
  meal_rate_full_day:     string
  lodging_rate_default:   string
  perdiem_rate_myr:       string
  rate_label:    string
  notes:         string
  effective_from: string
}

// ── Defaults ───────────────────────────────────────────────────────────────────

const DEFAULTS = {
  mileage_rate_per_km:    0.60,
  motorcycle_rate_per_km: 0.30,
  meal_rate_morning:      20.00,
  meal_rate_noon:         30.00,
  meal_rate_evening:      30.00,
  meal_rate_full_day:     60.00,
  lodging_rate_default:   120.00,
  perdiem_rate_myr:       0.00,
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function rateToForm(rate: Record<string, unknown> | null): FormState {
  const r = rate ?? {}
  function get3(k: string, fb: number) {
    const v = r[k]; return v != null ? Number(v).toFixed(3) : fb.toFixed(3)
  }
  function get2(k: string, fb: number) {
    const v = r[k]; return v != null ? Number(v).toFixed(2) : fb.toFixed(2)
  }
  function str(k: string) {
    const v = r[k]; return typeof v === 'string' ? v : ''
  }
  return {
    mileage_rate_per_km:    get3('mileage_rate_per_km',    DEFAULTS.mileage_rate_per_km),
    motorcycle_rate_per_km: (() => { const v = r.motorcycle_rate_per_km; return v != null ? Number(v).toFixed(3) : '' })(),
    meal_rate_morning:  get2('meal_rate_morning',  DEFAULTS.meal_rate_morning),
    meal_rate_noon:     get2('meal_rate_noon',     DEFAULTS.meal_rate_noon),
    meal_rate_evening:  get2('meal_rate_evening',  DEFAULTS.meal_rate_evening),
    meal_rate_full_day: get2('meal_rate_full_day', DEFAULTS.meal_rate_full_day),
    lodging_rate_default: get2('lodging_rate_default', DEFAULTS.lodging_rate_default),
    perdiem_rate_myr:   get2('perdiem_rate_myr',   DEFAULTS.perdiem_rate_myr),
    rate_label:    str('rate_label'),
    notes:         str('notes'),
    effective_from: str('effective_from') || todayStr(),
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '--'
  return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtMoney(v: number | null | undefined, dec = 2) {
  if (v == null) return '--'
  return 'MYR ' + Number(v).toFixed(dec)
}

// ── UI primitives ──────────────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={'bg-white rounded-xl border border-gray-200' + (className ? ' ' + className : '')}>{children}</div>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 py-4 border-b border-gray-100">
      <h2 className="text-sm font-semibold text-gray-900">{children}</h2>
    </div>
  )
}

function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-4 space-y-4">{children}</div>
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-100">
      {children}
    </p>
  )
}

function Toast({ toast }: { toast: { type: 'ok' | 'err'; msg: string } | null }) {
  if (!toast) return null
  return (
    <div className={'fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ' + (
      toast.type === 'ok'
        ? 'bg-green-50 text-green-700 border-green-200'
        : 'bg-red-50 text-red-700 border-red-200'
    )}>
      {toast.msg}
    </div>
  )
}

const INPUT = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
const INPUT_DIS = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 bg-gray-50 cursor-not-allowed'
const SELECT = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'

// ── Rate Template Reference ────────────────────────────────────────────────────

function TemplateReference({
  templates,
  onApply,
}: {
  templates: GlobalTemplate[]
  onApply: (patch: Partial<FormState>) => void
}) {
  const templateNames = [...new Set(templates.map(t => t.template_name).filter(Boolean) as string[])]
  const [selectedName, setSelectedName] = useState('')
  const [selectedId,   setSelectedId]   = useState('')
  const [expanded,     setExpanded]     = useState(false)

  const versionsForName = templates.filter(t => t.template_name === selectedName)
  const selectedTemplate = templates.find(t => t.id === selectedId) ?? null

  function handleNameChange(name: string) {
    setSelectedName(name)
    const first = templates.find(t => t.template_name === name)
    setSelectedId(first?.id ?? '')
  }

  function applyTemplate() {
    if (!selectedTemplate) return
    const t = selectedTemplate
    onApply({
      mileage_rate_per_km:    t.mileage_rate_per_km    != null ? Number(t.mileage_rate_per_km).toFixed(3)    : '',
      motorcycle_rate_per_km: t.motorcycle_rate_per_km != null ? Number(t.motorcycle_rate_per_km).toFixed(3) : '',
      meal_rate_morning:  t.meal_rate_morning  != null ? Number(t.meal_rate_morning).toFixed(2)  : '',
      meal_rate_noon:     t.meal_rate_noon     != null ? Number(t.meal_rate_noon).toFixed(2)     : '',
      meal_rate_evening:  t.meal_rate_evening  != null ? Number(t.meal_rate_evening).toFixed(2)  : '',
      meal_rate_full_day: t.meal_rate_full_day != null ? Number(t.meal_rate_full_day).toFixed(2) : '',
      lodging_rate_default: t.lodging_rate_default != null ? Number(t.lodging_rate_default).toFixed(2) : '',
      perdiem_rate_myr:   t.perdiem_rate_myr   != null ? Number(t.perdiem_rate_myr).toFixed(2)   : '',
      rate_label:    t.template_name ? 'Based on ' + t.template_name : '',
      effective_from: t.effective_from ?? todayStr(),
    })
  }

  if (templates.length === 0) {
    return (
      <Card>
        <SectionTitle>Rate Template Reference</SectionTitle>
        <CardBody>
          <p className="text-sm text-gray-400">No global rate templates available yet. You can still enter your team rates manually below.</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        type="button"
      >
        <div>
          <p className="text-sm font-semibold text-gray-900">Rate Template Reference</p>
          <p className="text-xs text-gray-400 mt-0.5">Choose a standard template to pre-fill the form below</p>
        </div>
        <svg className={'w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ' + (expanded ? 'rotate-180' : '')}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4">
          <p className="text-xs text-gray-500">
            Selecting a template <strong>only pre-fills</strong> the form below — it does not save anything.
            Click <strong>Save Team Rates</strong> when you are happy with the values.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Template">
              <select value={selectedName} onChange={e => handleNameChange(e.target.value)} className={SELECT}>
                <option value="">-- Choose template --</option>
                {templateNames.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Version (effective from)">
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                disabled={!selectedName}
                className={SELECT + (!selectedName ? ' opacity-50 cursor-not-allowed' : '')}
              >
                {versionsForName.map(t => (
                  <option key={t.id} value={t.id}>{fmtDate(t.effective_from)}</option>
                ))}
              </select>
            </Field>
          </div>

          {selectedTemplate && (
            <div className="bg-gray-50 rounded-lg px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-gray-400 mb-1 font-medium uppercase tracking-wide">Mileage</p>
                <p className="text-gray-700">Car: {fmtMoney(selectedTemplate.mileage_rate_per_km, 3)}/km</p>
                {selectedTemplate.motorcycle_rate_per_km != null && (
                  <p className="text-gray-700">Moto: {fmtMoney(selectedTemplate.motorcycle_rate_per_km, 3)}/km</p>
                )}
              </div>
              <div>
                <p className="text-gray-400 mb-1 font-medium uppercase tracking-wide">Meals</p>
                <p className="text-gray-700">Morning {fmtMoney(selectedTemplate.meal_rate_morning)}</p>
                <p className="text-gray-700">Noon {fmtMoney(selectedTemplate.meal_rate_noon)}</p>
                <p className="text-gray-700">Evening {fmtMoney(selectedTemplate.meal_rate_evening)}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1 font-medium uppercase tracking-wide">Other</p>
                <p className="text-gray-700">Lodging {fmtMoney(selectedTemplate.lodging_rate_default)}/night</p>
                <p className="text-gray-700">Per diem {fmtMoney(selectedTemplate.perdiem_rate_myr)}/day</p>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={applyTemplate}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply to form below
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

// ── Current rate summary banner ────────────────────────────────────────────────

function CurrentRateBanner({ rate }: { rate: Record<string, unknown> }) {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <strong>
            {'Current team rate'}
            {rate.rate_label ? ': ' + rate.rate_label : ''}
          </strong>
          {!!rate.effective_from && (
            <span className="ml-2 text-xs font-normal text-blue-500">
              {'Effective ' + fmtDate(rate.effective_from as string)}
            </span>
          )}
        </div>
        {!!rate.updated_at && (
          <span className="text-xs text-blue-400">
            {'Updated ' + fmtDate(rate.updated_at as string)}
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-xs">
        <span>Car: {fmtMoney(rate.mileage_rate_per_km as number, 3)}/km</span>
        {(rate.motorcycle_rate_per_km as number | null) != null && (
          <span>Moto: {fmtMoney(rate.motorcycle_rate_per_km as number, 3)}/km</span>
        )}
        <span>Morning: {fmtMoney(rate.meal_rate_morning as number)}</span>
        <span>Noon: {fmtMoney(rate.meal_rate_noon as number)}</span>
        <span>Evening: {fmtMoney(rate.meal_rate_evening as number)}</span>
        <span>Lodging: {fmtMoney(rate.lodging_rate_default as number)}/night</span>
        <span>Per diem: {fmtMoney(rate.perdiem_rate_myr as number)}/day</span>
      </div>
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function WorkspaceRatesClient({
  initialTeamRate,
  templates,
  orgRole,
}: {
  initialTeamRate: Record<string, unknown> | null
  templates: GlobalTemplate[]
  orgRole: string | null
}) {
  const canEdit = orgRole === 'OWNER' || orgRole === 'ADMIN'

  const [toast,    setToast]    = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  const [busy,     setBusy]     = useState(false)
  const [teamRate, setTeamRate] = useState<Record<string, unknown> | null>(initialTeamRate)
  const [form,     setForm]     = useState<FormState>(() => rateToForm(initialTeamRate))

  function showToast(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3200)
  }

  function setF(patch: Partial<FormState>) {
    setForm(prev => ({ ...prev, ...patch }))
  }

  const applyTemplate = useCallback((patch: Partial<FormState>) => {
    setForm(prev => ({ ...prev, ...patch }))
    showToast('ok', 'Template applied -- review and save below')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function save() {
    setBusy(true)
    try {
      const res = await fetch('/api/workspace/team-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mileage_rate_per_km:    form.mileage_rate_per_km    ? Number(form.mileage_rate_per_km)    : undefined,
          motorcycle_rate_per_km: form.motorcycle_rate_per_km ? Number(form.motorcycle_rate_per_km) : null,
          meal_rate_morning:  form.meal_rate_morning  ? Number(form.meal_rate_morning)  : undefined,
          meal_rate_noon:     form.meal_rate_noon     ? Number(form.meal_rate_noon)     : undefined,
          meal_rate_evening:  form.meal_rate_evening  ? Number(form.meal_rate_evening)  : undefined,
          meal_rate_full_day: form.meal_rate_full_day ? Number(form.meal_rate_full_day) : undefined,
          lodging_rate_default: form.lodging_rate_default ? Number(form.lodging_rate_default) : undefined,
          perdiem_rate_myr:   form.perdiem_rate_myr   ? Number(form.perdiem_rate_myr)   : undefined,
          rate_label:    form.rate_label    || null,
          notes:         form.notes         || null,
          effective_from: form.effective_from || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to save team rates')
      setTeamRate(json.teamRate)
      showToast('ok', 'Team rates saved successfully')
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'Failed to save team rates')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <Toast toast={toast} />

      {/* Page header */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Rates</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Set your team reimbursement rates. These apply to all employees in your workspace when submitting claims.
        </p>
      </div>

      {!canEdit && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          You have view-only access. Only the workspace Owner or Admin can update team rates.
        </div>
      )}

      {teamRate
        ? <CurrentRateBanner rate={teamRate} />
        : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            <strong>No team rate configured yet.</strong>{' '}
            {canEdit
              ? 'Fill in the rate profile below and click Save Team Rates.'
              : 'Contact your workspace Owner or Admin to configure team rates.'}
          </div>
        )
      }

      {/* Template reference */}
      <TemplateReference templates={templates} onApply={applyTemplate} />

      {/* Rate editor */}
      <Card>
        <SectionTitle>Team Rate Profile</SectionTitle>
        <CardBody>

          <SectionLabel>Mileage</SectionLabel>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Car rate (MYR/km) *" hint="Required -- applied to all car trips">
              {canEdit
                ? <input type="number" step="0.001" min="0" placeholder="0.600" value={form.mileage_rate_per_km} onChange={e => setF({ mileage_rate_per_km: e.target.value })} className={INPUT} />
                : <input value={form.mileage_rate_per_km} disabled className={INPUT_DIS} />
              }
            </Field>
            <Field label="Motorcycle rate (MYR/km)" hint="Optional -- leave blank to use car rate">
              {canEdit
                ? <input type="number" step="0.001" min="0" placeholder="optional" value={form.motorcycle_rate_per_km} onChange={e => setF({ motorcycle_rate_per_km: e.target.value })} className={INPUT} />
                : <input value={form.motorcycle_rate_per_km || '--'} disabled className={INPUT_DIS} />
              }
            </Field>
          </div>

          <SectionLabel>Meal Allowances (MYR per session)</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {([
              { key: 'meal_rate_morning',  label: 'Morning' },
              { key: 'meal_rate_noon',     label: 'Noon' },
              { key: 'meal_rate_evening',  label: 'Evening' },
              { key: 'meal_rate_full_day', label: 'Full day' },
            ] as { key: keyof FormState; label: string }[]).map(({ key, label }) => (
              <Field key={key} label={label}>
                {canEdit
                  ? <input type="number" step="0.01" min="0" placeholder="0.00" value={form[key]} onChange={e => setF({ [key]: e.target.value } as Partial<FormState>)} className={INPUT} />
                  : <input value={form[key]} disabled className={INPUT_DIS} />
                }
              </Field>
            ))}
          </div>

          <SectionLabel>Accommodation and Daily Allowance</SectionLabel>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Lodging cap (MYR/night)">
              {canEdit
                ? <input type="number" step="0.01" min="0" placeholder="120.00" value={form.lodging_rate_default} onChange={e => setF({ lodging_rate_default: e.target.value })} className={INPUT} />
                : <input value={form.lodging_rate_default} disabled className={INPUT_DIS} />
              }
            </Field>
            <Field label="Per diem (MYR/day)" hint="0 = not applicable">
              {canEdit
                ? <input type="number" step="0.01" min="0" placeholder="0.00" value={form.perdiem_rate_myr} onChange={e => setF({ perdiem_rate_myr: e.target.value })} className={INPUT} />
                : <input value={form.perdiem_rate_myr} disabled className={INPUT_DIS} />
              }
            </Field>
          </div>

          <SectionLabel>Record Details</SectionLabel>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Rate label" hint="Short name for this rate version">
              {canEdit
                ? <input type="text" placeholder="e.g. Standard 2026 Q2" value={form.rate_label} onChange={e => setF({ rate_label: e.target.value })} className={INPUT} />
                : <input value={form.rate_label || '--'} disabled className={INPUT_DIS} />
              }
            </Field>
            <Field label="Effective from">
              {canEdit
                ? <input type="date" value={form.effective_from} onChange={e => setF({ effective_from: e.target.value })} className={INPUT} />
                : <input value={fmtDate(form.effective_from)} disabled className={INPUT_DIS} />
              }
            </Field>
          </div>
          <Field label="Notes (internal)">
            {canEdit
              ? <textarea placeholder="Any notes about this rate version..." value={form.notes} onChange={e => setF({ notes: e.target.value })} rows={2} className={INPUT} />
              : <textarea value={form.notes || '--'} disabled rows={2} className={INPUT_DIS} />
            }
          </Field>

          {canEdit && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Rates apply immediately to new claims by your team employees.
              </p>
              <button
                type="button"
                onClick={save}
                disabled={busy}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {busy ? 'Saving...' : 'Save Team Rates'}
              </button>
            </div>
          )}
        </CardBody>
      </Card>

      <p className="text-xs text-gray-400">All monetary values in MYR.</p>
    </div>
  )
}
