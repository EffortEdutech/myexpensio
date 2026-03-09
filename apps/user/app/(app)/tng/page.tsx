'use client'
// apps/user/app/(app)/tng/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// TNG Statement Importer
//
// Flow:
//   1. Upload TNG eStatement PDF (drag-drop or file picker)
//   2. Parse → preview TOLL + PARKING rows from statement
//   3. User selects rows with checkboxes (select all / filter by type)
//   4. Save selected → POST /api/tng/transactions (deduped by trans_no)
//   5. Success screen with saved/skipped counts
//
// API endpoints used:
//   POST /api/tng/parse          → { rows, toll_count, parking_count, total_extracted }
//   POST /api/tng/transactions   → { saved_count, skipped_count, upload_batch_id }
//   GET  /api/tng/transactions   → { rows } — past saved transactions
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────

type TngRow = {
  trans_no:       string | null
  entry_datetime: string | null
  exit_datetime:  string | null
  entry_location: string | null
  exit_location:  string | null
  amount:         number
  currency:       string
  sector:         'TOLL' | 'PARKING'
}

type ParseResult = {
  total_extracted: number
  toll_count:      number
  parking_count:   number
  rows:            TngRow[]
}

type SaveResult = {
  saved_count:     number
  skipped_count:   number
  upload_batch_id: string
}

type Step = 'upload' | 'parsing' | 'preview' | 'saving' | 'done' | 'error'
type SectorFilter = 'ALL' | 'TOLL' | 'PARKING'

// ── Formatters ─────────────────────────────────────────────────────────────────

const fmtMyr = (n: number) => 'MYR ' + Number(n).toFixed(2)

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-MY', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    })
  } catch { return iso }
}

function fmtDateOnly(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-MY', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch { return iso }
}

// ── Row Card ───────────────────────────────────────────────────────────────────

