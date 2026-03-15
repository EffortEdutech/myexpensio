'use client'
// apps/user/app/(app)/exports/page.tsx
//
// CHANGES (15 Mar 2026):
//   - DRAFT claims now exportable (warning badge on draft selection)
//   - Step 4 PDF Options: removed LayoutToggle (grouping is set in template, Step 3 shows it)
//   - Step 4 is now purely the signature pad

import { useState, useEffect, useCallback } from 'react'
import { SignaturePad } from '@/components/SignaturePad'

// ── Types ─────────────────────────────────────────────────────────────────────

type Claim = {
  id:           string
  title:        string | null
  status:       string
  period_start: string | null
  period_end:   string | null
  total_amount: number
  currency:     string
  submitted_at: string | null
  created_at:   string
}

type ExportJob = {
  id:               string
  format:           string
  status:           string
  row_count:        number | null
  filter_date_from: string | null
  filter_date_to:   string | null
  filter_status:    string
  created_at:       string
}

type Template = {
  id:          string
  name:        string
  description: string | null
  is_default:  boolean
  schema: {
    preset?:     string
    columns?:    string[]
    pdf_layout?: {
      grouping?:              string
      orientation?:           string
      show_summary_table?:    boolean
      show_receipt_appendix?: boolean
      show_tng_appendix?:     boolean
      show_declaration?:      boolean
      accent_color?:          string
    }
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTHS      = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const currentYear = new Date().getFullYear()
const YEARS       = Array.from({ length: currentYear - 2022 }, (_, i) => 2023 + i)

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtMyr = (n: number) => 'MYR ' + Number(n).toFixed(2)

function periodLabel(start: string | null, end: string | null, title: string | null): string {
  if (title) return title
  if (!start) return 'Untitled claim'
  const s = new Date(start)
  if (end) {
    const e = new Date(end)
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear())
      return `${MONTHS[s.getMonth()]} ${s.getFullYear()}`
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
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function histPeriodLabel(job: ExportJob): string {
  const from = job.filter_date_from
  const to   = job.filter_date_to
  if (!from && !to) return 'All claims'
  if (from && to) {
    const f = new Date(from), t = new Date(to)
    if (f.getMonth() === t.getMonth() && f.getFullYear() === t.getFullYear())
      return `${MONTHS[f.getMonth()]} ${f.getFullYear()}`
    if (f.getMonth() === 0 && t.getMonth() === 11 && f.getFullYear() === t.getFullYear())
      return `Year ${f.getFullYear()}`
    return `${fmtDateShort(from)} – ${fmtDateShort(to)}`
  }
  return from ? `From ${fmtDateShort(from)}` : `To ${fmtDateShort(to)}`
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ExportsPage() {
  const [claims,       setClaims]       = useState<Claim[]>([])
  const [loadingC,     setLoadingC]     = useState(true)
  const [claimsErr,    setClaimsErr]    = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'DRAFT'>('ALL')
  const [yearFilter,   setYearFilter]   = useState<number | null>(null)
  const [monthFilter,  setMonthFilter]  = useState<number | null>(null)
  const [selected,     setSelected]     = useState<Set<string>>(new Set())
  const [format,       setFormat]       = useState<'XLSX' | 'CSV' | 'PDF'>('XLSX')
  const [templates,    setTemplates]    = useState<Template[]>([])
  const [templateId,   setTemplateId]   = useState<string | null>(null)
  const [loadingT,     setLoadingT]     = useState(true)
  const [signature,    setSignature]    = useState<string | null>(null)
  const [generating,   setGenerating]   = useState(false)
  const [genError,     setGenError]     = useState<string | null>(null)
  const [genSuccess,   setGenSuccess]   = useState<string | null>(null)
  const [history,      setHistory]      = useState<ExportJob[]>([])
  const [loadingH,     setLoadingH]     = useState(true)

  // ── Loaders ──────────────────────────────────────────────────────────────

  const loadClaims = useCallback(async () => {
    setLoadingC(true); setClaimsErr(null)
    try {
      const res  = await fetch('/api/claims?limit=100')
      const json = await res.json()
      if (!res.ok) { setClaimsErr(json.error?.message ?? 'Failed to load claims.'); return }
      setClaims(json.items ?? [])
    } catch { setClaimsErr('Network error loading claims.') }
    finally  { setLoadingC(false) }
  }, [])

  const loadTemplates = useCallback(async () => {
    setLoadingT(true)
    try {
      const res  = await fetch('/api/report-templates')
      if (!res.ok) return
      const json = await res.json()
      const list: Template[] = json.templates ?? []
      setTemplates(list)
      if (list.length > 0) {
        const def = list.find(t => t.is_default) ?? list[0]
        setTemplateId(def.id)
      }
    } catch { /* non-critical */ }
    finally { setLoadingT(false) }
  }, [])

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/exports/history')
      if (!res.ok) return
      const json = await res.json()
      setHistory(json.items ?? [])
    } catch { /* non-critical */ }
    finally { setLoadingH(false) }
  }, [])

  useEffect(() => { loadClaims(); loadTemplates(); loadHistory() }, [loadClaims, loadTemplates, loadHistory])

  // ── Filtering ────────────────────────────────────────────────────────────

  const filteredClaims = claims.filter(c => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false
    if (yearFilter  !== null && c.period_start && new Date(c.period_start).getFullYear() !== yearFilter)  return false
    if (monthFilter !== null && c.period_start && new Date(c.period_start).getMonth()    !== monthFilter) return false
    return true
  })

  function toggleOne(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const allSelected    = filteredClaims.length > 0 && filteredClaims.every(c => selected.has(c.id))
  const selectedClaims = claims.filter(c => selected.has(c.id))
  const selectedTotal  = selectedClaims.reduce((s, c) => s + Number(c.total_amount), 0)
  const draftSelected  = selectedClaims.filter(c => c.status === 'DRAFT').length

  const activeTpl = templates.find(t => t.id === templateId) ?? null
  const colCount  = activeTpl?.schema?.columns?.length ?? 0

  // ── Generate ─────────────────────────────────────────────────────────────

  async function handleGenerate() {
    if (selected.size === 0) { setGenError('Select at least one claim.'); return }
    setGenerating(true); setGenError(null); setGenSuccess(null)

    const body: Record<string, unknown> = {
      format,
      claim_ids: Array.from(selected),
    }

    if (templateId) body.template_id = templateId

    if (format === 'PDF') {
      // Use grouping from template if available, else default BY_DATE
      const tplGrouping = activeTpl?.schema?.pdf_layout?.grouping
      body.pdf_layout = tplGrouping ?? 'BY_DATE'
      if (signature) body.signature_data_url = signature
    }

    try {
      const res = await fetch('/api/exports', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setGenError(json.error?.message ?? 'Export failed. Please try again.')
        return
      }

      const rowCount = parseInt(res.headers.get('X-Row-Count') ?? '0')
      const blob     = await res.blob()
      const ext      = format === 'CSV' ? 'csv' : format === 'PDF' ? 'pdf' : 'xlsx'
      const ds       = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const url      = URL.createObjectURL(blob)
      const a        = document.createElement('a')
      a.href = url; a.download = `myexpensio_claim_${ds}.${ext}`
      document.body.appendChild(a); a.click()
      document.body.removeChild(a); URL.revokeObjectURL(url)

      const tplName = activeTpl ? ` · ${activeTpl.name}` : ''
      setGenSuccess(
        `✓ ${format} downloaded — ${rowCount} item${rowCount !== 1 ? 's' : ''} from ${selected.size} claim${selected.size !== 1 ? 's' : ''}${tplName}`
      )
      loadHistory()
    } catch {
      setGenError('Network error. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={S.page}>

      {/* ── Step 1: Select Claims ──────────────────────────────────────── */}
      <div style={S.card}>
        <div style={S.cardHead}>
          <span style={S.cardIcon}>📋</span>
          <div>
            <div style={S.cardTitle}>Step 1 — Select Claims</div>
            <div style={S.cardSub}>Tick the claims you want to export</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {(['ALL', 'SUBMITTED', 'DRAFT'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{ ...S.filterBtn, ...(statusFilter === s ? S.filterActive : {}) }}>
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
              <button onClick={() => setSelected(new Set(filteredClaims.map(c => c.id)))} style={S.linkBtn}>
                Select all ({filteredClaims.length})
              </button>
              <button onClick={() => setSelected(new Set())} style={S.linkBtn}>Clear</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredClaims.map(c => {
                const isChecked = selected.has(c.id)
                return (
                  <button key={c.id} onClick={() => toggleOne(c.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                      border: isChecked ? '1.5px solid #0f172a' : '1px solid #f1f5f9',
                      borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                      backgroundColor: isChecked ? '#f8fafc' : '#fff', transition: 'all 0.12s',
                    }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                      backgroundColor: isChecked ? '#0f172a' : '#fff',
                      border: isChecked ? '2px solid #0f172a' : '2px solid #cbd5e1',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isChecked && <span style={{ color: '#fff', fontSize: 11, fontWeight: 800, lineHeight: 1 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                        {periodLabel(c.period_start, c.period_end, c.title)}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        {fmtDateShort(c.period_start)}
                        {c.period_end && c.period_end !== c.period_start && ` – ${fmtDateShort(c.period_end)}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                        backgroundColor: c.status === 'SUBMITTED' ? '#f0fdf4' : '#fef9c3',
                        color:           c.status === 'SUBMITTED' ? '#15803d' : '#854d0e',
                      }}>
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
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {selected.size} claim{selected.size !== 1 ? 's' : ''} selected
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{fmtMyr(selectedTotal)}</span>
          </div>
        )}

        {/* Draft warning — info only, export still proceeds */}
        {draftSelected > 0 && (
          <div style={{ marginTop: 8, padding: '8px 12px', backgroundColor: '#fefce8', border: '1px solid #fde047', borderRadius: 8, fontSize: 12, color: '#854d0e' }}>
            ⚠️ {draftSelected} Draft claim{draftSelected !== 1 ? 's' : ''} selected — these will be included in the export with DRAFT status marked.
          </div>
        )}
      </div>

      {/* ── Step 2: Format ─────────────────────────────────────────────── */}
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
            <button key={f} onClick={() => setFormat(f)}
              style={{ ...S.filterBtn, ...(format === f ? (f === 'PDF' ? S.filterActivePdf : S.filterActive) : {}) }}>
              {f === 'XLSX' ? '📊 Excel' : f === 'CSV' ? '📄 CSV' : '📋 PDF'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Step 3: Template ───────────────────────────────────────────── */}
      <div style={S.card}>
        <div style={S.cardHead}>
          <span style={S.cardIcon}>🗂</span>
          <div>
            <div style={S.cardTitle}>Step 3 — Report Template</div>
            <div style={S.cardSub}>Controls columns, order, and PDF layout</div>
          </div>
        </div>

        {loadingT ? (
          <div style={S.empty}>Loading templates…</div>
        ) : templates.length === 0 ? (
          <div style={{ padding: '10px 14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#64748b' }}>
            No templates configured. Standard columns will be used.
          </div>
        ) : templates.length === 1 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10 }}>
            <span style={{ fontSize: 20 }}>📄</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0369a1' }}>{templates[0].name}</div>
              {templates[0].description && <div style={{ fontSize: 11, color: '#0284c7', marginTop: 2 }}>{templates[0].description}</div>}
              <div style={{ fontSize: 10, color: '#7dd3fc', marginTop: 3 }}>
                {templates[0].schema?.columns?.length ?? 0} columns · {templates[0].schema?.preset ?? 'Standard'}
                {templates[0].is_default && ' · Default'}
                {format === 'PDF' && templates[0].schema?.pdf_layout?.grouping && ` · PDF: ${templates[0].schema.pdf_layout.grouping === 'BY_CATEGORY' ? 'By category' : 'By date'}`}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {templates.map(t => {
              const isActive = templateId === t.id
              const cols     = t.schema?.columns?.length ?? 0
              const preset   = t.schema?.preset ?? 'Standard'
              const pdfCfg   = t.schema?.pdf_layout

              return (
                <button key={t.id} onClick={() => setTemplateId(t.id)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.12s',
                    border:          isActive ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    backgroundColor: isActive ? '#eff6ff' : '#fff',
                  }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', marginTop: 2, flexShrink: 0,
                    border: isActive ? '5px solid #2563eb' : '2px solid #cbd5e1',
                    backgroundColor: '#fff', transition: 'all 0.12s',
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: isActive ? '#1d4ed8' : '#0f172a' }}>
                        {t.name}
                      </span>
                      {t.is_default && (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, backgroundColor: '#2563eb', color: '#fff' }}>
                          DEFAULT
                        </span>
                      )}
                    </div>
                    {t.description && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{t.description}</div>}
                    <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, fontWeight: 600, backgroundColor: isActive ? '#dbeafe' : '#f1f5f9', color: isActive ? '#1d4ed8' : '#64748b' }}>
                        {cols} columns
                      </span>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, fontWeight: 600, backgroundColor: isActive ? '#dbeafe' : '#f1f5f9', color: isActive ? '#1d4ed8' : '#64748b' }}>
                        {preset}
                      </span>
                      {format === 'PDF' && pdfCfg?.grouping && (
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, fontWeight: 600, backgroundColor: isActive ? '#ede9fe' : '#f5f3ff', color: isActive ? '#7c3aed' : '#6d28d9' }}>
                          PDF: {pdfCfg.grouping === 'BY_CATEGORY' ? 'By category' : 'By date'} · {pdfCfg.orientation ?? 'portrait'}
                        </span>
                      )}
                    </div>
                  </div>
                  {format === 'PDF' && pdfCfg?.accent_color && (
                    <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, backgroundColor: pdfCfg.accent_color, border: '2px solid rgba(0,0,0,0.08)', marginTop: 2 }} />
                  )}
                </button>
              )
            })}
          </div>
        )}

        {templateId && activeTpl && templates.length > 0 && (
          <div style={{ marginTop: 10, padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>
              <strong style={{ color: '#0f172a' }}>{activeTpl.name}</strong>
              {' '}will export{' '}
              <strong>{colCount > 0 ? `${colCount} columns` : 'standard columns'}</strong>
              {format === 'PDF' && activeTpl.schema?.pdf_layout?.grouping && (
                <> — grouped <strong>{activeTpl.schema.pdf_layout.grouping === 'BY_CATEGORY' ? 'by category' : 'by date'}</strong>, {activeTpl.schema.pdf_layout.orientation ?? 'portrait'}</>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Step 4: Signature (PDF only) ─────────────────────────────── */}
      {/* Grouping toggle REMOVED — it is set in the template (Step 3 shows it) */}
      {format === 'PDF' && (
        <div style={{ ...S.card, border: '1px solid #e9d5ff' }}>
          <div style={S.cardHead}>
            <span style={S.cardIcon}>✍</span>
            <div>
              <div style={S.cardTitle}>Step 4 — Signature</div>
              <div style={S.cardSub}>Appears on the Declaration page of the PDF</div>
            </div>
          </div>
          <SignaturePad onCapture={dataUrl => setSignature(dataUrl)} width={420} height={130} />
          {signature
            ? <div style={{ fontSize: 11, color: '#15803d', fontWeight: 600, marginTop: 6 }}>✓ Signature ready</div>
            : <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Optional — leave blank for an unsigned line</div>
          }
        </div>
      )}

      {/* ── Generate ─────────────────────────────────────────────────── */}
      <div style={S.card}>
        {genError   && <div style={{ ...S.errorBox,   marginBottom: 12 }}>{genError}</div>}
        {genSuccess && <div style={{ ...S.successBox, marginBottom: 12 }}>{genSuccess}</div>}

        <button onClick={handleGenerate} disabled={generating || selected.size === 0}
          style={{ ...S.btnGenerate, ...(format === 'PDF' ? S.btnGeneratePdf : {}), opacity: generating || selected.size === 0 ? 0.45 : 1, cursor: selected.size === 0 ? 'not-allowed' : 'pointer' }}>
          {generating
            ? `Generating ${format}…`
            : selected.size === 0
              ? 'Select claims above first'
              : `Generate ${format} — ${selected.size} claim${selected.size !== 1 ? 's' : ''}`
          }
        </button>

        {activeTpl && selected.size > 0 && (
          <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>
            Using template: <strong style={{ color: '#64748b' }}>{activeTpl.name}</strong>
            {colCount > 0 && ` · ${colCount} columns`}
          </div>
        )}
      </div>

      {/* ── History ──────────────────────────────────────────────────── */}
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
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
                      backgroundColor: job.format === 'PDF' ? '#f5f3ff' : '#dcfce7',
                      color:           job.format === 'PDF' ? '#7c3aed' : '#15803d',
                    }}>{job.format}</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{histPeriodLabel(job)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDateTime(job.created_at)}</div>
                </div>
                {job.row_count !== null && (
                  <span style={{ fontSize: 11, color: '#64748b', flexShrink: 0 }}>
                    {job.row_count} row{job.row_count !== 1 ? 's' : ''}
                  </span>
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
  page:            { maxWidth: 560, margin: '0 auto', padding: '20px 16px 60px', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', gap: 16 },
  card:            { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px' },
  cardHead:        { display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  cardIcon:        { fontSize: 22, flexShrink: 0 },
  cardTitle:       { fontSize: 14, fontWeight: 800, color: '#0f172a' },
  cardSub:         { fontSize: 12, color: '#64748b', marginTop: 2 },
  filterBtn:       { fontSize: 12, fontWeight: 600, padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', backgroundColor: '#f8fafc', color: '#374151' },
  filterActive:    { backgroundColor: '#0f172a', color: '#fff', border: '1px solid #0f172a' },
  filterActivePdf: { backgroundColor: '#7c3aed', color: '#fff', border: '1px solid #7c3aed' },
  select:          { fontSize: 12, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, backgroundColor: '#f8fafc', color: '#374151' },
  linkBtn:         { fontSize: 12, fontWeight: 600, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  empty:           { fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '16px 0' },
  errorBox:        { padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626' },
  successBox:      { padding: '10px 12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13, color: '#15803d', fontWeight: 600 },
  btnGenerate:     { width: '100%', paddingTop: 14, paddingBottom: 14, backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  btnGeneratePdf:  { backgroundColor: '#7c3aed' },
  histRow:         { display: 'flex', alignItems: 'center', gap: 12, paddingTop: 12, paddingBottom: 12 },
}
