'use client'
// apps/admin/components/TemplateEditor.tsx
//
// Two-tab export template builder:
//
//   Tab 1 — Columns
//     Left panel  : All available columns grouped by category (tick to include)
//     Right panel : Export order list (↑ ↓ to reorder, ✕ to remove)
//     Preview     : Live header strip showing final column order
//
//   Tab 2 — PDF Settings
//     Controls the visual layout and optional sections of the PDF export.
//     Stored as template.schema.pdf_layout JSONB block.
//     Drives pdf-builder.ts → PdfLayoutConfig.
//
// JSONB stored in report_templates.schema:
//   {
//     version:    2,
//     preset:     'STANDARD' | 'COMPLETE' | 'CUSTOM',
//     columns:    ExportColumnKey[],       ← ordered array
//     pdf_layout: PdfLayoutConfig          ← NEW
//   }

import { useState, useCallback } from 'react'
import {
  ALL_COLUMNS,
  COLUMN_GROUPS,
  PRESET_COLUMNS,
  getColumnDef,
  type ExportColumnKey,
  type ColumnPreset,
} from '@/lib/export-columns'

// ── PDF layout config type (mirrors pdf-builder.ts PdfLayoutConfig) ──────────
export type PdfLayoutConfig = {
  orientation:           'portrait' | 'landscape'
  grouping:              'BY_DATE' | 'BY_CATEGORY'
  show_summary_table:    boolean
  show_receipt_appendix: boolean
  show_tng_appendix:     boolean
  show_declaration:      boolean
  accent_color:          string   // hex — used for header bar and section headers
}

export const DEFAULT_PDF_LAYOUT: PdfLayoutConfig = {
  orientation:           'portrait',
  grouping:              'BY_DATE',
  show_summary_table:    true,
  show_receipt_appendix: true,
  show_tng_appendix:     true,
  show_declaration:      true,
  accent_color:          '#0f172a',
}

// ── Column helpers ────────────────────────────────────────────────────────────
const STANDARD_SET = new Set(PRESET_COLUMNS.STANDARD)

function inferPreset(cols: ExportColumnKey[]): ColumnPreset | 'CUSTOM' {
  if (cols.length === 0) return 'STANDARD'
  const sorted     = [...cols].sort().join(',')
  const stdSorted  = [...PRESET_COLUMNS.STANDARD].sort().join(',')
  const compSorted = [...PRESET_COLUMNS.COMPLETE].sort().join(',')
  if (sorted === stdSorted)  return 'STANDARD'
  if (sorted === compSorted) return 'COMPLETE'
  return 'CUSTOM'
}