function RowCard({
  row, selected, onToggle,
}: {
  row: TngRow; selected: boolean; onToggle: () => void
}) {
  const isToll    = row.sector === 'TOLL'
  const icon      = isToll ? '🛣️' : '🅿️'
  const badgeBg   = isToll ? '#eff6ff' : '#f0fdf4'
  const badgeFg   = isToll ? '#1d4ed8' : '#15803d'

  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px',
        border: `1.5px solid ${selected ? '#0f172a' : '#e2e8f0'}`,
        borderRadius: 12,
        backgroundColor: selected ? '#f8fafc' : '#fff',
        cursor: 'pointer', textAlign: 'left', width: '100%',
      }}
    >
      {/* Checkbox */}
      <div style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
        border: `2px solid ${selected ? '#0f172a' : '#cbd5e1'}`,
        backgroundColor: selected ? '#0f172a' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <span style={{ fontSize: 12, color: '#fff', fontWeight: 800 }}>✓</span>}
      </div>

      {/* Icon */}
      <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Sector badge + date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6,
            backgroundColor: badgeBg, color: badgeFg, letterSpacing: 0.5,
          }}>
            {row.sector}
          </span>
          <span style={{ fontSize: 11, color: '#64748b' }}>
            {fmtDateOnly(row.entry_datetime)}
          </span>
          {row.trans_no && (
            <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>
              #{row.trans_no}
            </span>
          )}
        </div>

        {/* Location */}
        {isToll ? (
          <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', lineHeight: 1.4 }}>
            {row.entry_location || '—'}
            {row.exit_location && (
              <span style={{ color: '#64748b', fontWeight: 400 }}> → {row.exit_location}</span>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
            {row.entry_location || row.exit_location || 'Parking'}
          </div>
        )}

        {/* Time range */}
        {(row.entry_datetime || row.exit_datetime) && (
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
            {row.entry_datetime && new Date(row.entry_datetime).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: false })}
            {row.exit_datetime && ` – ${new Date(row.exit_datetime).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: false })}`}
          </div>
        )}
      </div>

      {/* Amount */}
      <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', flexShrink: 0 }}>
        {fmtMyr(row.amount)}
      </span>
    </button>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TngImporterPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step,         setStep]         = useState<Step>('upload')
  const [dragOver,     setDragOver]     = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parseResult,  setParseResult]  = useState<ParseResult | null>(null)
  const [saveResult,   setSaveResult]   = useState<SaveResult | null>(null)
  const [errorMsg,     setErrorMsg]     = useState<string | null>(null)

  // Row selection
  const [selected,     setSelected]     = useState<Set<number>>(new Set())
  const [sectorFilter, setSectorFilter] = useState<SectorFilter>('ALL')

  // ── File handling ──────────────────────────────────────────────────────────

  function pickFile(file: File) {
    if (file.type !== 'application/pdf') {
      setErrorMsg('Please upload a PDF file. TNG eStatements are PDF format.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File is too large (max 10MB).')
      return
    }
    setSelectedFile(file)
    setErrorMsg(null)
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) pickFile(file)
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) pickFile(file)
  }

  // ── Parse ──────────────────────────────────────────────────────────────────

  async function handleParse() {
    if (!selectedFile) return
    setStep('parsing'); setErrorMsg(null)

    const form = new FormData()
    form.append('file', selectedFile)

    try {
      const res  = await fetch('/api/tng/parse', { method: 'POST', body: form })
      const json = await res.json()

      if (!res.ok) {
        setErrorMsg(json.error?.message ?? 'Failed to parse the PDF.')
        setStep('upload'); return
      }

      if (!json.rows || json.rows.length === 0) {
        setErrorMsg('No Toll or Parking transactions found in this statement. Retail / reload entries are excluded.')
        setStep('upload'); return
      }

      setParseResult(json)
      // Pre-select all rows
      setSelected(new Set(json.rows.map((_: TngRow, i: number) => i)))
      setStep('preview')
    } catch (e: unknown) {
      setErrorMsg((e as Error).message || 'Unexpected error. Please try again.')
      setStep('upload')
    }
  }

  // ── Selection helpers ──────────────────────────────────────────────────────

  const visibleRows = parseResult?.rows.filter(r =>
    sectorFilter === 'ALL' || r.sector === sectorFilter
  ) ?? []

  const visibleIndices = parseResult?.rows
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => sectorFilter === 'ALL' || r.sector === sectorFilter)
    .map(({ i }) => i) ?? []

  function toggleRow(idx: number) {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(idx) ? n.delete(idx) : n.add(idx)
      return n
    })
  }

  function selectAllVisible() {
    setSelected(prev => {
      const n = new Set(prev)
      visibleIndices.forEach(i => n.add(i))
      return n
    })
  }

  function deselectAllVisible() {
    setSelected(prev => {
      const n = new Set(prev)
      visibleIndices.forEach(i => n.delete(i))
      return n
    })
  }

  const allVisibleSelected = visibleIndices.length > 0 && visibleIndices.every(i => selected.has(i))
  const selectedRows = (parseResult?.rows ?? []).filter((_, i) => selected.has(i))
  const selectedTotal = selectedRows.reduce((s, r) => s + r.amount, 0)

  // ── Save ───────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (selectedRows.length === 0) return
    setStep('saving')

    try {
      const res  = await fetch('/api/tng/transactions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rows: selectedRows }),
      })
      const json = await res.json()

      if (!res.ok) {
        setErrorMsg(json.error?.message ?? 'Failed to save transactions.')
        setStep('preview'); return
      }

      setSaveResult(json)
      setStep('done')
    } catch (e: unknown) {
      setErrorMsg((e as Error).message || 'Unexpected error during save.')
      setStep('preview')
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────────────

  function reset() {
    setStep('upload'); setSelectedFile(null)
    setParseResult(null); setSaveResult(null)
    setSelected(new Set()); setSectorFilter('ALL')
    setErrorMsg(null)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/claims" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>
          ← Claims
        </Link>
      </div>

      <div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>
          💳 TNG Statement Importer
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
          Upload your Touch 'n Go eStatement PDF to extract Toll &amp; Parking charges into your records.
        </p>
      </div>

      {/* ── STEP: UPLOAD ────────────────────────────────────────────────────── */}
      {(step === 'upload' || step === 'parsing') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Drag-drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? '#0f172a' : selectedFile ? '#16a34a' : '#cbd5e1'}`,
              borderRadius: 16,
              backgroundColor: dragOver ? '#f8fafc' : selectedFile ? '#f0fdf4' : '#fafafa',
              padding: '40px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>
              {selectedFile ? '✅' : '📄'}
            </div>

            {selectedFile ? (
              <>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#15803d', marginBottom: 4 }}>
                  {selectedFile.name}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {(selectedFile.size / 1024).toFixed(0)} KB — tap to change file
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                  Drop your TNG eStatement PDF here
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  or tap to browse — PDF only, max 10MB
                </div>
              </>
            )}
          </div>

          <input
            ref={fileInputRef} type="file" accept=".pdf,application/pdf"
            onChange={onFileInput} style={{ display: 'none' }}
          />

          {/* How to get the statement */}
          <div style={{ padding: '12px 14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
              📱 How to get your TNG eStatement
            </div>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>
              TNG eWallet app → <strong>History</strong> → <strong>eStatement</strong> → Select month → <strong>Download PDF</strong>
            </div>
          </div>

          {errorMsg && (
            <div style={S.errorBox}>{errorMsg}</div>
          )}

          {/* Parse button */}
          <button
            onClick={handleParse}
            disabled={!selectedFile || step === 'parsing'}
            style={{
              ...S.btnPrimary,
              opacity: !selectedFile || step === 'parsing' ? 0.45 : 1,
              cursor:  !selectedFile || step === 'parsing' ? 'not-allowed' : 'pointer',
            }}
          >
            {step === 'parsing' ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <span style={S.spinner} />
                Parsing statement…
              </span>
            ) : '🔍 Parse Statement'}
          </button>
        </div>
      )}

      {/* ── STEP: PREVIEW ───────────────────────────────────────────────────── */}
      {(step === 'preview' || step === 'saving') && parseResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Summary bar */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={S.statCard}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Found</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{parseResult.total_extracted}</div>
            </div>
            <div style={{ ...S.statCard, backgroundColor: '#eff6ff' }}>
              <div style={{ fontSize: 11, color: '#1d4ed8', fontWeight: 600 }}>🛣️ Toll</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#1d4ed8' }}>{parseResult.toll_count}</div>
            </div>
            <div style={{ ...S.statCard, backgroundColor: '#f0fdf4' }}>
              <div style={{ fontSize: 11, color: '#15803d', fontWeight: 600 }}>🅿️ Parking</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#15803d' }}>{parseResult.parking_count}</div>
            </div>
            <div style={{ ...S.statCard, backgroundColor: '#fef9c3', flex: 2 }}>
              <div style={{ fontSize: 11, color: '#854d0e', fontWeight: 600 }}>Selected total</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#854d0e' }}>
                {fmtMyr(selectedTotal)}
              </div>
            </div>
          </div>

          {/* File info + change */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#64748b', flex: 1 }}>
              📄 {selectedFile?.name}
            </span>
            <button onClick={reset} style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Change file
            </button>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 0, backgroundColor: '#f1f5f9', borderRadius: 10, padding: 4 }}>
            {(['ALL', 'TOLL', 'PARKING'] as SectorFilter[]).map(f => {
              const count = f === 'ALL' ? parseResult.total_extracted
                : f === 'TOLL' ? parseResult.toll_count : parseResult.parking_count
              return (
                <button key={f} onClick={() => setSectorFilter(f)} style={{
                  flex: 1, padding: '8px 4px', border: 'none', borderRadius: 8, cursor: 'pointer',
                  fontSize: 12, fontWeight: 700,
                  backgroundColor: sectorFilter === f ? '#fff' : 'transparent',
                  color:           sectorFilter === f ? '#0f172a' : '#64748b',
                  boxShadow:       sectorFilter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}>
                  {f === 'ALL' ? `All (${count})` : f === 'TOLL' ? `🛣️ Toll (${count})` : `🅿️ Parking (${count})`}
                </button>
              )
            })}
          </div>

          {/* Select / Deselect all */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {selected.size} of {parseResult.total_extracted} selected
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={selectAllVisible}
                disabled={allVisibleSelected}
                style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', background: 'none', border: 'none', cursor: 'pointer', opacity: allVisibleSelected ? 0.4 : 1 }}
              >
                Select all
              </button>
              <button
                onClick={deselectAllVisible}
                style={{ fontSize: 12, fontWeight: 600, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Deselect all
              </button>
            </div>
          </div>

          {errorMsg && <div style={S.errorBox}>{errorMsg}</div>}

          {/* Row list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visibleIndices.map((idx) => (
              <RowCard
                key={idx}
                row={parseResult.rows[idx]}
                selected={selected.has(idx)}
                onToggle={() => toggleRow(idx)}
              />
            ))}
          </div>

          {/* Save button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={selected.size === 0 || step === 'saving'}
              style={{
                ...S.btnPrimary,
                opacity: selected.size === 0 || step === 'saving' ? 0.45 : 1,
                cursor:  selected.size === 0 || step === 'saving' ? 'not-allowed' : 'pointer',
              }}
            >
              {step === 'saving' ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <span style={S.spinner} />
                  Saving {selected.size} transaction{selected.size !== 1 ? 's' : ''}…
                </span>
              ) : `💾 Save ${selected.size} Transaction${selected.size !== 1 ? 's' : ''} · ${fmtMyr(selectedTotal)}`}
            </button>

            <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', margin: 0 }}>
              Duplicate transactions (same reference number) are automatically skipped.
            </p>
          </div>
        </div>
      )}

      {/* ── STEP: DONE ──────────────────────────────────────────────────────── */}
      {step === 'done' && saveResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', padding: '24px 0', textAlign: 'center' }}>

          <div style={{ fontSize: 56 }}>✅</div>

          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
              Transactions saved!
            </div>
            <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
              <strong style={{ color: '#15803d' }}>{saveResult.saved_count} saved</strong>
              {saveResult.skipped_count > 0 && (
                <> · <strong style={{ color: '#64748b' }}>{saveResult.skipped_count} skipped</strong> (already in records)</>
              )}
            </div>
          </div>

          {/* Batch ID for reference */}
          <div style={{ padding: '8px 14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
            Batch: {saveResult.upload_batch_id.slice(0, 8)}…
          </div>

          {/* What's next */}
          <div style={{ width: '100%', padding: '14px', backgroundColor: '#fef9c3', border: '1px solid #fde68a', borderRadius: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#854d0e', marginBottom: 6 }}>
              💡 What's next?
            </div>
            <div style={{ fontSize: 12, color: '#92400e', lineHeight: 1.7, textAlign: 'left' }}>
              Your TNG transactions are now in your records.
              When building a claim, add a <strong>Toll</strong> or <strong>Parking</strong> item
              and tick <strong>"Paid by TNG"</strong> — the matching transaction will
              auto-fill the amount when you link it.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <Link href="/claims" style={{ ...S.btnPrimary, textDecoration: 'none', textAlign: 'center', display: 'block' }}>
              Go to Claims
            </Link>
            <button
              onClick={reset}
              style={{ ...S.btnSecondary }}
            >
              Import another statement
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page:       { display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 80, maxWidth: 640 },

  btnPrimary: {
    width: '100%', padding: '14px', backgroundColor: '#0f172a', color: '#fff',
    border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  btnSecondary: {
    width: '100%', padding: '12px', backgroundColor: '#fff', color: '#374151',
    border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },

  statCard: {
    flex: 1, minWidth: 70, padding: '10px 14px',
    backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
    borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 2,
  },

  errorBox: {
    padding: '10px 12px', backgroundColor: '#fef2f2',
    border: '1px solid #fecaca', borderRadius: 8,
    fontSize: 13, color: '#dc2626',
  },

  spinner: {
    display: 'inline-block',
    width: 16, height: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  } as React.CSSProperties,
}
