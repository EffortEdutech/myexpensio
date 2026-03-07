'use client'
// apps/user/app/(app)/exports/page.tsx
//
// UX flow:
//   1. Page loads — fetches all claims for the org
//   2. User filters by status / year / month (optional)
//   3. User ticks the claims they want to export
//   4. Picks format (XLSX / CSV / PDF)
//   5. For PDF: draws signature on SignaturePad
//   6. Taps Generate → file downloads immediately

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

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTHS = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
]

const currentYear  = new Date().getFullYear()
const currentMonth = new Date().getMonth()  // 0-indexed
// Years: 2023 → current year, ascending for dropdown
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
  // Claims state
  const [claims,      setClaims]      = useState<Claim[]>([])
  const [loadingC,    setLoadingC]    = useState(true)
  const [claimsErr,   setClaimsErr]   = useState<string | null>(null)

  // Filter state (for the claims list)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'DRAFT'>('ALL')
  const [yearFilter,   setYearFilter]   = useState<number | null>(null)
  const [monthFilter,  setMonthFilter]  = useState<number | null>(null)  // 0-indexed

  // Selection state
  const [selected,    setSelected]    = useState<Set<string>>(new Set())

  // Export state
  const [format,      setFormat]      = useState<'XLSX' | 'CSV' | 'PDF'>('XLSX')
  const [signature,   setSignature]   = useState<string | null>(null)  // base64 PNG from SignaturePad
  const [generating,  setGenerating]  = useState(false)
  const [genError,    setGenError]    = useState<string | null>(null)
  const [genSuccess,  setGenSuccess]  = useState<string | null>(null)

  // History state
  const [history,     setHistory]     = useState<ExportJob[]>([])
  const [loadingH,    setLoadingH]    = useState(true)

  // ── Load claims ────────────────────────────────────────────────────────────

  const loadClaims = useCallback(async () => {
    setLoadingC(true); setClaimsErr(null)
    const res  = await fetch('/api/claims?limit=100')
    const json = await res.json()
    if (!res.ok) { setClaimsErr(json.error?.message ?? 'Failed to load claims.'); setLoadingC(false); return }
    setClaims(json.items ?? [])
    setLoadingC(false)
  }, [])

  // ── Load history ───────────────────────────────────────────────────────────

  const loadHistory = useCallback(async () => {
    const res  = await fetch('/api/exports')
    const json = await res.json()
    setHistory(json.items ?? [])
    setLoadingH(false)
  }, [])

  useEffect(() => {
    loadClaims()
    loadHistory()
  }, [loadClaims, loadHistory])

  // ── Filtered claims ────────────────────────────────────────────────────────

  const filteredClaims = claims.filter(c => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false
    if (yearFilter !== null && c.period_start) {
      if (new Date(c.period_start).getFullYear() !== yearFilter) return false
    }
    if (monthFilter !== null && c.period_start) {
      if (new Date(c.period_start).getMonth() !== monthFilter) return false
    }
    return true
  })

  // ── Selection helpers ──────────────────────────────────────────────────────

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(filteredClaims.map(c => c.id)))
  }

  function selectNone() {
    setSelected(new Set())
  }

  const allSelected  = filteredClaims.length > 0 && filteredClaims.every(c => selected.has(c.id))
  const someSelected = filteredClaims.some(c => selected.has(c.id)) && !allSelected

  // Total of selected claims
  const selectedClaims  = claims.filter(c => selected.has(c.id))
  const selectedTotal   = selectedClaims.reduce((sum, c) => sum + Number(c.total_amount), 0)

  // ── Generate ───────────────────────────────────────────────────────────────

  async function handleGenerate() {
    if (selected.size === 0) { setGenError('Select at least one claim.'); return }
    setGenerating(true); setGenError(null); setGenSuccess(null)

    const body: Record<string, unknown> = {
      format,
      claim_ids: Array.from(selected),
    }
    // PDF: attach signature if provided
    if (format === 'PDF' && signature) {
      body.signature_data_url = signature
    }

    const res = await fetch('/api/exports', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })

    setGenerating(false)

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setGenError(json.error?.message ?? 'Export failed. Please try again.')
      return
    }

    const rowCount = parseInt(res.headers.get('X-Row-Count') ?? '0')

    // Trigger blob download
    const blob = await res.blob()
    const ext  = format === 'CSV' ? 'csv' : format === 'PDF' ? 'pdf' : 'xlsx'
    const ds   = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `myexpensio_claim_${ds}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setGenSuccess(`✓ ${format} downloaded — ${rowCount} item${rowCount !== 1 ? 's' : ''} from ${selected.size} claim${selected.size !== 1 ? 's' : ''}.`)
    await loadHistory()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={S.page}>
      <h1 style={S.pageTitle}>Export Claims</h1>

      {/* ── Step 1: Select claims ─────────────────────────────────────────── */}
      <div style={S.card}>
        <div style={S.cardHead}>
          <span style={S.cardIcon}>📋</span>
          <div style={{ flex: 1 }}>
            <div style={S.cardTitle}>Step 1 — Select Claims</div>
            <div style={S.cardSub}>Tick the claims you want to export</div>
          </div>
          {selected.size > 0 && (
            <span style={S.selBadge}>{selected.size} selected</span>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Row 1: Status + Year + Month dropdowns */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* Status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 100 }}>
              <label style={S.dropLabel}>Status</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as 'ALL' | 'SUBMITTED' | 'DRAFT')}
                style={S.dropdown}
              >
                <option value="ALL">All</option>
                <option value="SUBMITTED">✓ Submitted</option>
                <option value="DRAFT">✏ Draft</option>
              </select>
            </div>

            {/* Year */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 90 }}>
              <label style={S.dropLabel}>Year</label>
              <select
                value={yearFilter ?? ''}
                onChange={e => {
                  const val = e.target.value
                  if (!val) { setYearFilter(null); setMonthFilter(null) }
                  else setYearFilter(Number(val))
                }}
                style={S.dropdown}
              >
                <option value="">All years</option>
                {YEARS.slice().reverse().map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Month — enabled only when a year is selected */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 110 }}>
              <label style={{ ...S.dropLabel, opacity: yearFilter === null ? 0.4 : 1 }}>Month</label>
              <select
                value={monthFilter ?? ''}
                disabled={yearFilter === null}
                onChange={e => {
                  const val = e.target.value
                  setMonthFilter(val === '' ? null : Number(val))
                }}
                style={{ ...S.dropdown, opacity: yearFilter === null ? 0.4 : 1 }}
              >
                <option value="">All months</option>
                {MONTHS.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Select all / none */}
        {filteredClaims.length > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={allSelected ? selectNone : selectAll} style={S.linkBtn}>
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
            {selected.size > 0 && (
              <>
                <span style={{ color: '#e2e8f0' }}>|</span>
                <button onClick={selectNone} style={S.linkBtn}>Clear selection</button>
              </>
            )}
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              {filteredClaims.length} claim{filteredClaims.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Claims list */}
        {loadingC ? (
          <div style={S.empty}>Loading claims…</div>
        ) : claimsErr ? (
          <div style={S.errorBox}>{claimsErr}</div>
        ) : filteredClaims.length === 0 ? (
          <div style={S.empty}>No claims match the selected filters.</div>
        ) : (
          <div style={S.claimList}>
            {filteredClaims.map((claim, i) => {
              const isChecked = selected.has(claim.id)
              const label     = periodLabel(claim.period_start, claim.period_end, claim.title)
              return (
                <button
                  key={claim.id}
                  onClick={() => toggleOne(claim.id)}
                  style={{
                    ...S.claimRow,
                    borderTop:       i > 0 ? '1px solid #f1f5f9' : 'none',
                    backgroundColor: isChecked ? '#f0f9ff' : '#fff',
                  }}
                >
                  {/* Checkbox */}
                  <div style={{
                    ...S.checkbox,
                    backgroundColor: isChecked ? '#0f172a' : '#fff',
                    borderColor:     isChecked ? '#0f172a' : '#cbd5e1',
                  }}>
                    {isChecked && <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>✓</span>}
                  </div>

                  {/* Claim info */}
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      {fmtDateShort(claim.period_start)}
                      {claim.period_end && claim.period_end !== claim.period_start && ` – ${fmtDateShort(claim.period_end)}`}
                    </div>
                  </div>

                  {/* Status + amount */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      paddingTop: 2, paddingBottom: 2, paddingLeft: 7, paddingRight: 7,
                      borderRadius: 10,
                      backgroundColor: claim.status === 'SUBMITTED' ? '#f0fdf4' : '#fef9c3',
                      color:           claim.status === 'SUBMITTED' ? '#15803d' : '#854d0e',
                    }}>
                      {claim.status === 'SUBMITTED' ? '✓ Submitted' : 'Draft'}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                      {fmtMyr(claim.total_amount)}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Step 2: Format + Generate ─────────────────────────────────────── */}
      <div style={{ ...S.card, opacity: selected.size === 0 ? 0.5 : 1 }}>
        <div style={S.cardHead}>
          <span style={S.cardIcon}>📤</span>
          <div>
            <div style={S.cardTitle}>Step 2 — Export</div>
            <div style={S.cardSub}>Choose format and download</div>
          </div>
        </div>

        {/* Selected summary */}
        {selected.size > 0 && (
          <div style={S.summaryBox}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
              {selected.size} claim{selected.size !== 1 ? 's' : ''} selected &nbsp;·&nbsp;
              <span style={{ color: '#64748b', fontWeight: 600 }}>{fmtMyr(selectedTotal)}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {selectedClaims.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569' }}>
                  <span>{periodLabel(c.period_start, c.period_end, c.title)}</span>
                  <span style={{ fontWeight: 600 }}>{fmtMyr(c.total_amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Format toggle — 3 buttons */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Format</div>
          <div style={S.filterRow}>
            <button onClick={() => setFormat('XLSX')} style={{ ...S.filterBtn, ...(format === 'XLSX' ? S.filterActive : {}), flex: 1 }}>
              📊 Excel (.xlsx)
            </button>
            <button onClick={() => setFormat('CSV')} style={{ ...S.filterBtn, ...(format === 'CSV' ? S.filterActive : {}), flex: 1 }}>
              📄 CSV (.csv)
            </button>
            <button onClick={() => setFormat('PDF')} style={{ ...S.filterBtn, ...(format === 'PDF' ? S.filterActivePdf : {}), flex: 1 }}>
              📋 PDF (submit-ready)
            </button>
          </div>
        </div>

        {/* PDF — feature callout + SignaturePad */}
        {format === 'PDF' && (
          <div style={S.pdfPanel}>
            {/* What's in the PDF */}
            <div style={S.pdfFeaturesGrid}>
              {[
                ['📋', 'Cover page', 'Claimant info + org + grand total'],
                ['📊', 'Claims summary', 'All selected claims in one table'],
                ['🔍', 'Item detail', 'Every line item per claim'],
                ['🧾', 'Receipt appendix', 'Original photos embedded per page'],
                ['✍', 'Declaration', 'Claimant signature + date'],
              ].map(([icon, title, desc]) => (
                <div key={title} style={S.pdfFeature}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{title}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Signature section */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                ✍ Your Signature
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
                Optional but recommended. Your signature will appear on the Declaration page of the PDF.
              </div>
              <SignaturePad
                onCapture={dataUrl => setSignature(dataUrl)}
                width={420}
                height={130}
              />
              {signature && (
                <div style={{ fontSize: 11, color: '#15803d', fontWeight: 600, marginTop: 6 }}>
                  ✓ Signature ready — will be embedded in PDF
                </div>
              )}
              {!signature && (
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                  No signature drawn — PDF will include a blank signature line
                </div>
              )}
            </div>
          </div>
        )}

        {genError   && <div style={S.errorBox}>{genError}</div>}
        {genSuccess && <div style={S.successBox}>{genSuccess}</div>}

        <button
          onClick={handleGenerate}
          disabled={generating || selected.size === 0}
          style={{
            ...S.btnGenerate,
            ...(format === 'PDF' ? S.btnGeneratePdf : {}),
            opacity: generating || selected.size === 0 ? 0.45 : 1,
            cursor:  selected.size === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {generating
            ? `Generating ${format}…`
            : selected.size === 0
              ? 'Select claims above first'
              : format === 'PDF'
                ? `Generate PDF — ${selected.size} claim${selected.size !== 1 ? 's' : ''} · ${fmtMyr(selectedTotal)}`
                : `Generate ${format} — ${selected.size} claim${selected.size !== 1 ? 's' : ''}`}
        </button>
      </div>

      {/* ── History ───────────────────────────────────────────────────────── */}
      <div style={S.card}>
        <div style={S.cardHead}>
          <span style={S.cardIcon}>🕐</span>
          <div>
            <div style={S.cardTitle}>Export History</div>
            <div style={S.cardSub}>Re-download any previous export</div>
          </div>
        </div>

        {loadingH ? (
          <div style={S.empty}>Loading…</div>
        ) : history.length === 0 ? (
          <div style={S.empty}>No exports yet. Generate your first export above.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {history.map((job, i) => (
              <div key={job.id} style={{
                ...S.histRow,
                borderTop: i > 0 ? '1px solid #f1f5f9' : 'none',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      padding: '2px 6px', borderRadius: 6,
                      backgroundColor: job.format === 'XLSX' ? '#dcfce7'
                                     : job.format === 'PDF'  ? '#fef3c7'
                                     : '#dbeafe',
                      color:           job.format === 'XLSX' ? '#15803d'
                                     : job.format === 'PDF'  ? '#92400e'
                                     : '#1d4ed8',
                    }}>{job.format}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                      {histPeriodLabel(job)}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    {job.row_count != null ? `${job.row_count} item${job.row_count !== 1 ? 's' : ''} · ` : ''}
                    {fmtDateTime(job.created_at)}
                  </div>
                </div>
                {job.status === 'DONE' ? (
                  <a href={`/api/exports/${job.id}/download`} target="_blank" rel="noreferrer" style={S.btnDownload}>
                    ⬇
                  </a>
                ) : (
                  <span style={{ fontSize: 12, color: '#dc2626' }}>Failed</span>
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
  page:        { display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 80 },
  pageTitle:   { fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 },
  card:        {
    backgroundColor: '#fff', borderWidth: 1, borderStyle: 'solid', borderColor: '#e2e8f0', borderRadius: 14,
    paddingTop: 14, paddingBottom: 16, paddingLeft: 16, paddingRight: 16,
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  cardHead:    { display: 'flex', alignItems: 'center', gap: 10 },
  cardIcon:    { fontSize: 20 },
  cardTitle:   { fontSize: 14, fontWeight: 700, color: '#0f172a' },
  cardSub:     { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  selBadge:    {
    fontSize: 11, fontWeight: 700, color: '#fff',
    backgroundColor: '#0f172a', borderRadius: 12,
    paddingTop: 3, paddingBottom: 3, paddingLeft: 8, paddingRight: 8,
  },

  // Dropdowns
  dropLabel:   { fontSize: 11, fontWeight: 600, color: '#64748b' },
  dropdown:    {
    paddingTop: 8, paddingBottom: 8, paddingLeft: 10, paddingRight: 10,
    borderWidth: 1.5, borderStyle: 'solid', borderColor: '#e2e8f0', borderRadius: 8,
    fontSize: 13, color: '#0f172a', backgroundColor: '#fff',
    cursor: 'pointer', outline: 'none', width: '100%',
  },

  // Filters
  filterRow:   { display: 'flex', gap: 6, flexWrap: 'wrap' },
  filterBtn:   {
    paddingTop: 6, paddingBottom: 6, paddingLeft: 12, paddingRight: 12,
    borderWidth: 1.5, borderStyle: 'solid', borderColor: '#e2e8f0', borderRadius: 8,
    fontSize: 12, fontWeight: 500, cursor: 'pointer',
    backgroundColor: '#f8fafc', color: '#374151',
  },
  filterActive: {
    backgroundColor: '#0f172a', color: '#fff',
    borderWidth: 1.5, borderStyle: 'solid', borderColor: '#0f172a', fontWeight: 700,
  },
  linkBtn:     {
    fontSize: 12, color: '#3b82f6', fontWeight: 500,
    background: 'none', borderWidth: 0, borderStyle: 'solid', borderColor: 'transparent', cursor: 'pointer', padding: 0,
  },

  // Claims list
  claimList:   { display: 'flex', flexDirection: 'column', borderRadius: 10, borderWidth: 1, borderStyle: 'solid', borderColor: '#e2e8f0', overflow: 'hidden' },
  claimRow:    {
    display: 'flex', alignItems: 'center', gap: 12,
    paddingTop: 12, paddingBottom: 12, paddingLeft: 14, paddingRight: 14,
    cursor: 'pointer', width: '100%', textAlign: 'left',
    borderWidth: 0, borderStyle: 'solid', borderColor: 'transparent', boxSizing: 'border-box',
  },
  checkbox:    {
    width: 20, height: 20, borderRadius: 5, flexShrink: 0,
    borderWidth: 2, borderStyle: 'solid', borderColor: '#cbd5e1',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  // Summary box
  summaryBox:  {
    backgroundColor: '#f8fafc', borderRadius: 10,
    paddingTop: 12, paddingBottom: 12, paddingLeft: 14, paddingRight: 14,
    borderWidth: 1, borderStyle: 'solid', borderColor: '#e2e8f0',
  },

  // Feedback
  errorBox:    {
    paddingTop: 10, paddingBottom: 10, paddingLeft: 12, paddingRight: 12,
    backgroundColor: '#fef2f2', borderWidth: 1, borderStyle: 'solid', borderColor: '#fecaca',
    borderRadius: 8, fontSize: 13, color: '#dc2626',
  },
  successBox:  {
    paddingTop: 10, paddingBottom: 10, paddingLeft: 12, paddingRight: 12,
    backgroundColor: '#f0fdf4', borderWidth: 1, borderStyle: 'solid', borderColor: '#bbf7d0',
    borderRadius: 8, fontSize: 13, color: '#15803d', fontWeight: 600,
  },
  btnGenerate: {
    paddingTop: 14, paddingBottom: 14,
    backgroundColor: '#0f172a', color: '#fff',
    borderWidth: 0, borderStyle: 'solid', borderColor: 'transparent', borderRadius: 10,
    fontSize: 14, fontWeight: 700,
  },

  // Empty / feedback
  empty:       { fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '16px 0' },

  // History
  histRow:     { display: 'flex', alignItems: 'center', gap: 12, paddingTop: 12, paddingBottom: 12 },
  btnDownload: {
    fontSize: 16, color: '#0f172a',
    borderWidth: 1, borderStyle: 'solid', borderColor: '#e2e8f0', borderRadius: 8,
    paddingTop: 7, paddingBottom: 7, paddingLeft: 12, paddingRight: 12,
    textDecoration: 'none', flexShrink: 0, backgroundColor: '#f8fafc',
  },

  // PDF-specific
  filterActivePdf: {
    backgroundColor: '#7c3aed', color: '#fff',
    borderWidth: 1.5, borderStyle: 'solid', borderColor: '#7c3aed', fontWeight: 700,
  },
  pdfPanel: {
    backgroundColor: '#faf5ff',
    borderWidth: 1, borderStyle: 'solid', borderColor: '#e9d5ff',
    borderRadius: 12,
    paddingTop: 14, paddingBottom: 14, paddingLeft: 16, paddingRight: 16,
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  pdfFeaturesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  pdfFeature: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#fff',
    borderWidth: 1, borderStyle: 'solid', borderColor: '#e9d5ff',
    borderRadius: 8,
    paddingTop: 8, paddingBottom: 8, paddingLeft: 10, paddingRight: 10,
  },
  btnGeneratePdf: {
    backgroundColor: '#7c3aed',
  },
}
