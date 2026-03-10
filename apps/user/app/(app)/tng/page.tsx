'use client'
// apps/user/app/(app)/tng/page.tsx
// Route: /tng
//
// TNG Statement Manager
//
// PURPOSE:
//   tng_transactions is a persistent library — rows stay in DB and are reused
//   across claims. This page is the hub to manage that library:
//     - See all imported statements (grouped by upload_batch_id)
//     - Import a new statement (collapsible inline importer)
//     - Remove a batch (only when 0 rows are claimed)
//
//   A ?return=<path> query param causes a "Continue" button to appear that
//   redirects back after import. Used by /claims/[id]/tng-link.
//
// API calls:
//   GET    /api/tng/transactions            → all rows for this user
//   POST   /api/tng/parse                   → parse PDF (preview, not saved)
//   POST   /api/tng/transactions            → save parsed rows
//   DELETE /api/tng/statements/[batch_id]  → remove a batch (unclaimed only)

import { useState, useRef, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter }                          from 'next/navigation'

// ── Types ─────────────────────────────────────────────────────────────────────

type TngRow = {
  id:              string
  trans_no:        string | null
  entry_datetime:  string | null
  exit_datetime:   string | null
  entry_location:  string | null
  exit_location:   string | null
  amount:          number
  sector:          'TOLL' | 'PARKING' | 'RETAIL'
  upload_batch_id: string | null
  claimed:         boolean
  created_at:      string
}

type StatementBatch = {
  batch_id:      string
  imported_at:   string
  toll_count:    number
  parking_count: number
  total_amount:  number
  claimed_count: number
  rows:          TngRow[]
}

type TngParsedRow = {
  trans_no:       string | null
  entry_datetime: string | null
  exit_datetime:  string | null
  entry_location: string | null
  exit_location:  string | null
  amount:         number
  sector:         'TOLL' | 'PARKING'
}

type ParseMeta = { account_name: string | null; period: string | null } | null
type ImportState = 'IDLE' | 'PARSING' | 'PREVIEW' | 'SAVING' | 'SAVED' | 'ERROR'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-MY', {
      day: '2-digit', month: 'short', year: 'numeric',
      timeZone: 'Asia/Kuala_Lumpur',
    })
  } catch { return iso }
}

function fmtMyr(n: number): string {
  return `RM ${Number(n).toFixed(2)}`
}

function groupIntoBatches(rows: TngRow[]): StatementBatch[] {
  const map = new Map<string, TngRow[]>()
  for (const r of rows) {
    const key = r.upload_batch_id ?? 'no-batch'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(r)
  }
  const batches: StatementBatch[] = []
  for (const [batch_id, bRows] of map.entries()) {
    batches.push({
      batch_id,
      imported_at:   bRows.reduce((a, b) => a < b.created_at ? a : b.created_at, bRows[0].created_at),
      toll_count:    bRows.filter(r => r.sector === 'TOLL').length,
      parking_count: bRows.filter(r => r.sector === 'PARKING').length,
      total_amount:  bRows.reduce((s, r) => s + Number(r.amount), 0),
      claimed_count: bRows.filter(r => r.claimed).length,
      rows:          bRows,
    })
  }
  return batches.sort((a, b) => b.imported_at.localeCompare(a.imported_at))
}

// ── Pill badge ────────────────────────────────────────────────────────────────

function Pill({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
      backgroundColor: bg, color, display: 'inline-block',
    }}>
      {children}
    </span>
  )
}

// ── Statement card ────────────────────────────────────────────────────────────

