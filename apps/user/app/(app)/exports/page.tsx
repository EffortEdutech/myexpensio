'use client'
// apps/user/app/(app)/exports/page.tsx

import { useState, useEffect, useCallback } from 'react'
import { SignaturePad } from '@/components/SignaturePad'

// ── Types ─────────────────────────────────────────────────────────────────────

type Claim = {
  id: string
  title: string | null
  status: string
  period_start: string | null
  period_end: string | null
  total_amount: number
  currency: string
  submitted_at: string | null
  created_at: string
}

type ExportJob = {
  id: string
  format: string
  status: string
  row_count: number | null
  filter_date_from: string | null
  filter_date_to: string | null
  filter_status: string
  created_at: string
}

type PdfGrouping = 'BY_DATE' | 'BY_CATEGORY'

type Template = {
  id: string
  name: string
  description: string | null
  is_default: boolean
  schema: {
    preset?: string
    columns?: string[]
    pdf_layout?: { grouping?: string }
  }
}

type UsageInfo = {
  tier: 'FREE' | 'PRO'
  is_admin: boolean
  period_start: string
  period_end: string
  exports_used: number
  exports_limit: number | null
  limit_label?: string | null
  override_notes?: string | null
}

type TngPreviewStatement = {
  statement_label:   string
  upload_batch_id:   string | null
  transaction_count: number
  total_amount_myr:  number
  has_source_pdf:    boolean
}

// ── Constants + helpers ───────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: currentYear - 2022 }, (_, i) => 2023 + i)

const fmtMyr = (n: number) => 'MYR ' + Number(n).toFixed(2)

function periodLabel(start: string | null, end: string | null, title: string | null): string {
  if (title) return title
  if (!start) return 'Untitled claim'
  const s = new Date(start)
  if (end) {
    const e = new Date(end)
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) return `${MONTHS[s.getMonth()]} ${s.getFullYear()}`
    return `${MONTHS[s.getMonth()]} – ${MONTHS[e.getMonth()]} ${e.getFullYear()}`
  }
  return `${MONTHS[s.getMonth()]} ${s.getFullYear()}`
}

function fmtDateShort(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-MY', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function histPeriodLabel(job: ExportJob): string {
  const from = job.filter_date_from
  const to   = job.filter_date_to
  if (!from && !to) return 'All claims'
  if (from && to) {
    const f = new Date(from), t = new Date(to)
    if (f.getMonth() === t.getMonth() && f.getFullYear() === t.getFullYear()) return `${MONTHS[f.getMonth()]} ${f.getFullYear()}`
    return `${fmtDateShort(from)} – ${fmtDateShort(to)}`
  }
  return from ? `From ${fmtDateShort(from)}` : `To ${fmtDateShort(to)}`
}

function normalizeGrouping(value: string | undefined | null): PdfGrouping {
  return value === 'BY_CATEGORY' ? 'BY_CATEGORY' : 'BY_DATE'
}

function groupingLabel(value: PdfGrouping) {
  return value === 'BY_CATEGORY' ? 'By category' : 'By date'
}

// ── TNG Preview Card component ────────────────────────────────────────────────

