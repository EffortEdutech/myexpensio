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
//   GET    /api/tng/transactions           → all rows for this user
//   POST   /api/tng/parse                  → parse PDF + save to Storage, returns source_file_path + statement_label
//   POST   /api/tng/transactions           → save parsed rows (with source_file_path + statement_label forwarded)
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
  statement_label: string | null  // ← new: human-readable statement name
  claimed:         boolean
  created_at:      string
}

type StatementBatch = {
  batch_id:       string
  statement_label: string        // ← new: shown as batch card header
  imported_at:    string
  toll_count:     number
  parking_count:  number
  retail_count:   number
  total_amount:   number
  claimed_count:  number
  rows:           TngRow[]
}

type TngParsedRow = {
  trans_no:       string | null
  entry_datetime: string | null
  exit_datetime:  string | null
  entry_location: string | null
  exit_location:  string | null
  amount:         number
  sector:         'TOLL' | 'PARKING' | 'RETAIL'
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
    const key = r.upload_batch_id ?? 'unbatched'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(r)
  }

  const batches: StatementBatch[] = []
  for (const [batch_id, batchRows] of map.entries()) {
    const first = batchRows[0]

    // statement_label: use from first row (all rows in batch share it), or derive fallback
    const rawLabel = first.statement_label
    const importDate = new Date(first.created_at).toLocaleDateString('en-MY', {
      day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kuala_Lumpur',
    })
    const statement_label = rawLabel ?? `Imported ${importDate}`

    batches.push({
      batch_id,
      statement_label,
      imported_at:   first.created_at,
      toll_count:    batchRows.filter(r => r.sector === 'TOLL').length,
      parking_count: batchRows.filter(r => r.sector === 'PARKING').length,
      retail_count:  batchRows.filter(r => r.sector === 'RETAIL').length,
      total_amount:  batchRows.reduce((s, r) => s + Number(r.amount), 0),
      claimed_count: batchRows.filter(r => r.claimed).length,
      rows:          batchRows,
    })
  }

  // Most recently imported first
  batches.sort((a, b) => b.imported_at.localeCompare(a.imported_at))
  return batches
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  page:      { padding: '20px 16px 80px', maxWidth: 600, margin: '0 auto', fontFamily: 'system-ui, sans-serif' } as React.CSSProperties,
  card:      { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 12 } as React.CSSProperties,
  batchHead: { padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 } as React.CSSProperties,
  batchLabel:{ fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 } as React.CSSProperties,
  batchMeta: { fontSize: 11, color: '#64748b', marginTop: 2 } as React.CSSProperties,
  batchBadge:{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, backgroundColor: '#f1f5f9', color: '#475569', flexShrink: 0 } as React.CSSProperties,
  row:       { padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #f8fafc' } as React.CSSProperties,
  rowIcon:   { width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 } as React.CSSProperties,
  rowDesc:   { fontSize: 13, color: '#0f172a', lineHeight: 1.3 } as React.CSSProperties,
  rowSub:    { fontSize: 11, color: '#64748b', marginTop: 1 } as React.CSSProperties,
  rowAmt:    { fontSize: 13, fontWeight: 700, color: '#0f172a', marginLeft: 'auto', flexShrink: 0 } as React.CSSProperties,
  claimedDot:{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#22c55e', flexShrink: 0 } as React.CSSProperties,
  errorBox:  { padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626' } as React.CSSProperties,
  spinner:   { width: 24, height: 24, border: '3px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' } as React.CSSProperties,
  delBtn:    { fontSize: 12, padding: '4px 10px', border: '1px solid #fca5a5', borderRadius: 6, backgroundColor: '#fff', color: '#ef4444', cursor: 'pointer' } as React.CSSProperties,
}

// ── Inline Importer ───────────────────────────────────────────────────────────

function InlineImporter({ onSaved }: { onSaved: (count: number) => void }) {
  const fileRef   = useRef<HTMLInputElement>(null)
  const [state,    setState]    = useState<ImportState>('IDLE')
  const [parsed,   setParsed]   = useState<TngParsedRow[]>([])
  const [meta,     setMeta]     = useState<ParseMeta>(null)
  const [label,    setLabel]    = useState<string | null>(null)
  const [srcPath,  setSrcPath]  = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [errMsg,   setErrMsg]   = useState<string | null>(null)
  const [isDragging, setDragging] = useState(false)

  async function handleFile(file: File) {
    setState('PARSING'); setErrMsg(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res  = await fetch('/api/tng/parse', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) { setErrMsg(json.error?.message ?? 'Parse failed.'); setState('ERROR'); return }

      const rows: TngParsedRow[] = json.rows ?? []
      setParsed(rows)
      setMeta(json.meta ?? null)
      setLabel(json.statement_label ?? null)  // ← capture statement_label from parse
      setSrcPath(json.source_file_path ?? null)
      setSelected(new Set(rows.map((_, i) => i)))
      setState('PREVIEW')
    } catch { setErrMsg('Network error.'); setState('ERROR') }
  }

  async function handleSave() {
    const toSave = parsed.filter((_, i) => selected.has(i))
    if (toSave.length === 0) return
    setState('SAVING')
    try {
      const res  = await fetch('/api/tng/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows:             toSave,
          source_file_path: srcPath,
          statement_label:  label,  // ← forward statement_label to persist on rows
        }),
      })
      const json = await res.json()
      if (!res.ok) { setErrMsg(json.error?.message ?? 'Save failed.'); setState('ERROR'); return }
      setState('SAVED')
      onSaved(json.saved_count ?? 0)
    } catch { setErrMsg('Network error.'); setState('ERROR') }
  }

  const tollRows    = parsed.filter(r => r.sector === 'TOLL')
  const parkingRows = parsed.filter(r => r.sector === 'PARKING')

  if (state === 'IDLE' || state === 'ERROR') return (
    <div>
      <div
        style={{ border: `2px dashed ${isDragging ? '#3b82f6' : '#cbd5e1'}`, borderRadius: 12, padding: '28px 20px', textAlign: 'center' as const, backgroundColor: isDragging ? '#eff6ff' : '#f8fafc', cursor: 'pointer' }}
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f) }}
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
      {state === 'ERROR' && errMsg && <div style={S.errorBox}>{errMsg}</div>}
    </div>
  )

  if (state === 'PARSING') return (
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      <div style={S.spinner} />
      <div style={{ fontSize: 13, color: '#64748b', marginTop: 12 }}>Reading statement…</div>
    </div>
  )

  if (state === 'SAVING') return (
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      <div style={S.spinner} />
      <div style={{ fontSize: 13, color: '#64748b', marginTop: 12 }}>Saving transactions…</div>
    </div>
  )

  if (state === 'SAVED') return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#15803d' }}>Transactions saved</div>
      {label && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>📋 {label}</div>}
    </div>
  )

  // PREVIEW state
  const selCount  = selected.size
  const selAmount = parsed.filter((_, i) => selected.has(i)).reduce((s, r) => s + r.amount, 0)

  function toggleRow(i: number) {
    setSelected(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n })
  }
  function toggleAll(rows: TngParsedRow[], baseIdx: number) {
    const idxs = rows.map((_, j) => baseIdx + j)
    const allOn = idxs.every(i => selected.has(i))
    setSelected(prev => { const n = new Set(prev); idxs.forEach(i => allOn ? n.delete(i) : n.add(i)); return n })
  }

  return (
    <div>
      {/* Statement period label */}
      {label && (
        <div style={{ marginBottom: 12, padding: '8px 12px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, fontSize: 12, color: '#0369a1', fontWeight: 600 }}>
          📋 {label}
          {meta?.account_name && <span style={{ fontWeight: 400, marginLeft: 6, color: '#0284c7' }}>· {meta.account_name}</span>}
        </div>
      )}

      {errMsg && <div style={{ ...S.errorBox, marginBottom: 10 }}>{errMsg}</div>}

      {/* TOLL section */}
      {tollRows.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const }}>🛣 Toll ({tollRows.length})</span>
            <button onClick={() => toggleAll(tollRows, 0)} style={{ fontSize: 10, padding: '2px 8px', border: '1px solid #e2e8f0', borderRadius: 4, backgroundColor: '#f8fafc', cursor: 'pointer', color: '#475569' }}>
              {tollRows.every((_, j) => selected.has(j)) ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          {tollRows.map((r, j) => {
            const globalIdx = j
            const desc = [r.entry_location, r.exit_location].filter(Boolean).join(' → ') || 'Toll'
            const date = (r.exit_datetime ?? r.entry_datetime ?? '').slice(0, 10)
            return (
              <label key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                <input type="checkbox" checked={selected.has(globalIdx)} onChange={() => toggleRow(globalIdx)} style={{ width: 16, height: 16, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#0f172a', lineHeight: 1.3 }}>{desc}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{date}{r.trans_no ? ` · #${r.trans_no}` : ''}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', flexShrink: 0 }}>{fmtMyr(r.amount)}</span>
              </label>
            )
          })}
        </div>
      )}

      {/* PARKING section */}
      {parkingRows.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const }}>🅿️ Parking ({parkingRows.length})</span>
            <button onClick={() => toggleAll(parkingRows, tollRows.length)} style={{ fontSize: 10, padding: '2px 8px', border: '1px solid #e2e8f0', borderRadius: 4, backgroundColor: '#f8fafc', cursor: 'pointer', color: '#475569' }}>
              {parkingRows.every((_, j) => selected.has(tollRows.length + j)) ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          {parkingRows.map((r, j) => {
            const globalIdx = tollRows.length + j
            const desc = r.entry_location ?? r.exit_location ?? 'Parking'
            const date = (r.exit_datetime ?? r.entry_datetime ?? '').slice(0, 10)
            return (
              <label key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                <input type="checkbox" checked={selected.has(globalIdx)} onChange={() => toggleRow(globalIdx)} style={{ width: 16, height: 16, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#0f172a', lineHeight: 1.3 }}>{desc}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{date}{r.trans_no ? ` · #${r.trans_no}` : ''}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', flexShrink: 0 }}>{fmtMyr(r.amount)}</span>
              </label>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
        <span style={{ fontSize: 12, color: '#64748b' }}>{selCount} selected · {fmtMyr(selAmount)}</span>
        <button
          onClick={handleSave}
          disabled={selCount === 0}
          style={{ fontSize: 13, fontWeight: 700, padding: '9px 18px', backgroundColor: selCount === 0 ? '#f1f5f9' : '#0f172a', color: selCount === 0 ? '#94a3b8' : '#fff', border: 'none', borderRadius: 8, cursor: selCount === 0 ? 'default' : 'pointer' }}
        >
          Save {selCount > 0 ? `${selCount} transaction${selCount !== 1 ? 's' : ''}` : 'Selected'}
        </button>
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

  const [batches,       setBatches]       = useState<StatementBatch[]>([])
  const [loadingLib,    setLoadingLib]    = useState(true)
  const [loadErr,       setLoadErr]       = useState<string | null>(null)
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null)
  const [showImporter,  setShowImporter]  = useState(false)
  const [deletingId,    setDeletingId]    = useState<string | null>(null)
  const [deleteErr,     setDeleteErr]     = useState<string | null>(null)

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

  async function handleDelete(batchId: string) {
    if (!confirm('Remove this statement? Only unclaimed transactions will be deleted.')) return
    setDeletingId(batchId); setDeleteErr(null)
    try {
      const res  = await fetch(`/api/tng/statements/${batchId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) { setDeleteErr(json.error?.message ?? 'Delete failed.'); setDeletingId(null); return }
      loadLibrary()
    } catch { setDeleteErr('Network error.') }
    finally   { setDeletingId(null) }
  }

  const hasStatements = batches.length > 0
  const totalTxns     = batches.reduce((s, b) => s + b.toll_count + b.parking_count + b.retail_count, 0)

  return (
    <div style={S.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}>
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

      {/* ── Return context banner ──────────────────────────────────────── */}
      {returnUrl && (
        <div style={{ padding: '10px 14px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, fontSize: 12, color: '#1d4ed8', lineHeight: 1.5, marginBottom: 12 }}>
          💡 Import a statement below, then tap <strong>Continue to match</strong> to link it to your claim.
          {hasStatements && <> Or tap <strong>Continue</strong> now to match existing transactions.</>}
        </div>
      )}

      {/* ── Inline importer ───────────────────────────────────────────── */}
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

      {/* ── Errors ────────────────────────────────────────────────────── */}
      {loadErr  && <div style={S.errorBox}>{loadErr}</div>}
      {deleteErr && <div style={{ ...S.errorBox, marginTop: 8 }}>{deleteErr}</div>}

      {/* ── Continue button (return flow) ─────────────────────────────── */}
      {returnUrl && hasStatements && !showImporter && (
        <button
          onClick={() => router.push(returnUrl)}
          style={{ width: '100%', padding: '12px', marginBottom: 12, backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          Continue to Match →
        </button>
      )}

      {/* ── Statement library ─────────────────────────────────────────── */}
      {loadingLib
        ? <div style={{ textAlign: 'center', padding: '40px 0' }}><div style={S.spinner} /></div>
        : hasStatements
          ? batches.map(batch => (
            <div key={batch.batch_id} style={S.card}>
              {/* Batch header */}
              <div style={S.batchHead}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* statement_label as the primary title */}
                  <div style={S.batchLabel}>📋 {batch.statement_label}</div>
                  <div style={S.batchMeta}>
                    {[
                      batch.toll_count    > 0 ? `${batch.toll_count} toll`    : null,
                      batch.parking_count > 0 ? `${batch.parking_count} parking` : null,
                      batch.retail_count  > 0 ? `${batch.retail_count} retail`  : null,
                    ].filter(Boolean).join(' · ')}
                    {' · '}
                    {fmtMyr(batch.total_amount)}
                    {batch.claimed_count > 0 && ` · ${batch.claimed_count} claimed`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => setExpandedBatch(b => b === batch.batch_id ? null : batch.batch_id)}
                    style={{ fontSize: 11, padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: 6, backgroundColor: '#f8fafc', color: '#475569', cursor: 'pointer' }}
                  >
                    {expandedBatch === batch.batch_id ? 'Hide' : 'Show'}
                  </button>
                  {batch.claimed_count === 0 && (
                    <button
                      onClick={() => handleDelete(batch.batch_id)}
                      disabled={deletingId === batch.batch_id}
                      style={S.delBtn}
                    >
                      {deletingId === batch.batch_id ? '…' : 'Remove'}
                    </button>
                  )}
                </div>
              </div>

              {/* Expandable rows */}
              {expandedBatch === batch.batch_id && (
                <div>
                  {batch.rows.map(row => {
                    const desc = row.sector === 'TOLL'
                      ? [row.entry_location, row.exit_location].filter(Boolean).join(' → ') || 'Toll'
                      : row.entry_location ?? row.exit_location ?? (row.sector === 'PARKING' ? 'Parking' : 'Retail')
                    const date = (row.exit_datetime ?? row.entry_datetime ?? '').slice(0, 10)
                    return (
                      <div key={row.id} style={S.row}>
                        <div style={{ ...S.rowIcon, backgroundColor: row.sector === 'TOLL' ? '#f0fdf4' : row.sector === 'PARKING' ? '#eff6ff' : '#fefce8' }}>
                          {row.sector === 'TOLL' ? '🛣' : row.sector === 'PARKING' ? '🅿️' : '🛍'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={S.rowDesc}>{desc}</div>
                          <div style={S.rowSub}>{fmtDate(date)}{row.trans_no ? ` · #${row.trans_no}` : ''}</div>
                        </div>
                        <div style={{ ...S.rowAmt, color: row.claimed ? '#15803d' : '#0f172a' }}>
                          {fmtMyr(Number(row.amount))}
                        </div>
                        {row.claimed && <div style={S.claimedDot} title="Claimed" />}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))
          : !loadErr && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>No statements yet</div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>Import your TNG eWallet statement PDF to see toll and parking transactions here.</div>
            </div>
          )
      }
    </div>
  )
}
