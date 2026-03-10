'use client'
// apps/user/app/(app)/tng/page.tsx
//
// TNG Statement Importer
//
// State machine:
//   IDLE     → user has not uploaded a file yet
//   PARSING  → POST /api/tng/parse in progress
//   PREVIEW  → parsed rows shown; user picks which to save
//   SAVING   → POST /api/tng/transactions in progress
//   SAVED    → success — show counts + link to /tng/transactions
//
// Navigation:
//   Link to /tng/transactions always visible in header
//   After SAVED → explicit "View Saved Transactions" button

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────────────────

type Sector = 'TOLL' | 'PARKING'

type ParsedRow = {
  trans_no:       string | null
  entry_datetime: string | null
  exit_datetime:  string | null
  entry_location: string | null
  exit_location:  string | null
  amount:         number
  sector:         Sector | 'RETAIL'
}

type PageState = 'IDLE' | 'PARSING' | 'PREVIEW' | 'SAVING' | 'SAVED'

type SaveResult = {
  upload_batch_id: string
  saved_count:     number
  skipped_count:   number
  message:         string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtMyr(n: number) {
  return 'RM ' + n.toFixed(2)
}

function fmtDateShort(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-MY', {
      day: '2-digit', month: 'short',
    })
  } catch {
    return '—'
  }
}