function StatementCard({ batch, onRemove, expanded, onToggleExpand }: {
  batch:          StatementBatch
  onRemove:       (id: string) => void
  expanded:       boolean
  onToggleExpand: (id: string) => void
}) {
  const [removing, setRemoving] = useState(false)
  const canRemove  = batch.claimed_count === 0
  const visibleRows = batch.rows.filter(r => r.sector !== 'RETAIL')

  async function handleRemove() {
    if (!confirm(
      `Remove this statement?\n\nThis will delete ${visibleRows.length} transaction${visibleRows.length !== 1 ? 's' : ''} from your library.`
    )) return
    setRemoving(true)
    try {
      const res  = await fetch(`/api/tng/statements/${batch.batch_id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) { alert(json.error?.message ?? 'Failed to remove.'); setRemoving(false); return }
      onRemove(batch.batch_id)
    } catch {
      alert('Network error. Please try again.')
      setRemoving(false)
    }
  }

  return (
    <div style={S.card}>
      {/* Header */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>📄</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
              Imported {fmtDate(batch.imported_at)}
            </div>

            {/* Stat pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {batch.toll_count > 0 && <Pill bg="#dbeafe" color="#1d4ed8">🛣️ {batch.toll_count} toll</Pill>}
              {batch.parking_count > 0 && <Pill bg="#fef3c7" color="#92400e">🅿️ {batch.parking_count} parking</Pill>}
              <Pill bg="#f1f5f9" color="#475569">{fmtMyr(batch.total_amount)}</Pill>
              {batch.claimed_count > 0 && <Pill bg="#f0fdf4" color="#15803d">✓ {batch.claimed_count} claimed</Pill>}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => onToggleExpand(batch.batch_id)}
                style={S.btnGhost}
              >
                {expanded ? '▲ Hide' : `▼ Show ${visibleRows.length} rows`}
              </button>
              {canRemove
                ? <button onClick={handleRemove} disabled={removing} style={{ ...S.btnGhost, color: '#dc2626' }}>
                    {removing ? 'Removing…' : '🗑 Remove'}
                  </button>
                : <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    {batch.claimed_count} row{batch.claimed_count !== 1 ? 's' : ''} claimed — cannot remove
                  </span>
              }
            </div>
          </div>
        </div>
      </div>

      {/* Rows list */}
      {expanded && (
        <div style={{ borderTop: '1px solid #f1f5f9' }}>
          {visibleRows.length === 0
            ? <div style={{ padding: '16px', fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>No TOLL/PARKING rows.</div>
            : visibleRows.map((row, i) => {
                const loc  = row.sector === 'TOLL'
                  ? [row.entry_location, row.exit_location].filter(Boolean).join(' → ')
                  : (row.entry_location ?? '—')
                const date = fmtDate(row.exit_datetime ?? row.entry_datetime)
                return (
                  <div key={row.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 16px',
                    borderBottom: i < visibleRows.length - 1 ? '1px solid #f8fafc' : 'none',
                    backgroundColor: row.claimed ? '#f0fdf4' : '#fff',
                  }}>
                    <span style={{ fontSize: 13 }}>{row.sector === 'TOLL' ? '🛣️' : '🅿️'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {loc}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        {date}{row.trans_no ? ` · #${row.trans_no}` : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{fmtMyr(row.amount)}</div>
                      {row.claimed && <div style={{ fontSize: 10, color: '#15803d', fontWeight: 700 }}>✓ claimed</div>}
                    </div>
                  </div>
                )
              })
          }
        </div>
      )}
    </div>
  )
}

// ── Inline importer ───────────────────────────────────────────────────────────