function TngPreviewCard({
  tngPreview,
  loadingTngPreview,
}: {
  tngPreview:        TngPreviewStatement[]
  loadingTngPreview: boolean
}) {
  if (loadingTngPreview) {
    return (
      <div style={{ padding: '14px 16px', backgroundColor: '#fff', border: '1px solid #bfdbfe', borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>📎</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8' }}>Appendix B — TNG Statements</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Checking which statements will be attached…</div>
          </div>
        </div>
      </div>
    )
  }

  if (tngPreview.length === 0) return null

  const totalTxns   = tngPreview.reduce((s, p) => s + p.transaction_count, 0)
  const totalAmount = tngPreview.reduce((s, p) => s + p.total_amount_myr, 0)

  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #bfdbfe', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', backgroundColor: '#eff6ff', borderBottom: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>📎</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8' }}>
            Appendix B — TNG eWallet Statements
          </div>
          <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 2 }}>
            {tngPreview.length} statement PDF{tngPreview.length !== 1 ? 's' : ''} · {totalTxns} transaction{totalTxns !== 1 ? 's' : ''} highlighted · RM {totalAmount.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Statement rows */}
      <div style={{ padding: '4px 0' }}>
        {tngPreview.map((stmt, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px',
              borderBottom: i < tngPreview.length - 1 ? '1px solid #f1f5f9' : 'none',
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>{stmt.has_source_pdf ? '✅' : '⚠️'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.3 }}>
                {stmt.statement_label}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                {stmt.transaction_count} transaction{stmt.transaction_count !== 1 ? 's' : ''} · RM {stmt.total_amount_myr.toFixed(2)}
                {!stmt.has_source_pdf && (
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}> · PDF unavailable</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div style={{ padding: '10px 16px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
        ℹ️ Only statements containing your claimed Toll/Parking transactions are attached. Relevant rows are highlighted in each PDF.
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ExportsPage() {
  const [claims,            setClaims]            = useState<Claim[]>([])
  const [loadingC,          setLoadingC]          = useState(true)
  const [claimsErr,         setClaimsErr]         = useState<string | null>(null)
  const [statusFilter,      setStatusFilter]      = useState<'ALL' | 'SUBMITTED' | 'DRAFT'>('ALL')
  const [yearFilter,        setYearFilter]        = useState<number | null>(null)
  const [monthFilter,       setMonthFilter]       = useState<number | null>(null)
  const [selected,          setSelected]          = useState<Set<string>>(new Set())
  const [format,            setFormat]            = useState<'XLSX' | 'CSV' | 'PDF'>('XLSX')
  const [templates,         setTemplates]         = useState<Template[]>([])
  const [templateId,        setTemplateId]        = useState<string | null>(null)
  const [loadingT,          setLoadingT]          = useState(true)
  const [signature,         setSignature]         = useState<string | null>(null)
  const [generating,        setGenerating]        = useState(false)
  const [genError,          setGenError]          = useState<string | null>(null)
  const [genSuccess,        setGenSuccess]        = useState<string | null>(null)
  const [history,           setHistory]           = useState<ExportJob[]>([])
  const [loadingH,          setLoadingH]          = useState(true)
  const [pdfGrouping,       setPdfGrouping]       = useState<PdfGrouping>('BY_DATE')
  const [groupingTouched,   setGroupingTouched]   = useState(false)
  const [usage,             setUsage]             = useState<UsageInfo | null>(null)
  // TNG preview state — lives inside the component where it belongs
  const [tngPreview,        setTngPreview]        = useState<TngPreviewStatement[]>([])
  const [loadingTngPreview, setLoadingTngPreview] = useState(false)

  // ── Data loaders ───────────────────────────────────────────────────────────

  const loadClaims = useCallback(async () => {
    setLoadingC(true); setClaimsErr(null)
    try {
      const res = await fetch('/api/claims?limit=100')
      const json = await res.json()
      if (!res.ok) { setClaimsErr(json.error?.message ?? 'Failed to load claims.'); return }
      setClaims(json.items ?? [])
    } catch {
      setClaimsErr('Network error loading claims.')
    } finally { setLoadingC(false) }
  }, [])

  const loadTemplates = useCallback(async () => {
    setLoadingT(true)
    try {
      const res = await fetch('/api/report-templates')
      if (!res.ok) return
      const json = await res.json()
      const list: Template[] = json.templates ?? []
      setTemplates(list)
      if (list.length > 0) {
        const def = list.find(t => t.is_default) ?? list[0]
        setTemplateId(def.id)
        setPdfGrouping(normalizeGrouping(def.schema?.pdf_layout?.grouping))
        setGroupingTouched(false)
      }
    } catch {}
    finally { setLoadingT(false) }
  }, [])

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/exports/history')
      if (!res.ok) return
      const json = await res.json()
      setHistory(json.items ?? [])
    } catch {}
    finally { setLoadingH(false) }
  }, [])

  const loadUsage = useCallback(async () => {
    try {
      const res = await fetch('/api/usage')
      if (!res.ok) return
      const json = await res.json()
      setUsage(json)
    } catch {}
  }, [])

  useEffect(() => {
    loadClaims(); loadTemplates(); loadHistory(); loadUsage()
  }, [loadClaims, loadTemplates, loadHistory, loadUsage])

  // ── Derived values ─────────────────────────────────────────────────────────

  const activeTpl       = templates.find(t => t.id === templateId) ?? null
  const templateGrouping = normalizeGrouping(activeTpl?.schema?.pdf_layout?.grouping)
  const exportUnlimited = !!usage && (usage.is_admin || usage.exports_limit === null)
  const exportAtLimit   = !!usage && !exportUnlimited && usage.exports_limit !== null && usage.exports_used >= usage.exports_limit

  // Sync grouping when template changes (unless user manually overrode it)
  useEffect(() => {
    if (format !== 'PDF') return
    if (groupingTouched) return
    setPdfGrouping(templateGrouping)
  }, [format, templateGrouping, groupingTouched])

  // Load TNG preview whenever PDF format is selected and claims are ticked
  useEffect(() => {
    if (format === 'PDF' && selected.size > 0) {
      loadTngPreview(Array.from(selected))
    } else {
      setTngPreview([])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, selected])

  // ── TNG preview loader ─────────────────────────────────────────────────────

  async function loadTngPreview(claimIds: string[]) {
    if (claimIds.length === 0) { setTngPreview([]); return }
    setLoadingTngPreview(true)
    try {
      const params = new URLSearchParams({ claim_ids: claimIds.join(',') })
      const res    = await fetch(`/api/export/tng-preview?${params}`)
      const json   = await res.json()
      if (res.ok) setTngPreview(json.statements ?? [])
    } catch { /* non-critical — preview failing should not block export */ }
    finally { setLoadingTngPreview(false) }
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  const filteredClaims = claims.filter(c => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false
    if (yearFilter  !== null && c.period_start && new Date(c.period_start).getFullYear() !== yearFilter)  return false
    if (monthFilter !== null && c.period_start && new Date(c.period_start).getMonth()     !== monthFilter) return false
    return true
  })

  function toggleOne(id: string) {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function handleTemplateSelect(id: string) {
    const nextTemplate = templates.find(t => t.id === id) ?? null
    setTemplateId(id)
    setGroupingTouched(false)
    setPdfGrouping(normalizeGrouping(nextTemplate?.schema?.pdf_layout?.grouping))
  }

  function handleGroupingPick(value: PdfGrouping) {
    setPdfGrouping(value)
    setGroupingTouched(true)
  }

  const selectedClaims = claims.filter(c => selected.has(c.id))
  const selectedTotal  = selectedClaims.reduce((s, c) => s + Number(c.total_amount), 0)
  const draftSelected  = selectedClaims.filter(c => c.status === 'DRAFT').length

  async function handleGenerate() {
    if (selected.size === 0) { setGenError('Select at least one claim.'); return }
    if (exportAtLimit) { setGenError('Your organisation has reached its export limit for this month.'); return }

    setGenerating(true); setGenError(null); setGenSuccess(null)

    const body: Record<string, unknown> = { format, claim_ids: Array.from(selected) }
    if (templateId) body.template_id = templateId
    if (format === 'PDF') {
      body.pdf_layout = pdfGrouping
      if (signature) body.signature_data_url = signature
    }

    try {
      const res = await fetch('/api/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        if (res.status === 429) await loadUsage()
        setGenError(json.error?.message ?? 'Export failed. Please try again.')
        return
      }

      const rowCount = parseInt(res.headers.get('X-Row-Count') ?? '0')
      const blob     = await res.blob()
      const ext      = format === 'CSV' ? 'csv' : format === 'PDF' ? 'pdf' : 'xlsx'
      const ds       = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const url      = URL.createObjectURL(blob)
      const a        = document.createElement('a')
      a.href         = url
      a.download     = `myexpensio_claim_${ds}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      const groupingText = format === 'PDF' ? ` · ${groupingLabel(pdfGrouping)}` : ''
      setGenSuccess(`✓ ${format} downloaded — ${rowCount} row${rowCount !== 1 ? 's' : ''}${groupingText}`)
      await loadHistory()
      await loadUsage()
    } catch {
      setGenError('Network error. Please try again.')
    } finally { setGenerating(false) }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={S.page}>

      {/* Export Policy */}
      <div style={S.card}>
        <div style={S.cardHead}>
          <span style={S.cardIcon}>🧭</span>
          <div>
            <div style={S.cardTitle}>Export Policy</div>
            <div style={S.cardSub}>Current organisation export allowance</div>
          </div>
        </div>
        {!usage
          ? <div style={S.empty}>Loading export policy…</div>
          : exportUnlimited
            ? <div style={S.okPill}>{usage.limit_label ?? 'Unlimited'} — Unlimited exports</div>
            : <div style={S.limitPill}>{usage.limit_label ?? usage.tier} — {usage.exports_used} / {usage.exports_limit} exports this month</div>
        }
        {usage?.override_notes && <div style={S.noteText}>{usage.override_notes}</div>}
      </div>

      {/* Step 1 — Select Claims */}
      <div style={S.card}>
        <div style={S.cardHead}>
          <span style={S.cardIcon}>📋</span>
          <div>
            <div style={S.cardTitle}>Step 1 — Select Claims</div>
            <div style={S.cardSub}>Tick the claims you want to export</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {(['ALL', 'SUBMITTED', 'DRAFT'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ ...S.filterBtn, ...(statusFilter === s ? S.filterActive : {}) }}>
              {s === 'ALL' ? 'All' : s === 'SUBMITTED' ? '✓ Submitted' : '✏ Draft'}
            </button>
          ))}
          <select value={yearFilter ?? ''} onChange={e => setYearFilter(e.target.value ? Number(e.target.value) : null)} style={S.select}>
            <option value=''>All years</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={monthFilter ?? ''} onChange={e => setMonthFilter(e.target.value !== '' ? Number(e.target.value) : null)} style={S.select}>
            <option value=''>All months</option>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>

        {loadingC ? (
          <div style={S.empty}>Loading claims…</div>
        ) : claimsErr ? (
          <div style={S.errorBox}>{claimsErr}</div>
        ) : filteredClaims.length === 0 ? (
          <div style={S.empty}>No claims match this filter.</div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <button onClick={() => setSelected(new Set(filteredClaims.map(c => c.id)))} style={S.linkBtn}>Select all ({filteredClaims.length})</button>
              <button onClick={() => setSelected(new Set())} style={S.linkBtn}>Clear</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredClaims.map(c => {
                const isChecked = selected.has(c.id)
                return (
                  <button key={c.id} onClick={() => toggleOne(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: isChecked ? '1.5px solid #0f172a' : '1px solid #f1f5f9', borderRadius: 10, cursor: 'pointer', textAlign: 'left', backgroundColor: isChecked ? '#f8fafc' : '#fff' }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, backgroundColor: isChecked ? '#0f172a' : '#fff', border: isChecked ? '2px solid #0f172a' : '2px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isChecked && <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{periodLabel(c.period_start, c.period_end, c.title)}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDateShort(c.period_start)}{c.period_end && c.period_end !== c.period_start && ` – ${fmtDateShort(c.period_end)}`}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, backgroundColor: c.status === 'SUBMITTED' ? '#f0fdf4' : '#fef9c3', color: c.status === 'SUBMITTED' ? '#15803d' : '#854d0e' }}>
                        {c.status === 'SUBMITTED' ? '✓ Submitted' : 'Draft'}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{fmtMyr(c.total_amount)}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {selected.size > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>{selected.size} claim{selected.size !== 1 ? 's' : ''} selected</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{fmtMyr(selectedTotal)}</span>
          </div>
        )}
        {draftSelected > 0 && (
          <div style={{ marginTop: 8, padding: '8px 12px', backgroundColor: '#fefce8', border: '1px solid #fde047', borderRadius: 8, fontSize: 12, color: '#854d0e' }}>
            ⚠️ {draftSelected} Draft claim{draftSelected !== 1 ? 's' : ''} selected — these will be included in the export with DRAFT status marked.
          </div>
        )}
      </div>

      {/* Step 2 — Export Format */}
      <div style={S.card}>
        <div style={S.cardHead}>
          <span style={S.cardIcon}>📥</span>
          <div>
            <div style={S.cardTitle}>Step 2 — Export Format</div>
            <div style={S.cardSub}>Choose how you want to download your data</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['XLSX', 'CSV', 'PDF'] as const).map(f => (
            <button key={f} onClick={() => setFormat(f)} style={{ ...S.filterBtn, ...(format === f ? (f === 'PDF' ? S.filterActivePdf : S.filterActive) : {}) }}>
              {f === 'XLSX' ? '📊 Excel' : f === 'CSV' ? '📄 CSV' : '📋 PDF'}
            </button>
          ))}
        </div>
      </div>

      {/* Step 3 — Report Template */}
      <div style={S.card}>
        <div style={S.cardHead}>
          <span style={S.cardIcon}>🗂</span>
          <div>
            <div style={S.cardTitle}>Step 3 — Report Template</div>
            <div style={S.cardSub}>Controls columns, order, and PDF layout defaults</div>
          </div>
        </div>
        {loadingT ? (
          <div style={S.empty}>Loading templates…</div>
        ) : templates.length === 0 ? (
          <div style={S.empty}>No templates configured.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {templates.map(t => {
              const isActive = templateId === t.id
              return (
                <button key={t.id} onClick={() => handleTemplateSelect(t.id)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', border: isActive ? '2px solid #2563eb' : '1px solid #e2e8f0', backgroundColor: isActive ? '#eff6ff' : '#fff' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', marginTop: 2, flexShrink: 0, border: isActive ? '5px solid #2563eb' : '2px solid #cbd5e1', backgroundColor: '#fff' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: isActive ? '#1d4ed8' : '#0f172a' }}>{t.name}</span>
                      {t.is_default && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, backgroundColor: '#2563eb', color: '#fff' }}>DEFAULT</span>}
                    </div>
                    {t.description && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{t.description}</div>}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Step 4 — PDF Options (only when PDF format selected) */}
      {format === 'PDF' && (
        <div style={{ ...S.card, border: '1px solid #e9d5ff' }}>
          <div style={S.cardHead}>
            <span style={S.cardIcon}>🧩</span>
            <div>
              <div style={S.cardTitle}>Step 4 — PDF Options</div>
              <div style={S.cardSub}>Choose grouping and optional signature</div>
            </div>
          </div>
          <div style={S.optionBlock}>
            <div style={S.optionLabel}>Grouping</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleGroupingPick('BY_DATE')}     style={{ ...S.filterBtn, ...(pdfGrouping === 'BY_DATE'     ? S.filterActivePdf : {}) }}>📅 By Date</button>
              <button onClick={() => handleGroupingPick('BY_CATEGORY')} style={{ ...S.filterBtn, ...(pdfGrouping === 'BY_CATEGORY' ? S.filterActivePdf : {}) }}>🏷️ By Category</button>
            </div>
            <div style={S.optionHint}>
              Template default: <strong>{groupingLabel(templateGrouping)}</strong>
              {groupingTouched && pdfGrouping !== templateGrouping && <> · manual override active</>}
            </div>
          </div>
          <div style={S.optionDivider} />
          <div style={S.optionBlock}>
            <div style={S.optionLabel}>Signature</div>
            <div style={S.optionHint}>Appears on the Declaration page of the PDF</div>
            <SignaturePad onCapture={dataUrl => setSignature(dataUrl)} width={420} height={130} />
          </div>
        </div>
      )}

      {/* TNG Appendix Preview — only when PDF + claims with TNG items are selected */}
      {format === 'PDF' && (
        <TngPreviewCard
          tngPreview={tngPreview}
          loadingTngPreview={loadingTngPreview}
        />
      )}

      {/* Generate button */}
      <div style={S.card}>
        {genError   && <div style={{ ...S.errorBox,   marginBottom: 12 }}>{genError}</div>}
        {genSuccess && <div style={{ ...S.successBox, marginBottom: 12 }}>{genSuccess}</div>}
        <button
          onClick={handleGenerate}
          disabled={generating || selected.size === 0 || exportAtLimit}
          style={{ ...S.btnGenerate, ...(format === 'PDF' ? S.btnGeneratePdf : {}), opacity: generating || selected.size === 0 || exportAtLimit ? 0.45 : 1 }}
        >
          {generating      ? `Generating ${format}…`
           : exportAtLimit ? 'Monthly export limit reached'
           : selected.size === 0 ? 'Select claims above first'
           : `Generate ${format} — ${selected.size} claim${selected.size !== 1 ? 's' : ''}`}
        </button>
      </div>

      {/* Export History */}
      <div style={S.card}>
        <div style={S.cardHead}>
          <span style={S.cardIcon}>🕐</span>
          <div>
            <div style={S.cardTitle}>Export History</div>
            <div style={S.cardSub}>Your previous exports</div>
          </div>
        </div>
        {loadingH ? (
          <div style={S.empty}>Loading…</div>
        ) : history.length === 0 ? (
          <div style={S.empty}>No exports yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {history.map((job, i) => (
              <div key={job.id} style={{ ...S.histRow, borderTop: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6, backgroundColor: job.format === 'PDF' ? '#f5f3ff' : '#dcfce7', color: job.format === 'PDF' ? '#7c3aed' : '#15803d' }}>{job.format}</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{histPeriodLabel(job)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDateTime(job.created_at)}</div>
                </div>
                {job.row_count !== null && (
                  <span style={{ fontSize: 11, color: '#64748b', flexShrink: 0 }}>{job.row_count} row{job.row_count !== 1 ? 's' : ''}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page:           { maxWidth: 560, margin: '0 auto', padding: '20px 16px 60px', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', gap: 16 },
  card:           { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px' },
  cardHead:       { display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  cardIcon:       { fontSize: 22, flexShrink: 0 },
  cardTitle:      { fontSize: 14, fontWeight: 800, color: '#0f172a' },
  cardSub:        { fontSize: 12, color: '#64748b', marginTop: 2 },
  filterBtn:      { fontSize: 12, fontWeight: 600, padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', backgroundColor: '#f8fafc', color: '#374151' },
  filterActive:   { backgroundColor: '#0f172a', color: '#fff', border: '1px solid #0f172a' },
  filterActivePdf:{ backgroundColor: '#7c3aed', color: '#fff', border: '1px solid #7c3aed' },
  select:         { fontSize: 12, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, backgroundColor: '#f8fafc', color: '#374151' },
  linkBtn:        { fontSize: 12, fontWeight: 600, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  empty:          { fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '16px 0' },
  errorBox:       { padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626' },
  successBox:     { padding: '10px 12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13, color: '#15803d', fontWeight: 600 },
  btnGenerate:    { width: '100%', paddingTop: 14, paddingBottom: 14, backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  btnGeneratePdf: { backgroundColor: '#7c3aed' },
  histRow:        { display: 'flex', alignItems: 'center', gap: 12, paddingTop: 12, paddingBottom: 12 },
  optionBlock:    { display: 'flex', flexDirection: 'column', gap: 8 },
  optionLabel:    { fontSize: 13, fontWeight: 700, color: '#0f172a' },
  optionHint:     { fontSize: 11, color: '#64748b', lineHeight: 1.6 },
  optionDivider:  { height: 1, backgroundColor: '#ede9fe', marginTop: 14, marginBottom: 14 },
  okPill:         { padding: '10px 12px', borderRadius: 8, border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4', color: '#15803d', fontSize: 13, fontWeight: 700 },
  limitPill:      { padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#0f172a', fontSize: 13, fontWeight: 700 },
  noteText:       { marginTop: 8, fontSize: 11, color: '#64748b' },
}
