'use client'
// apps/user/app/(app)/tng/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// TNG Statement Importer — two modes:
//
// AUTO mode (machine-readable PDF):
//   Upload → Parse → Checkbox table → Save to tng_transactions
//
// MANUAL mode (image-based PDF, or parse returns 0 rows):
//   Parse returns manual_entry_required=true → user sees a row-entry table
//   to key in their toll/parking items manually → Save to tng_transactions
//
// API: POST /api/tng/parse, POST /api/tng/transactions
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from 'react'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────

type TngSector = 'TOLL' | 'PARKING'

type TngRow = {
  trans_no:       string | null
  entry_datetime: string | null
  exit_datetime:  string | null
  entry_location: string | null
  exit_location:  string | null
  amount:         number
  currency:       string
  sector:         TngSector
}

type ParseResult = {
  total_extracted:       number
  toll_count:            number
  parking_count:         number
  rows:                  TngRow[]
  manual_entry_required: boolean
  manual_entry_reason?:  string
  page_count:            number
}

type SaveResult = {
  saved_count:     number
  skipped_count:   number
  upload_batch_id: string
}

// Manual entry row (blank form row the user fills in)
type ManualRow = {
  id:             number
  sector:         TngSector
  entry_location: string
  exit_location:  string    // TOLL only
  amount:         string
  claim_date:     string
}

type Step = 'upload' | 'parsing' | 'preview' | 'manual' | 'saving' | 'done'
type SectorFilter = 'ALL' | 'TOLL' | 'PARKING'

// ── Formatters ─────────────────────────────────────────────────────────────────

const fmtMyr = (n: number) => 'MYR ' + Number(n).toFixed(2)

function fmtDateOnly(iso: string | null): string {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return iso }
}

let _rowId = 1
function newManualRow(sector: TngSector = 'TOLL'): ManualRow {
  return { id: _rowId++, sector, entry_location: '', exit_location: '', amount: '', claim_date: new Date().toISOString().slice(0, 10) }
}

function manualRowToTng(r: ManualRow): TngRow {
  return {
    trans_no:       null,
    entry_datetime: r.claim_date ? new Date(r.claim_date + 'T00:00:00+08:00').toISOString() : null,
    exit_datetime:  null,
    entry_location: r.entry_location.trim() || null,
    exit_location:  r.sector === 'TOLL' ? (r.exit_location.trim() || null) : null,
    amount:         parseFloat(r.amount) || 0,
    currency:       'MYR',
    sector:         r.sector,
  }
}

// ── Parsed Row Card ────────────────────────────────────────────────────────────

function RowCard({ row, selected, onToggle }: { row: TngRow; selected: boolean; onToggle: () => void }) {
  const isToll  = row.sector === 'TOLL'
  const badgeBg = isToll ? '#eff6ff' : '#f0fdf4'
  const badgeFg = isToll ? '#1d4ed8' : '#15803d'

  return (
    <button onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
      border: `1.5px solid ${selected ? '#0f172a' : '#e2e8f0'}`,
      borderRadius: 12, backgroundColor: selected ? '#f8fafc' : '#fff',
      cursor: 'pointer', textAlign: 'left', width: '100%',
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
        border: `2px solid ${selected ? '#0f172a' : '#cbd5e1'}`,
        backgroundColor: selected ? '#0f172a' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <span style={{ fontSize: 12, color: '#fff', fontWeight: 800 }}>✓</span>}
      </div>
      <span style={{ fontSize: 20, flexShrink: 0 }}>{isToll ? '🛣️' : '🅿️'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6, backgroundColor: badgeBg, color: badgeFg }}>{row.sector}</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>{fmtDateOnly(row.entry_datetime)}</span>
          {row.trans_no && <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>#{row.trans_no}</span>}
        </div>
        {isToll ? (
          <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
            {row.entry_location || '—'}
            {row.exit_location && <span style={{ color: '#64748b', fontWeight: 400 }}> → {row.exit_location}</span>}
          </div>
        ) : (
          <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{row.entry_location || 'Parking'}</div>
        )}
      </div>
      <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', flexShrink: 0 }}>{fmtMyr(row.amount)}</span>
    </button>
  )
}