function InlineImporter({ onSaved }: { onSaved: (count: number) => void }) {
  const [importState, setImportState] = useState<ImportState>('IDLE')
  const [rows,        setRows]        = useState<TngParsedRow[]>([])
  const [meta,        setMeta]        = useState<ParseMeta>(null)
  const [selected,    setSelected]    = useState<Set<number>>(new Set())
  const [errorMsg,    setErrorMsg]    = useState<string | null>(null)
  const [savedCount,  setSavedCount]  = useState(0)
  const [isDragging,  setIsDragging]  = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) { setErrorMsg('Please upload a PDF file.'); return }
    setImportState('PARSING'); setErrorMsg(null); setRows([]); setMeta(null); setSelected(new Set())
    const fd = new FormData(); fd.append('file', file)
    try {
      const res  = await fetch('/api/tng/parse', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) { setErrorMsg(json?.error?.message ?? 'Parse failed.'); setImportState('ERROR'); return }
      const parsed: TngParsedRow[] = Array.isArray(json.rows) ? json.rows : []
      if (parsed.length === 0) {
        setErrorMsg('No TOLL or PARKING transactions found. Please check this is a TNG Customer Transactions Statement PDF.')
        setImportState('ERROR'); return
      }
      setRows(parsed); setMeta(json.meta ?? null)
      setSelected(new Set(parsed.map((_, i) => i)))
      setImportState('PREVIEW')
    } catch {
      setErrorMsg('Network error. Please try again.')
      setImportState('ERROR')
    }
  }, [])

  const handleSave = useCallback(async () => {
    const toSave = rows.filter((_, i) => selected.has(i))
    if (toSave.length === 0) return
    setImportState('SAVING'); setErrorMsg(null)
    try {
      const res  = await fetch('/api/tng/transactions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: toSave }),
      })
      const json = await res.json()
      if (!res.ok) { setErrorMsg(json?.error?.message ?? 'Failed to save.'); setImportState('PREVIEW'); return }
      setSavedCount(json.saved_count ?? 0)
      setImportState('SAVED')
      onSaved(json.saved_count ?? 0)
    } catch {
      setErrorMsg('Network error while saving.')
      setImportState('PREVIEW')
    }
  }, [rows, selected, onSaved])

  function toggleRow(i: number) {
    setSelected(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n })
  }
  function reset() {
    setImportState('IDLE'); setRows([]); setMeta(null); setSelected(new Set()); setErrorMsg(null); setSavedCount(0)
  }

  const selectedTotal = rows.filter((_, i) => selected.has(i)).reduce((s, r) => s + r.amount, 0)
  const tollRows      = rows.filter(r => r.sector === 'TOLL')
  const parkingRows   = rows.filter(r => r.sector === 'PARKING')

  if (importState === 'SAVED') return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#15803d', marginBottom: 4 }}>
        {savedCount} transaction{savedCount !== 1 ? 's' : ''} saved to library
      </div>
      <button onClick={reset} style={{ ...S.btnGhost, marginTop: 8 }}>Import another statement</button>
    </div>
  )

  if (importState === 'PARSING' || importState === 'SAVING') return (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <div style={S.spinner} />
      <div style={{ fontSize: 13, color: '#64748b' }}>
        {importState === 'PARSING' ? 'Reading statement…' : `Saving ${selected.size} transactions…`}
      </div>
    </div>
  )

  if (importState === 'PREVIEW') {
    const renderSection = (label: string, sRows: TngParsedRow[], bg: string, col: string) => {
      if (sRows.length === 0) return null
      const gi     = sRows.map(r => rows.indexOf(r))
      const allSel = gi.every(i => selected.has(i))
      return (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
              {label} <Pill bg={bg} color={col}>{sRows.length}</Pill>
            </span>
            <button style={{ fontSize: 11, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}
              onClick={() => setSelected(prev => { const n = new Set(prev); allSel ? gi.forEach(i => n.delete(i)) : gi.forEach(i => n.add(i)); return n })}>
              {allSel ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          {sRows.map((row, j) => {
            const idx   = rows.indexOf(row)
            const isSel = selected.has(idx)
            const desc  = label === 'TOLL'
              ? [row.entry_location, row.exit_location].filter(Boolean).join(' → ')
              : (row.entry_location ?? '—')
            return (
              <div key={j} onClick={() => toggleRow(idx)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                borderBottom: '1px solid #f1f5f9', cursor: 'pointer', opacity: isSel ? 1 : 0.45,
              }}>
                <input type="checkbox" checked={isSel} onChange={() => toggleRow(idx)}
                  onClick={e => e.stopPropagation()}
                  style={{ width: 16, height: 16, accentColor: '#0f172a', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{desc}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDate(row.exit_datetime ?? row.entry_datetime)}{row.trans_no ? ` · #${row.trans_no}` : ''}</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', flexShrink: 0 }}>{fmtMyr(row.amount)}</span>
              </div>
            )
          })}
        </div>
      )
    }

    return (
      <div>
        {meta?.account_name && (
          <div style={{ padding: '7px 10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, marginBottom: 12, fontSize: 12, color: '#15803d' }}>
            <strong>Account:</strong> {meta.account_name}{meta.period && <> · <strong>Period:</strong> {meta.period}</>}
          </div>
        )}
        {errorMsg && <div style={{ ...S.errorBox, marginBottom: 12 }}>{errorMsg}</div>}
        {renderSection('TOLL',    tollRows,    '#dbeafe', '#1d4ed8')}
        {renderSection('PARKING', parkingRows, '#fef3c7', '#92400e')}

        {/* Inline save bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, marginTop: 4 }}>
          <div style={{ fontSize: 13, color: '#374151' }}>
            <strong>{selected.size}</strong> selected
            {selectedTotal > 0 && <> · <strong style={{ color: '#0f172a' }}>{fmtMyr(selectedTotal)}</strong></>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={reset} style={{ ...S.btnGhost, border: '1px solid #e2e8f0' }}>Cancel</button>
            <button onClick={handleSave} disabled={selected.size === 0}
              style={{ fontSize: 12, fontWeight: 700, padding: '7px 16px', border: 'none', borderRadius: 8, cursor: 'pointer', backgroundColor: '#0f172a', color: '#fff', opacity: selected.size === 0 ? 0.45 : 1 }}>
              Save ({selected.size})
            </button>
          </div>
        </div>
      </div>
    )
  }

  // IDLE / ERROR
  return (
    <div>
      {errorMsg && <div style={{ ...S.errorBox, marginBottom: 12 }}>{errorMsg}</div>}
      <div
        style={{ border: `2px dashed ${isDragging ? '#3b82f6' : '#cbd5e1'}`, borderRadius: 12, padding: '28px 20px', textAlign: 'center', backgroundColor: isDragging ? '#eff6ff' : '#f8fafc', cursor: 'pointer' }}
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f) }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Drop TNG statement here or tap to browse</div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>PDF only · max 10 MB</div>
      </div>
      <input ref={fileRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
      <div style={{ marginTop: 10, fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>
        TNG app → History → Export Statement → Customer Transactions Statement PDF
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TngPage() {
  return <Suspense><TngStatementManager /></Suspense>
}

function TngStatementManager() {
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const returnUrl     = searchParams.get('return')

  const [batches,       setBatches]      = useState<StatementBatch[]>([])
  const [loadingLib,    setLoadingLib]   = useState(true)
  const [loadErr,       setLoadErr]      = useState<string | null>(null)
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null)
  const [showImporter,  setShowImporter] = useState(false)

  const loadLibrary = useCallback(async () => {
    setLoadingLib(true); setLoadErr(null)
    try {
      const res  = await fetch('/api/tng/transactions')
      const json = await res.json()
      if (!res.ok) { setLoadErr(json.error?.message ?? 'Failed to load.'); return }
      setBatches(groupIntoBatches(json.items ?? []))
    } catch { setLoadErr('Network error.') }
    finally   { setLoadingLib(false) }
  }, [])

  useEffect(() => { loadLibrary() }, [loadLibrary])

  function handleSaved(count: number) {
    if (count > 0) { loadLibrary(); setShowImporter(false) }
  }

  const hasStatements = batches.length > 0
  const totalTxns     = batches.reduce((s, b) => s + b.toll_count + b.parking_count, 0)

  return (
    <div style={S.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>💳 TNG Statements</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            {loadingLib ? 'Loading…'
              : hasStatements
                ? `${batches.length} statement${batches.length !== 1 ? 's' : ''} · ${totalTxns} transactions`
                : 'No statements imported yet'}
          </p>
        </div>
        <button
          onClick={() => setShowImporter(v => !v)}
          style={{ fontSize: 12, fontWeight: 700, padding: '8px 14px', border: 'none', borderRadius: 8, cursor: 'pointer', flexShrink: 0, backgroundColor: showImporter ? '#f1f5f9' : '#0f172a', color: showImporter ? '#64748b' : '#fff' }}
        >
          {showImporter ? '✕ Cancel' : '+ Import Statement'}
        </button>
      </div>

      {/* ── Return context banner ───────────────────────────────────── */}
      {returnUrl && (
        <div style={{ padding: '10px 14px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, fontSize: 12, color: '#1d4ed8', lineHeight: 1.5 }}>
          💡 Import a statement below, then tap <strong>Continue to match</strong> to link it to your claim.
          {hasStatements && <> Or tap <strong>Continue</strong> now to match existing transactions.</>}
        </div>
      )}

      {/* ── Inline importer ─────────────────────────────────────────── */}
      {showImporter && (
        <div style={S.card}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
            Import New Statement
          </div>
          <div style={{ padding: '14px 16px' }}>
            <InlineImporter onSaved={handleSaved} />
          </div>
        </div>
      )}

      {/* ── Errors ──────────────────────────────────────────────────── */}
      {loadErr && <div style={S.errorBox}>{loadErr}</div>}

      {/* ── Library ─────────────────────────────────────────────────── */}
      {loadingLib
        ? <div style={{ textAlign: 'center', padding: '40px 0' }}><div style={S.spinner} /></div>
        : hasStatements
          ? batches.map(b => (
              <StatementCard
                key={b.batch_id}
                batch={b}
                onRemove={id => setBatches(prev => prev.filter(x => x.batch_id !== id))}
                expanded={expandedBatch === b.batch_id}
                onToggleExpand={id => setExpandedBatch(prev => prev === id ? null : id)}
              />
            ))
          : !showImporter && (
              <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>📄</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>No statements yet</div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 1.6 }}>
                  Import your TNG Customer Transactions Statement PDF.<br />
                  Rows stay in your library and can be matched to any claim.
                </div>
                <button onClick={() => setShowImporter(true)} style={{ fontSize: 13, fontWeight: 700, padding: '10px 20px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer' }}>
                  + Import First Statement
                </button>
              </div>
            )
      }

      {/* ── Continue button (claim return flow) ─────────────────────── */}
      {returnUrl && hasStatements && !loadingLib && (
        <button
          onClick={() => router.push(returnUrl)}
          style={{ width: '100%', padding: '14px 20px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.2 }}
        >
          Continue → Match TNG to claim items
        </button>
      )}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page:    { maxWidth: 520, margin: '0 auto', padding: '20px 16px 60px', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', gap: 16 },
  card:    { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' },
  btnGhost: { fontSize: 11, fontWeight: 700, padding: '6px 12px', border: 'none', borderRadius: 8, cursor: 'pointer', backgroundColor: '#f1f5f9', color: '#374151' },
  spinner: { width: 26, height: 26, border: '3px solid #e2e8f0', borderTop: '3px solid #0f172a', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' },
  errorBox: { backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#dc2626' },
}
