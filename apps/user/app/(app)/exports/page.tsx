'use client'
// apps/user/app/(app)/exports/page.tsx
//
// UX flow:
//   1. Page loads — fetches all claims for the org
//   2. User filters by status / year / month (optional)
//   3. User ticks the claims they want to export
//   4. Picks format (XLSX / CSV / PDF)
//   5. For PDF: picks layout (By Date | By Category), draws signature
//   6. Taps Generate → file downloads immediately
//
// FIXES (14 Mar 2026):
//   - FIX 1: S.filterActive / S.filterActivePdf now use `border` (shorthand)
//            instead of `borderColor` to avoid React style-shorthand conflict warning.
//   - FIX 2: loadHistory now calls /api/exports/history (dedicated GET route)
//            with try/catch/finally so a 405/empty body never crashes the page.

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

type PdfLayout = 'BY_DATE' | 'BY_CATEGORY'

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: currentYear - 2022 }, (_, i) => 2023 + i)

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
  return from ?? to ?? '—'
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ExportsPage() {
  const [claims,       setClaims]      = useState<Claim[]>([])
  const [loadingC,     setLoadingC]    = useState(true)
  const [claimsErr,    setClaimsErr]   = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'DRAFT'>('ALL')
  const [yearFilter,   setYearFilter]  = useState<number | null>(null)
  const [monthFilter,  setMonthFilter] = useState<number | null>(null)
  const [selected,     setSelected]    = useState<Set<string>>(new Set())
  const [format,       setFormat]      = useState<'XLSX' | 'CSV' | 'PDF'>('XLSX')

  // ── PDF-specific options ──────────────────────────────────────────────────
  const [pdfLayout,  setPdfLayout] = useState<PdfLayout>('BY_DATE')
  const [signature,  setSignature] = useState<string | null>(null)

  const [generating, setGenerating] = useState(false)
  const [genError,   setGenError]   = useState<string | null>(null)
  const [genSuccess, setGenSuccess] = useState<string | null>(null)
  const [history,    setHistory]    = useState<ExportJob[]>([])
  const [loadingH,   setLoadingH]   = useState(true)

  // ── Load claims ───────────────────────────────────────────────────────────

  const loadClaims = useCallback(async () => {
    setLoadingC(true); setClaimsErr(null)
    try {
      const res  = await fetch('/api/claims?limit=100')
      const json = await res.json()
      if (!res.ok) { setClaimsErr(json.error?.message ?? 'Failed to load claims.'); return }
      setClaims(json.items ?? [])
    } catch {
      setClaimsErr('Network error loading claims.')
    } finally {
      setLoadingC(false)
    }
  }, [])

  // ── FIX 2: Load history — dedicated GET route, safe try/catch/finally ─────

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/exports/history')
      if (!res.ok) return   // silently degrade — history is non-critical
      const json = await res.json()
      setHistory(json.items ?? [])
    } catch {
      // non-critical — swallow network errors
    } finally {
      setLoadingH(false)
    }
  }, [])

  useEffect(() => { loadClaims(); loadHistory() }, [loadClaims, loadHistory])

  // ── Filtering ─────────────────────────────────────────────────────────────

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

  // ── Generate export ───────────────────────────────────────────────────────

  async function handleGenerate() {
    if (selected.size === 0) { setGenError('Select at least one claim.'); return }
    setGenerating(true); setGenError(null); setGenSuccess(null)

    const body: Record<string, unknown> = {
      format,
      claim_ids: Array.from(selected),
    }
    if (format === 'PDF') {
      body.pdf_layout = pdfLayout
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

      setGenSuccess(
        `✓ ${format} downloaded — ${rowCount} item${rowCount !== 1 ? 's' : ''} from ${selected.size} claim${selected.size !== 1 ? 's' : ''}`
      )
      loadHistory()
    } catch {
      setGenError('Network error. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  // ── Layout toggle component ───────────────────────────────────────────────

  function LayoutToggle() {
    const opts: { value: PdfLayout; icon: string; label: string; desc: string }[] = [
      {
        value: 'BY_DATE',
        icon:  '📅',
        label: 'By Date',
        desc:  'All items in one table, sorted chronologically per claim',
      },
      {
        value: 'BY_CATEGORY',
        icon:  '📂',
        label: 'By Category',
        desc:  'Each expense type on its own page — Mileage, Toll, Parking…',
      },
    ]
    return (
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
          📑 Item Layout
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {opts.map(o => (
            <button
              key={o.value}
              onClick={() => setPdfLayout(o.value)}
              style={{
                flex: 1, padding: '10px 12px', border: 'none', borderRadius: 10, cursor: 'pointer',
                textAlign:       'left',
                backgroundColor: pdfLayout === o.value ? '#7c3aed' : '#fff',
                color:           pdfLayout === o.value ? '#fff'    : '#0f172a',
                outline:         pdfLayout === o.value ? 'none'    : '1px solid #e9d5ff',
                transition:      'all 0.15s',
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 4 }}>{o.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>{o.label}</div>
              <div style={{ fontSize: 10, opacity: pdfLayout === o.value ? 0.85 : 0.6, lineHeight: 1.4 }}>
                {o.desc}
              </div>
            </button>
          ))}
        </div>

        {pdfLayout === 'BY_DATE' && (
          <div style={{ marginTop: 10, padding: '8px 10px', backgroundColor: '#f5f3ff', borderRadius: 8, fontSize: 11, color: '#6d28d9', lineHeight: 1.6 }}>
            <strong>Pages:</strong> Cover → Summary → Items (date order) → Declaration → Receipts
          </div>
        )}
        {pdfLayout === 'BY_CATEGORY' && (
          <div style={{ marginTop: 10, padding: '8px 10px', backgroundColor: '#f5f3ff', borderRadius: 8, fontSize: 11, color: '#6d28d9', lineHeight: 1.6 }}>
            <strong>Pages:</strong> Cover → Summary → Mileage page → Meal page → Toll page → Parking page → … → Declaration → Receipts
            <br /><span style={{ opacity: 0.75 }}>Only categories with items appear.</span>
          </div>
        )}
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={S.page}>

      {/* ── Select Claims ────────────────────────────────────────────────── */}
      <div style={S.card}>
        <div style={S.cardHead}>
          <span style={S.cardIcon}>📋</span>
          <div>
            <div style={S.cardTitle}>Select Claims</div>
            <div style={S.cardSub}>Tick the claims you want to export</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {(['ALL', 'SUBMITTED', 'DRAFT'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{
                ...S.filterBtn,
                // FIX 1: use `border` shorthand, not `borderColor`, to avoid React re-render warning
                ...(statusFilter === s ? S.filterActive : {}),
              }}>
              {s === 'ALL' ? 'All' : s === 'SUBMITTED' ? '✓ Submitted' : '✏ Draft'}
            </button>
          ))}
          <select value={yearFilter ?? ''} onChange={e => setYearFilter(e.target.value ? Number(e.target.value) : null)}
            style={S.select}>
            <option value=''>All years</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={monthFilter ?? ''} onChange={e => setMonthFilter(e.target.value !== '' ? Number(e.target.value) : null)}
            style={S.select}>
            <option value=''>All months</option>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>

        {/* Claims list */}
        {loadingC ? (
          <div style={S.empty}>Loading claims…</div>
        ) : claimsErr ? (
          <div style={S.errorBox}>{claimsErr}</div>
        ) : filteredClaims.length === 0 ? (
          <div style={S.empty}>No claims match the selected filters.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Select all */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
              <input type='checkbox' checked={allSelected}
                onChange={() => allSelected
                  ? setSelected(new Set())
                  : setSelected(new Set(filteredClaims.map(c => c.id)))}
                style={{ width: 16, height: 16, accentColor: '#0f172a', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                {allSelected ? 'Deselect all' : `Select all (${filteredClaims.length})`}
              </span>
            </div>

            {filteredClaims.map((c, i) => (
              <div key={c.id} onClick={() => toggleOne(c.id)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0',
                borderBottom: i < filteredClaims.length - 1 ? '1px solid #f8fafc' : 'none',
                cursor: 'pointer',
              }}>
                <input type='checkbox' checked={selected.has(c.id)} onChange={() => toggleOne(c.id)}
                  onClick={e => e.stopPropagation()}
                  style={{ width: 16, height: 16, accentColor: '#0f172a', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {periodLabel(c.period_start, c.period_end, c.title)}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                      backgroundColor: c.status === 'SUBMITTED' ? '#dcfce7' : '#fef9c3',
                      color:           c.status === 'SUBMITTED' ? '#15803d' : '#854d0e',
                    }}>{c.status}</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      {fmtDateShort(c.period_start)} – {fmtDateShort(c.period_end)}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', flexShrink: 0 }}>
                  {fmtMyr(c.total_amount)}
                </div>
              </div>
            ))}
          </div>
        )}

        {selected.size > 0 && (
          <div style={{ marginTop: 12, padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
              {selected.size} claim{selected.size !== 1 ? 's' : ''} selected
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              {fmtMyr(selectedTotal)}
            </span>
          </div>
        )}
      </div>

      {/* ── Format & Generate ────────────────────────────────────────────── */}
      <div style={S.card}>
        <div style={S.cardHead}>
          <span style={S.cardIcon}>📥</span>
          <div>
            <div style={S.cardTitle}>Export Format</div>
            <div style={S.cardSub}>Choose how you want to download your data</div>
          </div>
        </div>

        {/* Format picker */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['XLSX', 'CSV', 'PDF'] as const).map(f => (
            <button key={f} onClick={() => setFormat(f)}
              style={{
                ...S.filterBtn,
                // FIX 1: use `border` shorthand on active state
                ...(format === f ? (f === 'PDF' ? S.filterActivePdf : S.filterActive) : {}),
              }}>
              {f === 'XLSX' ? '📊 Excel' : f === 'CSV' ? '📄 CSV' : '📋 PDF'}
            </button>
          ))}
        </div>

        {/* PDF panel */}
        {format === 'PDF' && (
          <div style={S.pdfPanel}>

            {/* Feature grid */}
            <div style={S.pdfFeaturesGrid}>
              {[
                ['📋', 'Cover page',    'Claimant info + org + grand total'],
                ['📊', 'Summary table', 'All selected claims'],
                ['🔍', 'Item detail',   'Every line item'],
                ['🧾', 'Receipts',      'Original photos embedded'],
                ['✍',  'Declaration',  'Signature + date'],
              ].map(([icon, title, desc]) => (
                <div key={title} style={S.pdfFeature}>
                  <span style={{ fontSize: 16 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{title}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Layout toggle */}
            <div style={{ borderTop: '1px solid #e9d5ff', paddingTop: 14 }}>
              <LayoutToggle />
            </div>

            {/* Signature */}
            <div style={{ borderTop: '1px solid #e9d5ff', paddingTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                ✍ Your Signature
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
                Optional. Appears on the Declaration page.
              </div>
              <SignaturePad onCapture={dataUrl => setSignature(dataUrl)} width={420} height={130} />
              {signature
                ? <div style={{ fontSize: 11, color: '#15803d', fontWeight: 600, marginTop: 6 }}>✓ Signature ready</div>
                : <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>No signature — blank line will appear</div>
              }
            </div>

          </div>
        )}

        {genError   && <div style={{ ...S.errorBox,   marginTop: 12 }}>{genError}</div>}
        {genSuccess && <div style={{ ...S.successBox, marginTop: 12 }}>{genSuccess}</div>}

        <button
          onClick={handleGenerate}
          disabled={generating || selected.size === 0}
          style={{
            ...S.btnGenerate,
            ...(format === 'PDF' ? S.btnGeneratePdf : {}),
            marginTop: 14,
            opacity: generating || selected.size === 0 ? 0.45 : 1,
            cursor:  selected.size === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {generating
            ? `Generating ${format}…`
            : selected.size === 0
              ? 'Select claims above first'
              : format === 'PDF'
                ? `Generate PDF — ${selected.size} claim${selected.size !== 1 ? 's' : ''} · ${pdfLayout === 'BY_CATEGORY' ? 'By Category' : 'By Date'} · ${fmtMyr(selectedTotal)}`
                : `Generate ${format} — ${selected.size} claim${selected.size !== 1 ? 's' : ''}`
          }
        </button>
      </div>

      {/* ── History ──────────────────────────────────────────────────────── */}
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
  page:     { maxWidth: 560, margin: '0 auto', padding: '20px 16px 60px', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', gap: 16 },
  card:     { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px' },
  cardHead: { display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  cardIcon: { fontSize: 22, flexShrink: 0 },
  cardTitle:{ fontSize: 14, fontWeight: 800, color: '#0f172a' },
  cardSub:  { fontSize: 12, color: '#64748b', marginTop: 2 },

  // FIX 1: use `border` shorthand (not `borderColor`) to avoid React style-mixing warning
  filterBtn:       { fontSize: 12, fontWeight: 600, padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', backgroundColor: '#f8fafc', color: '#374151' },
  filterActive:    { backgroundColor: '#0f172a', color: '#fff', border: '1px solid #0f172a' },
  filterActivePdf: { backgroundColor: '#7c3aed', color: '#fff', border: '1px solid #7c3aed' },

  select:     { fontSize: 12, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, backgroundColor: '#f8fafc', color: '#374151' },
  empty:      { fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '16px 0' },
  errorBox:   { padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626' },
  successBox: { padding: '10px 12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13, color: '#15803d', fontWeight: 600 },
  btnGenerate:    { width: '100%', paddingTop: 14, paddingBottom: 14, backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  btnGeneratePdf: { backgroundColor: '#7c3aed' },
  histRow:  { display: 'flex', alignItems: 'center', gap: 12, paddingTop: 12, paddingBottom: 12 },
  pdfPanel: { backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 0 },
  pdfFeaturesGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 },
  pdfFeature: { display: 'flex', alignItems: 'flex-start', gap: 8, backgroundColor: '#fff', border: '1px solid #e9d5ff', borderRadius: 8, padding: '8px 10px' },
}