// ── Manual Row Editor ──────────────────────────────────────────────────────────

function ManualRowEditor({ row, onChange, onRemove }: {
  row: ManualRow
  onChange: (r: ManualRow) => void
  onRemove: () => void
}) {
  const isToll = row.sector === 'TOLL'

  function set(field: keyof ManualRow, val: string) {
    onChange({ ...row, [field]: val })
  }

  return (
    <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Sector + Remove */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
          {(['TOLL', 'PARKING'] as TngSector[]).map(s => (
            <button key={s} onClick={() => set('sector', s)} style={{
              padding: '5px 12px', border: 'none', borderRadius: 8, cursor: 'pointer',
              fontSize: 12, fontWeight: 700,
              backgroundColor: row.sector === s ? '#0f172a' : '#f1f5f9',
              color:           row.sector === s ? '#fff'    : '#64748b',
            }}>
              {s === 'TOLL' ? '🛣️ Toll' : '🅿️ Parking'}
            </button>
          ))}
        </div>
        <button onClick={onRemove} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16, padding: 4, flexShrink: 0 }}>✕</button>
      </div>

      {/* Date + Amount */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={S.label}>Date</label>
          <input type="date" value={row.claim_date} onChange={e => set('claim_date', e.target.value)} style={S.input} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={S.label}>Amount (MYR)</label>
          <input type="number" min="0" step="0.01" placeholder="0.00" value={row.amount} onChange={e => set('amount', e.target.value)} style={S.input} />
        </div>
      </div>

      {/* Location */}
      {isToll ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Entry Plaza</label>
            <input type="text" placeholder="e.g. PLUS – TAPAH" value={row.entry_location} onChange={e => set('entry_location', e.target.value)} style={S.input} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Exit Plaza</label>
            <input type="text" placeholder="e.g. PLUS – SUBANG" value={row.exit_location} onChange={e => set('exit_location', e.target.value)} style={S.input} />
          </div>
        </div>
      ) : (
        <div>
          <label style={S.label}>Location</label>
          <input type="text" placeholder="e.g. IOI City Mall" value={row.entry_location} onChange={e => set('entry_location', e.target.value)} style={S.input} />
        </div>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function TngImporterPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step,         setStep]         = useState<Step>('upload')
  const [dragOver,     setDragOver]     = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parseResult,  setParseResult]  = useState<ParseResult | null>(null)
  const [saveResult,   setSaveResult]   = useState<SaveResult | null>(null)
  const [errorMsg,     setErrorMsg]     = useState<string | null>(null)

  // Auto mode selection
  const [selected,     setSelected]     = useState<Set<number>>(new Set())
  const [sectorFilter, setSectorFilter] = useState<SectorFilter>('ALL')

  // Manual mode
  const [manualRows,   setManualRows]   = useState<ManualRow[]>([newManualRow('TOLL')])

  // ── File handling ──────────────────────────────────────────────────────────

  function pickFile(file: File) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Please upload a PDF file. TNG eStatements are PDF format.'); return
    }
    if (file.size > 10 * 1024 * 1024) { setErrorMsg('File too large (max 10 MB).'); return }
    setSelectedFile(file); setErrorMsg(null)
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
      const json = await res.json() as ParseResult

      if (!res.ok) {
        setErrorMsg((json as { error?: { message?: string } }).error?.message ?? 'Failed to parse the PDF.')
        setStep('upload'); return
      }

      setParseResult(json)

      if (json.manual_entry_required) {
        // Image-based PDF or no rows found → manual mode
        setManualRows([newManualRow('TOLL')])
        setStep('manual')
      } else {
        // Auto mode — pre-select all rows
        setSelected(new Set(json.rows.map((_, i) => i)))
        setStep('preview')
      }
    } catch (e: unknown) {
      setErrorMsg((e as Error).message || 'Unexpected error. Please try again.')
      setStep('upload')
    }
  }

  // ── Selection helpers (auto mode) ──────────────────────────────────────────

  const visibleIndices = (parseResult?.rows ?? [])
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => sectorFilter === 'ALL' || r.sector === sectorFilter)
    .map(({ i }) => i)

  function toggleRow(idx: number) {
    setSelected(prev => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n })
  }

  function selectAllVisible() { setSelected(prev => { const n = new Set(prev); visibleIndices.forEach(i => n.add(i)); return n }) }
  function deselectAllVisible() { setSelected(prev => { const n = new Set(prev); visibleIndices.forEach(i => n.delete(i)); return n }) }

  const allVisibleSelected = visibleIndices.length > 0 && visibleIndices.every(i => selected.has(i))
  const selectedRows   = (parseResult?.rows ?? []).filter((_, i) => selected.has(i))
  const selectedTotal  = selectedRows.reduce((s, r) => s + r.amount, 0)

  // ── Manual row helpers ─────────────────────────────────────────────────────

  const validManualRows = manualRows.filter(r => r.amount && parseFloat(r.amount) > 0)
  const manualTotal     = validManualRows.reduce((s, r) => s + parseFloat(r.amount), 0)

  function updateManualRow(id: number, r: ManualRow) { setManualRows(prev => prev.map(x => x.id === id ? r : x)) }
  function removeManualRow(id: number)               { setManualRows(prev => prev.filter(x => x.id !== id)) }
  function addManualRow(sector: TngSector)            { setManualRows(prev => [...prev, newManualRow(sector)]) }

  // ── Save ───────────────────────────────────────────────────────────────────

  async function handleSave(rows: TngRow[]) {
    if (rows.length === 0) return
    setStep('saving')

    try {
      const res  = await fetch('/api/tng/transactions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rows }),
      })
      const json = await res.json()

      if (!res.ok) {
        setErrorMsg(json.error?.message ?? 'Failed to save transactions.')
        setStep(parseResult?.manual_entry_required ? 'manual' : 'preview')
        return
      }

      setSaveResult(json); setStep('done')
    } catch (e: unknown) {
      setErrorMsg((e as Error).message || 'Unexpected error.')
      setStep(parseResult?.manual_entry_required ? 'manual' : 'preview')
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────────────

  function reset() {
    setStep('upload'); setSelectedFile(null); setParseResult(null)
    setSaveResult(null); setSelected(new Set()); setSectorFilter('ALL')
    setManualRows([newManualRow('TOLL')]); setErrorMsg(null)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={S.page}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/claims" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>← Claims</Link>
      </div>

      <div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>💳 TNG Statement Importer</h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
          Upload your Touch &apos;n Go eStatement to extract Toll &amp; Parking charges.
        </p>
      </div>

      {/* ── UPLOAD ────────────────────────────────────────────────────────── */}
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
              borderRadius: 16, backgroundColor: dragOver ? '#f8fafc' : selectedFile ? '#f0fdf4' : '#fafafa',
              padding: '40px 24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>{selectedFile ? '✅' : '📄'}</div>
            {selectedFile ? (
              <>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#15803d', marginBottom: 4 }}>{selectedFile.name}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{(selectedFile.size / 1024).toFixed(0)} KB — tap to change</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Drop your TNG eStatement PDF here</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>or tap to browse — PDF only, max 10 MB</div>
              </>
            )}
          </div>

          <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = '' }} style={{ display: 'none' }} />

          {/* How-to */}
          <div style={{ padding: '12px 14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>📱 How to get your TNG eStatement</div>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>
              TNG eWallet app → <strong>History</strong> → <strong>eStatement</strong> → Select month → <strong>Download PDF</strong>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
              💡 If your PDF is image-based (cannot copy text), you can still enter your transactions manually after uploading.
            </div>
          </div>

          {errorMsg && <div style={S.errorBox}>{errorMsg}</div>}

          <button onClick={handleParse} disabled={!selectedFile || step === 'parsing'} style={{ ...S.btnPrimary, opacity: !selectedFile || step === 'parsing' ? 0.45 : 1, cursor: !selectedFile || step === 'parsing' ? 'not-allowed' : 'pointer' }}>
            {step === 'parsing' ? <SpinnerLabel label="Parsing statement…" /> : '🔍 Parse Statement'}
          </button>
        </div>
      )}

      {/* ── PREVIEW (auto mode) ────────────────────────────────────────────── */}
      {(step === 'preview' || (step === 'saving' && !parseResult?.manual_entry_required)) && parseResult && !parseResult.manual_entry_required && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <StatCard label="Found"       value={parseResult.total_extracted} />
            <StatCard label="🛣️ Toll"    value={parseResult.toll_count}    color="#eff6ff" fg="#1d4ed8" />
            <StatCard label="🅿️ Parking" value={parseResult.parking_count} color="#f0fdf4" fg="#15803d" />
            <StatCard label="Selected total" value={fmtMyr(selectedTotal)} color="#fef9c3" fg="#854d0e" grow />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#64748b', flex: 1 }}>📄 {selectedFile?.name}</span>
            <button onClick={reset} style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>Change file</button>
          </div>

          {/* Sector filter */}
          <div style={{ display: 'flex', gap: 0, backgroundColor: '#f1f5f9', borderRadius: 10, padding: 4 }}>
            {(['ALL', 'TOLL', 'PARKING'] as SectorFilter[]).map(f => {
              const count = f === 'ALL' ? parseResult.total_extracted : f === 'TOLL' ? parseResult.toll_count : parseResult.parking_count
              return (
                <button key={f} onClick={() => setSectorFilter(f)} style={{
                  flex: 1, padding: '8px 4px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  backgroundColor: sectorFilter === f ? '#fff' : 'transparent',
                  color:           sectorFilter === f ? '#0f172a' : '#64748b',
                  boxShadow:       sectorFilter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}>
                  {f === 'ALL' ? `All (${count})` : f === 'TOLL' ? `🛣️ Toll (${count})` : `🅿️ Parking (${count})`}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>{selected.size} of {parseResult.total_extracted} selected</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={selectAllVisible}   disabled={allVisibleSelected} style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', background: 'none', border: 'none', cursor: 'pointer', opacity: allVisibleSelected ? 0.4 : 1 }}>Select all</button>
              <button onClick={deselectAllVisible} style={{ fontSize: 12, fontWeight: 600, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>Deselect all</button>
            </div>
          </div>

          {errorMsg && <div style={S.errorBox}>{errorMsg}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visibleIndices.map(idx => (
              <RowCard key={idx} row={parseResult.rows[idx]} selected={selected.has(idx)} onToggle={() => toggleRow(idx)} />
            ))}
          </div>

          <button onClick={() => handleSave(selectedRows)} disabled={selected.size === 0 || step === 'saving'}
            style={{ ...S.btnPrimary, opacity: selected.size === 0 || step === 'saving' ? 0.45 : 1, cursor: selected.size === 0 || step === 'saving' ? 'not-allowed' : 'pointer' }}>
            {step === 'saving' ? <SpinnerLabel label={`Saving ${selected.size} transaction${selected.size !== 1 ? 's' : ''}…`} /> : `💾 Save ${selected.size} Transaction${selected.size !== 1 ? 's' : ''} · ${fmtMyr(selectedTotal)}`}
          </button>
          <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', margin: 0 }}>Duplicate transactions (same reference number) are automatically skipped.</p>
        </div>
      )}

      {/* ── MANUAL ENTRY MODE ─────────────────────────────────────────────── */}
      {(step === 'manual' || (step === 'saving' && parseResult?.manual_entry_required)) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Reason banner */}
          {parseResult?.manual_entry_reason && (
            <div style={{ padding: '12px 14px', backgroundColor: '#fef9c3', border: '1px solid #fde68a', borderRadius: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#854d0e', marginBottom: 4 }}>📋 Manual entry required</div>
              <div style={{ fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>{parseResult.manual_entry_reason}</div>
            </div>
          )}

          {/* File info */}
          {selectedFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#64748b', flex: 1 }}>📄 {selectedFile.name}</span>
              <button onClick={reset} style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>Change file</button>
            </div>
          )}

          {/* Manual rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {manualRows.map(row => (
              <ManualRowEditor key={row.id} row={row} onChange={r => updateManualRow(r.id, r)} onRemove={() => removeManualRow(row.id)} />
            ))}
          </div>

          {/* Add row buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => addManualRow('TOLL')} style={{ ...S.btnSecondary, flex: 1, fontSize: 13 }}>+ 🛣️ Add Toll</button>
            <button onClick={() => addManualRow('PARKING')} style={{ ...S.btnSecondary, flex: 1, fontSize: 13 }}>+ 🅿️ Add Parking</button>
          </div>

          {/* Total preview */}
          {validManualRows.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#fef9c3', border: '1px solid #fde68a', borderRadius: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#854d0e' }}>{validManualRows.length} row{validManualRows.length !== 1 ? 's' : ''} to save</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#854d0e' }}>{fmtMyr(manualTotal)}</span>
            </div>
          )}

          {errorMsg && <div style={S.errorBox}>{errorMsg}</div>}

          <button
            onClick={() => handleSave(validManualRows.map(manualRowToTng))}
            disabled={validManualRows.length === 0 || step === 'saving'}
            style={{ ...S.btnPrimary, opacity: validManualRows.length === 0 || step === 'saving' ? 0.45 : 1, cursor: validManualRows.length === 0 || step === 'saving' ? 'not-allowed' : 'pointer' }}
          >
            {step === 'saving' ? <SpinnerLabel label={`Saving ${validManualRows.length} transaction${validManualRows.length !== 1 ? 's' : ''}…`} /> : `💾 Save ${validManualRows.length} Transaction${validManualRows.length !== 1 ? 's' : ''} · ${fmtMyr(manualTotal)}`}
          </button>
        </div>
      )}

      {/* ── DONE ──────────────────────────────────────────────────────────── */}
      {step === 'done' && saveResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', padding: '24px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 56 }}>✅</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Transactions saved!</div>
            <div style={{ fontSize: 14, color: '#64748b' }}>
              <strong style={{ color: '#15803d' }}>{saveResult.saved_count} saved</strong>
              {saveResult.skipped_count > 0 && <> · <strong style={{ color: '#64748b' }}>{saveResult.skipped_count} skipped</strong> (already in records)</>}
            </div>
          </div>
          <div style={{ padding: '8px 14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
            Batch: {saveResult.upload_batch_id.slice(0, 8)}…
          </div>
          <div style={{ width: '100%', padding: '14px', backgroundColor: '#fef9c3', border: '1px solid #fde68a', borderRadius: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#854d0e', marginBottom: 6 }}>💡 What&apos;s next?</div>
            <div style={{ fontSize: 12, color: '#92400e', lineHeight: 1.7, textAlign: 'left' }}>
              Your TNG transactions are now in your records. When adding a Toll or Parking item to a claim, tick <strong>Paid by TNG</strong> — the amount will be linked from here.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <Link href="/claims" style={{ ...S.btnPrimary, textDecoration: 'none', textAlign: 'center', display: 'block' }}>Go to Claims</Link>
            <button onClick={reset} style={S.btnSecondary}>Import another statement</button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Tiny helpers ───────────────────────────────────────────────────────────────

function SpinnerLabel({ label }: { label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      {label}
    </span>
  )
}

function StatCard({ label, value, color, fg, grow }: { label: string; value: number | string; color?: string; fg?: string; grow?: boolean }) {
  return (
    <div style={{ flex: grow ? 2 : 1, minWidth: 70, padding: '10px 14px', backgroundColor: color ?? '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
      <div style={{ fontSize: 11, color: fg ?? '#64748b', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: typeof value === 'string' ? 16 : 20, fontWeight: 800, color: fg ?? '#0f172a' }}>{value}</div>
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page:        { display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 80, maxWidth: 640 },
  btnPrimary:  { width: '100%', padding: '14px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  btnSecondary:{ width: '100%', padding: '12px', backgroundColor: '#fff', color: '#374151', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  errorBox:    { padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626' },
  label:       { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 },
  input:       { width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box' },
}
