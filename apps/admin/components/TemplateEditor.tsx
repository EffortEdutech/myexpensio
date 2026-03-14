// apps/admin/components/TemplateEditor.tsx
//
// Column picker for creating/editing export templates.
// Shows grouped checkboxes for every available export column.
// Highlights which columns are in STANDARD vs COMPLETE preset.

'use client'

import { useState } from 'react'
import {
  ALL_COLUMNS,
  COLUMN_GROUPS,
  PRESET_COLUMNS,
  type ExportColumnKey,
  type ColumnPreset,
} from '@/lib/export-columns'

type Props = {
  initialColumns: ExportColumnKey[]
  initialPreset?: ColumnPreset
  onChange: (columns: ExportColumnKey[]) => void
}

export default function TemplateEditor({
  initialColumns,
  initialPreset = 'STANDARD',
  onChange,
}: Props) {
  const [selected, setSelected] = useState<Set<ExportColumnKey>>(
    new Set(initialColumns)
  )
  const [activePreset, setActivePreset] = useState<ColumnPreset | 'CUSTOM'>(
    initialColumns.length > 0 ? 'CUSTOM' : initialPreset
  )

  function applyPreset(preset: ColumnPreset) {
    const cols = PRESET_COLUMNS[preset]
    const next = new Set<ExportColumnKey>(cols)
    setSelected(next)
    setActivePreset(preset)
    onChange([...next])
  }

  function toggleColumn(key: ExportColumnKey) {
    const next = new Set(selected)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
    }
    setSelected(next)
    setActivePreset('CUSTOM')
    onChange([...next])
  }

  const standardSet = new Set(PRESET_COLUMNS.STANDARD)

  return (
    <div className="space-y-4">
      {/* Preset shortcuts */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Quick presets</p>
        <div className="flex flex-wrap gap-2">
          {(['STANDARD', 'COMPLETE'] as ColumnPreset[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => applyPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
                ${activePreset === p
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'}`}
            >
              {p}
              <span className="ml-1 opacity-60">
                ({PRESET_COLUMNS[p].length} cols)
              </span>
            </button>
          ))}
          {activePreset === 'CUSTOM' && (
            <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-50
                             text-purple-700 border border-purple-200">
              CUSTOM ({selected.size} cols)
            </span>
          )}
        </div>
      </div>

      {/* Column groups */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {COLUMN_GROUPS.map((group) => {
          const groupCols = ALL_COLUMNS.filter((c) => c.group === group)
          const checkedCount = groupCols.filter((c) => selected.has(c.key)).length

          return (
            <details key={group} className="border-b border-gray-100 last:border-0" open>
              <summary className="flex items-center justify-between px-4 py-3
                                  bg-gray-50 cursor-pointer select-none
                                  hover:bg-gray-100 transition-colors">
                <span className="text-sm font-semibold text-gray-700">{group}</span>
                <span className="text-xs text-gray-400">
                  {checkedCount}/{groupCols.length} selected
                </span>
              </summary>

              <div className="divide-y divide-gray-50">
                {groupCols.map((col) => {
                  const isChecked = selected.has(col.key)
                  const isStandard = standardSet.has(col.key)

                  return (
                    <label
                      key={col.key}
                      className="flex items-start gap-3 px-4 py-2.5 cursor-pointer
                                 hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleColumn(col.key)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600
                                   focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">
                            {col.label}
                          </span>
                          {isStandard && (
                            <span className="text-xs bg-blue-50 text-blue-600
                                             px-1.5 py-0.5 rounded font-medium">
                              STANDARD
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{col.description}</p>
                        <p className="text-xs font-mono text-gray-300 mt-0.5">{col.key}</p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </details>
          )
        })}
      </div>

      {/* Summary */}
      <p className="text-xs text-gray-400">
        {selected.size} column{selected.size !== 1 ? 's' : ''} selected.
        {selected.size === 0 && (
          <span className="text-red-500 ml-1">Select at least one column.</span>
        )}
      </p>
    </div>
  )
}
