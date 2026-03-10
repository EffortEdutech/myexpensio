'use client'
// apps/user/app/(app)/tng/page.tsx
// Route: /tng
//
// TNG eWallet Statement Importer
//
// State machine:
//   IDLE → (file selected) → PARSING → PREVIEW → SAVING → SAVED
//                                               ↘ (re-upload) → IDLE
//
// API calls:
//   POST /api/tng/parse          → { rows, toll_count, parking_count, meta }
//   POST /api/tng/transactions   → { saved_count, skipped_count }

import { useState, useRef, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type TngParsedRow = {
  trans_no:       string | null
  entry_datetime: string | null
  exit_datetime:  string | null
  entry_location: string | null
  exit_location:  string | null
  amount:         number
  sector:         'TOLL' | 'PARKING'
}

type ParseMeta = {
  account_name: string | null
  ewallet_id:   string | null
  period:       string | null
} | null

type PageState = 'IDLE' | 'PARSING' | 'PREVIEW' | 'SAVING' | 'SAVED' | 'ERROR'

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

function fmtMyr(amount: number): string {
  return `RM ${Number(amount).toFixed(2)}`
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  page:        { maxWidth: 480, margin: '0 auto', padding: '20px 16px 80px', fontFamily: 'system-ui, sans-serif' } as const,
  title:       { fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' } as const,
  subtitle:    { fontSize: 13, color: '#64748b', margin: '0 0 24px' } as const,

  dropzone:    {
    border:        '2px dashed #cbd5e1',
    borderRadius:  16,
    padding:       '36px 24px',
    textAlign:     'center',
    backgroundColor: '#f8fafc',
    cursor:        'pointer',
    transition:    'border-color 0.2s, background 0.2s',
  } as const,
  dropzoneDrag: {
    border:          '2px dashed #3b82f6',
    backgroundColor: '#eff6ff',
  } as const,
  dropIcon:    { fontSize: 40, marginBottom: 12 } as const,
  dropLabel:   { fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 } as const,
  dropSub:     { fontSize: 12, color: '#94a3b8' } as const,
  fileInput:   { display: 'none' } as const,

  metaCard:    {
    backgroundColor: '#f0fdf4',
    border:          '1px solid #bbf7d0',
    borderRadius:    10,
    padding:         '10px 14px',
    marginBottom:    16,
  } as const,
  metaRow:     { fontSize: 12, color: '#15803d', marginBottom: 2 } as const,
  metaLabel:   { fontWeight: 700 } as const,

  sectionHead: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    margin:         '20px 0 8px',
  } as const,
  sectionTitle: { fontSize: 14, fontWeight: 700, color: '#0f172a' } as const,
  selectAll:    {
    fontSize:   12, fontWeight: 600, color: '#3b82f6',
    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
  } as const,

  row:         {
    display:        'flex',
    alignItems:     'center',
    gap:            10,
    padding:        '10px 0',
    borderBottom:   '1px solid #f1f5f9',
  } as const,
  rowCheck:    { width: 18, height: 18, cursor: 'pointer', accentColor: '#0f172a', flexShrink: 0 } as const,
  rowBody:     { flex: 1, minWidth: 0 } as const,
  rowTitle:    { fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as const,
  rowSub:      { fontSize: 11, color: '#94a3b8', marginTop: 1 } as const,
  rowAmount:   { fontSize: 14, fontWeight: 700, color: '#0f172a', flexShrink: 0 } as const,

  footer:      {
    position:        'fixed',
    bottom:          0, left: 0, right: 0,
    backgroundColor: '#ffffff',
    borderTop:       '1px solid #e2e8f0',
    padding:         '12px 16px',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'space-between',
    gap:             10,
  } as const,
  footerLeft:  { fontSize: 13, color: '#374151' } as const,
  footerAmt:   { fontWeight: 700, color: '#0f172a' } as const,

  btnPrimary:  {
    backgroundColor: '#0f172a', color: '#fff',
    border:          'none', borderRadius: 10,
    padding:         '11px 20px',
    fontSize:        14, fontWeight: 700,
    cursor:          'pointer', flexShrink: 0,
  } as const,
  btnSecondary: {
    backgroundColor: 'transparent', color: '#64748b',
    border:          '1px solid #e2e8f0', borderRadius: 10,
    padding:         '11px 16px',
    fontSize:        13, fontWeight: 600,
    cursor:          'pointer',
  } as const,
  btnDisabled: { opacity: 0.45, pointerEvents: 'none' } as const,

  pill:        (bg: string, color: string) => ({
    fontSize: 10, fontWeight: 700,
    padding: '2px 7px', borderRadius: 6,
    backgroundColor: bg, color,
    flexShrink: 0,
  } as const),

  spinner:     {
    width: 28, height: 28,
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #0f172a',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '32px auto 12px',
  } as const,
  center:      { textAlign: 'center', padding: '32px 0', color: '#64748b', fontSize: 14 } as const,

  error:       {
    backgroundColor: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 10, padding: '14px 16px',
    fontSize: 13, color: '#dc2626', marginBottom: 16,
  } as const,
  success:     {
    backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
    borderRadius: 10, padding: '16px',
    textAlign: 'center', fontSize: 14, color: '#15803d',
  } as const,

  empty:       { textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 13 } as const,
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TngPage() {
  const [state,      setState]      = useState<PageState>('IDLE')
  const [rows,       setRows]       = useState<TngParsedRow[]>([])
  const [meta,       setMeta]       = useState<ParseMeta>(null)
  const [selected,   setSelected]   = useState<Set<number>>(new Set())
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null)
  const [savedInfo,  setSavedInfo]  = useState<{ saved: number; skipped: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Parse ──────────────────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Please upload a PDF file. Only TNG Customer Transactions Statement PDFs are supported.')
      return
    }

    setState('PARSING')
    setErrorMsg(null)
    setRows([])
    setMeta(null)
    setSelected(new Set())

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res  = await fetch('/api/tng/parse', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok) {
        const msg = json?.error?.message ?? `Parse failed (${res.status}).`
        setErrorMsg(msg)
        setState('ERROR')
        return
      }

      // Safely read rows — guard against any undefined/null
      const parsedRows: TngParsedRow[] = Array.isArray(json.rows) ? json.rows : []

      if (parsedRows.length === 0) {
        setErrorMsg('No TOLL or PARKING transactions found. Make sure this is a TNG Customer Transactions Statement PDF.')
        setState('ERROR')
        return
      }

      setRows(parsedRows)
      setMeta(json.meta ?? null)
      // Pre-select all by default
      setSelected(new Set(parsedRows.map((_, i) => i)))
      setState('PREVIEW')

    } catch (e) {
      console.error('[TNG parse]', e)
      setErrorMsg('Network error. Please check your connection and try again.')
      setState('ERROR')
    }
  }, [])

  // ── Drag & drop ────────────────────────────────────────────────────────────

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    const toSave = rows.filter((_, i) => selected.has(i))
    if (toSave.length === 0) return

    setState('SAVING')
    setErrorMsg(null)

    try {
      const res  = await fetch('/api/tng/transactions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rows: toSave }),
      })
      const json = await res.json()

      if (!res.ok) {
        setErrorMsg(json?.error?.message ?? 'Failed to save transactions.')
        setState('PREVIEW')
        return
      }

      setSavedInfo({ saved: json.saved_count ?? 0, skipped: json.skipped_count ?? 0 })
      setState('SAVED')

    } catch (e) {
      console.error('[TNG save]', e)
      setErrorMsg('Network error while saving. Please try again.')
      setState('PREVIEW')
    }
  }, [rows, selected])

  // ── Selection helpers ──────────────────────────────────────────────────────

  const toggleRow = (i: number) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })

  const tollRows    = rows.filter(r => r.sector === 'TOLL')
  const parkingRows = rows.filter(r => r.sector === 'PARKING')

  const selectedTotal = rows
    .filter((_, i) => selected.has(i))
    .reduce((s, r) => s + r.amount, 0)

  // ── Render: IDLE / ERROR ───────────────────────────────────────────────────

  const renderDropzone = () => (
    <>
      {errorMsg && <div style={S.error}>{errorMsg}</div>}

      <div
        style={{ ...S.dropzone, ...(isDragging ? S.dropzoneDrag : {}) }}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <div style={S.dropIcon}>📄</div>
        <div style={S.dropLabel}>Drop your TNG statement here</div>
        <div style={S.dropSub}>or tap to browse · PDF only · max 10 MB</div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        style={S.fileInput}
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />

      <div style={{ marginTop: 20, fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
        <strong style={{ color: '#64748b' }}>Supported format:</strong><br />
        TNG eWallet &ldquo;Customer Transactions Statement&rdquo; PDF.<br />
        Download from Touch &apos;n Go app → History → Export Statement.
      </div>
    </>
  )

  // ── Render: PARSING ────────────────────────────────────────────────────────

  const renderParsing = () => (
    <div style={S.center}>
      <div style={S.spinner} />
      <div>Reading statement…</div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
        This may take up to 30 seconds on first use.
      </div>
    </div>
  )

  // ── Render: SAVING ─────────────────────────────────────────────────────────

  const renderSaving = () => (
    <div style={S.center}>
      <div style={S.spinner} />
      <div>Saving {selected.size} transaction{selected.size !== 1 ? 's' : ''}…</div>
    </div>
  )

  // ── Render: SAVED ──────────────────────────────────────────────────────────

  const renderSaved = () => (
    <div>
      <div style={S.success}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>
          {savedInfo?.saved ?? 0} transaction{(savedInfo?.saved ?? 0) !== 1 ? 's' : ''} saved
        </div>
        {(savedInfo?.skipped ?? 0) > 0 && (
          <div style={{ fontSize: 12, color: '#166534', marginTop: 4 }}>
            {savedInfo!.skipped} duplicate{savedInfo!.skipped !== 1 ? 's' : ''} skipped
          </div>
        )}
        <div style={{ fontSize: 12, color: '#166534', marginTop: 8 }}>
          Go to a Claim → Add Item → Toll / Parking → From TNG Statement to attach them.
        </div>
      </div>

      <button
        style={{ ...S.btnSecondary, width: '100%', marginTop: 16, textAlign: 'center' }}
        onClick={() => { setState('IDLE'); setRows([]); setMeta(null); setSavedInfo(null); setSelected(new Set()) }}
      >
        Import Another Statement
      </button>
    </div>
  )

  // ── Render: PREVIEW ────────────────────────────────────────────────────────

  const renderSection = (
    label: string,
    sectionRows: TngParsedRow[],
    pillBg: string,
    pillColor: string,
  ) => {
    if (sectionRows.length === 0) return null

    // Map section rows back to global indices
    const globalIndices = sectionRows.map(r => rows.indexOf(r))
    const allSelected   = globalIndices.every(i => selected.has(i))

    return (
      <div>
        <div style={S.sectionHead}>
          <span style={S.sectionTitle}>
            {label}
            <span style={{ ...S.pill(pillBg, pillColor), marginLeft: 8 }}>
              {sectionRows.length}
            </span>
          </span>
          <button
            style={S.selectAll}
            onClick={() => {
              setSelected(prev => {
                const next = new Set(prev)
                if (allSelected) {
                  globalIndices.forEach(i => next.delete(i))
                } else {
                  globalIndices.forEach(i => next.add(i))
                }
                return next
              })
            }}
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        </div>

        {sectionRows.map((row, j) => {
          const gi     = rows.indexOf(row)
          const isChecked = selected.has(gi)
          const from   = row.entry_location ?? '—'
          const to     = row.exit_location  ?? '—'
          const dt     = fmtDate(row.exit_datetime ?? row.entry_datetime)
          const desc   = label === 'TOLL'
            ? `${from} → ${to}`
            : from

          return (
            <div
              key={j}
              style={{ ...S.row, opacity: isChecked ? 1 : 0.45, cursor: 'pointer' }}
              onClick={() => toggleRow(gi)}
            >
              <input
                type="checkbox"
                style={S.rowCheck}
                checked={isChecked}
                onChange={() => toggleRow(gi)}
                onClick={e => e.stopPropagation()}
              />
              <div style={S.rowBody}>
                <div style={S.rowTitle} title={desc}>{desc}</div>
                <div style={S.rowSub}>
                  {dt}
                  {row.trans_no ? ` · #${row.trans_no}` : ''}
                </div>
              </div>
              <div style={S.rowAmount}>{fmtMyr(row.amount)}</div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderPreview = () => (
    <>
      {errorMsg && <div style={S.error}>{errorMsg}</div>}

      {/* Meta card */}
      {meta?.account_name && (
        <div style={S.metaCard}>
          {meta.account_name && (
            <div style={S.metaRow}>
              <span style={S.metaLabel}>Account: </span>{meta.account_name}
            </div>
          )}
          {meta.period && (
            <div style={S.metaRow}>
              <span style={S.metaLabel}>Period: </span>{meta.period}
            </div>
          )}
        </div>
      )}

      {renderSection('TOLL',    tollRows,    '#dbeafe', '#1d4ed8')}
      {renderSection('PARKING', parkingRows, '#fef3c7', '#92400e')}

      {rows.length === 0 && (
        <div style={S.empty}>No transactions to display.</div>
      )}

      {/* Re-upload link */}
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button
          style={{ ...S.btnSecondary, fontSize: 12 }}
          onClick={() => { setState('IDLE'); setRows([]); setMeta(null); setSelected(new Set()) }}
        >
          Upload a different file
        </button>
      </div>

      {/* Fixed footer */}
      <div style={S.footer}>
        <div style={S.footerLeft}>
          {selected.size} selected
          {selectedTotal > 0 && (
            <> · <span style={S.footerAmt}>{fmtMyr(selectedTotal)}</span></>
          )}
        </div>
        <button
          style={{ ...S.btnPrimary, ...(selected.size === 0 ? S.btnDisabled : {}) }}
          disabled={selected.size === 0}
          onClick={handleSave}
        >
          Save {selected.size > 0 ? `(${selected.size})` : ''}
        </button>
      </div>
    </>
  )

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <div style={S.page}>
      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <h1 style={S.title}>Import TNG Statement</h1>
      <p style={S.subtitle}>
        Upload your Touch &apos;n Go Customer Transactions Statement to import toll &amp; parking charges.
      </p>

      {(state === 'IDLE' || state === 'ERROR') && renderDropzone()}
      {state === 'PARSING'                     && renderParsing()}
      {state === 'SAVING'                      && renderSaving()}
      {state === 'SAVED'                       && renderSaved()}
      {state === 'PREVIEW'                     && renderPreview()}
    </div>
  )
}