function rowKey(row: ParsedRow, idx: number): string {
  return row.trans_no ?? `row-${idx}`
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function TngPage() {
  const [pageState,   setPageState]  = useState<PageState>('IDLE')
  const [rows,        setRows]       = useState<ParsedRow[]>([])
  const [selected,    setSelected]   = useState<Set<string>>(new Set())
  const [parseError,  setParseError] = useState<string | null>(null)
  const [saveError,   setSaveError]  = useState<string | null>(null)
  const [saveResult,  setSaveResult] = useState<SaveResult | null>(null)
  const [isDragOver,  setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Derived ────────────────────────────────────────────────────────────────

  const tollRows    = rows.filter(r => r.sector === 'TOLL')
  const parkingRows = rows.filter(r => r.sector === 'PARKING')

  const selectedRows = rows.filter((r, i) => selected.has(rowKey(r, i)))
  const selectedTotal = selectedRows.reduce((sum, r) => sum + r.amount, 0)

  // ── File processing ────────────────────────────────────────────────────────

  const processFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && !file.type.includes('pdf')) {
      setParseError('Please upload a PDF file. TNG statements are PDF documents.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setParseError('File is too large. Maximum size is 10 MB.')
      return
    }

    setParseError(null)
    setSaveError(null)
    setPageState('PARSING')

    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch('/api/tng/parse', { method: 'POST', body: form })
      const json = await res.json()

      if (!res.ok) {
        setParseError(json.error?.message ?? 'Failed to parse PDF. Make sure it is a digital TNG statement.')
        setPageState('IDLE')
        return
      }

      const parsed: ParsedRow[] = (json.rows ?? []).filter(
        (r: ParsedRow) => r.sector === 'TOLL' || r.sector === 'PARKING'
      )

      if (parsed.length === 0) {
        setParseError('No TOLL or PARKING transactions found in this statement.')
        setPageState('IDLE')
        return
      }

      setRows(parsed)

      // Pre-select all by default
      const allKeys = new Set<string>(parsed.map((r, i) => rowKey(r, i)))
      setSelected(allKeys)
      setPageState('PREVIEW')
    } catch (e) {
      console.error('[TNG parse]', e)
      setParseError('Network error. Please check your connection and try again.')
      setPageState('IDLE')
    }
  }, [])

  // ── Drag & drop ────────────────────────────────────────────────────────────

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function onDragLeave() {
    setIsDragOver(false)
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    // Reset so same file can be re-uploaded
    e.target.value = ''
  }

  // ── Selection ──────────────────────────────────────────────────────────────

  function toggleRow(key: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function selectAll(sectorRows: ParsedRow[], sectorIndices: number[]) {
    setSelected(prev => {
      const next = new Set(prev)
      sectorRows.forEach((r, localIdx) => next.add(rowKey(r, sectorIndices[localIdx])))
      return next
    })
  }

  function deselectAll(sectorRows: ParsedRow[], sectorIndices: number[]) {
    setSelected(prev => {
      const next = new Set(prev)
      sectorRows.forEach((r, localIdx) => next.delete(rowKey(r, sectorIndices[localIdx])))
      return next
    })
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (selected.size === 0) {
      setSaveError('Please select at least one transaction to save.')
      return
    }

    setSaveError(null)
    setPageState('SAVING')

    // Build rows to save (only selected)
    const rowsToSave = rows.filter((r, i) => selected.has(rowKey(r, i)))

    try {
      const res = await fetch('/api/tng/transactions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rows: rowsToSave }),
      })
      const json = await res.json()

      if (!res.ok) {
        setSaveError(json.error?.message ?? 'Failed to save. Please try again.')
        setPageState('PREVIEW')
        return
      }

      setSaveResult(json)
      setPageState('SAVED')
    } catch (e) {
      console.error('[TNG save]', e)
      setSaveError('Network error. Please check your connection and try again.')
      setPageState('PREVIEW')
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────────────

  function reset() {
    setPageState('IDLE')
    setRows([])
    setSelected(new Set())
    setParseError(null)
    setSaveError(null)
    setSaveResult(null)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={S.page}>

      {/* ── Page header ──────────────────────────────────────────── */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.pageTitle}>💳 TNG Statement Import</h1>
          <p style={S.pageSub}>Upload your Touch 'n Go statement PDF to import toll and parking transactions.</p>
        </div>
        <Link href="/tng/transactions" style={S.txnLink}>
          View Saved Transactions →
        </Link>
      </div>

      {/* ── IDLE: File picker ─────────────────────────────────────── */}
      {pageState === 'IDLE' && (
        <>
          <div
            style={{
              ...S.dropZone,
              ...(isDragOver ? S.dropZoneActive : {}),
            }}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={S.dropIcon}>📄</div>
            <p style={S.dropTitle}>Drop your TNG statement here</p>
            <p style={S.dropSub}>or click to browse · PDF only · Max 10 MB</p>
            <button style={S.browseBtn} onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}>
              Choose PDF File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: 'none' }}
              onChange={onFileInput}
            />
          </div>

          {parseError && (
            <div style={S.errorBox}>
              <span style={{ fontWeight: 600 }}>⚠ Parse failed</span><br />
              {parseError}
            </div>
          )}

          <div style={S.tipBox}>
            <strong>How to get your TNG statement:</strong>
            <ol style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.7 }}>
              <li>Open the <strong>TNG eWallet</strong> app</li>
              <li>Go to <strong>History</strong> → tap the filter icon</li>
              <li>Select a date range and tap <strong>Export Statement</strong></li>
              <li>Save the PDF and upload it here</li>
            </ol>
          </div>
        </>
      )}

      {/* ── PARSING: Spinner ──────────────────────────────────────── */}
      {pageState === 'PARSING' && (
        <div style={S.spinnerBox}>
          <div style={S.spinner} />
          <p style={S.spinnerText}>Reading your TNG statement…</p>
          <p style={S.spinnerSub}>Extracting toll and parking transactions</p>
        </div>
      )}

      {/* ── PREVIEW: Checkbox table + Save button ─────────────────── */}
      {pageState === 'PREVIEW' && (
        <>
          {saveError && (
            <div style={S.errorBox}>
              <span style={{ fontWeight: 600 }}>⚠ Save failed</span><br />
              {saveError}
            </div>
          )}

          {/* Summary bar */}
          <div style={S.summaryBar}>
            <div style={S.summaryLeft}>
              <span style={S.summaryCount}>{rows.length}</span>
              <span style={S.summarySub}> transactions found</span>
              {tollRows.length > 0 && (
                <span style={S.sectorBadge('#dcfce7', '#16a34a')}>
                  🛣 {tollRows.length} Toll
                </span>
              )}
              {parkingRows.length > 0 && (
                <span style={S.sectorBadge('#dbeafe', '#1d4ed8')}>
                  🅿 {parkingRows.length} Parking
                </span>
              )}
            </div>
            <button onClick={reset} style={S.uploadNewBtn}>
              ↩ Upload Different File
            </button>
          </div>

          {/* TOLL section */}
          {tollRows.length > 0 && (
            <TxnSection
              title="🛣 Toll Transactions"
              accentColor="#16a34a"
              accentBg="#f0fdf4"
              rows={tollRows}
              allRows={rows}
              selected={selected}
              onToggle={toggleRow}
              onSelectAll={() => {
                const indices = rows.reduce<number[]>((acc, r, i) => { if (r.sector === 'TOLL') acc.push(i); return acc }, [])
                selectAll(tollRows, indices)
              }}
              onDeselectAll={() => {
                const indices = rows.reduce<number[]>((acc, r, i) => { if (r.sector === 'TOLL') acc.push(i); return acc }, [])
                deselectAll(tollRows, indices)
              }}
            />
          )}

          {/* PARKING section */}
          {parkingRows.length > 0 && (
            <TxnSection
              title="🅿 Parking Transactions"
              accentColor="#1d4ed8"
              accentBg="#eff6ff"
              rows={parkingRows}
              allRows={rows}
              selected={selected}
              onToggle={toggleRow}
              onSelectAll={() => {
                const indices = rows.reduce<number[]>((acc, r, i) => { if (r.sector === 'PARKING') acc.push(i); return acc }, [])
                selectAll(parkingRows, indices)
              }}
              onDeselectAll={() => {
                const indices = rows.reduce<number[]>((acc, r, i) => { if (r.sector === 'PARKING') acc.push(i); return acc }, [])
                deselectAll(parkingRows, indices)
              }}
            />
          )}

          {/* ── SAVE FOOTER ─────────────────────────────────────────── */}
          <div style={S.saveFooter}>
            <div style={S.saveTotal}>
              <span style={S.saveTotalLabel}>Selected</span>
              <span style={S.saveTotalCount}>{selected.size} of {rows.length}</span>
              <span style={S.saveTotalAmount}>{fmtMyr(selectedTotal)}</span>
            </div>

            {selected.size === 0 && (
              <p style={S.saveHint}>Tick at least one transaction above to save it.</p>
            )}

            <button
              onClick={handleSave}
              disabled={selected.size === 0}
              style={{
                ...S.saveBtn,
                opacity: selected.size === 0 ? 0.5 : 1,
                cursor:  selected.size === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              💾 Save {selected.size > 0 ? `${selected.size} ` : ''}Selected Transaction{selected.size !== 1 ? 's' : ''}
            </button>
          </div>
        </>
      )}

      {/* ── SAVING: Spinner ───────────────────────────────────────── */}
      {pageState === 'SAVING' && (
        <div style={S.spinnerBox}>
          <div style={S.spinner} />
          <p style={S.spinnerText}>Saving transactions…</p>
          <p style={S.spinnerSub}>Please wait, do not close this page</p>
        </div>
      )}

      {/* ── SAVED: Success ────────────────────────────────────────── */}
      {pageState === 'SAVED' && saveResult && (
        <div style={S.successBox}>
          <div style={S.successIcon}>✓</div>
          <h2 style={S.successTitle}>Transactions Saved!</h2>

          <div style={S.successStats}>
            <div style={S.successStat}>
              <span style={S.successStatNum}>{saveResult.saved_count}</span>
              <span style={S.successStatLabel}>Saved</span>
            </div>
            {saveResult.skipped_count > 0 && (
              <div style={S.successStat}>
                <span style={{ ...S.successStatNum, color: '#94a3b8' }}>{saveResult.skipped_count}</span>
                <span style={S.successStatLabel}>Already existed</span>
              </div>
            )}
          </div>

          <p style={S.successMessage}>{saveResult.message}</p>

          <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', margin: '0 0 16px' }}>
            To add them to a claim, go to your claim → Add Item → Toll or Parking → From TNG Statement.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
            <Link href="/tng/transactions" style={S.viewTxnBtn}>
              📋 View All Saved Transactions
            </Link>
            <button onClick={reset} style={S.importAnotherBtn}>
              ↩ Import Another Statement
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

// ── TxnSection component ───────────────────────────────────────────────────────

type TxnSectionProps = {
  title:         string
  accentColor:   string
  accentBg:      string
  rows:          ParsedRow[]
  allRows:       ParsedRow[]
  selected:      Set<string>
  onToggle:      (key: string) => void
  onSelectAll:   () => void
  onDeselectAll: () => void
}

function TxnSection({
  title, accentColor, accentBg,
  rows, allRows, selected,
  onToggle, onSelectAll, onDeselectAll,
}: TxnSectionProps) {
  // Map local row to its global index key
  const getKey = (row: ParsedRow) => {
    const globalIdx = allRows.findIndex(r => r === row)
    return rowKey(row, globalIdx)
  }

  const sectionKeys   = rows.map(getKey)
  const selectedCount = sectionKeys.filter(k => selected.has(k)).length
  const allSelected   = selectedCount === rows.length
  const subtotal      = rows.filter(r => selected.has(getKey(r))).reduce((s, r) => s + r.amount, 0)

  return (
    <div style={{ ...S.section, borderTop: `3px solid ${accentColor}` }}>
      {/* Section header */}
      <div style={{ ...S.sectionHeader, backgroundColor: accentBg }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: accentColor }}>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            {selectedCount} of {rows.length} selected · {fmtMyr(subtotal)}
          </span>
          <button
            onClick={allSelected ? onDeselectAll : onSelectAll}
            style={S.selectAllBtn}
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        </div>
      </div>

      {/* Rows */}
      <div>
        {rows.map((row) => {
          const key      = getKey(row)
          const isChecked = selected.has(key)

          return (
            <div
              key={key}
              onClick={() => onToggle(key)}
              style={{
                ...S.txnRow,
                backgroundColor: isChecked ? '#fafffe' : '#fff',
                borderLeft: isChecked ? `3px solid ${accentColor}` : '3px solid transparent',
              }}
            >
              {/* Checkbox */}
              <div style={{
                ...S.checkbox,
                backgroundColor: isChecked ? accentColor : '#fff',
                borderColor:     isChecked ? accentColor : '#cbd5e1',
              }}>
                {isChecked && <span style={S.checkmark}>✓</span>}
              </div>

              {/* Date */}
              <div style={S.txnDate}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
                  {fmtDateShort(row.entry_datetime)}
                </span>
              </div>

              {/* Location */}
              <div style={S.txnLocation}>
                {row.entry_location && row.exit_location ? (
                  <>
                    <span style={S.txnLocMain}>{row.entry_location}</span>
                    <span style={S.txnLocArrow}>→</span>
                    <span style={S.txnLocMain}>{row.exit_location}</span>
                  </>
                ) : row.entry_location ? (
                  <span style={S.txnLocMain}>{row.entry_location}</span>
                ) : (
                  <span style={{ ...S.txnLocMain, color: '#94a3b8', fontStyle: 'italic' }}>Location not extracted</span>
                )}
                {row.trans_no && (
                  <span style={S.txnNo}>#{row.trans_no}</span>
                )}
              </div>

              {/* Amount */}
              <div style={S.txnAmount}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                  {fmtMyr(row.amount)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

function S_sectorBadge(bg: string, color: string): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center',
    padding: '2px 8px', borderRadius: 99,
    fontSize: 11, fontWeight: 600,
    backgroundColor: bg, color,
    marginLeft: 8,
  }
}

const S: Record<string, React.CSSProperties> & { sectorBadge: (bg: string, c: string) => React.CSSProperties } = {
  sectorBadge: S_sectorBadge,

  page: {
    display: 'flex', flexDirection: 'column', gap: 16,
    maxWidth: 640, paddingBottom: 60,
  },
  pageHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
    flexWrap: 'wrap',
  },
  pageTitle: {
    fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0,
  },
  pageSub: {
    fontSize: 13, color: '#64748b', margin: '4px 0 0',
  },
  txnLink: {
    fontSize: 13, fontWeight: 600, color: '#0891b2',
    textDecoration: 'none', whiteSpace: 'nowrap',
    padding: '6px 12px',
    border: '1px solid #bae6fd',
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
  },

  // Drop zone
  dropZone: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    padding: '40px 24px',
    border: '2px dashed #cbd5e1',
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  dropZoneActive: {
    borderColor: '#0891b2',
    backgroundColor: '#f0f9ff',
  },
  dropIcon: {
    fontSize: 48,
    lineHeight: 1,
  },
  dropTitle: {
    fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0,
  },
  dropSub: {
    fontSize: 13, color: '#64748b', margin: 0,
  },
  browseBtn: {
    marginTop: 6,
    padding: '10px 24px',
    backgroundColor: '#0891b2',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14, fontWeight: 600,
    cursor: 'pointer',
  },

  // Error
  errorBox: {
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 10,
    fontSize: 13, color: '#dc2626',
    lineHeight: 1.5,
  },

  // Tip
  tipBox: {
    padding: '14px 16px',
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: 10,
    fontSize: 13, color: '#92400e',
  },

  // Spinner
  spinnerBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
    padding: '60px 24px',
  },
  spinner: {
    width: 40, height: 40,
    border: '4px solid #e2e8f0',
    borderTopColor: '#0891b2',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  spinnerText: {
    fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0,
  },
  spinnerSub: {
    fontSize: 13, color: '#64748b', margin: 0,
  },

  // Summary bar
  summaryBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexWrap: 'wrap', gap: 10,
    padding: '12px 16px',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
  },
  summaryLeft: {
    display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap',
  },
  summaryCount: {
    fontSize: 18, fontWeight: 800, color: '#0f172a',
  },
  summarySub: {
    fontSize: 13, color: '#64748b',
  },
  uploadNewBtn: {
    fontSize: 12, fontWeight: 600, color: '#64748b',
    background: 'none', border: '1px solid #e2e8f0',
    borderRadius: 8, padding: '6px 12px',
    cursor: 'pointer',
  },

  // Section
  section: {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 16px', gap: 8, flexWrap: 'wrap',
  },
  selectAllBtn: {
    fontSize: 11, fontWeight: 600, color: '#0891b2',
    background: 'none', border: 'none',
    cursor: 'pointer', padding: '2px 4px',
  },

  // Transaction row
  txnRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 16px',
    borderBottom: '1px solid #f8fafc',
    cursor: 'pointer',
    transition: 'background 0.1s',
  },
  checkbox: {
    width: 20, height: 20, flexShrink: 0,
    borderRadius: 5, border: '2px solid #cbd5e1',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.1s',
  },
  checkmark: {
    fontSize: 12, color: '#fff', fontWeight: 700, lineHeight: 1,
  },
  txnDate: {
    width: 52, flexShrink: 0,
  },
  txnLocation: {
    flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1,
  },
  txnLocMain: {
    fontSize: 12, fontWeight: 600, color: '#0f172a',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  txnLocArrow: {
    fontSize: 10, color: '#94a3b8',
  },
  txnNo: {
    fontSize: 10, color: '#94a3b8',
  },
  txnAmount: {
    flexShrink: 0, textAlign: 'right' as const,
    minWidth: 72,
  },

  // Save footer
  saveFooter: {
    position: 'sticky' as const, bottom: 0,
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: '16px 20px',
    display: 'flex', flexDirection: 'column', gap: 10,
    boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
  },
  saveTotal: {
    display: 'flex', alignItems: 'center', gap: 8,
  },
  saveTotalLabel: {
    fontSize: 12, fontWeight: 600, color: '#64748b',
  },
  saveTotalCount: {
    fontSize: 13, fontWeight: 700, color: '#0f172a',
    backgroundColor: '#f1f5f9',
    padding: '2px 8px', borderRadius: 99,
  },
  saveTotalAmount: {
    marginLeft: 'auto', fontSize: 18, fontWeight: 800, color: '#0f172a',
  },
  saveHint: {
    fontSize: 12, color: '#94a3b8', margin: 0, textAlign: 'center' as const,
  },
  saveBtn: {
    width: '100%',
    padding: '14px 20px',
    backgroundColor: '#059669',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15, fontWeight: 700,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },

  // Success
  successBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
    padding: '36px 24px',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
  },
  successIcon: {
    width: 56, height: 56,
    backgroundColor: '#d1fae5',
    color: '#059669',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 26, fontWeight: 700,
  },
  successTitle: {
    fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0,
  },
  successStats: {
    display: 'flex', gap: 28,
  },
  successStat: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
  },
  successStatNum: {
    fontSize: 30, fontWeight: 800, color: '#059669', lineHeight: 1,
  },
  successStatLabel: {
    fontSize: 12, color: '#64748b',
  },
  successMessage: {
    fontSize: 13, color: '#64748b', margin: 0, textAlign: 'center' as const,
  },
  viewTxnBtn: {
    display: 'block', textAlign: 'center' as const,
    padding: '13px 20px',
    backgroundColor: '#0891b2',
    color: '#fff',
    borderRadius: 10,
    textDecoration: 'none',
    fontSize: 14, fontWeight: 700,
  },
  importAnotherBtn: {
    width: '100%',
    padding: '12px 20px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    fontSize: 14, fontWeight: 600,
    cursor: 'pointer',
  },
}