// ── Props ─────────────────────────────────────────────────────────────────────
type Props = {
  initialColumns:    ExportColumnKey[]
  initialPdfLayout?: Partial<PdfLayoutConfig>
  onChangeColumns:   (columns: ExportColumnKey[]) => void
  onChangePdfLayout: (layout: PdfLayoutConfig) => void
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TemplateEditor({
  initialColumns,
  initialPdfLayout,
  onChangeColumns,
  onChangePdfLayout,
}: Props) {
  const [tab, setTab]     = useState<'columns' | 'pdf'>('columns')
  const [ordered, setOrdered] = useState<ExportColumnKey[]>(
    initialColumns.length > 0 ? initialColumns : PRESET_COLUMNS.STANDARD
  )
  const [pdfLayout, setPdfLayout] = useState<PdfLayoutConfig>({
    ...DEFAULT_PDF_LAYOUT,
    ...initialPdfLayout,
  })

  const selected = new Set(ordered)

  function emitColumns(next: ExportColumnKey[]) {
    setOrdered(next)
    onChangeColumns(next)
  }

  function emitPdf(patch: Partial<PdfLayoutConfig>) {
    const next = { ...pdfLayout, ...patch }
    setPdfLayout(next)
    onChangePdfLayout(next)
  }

  // ── Column actions ────────────────────────────────────────────────────────
  function applyPreset(preset: ColumnPreset) {
    emitColumns([...PRESET_COLUMNS[preset]])
  }

  const toggleColumn = useCallback((key: ExportColumnKey) => {
    if (selected.has(key)) {
      emitColumns(ordered.filter(k => k !== key))
    } else {
      emitColumns([...ordered, key])
    }
  }, [ordered, selected])

  function selectGroup(group: string, select: boolean) {
    const groupKeys = ALL_COLUMNS.filter(c => c.group === group).map(c => c.key)
    if (select) {
      const toAdd = groupKeys.filter(k => !selected.has(k))
      emitColumns([...ordered, ...toAdd])
    } else {
      emitColumns(ordered.filter(k => !groupKeys.includes(k)))
    }
  }

  function moveUp(idx: number) {
    if (idx === 0) return
    const next = [...ordered];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    emitColumns(next)
  }

  function moveDown(idx: number) {
    if (idx === ordered.length - 1) return
    const next = [...ordered];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    emitColumns(next)
  }

  function remove(idx: number) {
    emitColumns(ordered.filter((_, i) => i !== idx))
  }

  const activePreset = inferPreset(ordered)

  // ── Tab bar ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <div className="flex gap-1 border-b border-gray-200">
        {(['columns', 'pdf'] as const).map(t => (
          <button
            key={t} type="button" onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'columns' ? `Columns (${ordered.length})` : 'PDF Settings'}
          </button>
        ))}
      </div>

      {/* ── TAB 1: COLUMNS ──────────────────────────────────────────────── */}
      {tab === 'columns' && (
        <div className="space-y-3">

          {/* Preset shortcuts */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-medium text-gray-500">Quick presets:</span>
            {(['STANDARD', 'COMPLETE'] as ColumnPreset[]).map(p => (
              <button
                key={p} type="button" onClick={() => applyPreset(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  activePreset === p
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                {p} <span className="opacity-60">({PRESET_COLUMNS[p].length})</span>
              </button>
            ))}
            {activePreset === 'CUSTOM' && (
              <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                Custom ({ordered.length} cols)
              </span>
            )}
          </div>

          {/* Two-panel */}
          <div className="grid grid-cols-2 gap-3">

            {/* LEFT: column picker */}
            <div className="border border-gray-200 rounded-xl overflow-auto max-h-[420px]">
              <div className="sticky top-0 bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Available columns</p>
              </div>
              {COLUMN_GROUPS.map(group => {
                const groupCols  = ALL_COLUMNS.filter(c => c.group === group)
                const checkedCnt = groupCols.filter(c => selected.has(c.key)).length
                const allOn      = checkedCnt === groupCols.length
                return (
                  <div key={group} className="border-b border-gray-50 last:border-0">
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50/60">
                      <span className="text-xs font-semibold text-gray-600">{group}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{checkedCnt}/{groupCols.length}</span>
                        <button type="button" onClick={() => selectGroup(group, !allOn)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                          {allOn ? 'None' : 'All'}
                        </button>
                      </div>
                    </div>
                    {groupCols.map(col => {
                      const isChecked  = selected.has(col.key)
                      const isStandard = STANDARD_SET.has(col.key)
                      return (
                        <label key={col.key}
                          className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors">
                          <input type="checkbox" checked={isChecked}
                            onChange={() => toggleColumn(col.key)}
                            className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium ${isChecked ? 'text-gray-900' : 'text-gray-500'}`}>
                                {col.label}
                              </span>
                              {isStandard && (
                                <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium flex-shrink-0">STD</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 truncate mt-0.5">{col.description}</p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                )
              })}
            </div>

            {/* RIGHT: order list */}
            <div className="border border-gray-200 rounded-xl overflow-auto max-h-[420px]">
              <div className="sticky top-0 bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Export order — {ordered.length} column{ordered.length !== 1 ? 's' : ''}
                </p>
              </div>
              {ordered.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-gray-400">
                  No columns selected. Tick columns on the left.
                </div>
              ) : ordered.map((key, idx) => {
                const def = getColumnDef(key)
                return (
                  <div key={key}
                    className="flex items-center gap-2 px-3 py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 group">
                    <span className="text-xs text-gray-300 w-5 text-right flex-shrink-0 font-mono">{idx + 1}</span>
                    <span className="flex-1 text-xs font-medium text-gray-800 min-w-0 truncate">{def?.label ?? key}</span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => moveUp(idx)} disabled={idx === 0}
                        className="px-1.5 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-25">↑</button>
                      <button type="button" onClick={() => moveDown(idx)} disabled={idx === ordered.length - 1}
                        className="px-1.5 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-25">↓</button>
                    </div>
                    <button type="button" onClick={() => remove(idx)}
                      className="text-xs text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 ml-1 flex-shrink-0">✕</button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Preview strip */}
          {ordered.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Export preview — columns in order</p>
              </div>
              <div className="flex gap-1.5 overflow-x-auto p-3">
                {ordered.map((key, idx) => {
                  const def    = getColumnDef(key)
                  const isStd  = STANDARD_SET.has(key)
                  return (
                    <div key={key}
                      className={`flex-shrink-0 px-2.5 py-1 rounded text-xs font-medium border whitespace-nowrap ${
                        isStd ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}>
                      <span className="text-gray-300 mr-1 text-xs">{idx + 1}</span>
                      {def?.label ?? key}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: PDF SETTINGS ─────────────────────────────────────────── */}
      {tab === 'pdf' && (
        <div className="space-y-5">

          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700">
            These settings control how the PDF export looks. CSV and XLSX are not affected.
          </div>

          {/* Page setup */}
          <fieldset className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <legend className="px-4 py-3 border-b border-gray-100 w-full text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50 block">
              Page setup
            </legend>
            <div className="p-4 grid grid-cols-2 gap-5">

              {/* Orientation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Orientation</label>
                <div className="flex gap-3">
                  {(['portrait', 'landscape'] as const).map(o => (
                    <label key={o}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors text-sm ${
                        pdfLayout.orientation === o
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      <input type="radio" name="orientation" value={o}
                        checked={pdfLayout.orientation === o}
                        onChange={() => emitPdf({ orientation: o })}
                        className="sr-only" />
                      <span className="text-base">{o === 'portrait' ? '📄' : '📰'}</span>
                      <span className="font-medium capitalize">{o}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Grouping */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item grouping</label>
                <div className="flex flex-col gap-2">
                  {([
                    { value: 'BY_DATE',     label: 'By date',     desc: 'Items under each claim, sorted by date' },
                    { value: 'BY_CATEGORY', label: 'By category', desc: 'All items grouped by expense type' },
                  ] as const).map(g => (
                    <label key={g.value}
                      className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                        pdfLayout.grouping === g.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <input type="radio" name="grouping" value={g.value}
                        checked={pdfLayout.grouping === g.value}
                        onChange={() => emitPdf({ grouping: g.value })}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500" />
                      <div>
                        <p className={`text-sm font-medium ${pdfLayout.grouping === g.value ? 'text-blue-700' : 'text-gray-700'}`}>
                          {g.label}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{g.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </fieldset>

          {/* Sections to include */}
          <fieldset className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <legend className="px-4 py-3 border-b border-gray-100 w-full text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50 block">
              Sections to include
            </legend>
            <div className="divide-y divide-gray-50">
              {([
                {
                  key:   'show_summary_table' as const,
                  label: 'Summary table',
                  desc:  'One-page overview listing all claims with their totals and grand total',
                  rec:   true,
                },
                {
                  key:   'show_receipt_appendix' as const,
                  label: 'Appendix A — receipts',
                  desc:  'Each receipt photo printed on a dedicated page (Appendix A)',
                  rec:   false,
                },
                {
                  key:   'show_tng_appendix' as const,
                  label: 'Appendix B — TNG statements',
                  desc:  'Original TNG eWallet statement PDFs merged at end (if any TOLL/PARKING items)',
                  rec:   false,
                },
                {
                  key:   'show_declaration' as const,
                  label: 'Declaration & signature',
                  desc:  'Statutory declaration with signature area at the end of the document',
                  rec:   true,
                },
              ]).map(item => (
                <label key={item.key}
                  className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{item.label}</span>
                      {item.rec && (
                        <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-200 font-medium">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => emitPdf({ [item.key]: !pdfLayout[item.key] })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        pdfLayout[item.key] ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                      role="switch"
                      aria-checked={pdfLayout[item.key]}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        pdfLayout[item.key] ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Accent color */}
          <fieldset className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <legend className="px-4 py-3 border-b border-gray-100 w-full text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50 block">
              Branding
            </legend>
            <div className="px-5 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Accent colour
                <span className="ml-2 text-xs text-gray-400 font-normal">— used for header bar and section headings</span>
              </label>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="color"
                  value={pdfLayout.accent_color}
                  onChange={e => emitPdf({ accent_color: e.target.value })}
                  className="h-9 w-16 rounded cursor-pointer border border-gray-300 p-0.5"
                />
                <input
                  type="text"
                  value={pdfLayout.accent_color}
                  onChange={e => {
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                      emitPdf({ accent_color: e.target.value })
                    }
                  }}
                  className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#0f172a"
                />
                {/* Quick presets */}
                <div className="flex gap-2 ml-2">
                  {[
                    { hex: '#0f172a', label: 'Slate' },
                    { hex: '#1e3a8a', label: 'Navy' },
                    { hex: '#1d4ed8', label: 'Blue' },
                    { hex: '#065f46', label: 'Green' },
                    { hex: '#7c3aed', label: 'Purple' },
                    { hex: '#9f1239', label: 'Red' },
                  ].map(p => (
                    <button
                      key={p.hex}
                      type="button"
                      title={p.label}
                      onClick={() => emitPdf({ accent_color: p.hex })}
                      style={{ backgroundColor: p.hex }}
                      className={`h-7 w-7 rounded-full border-2 transition-all ${
                        pdfLayout.accent_color === p.hex ? 'border-blue-500 scale-110' : 'border-transparent hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Preview bar */}
              <div className="mt-3 rounded-lg overflow-hidden">
                <div style={{ backgroundColor: pdfLayout.accent_color }} className="px-4 py-2.5 flex items-center justify-between">
                  <span className="text-white font-bold text-sm">myexpensio</span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>EXPENSE CLAIM FORM</span>
                </div>
                <div className="bg-white border border-t-0 border-gray-200 px-4 py-2">
                  <div className="flex gap-4">
                    {['Date', 'Type', 'Description', 'Amount (MYR)'].map(h => (
                      <span key={h} style={{ color: pdfLayout.accent_color }} className="text-xs font-bold">{h}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </fieldset>

          {/* PDF structure summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4">
            <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">PDF structure preview</p>
            <div className="space-y-1.5">
              {[
                { always: true,  label: 'Page 1: Header + claimant info' },
                { always: pdfLayout.show_summary_table,    label: '→ Claims summary table' },
                { always: true,  label: `→ Items detail (${pdfLayout.grouping === 'BY_DATE' ? 'grouped by claim, sorted by date' : 'grouped by expense category'})` },
                { always: pdfLayout.show_declaration,      label: '→ Declaration & signature' },
                { always: pdfLayout.show_receipt_appendix, label: '→ Appendix A: Receipt images' },
                { always: pdfLayout.show_tng_appendix,     label: '→ Appendix B: TNG statement PDFs' },
              ].map((row, i) => (
                <div key={i} className={`flex items-center gap-2 text-xs ${row.always ? 'text-gray-700' : 'text-gray-300 line-through'}`}>
                  <span>{row.always ? '✓' : '✗'}</span>
                  <span>{row.label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
