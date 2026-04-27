'use client'
// apps/admin/components/InternalOrgPicker.tsx
//
// Shown to internal staff (SUPER_ADMIN / SUPPORT) when they visit a
// workspace-scoped page that requires an org_id to fetch data.
//
// Searches workspaces via /api/console/workspaces-search (same endpoint
// used by Expensio Console Members & Onboarding).
// When a workspace is selected the caller receives the org_id.

import { useState, useRef } from 'react'

type WorkspaceOption = {
  id:             string
  name:           string
  workspace_type: string
  contact_email:  string | null
  status:         string
}

const TYPE_CLS: Record<string, string> = {
  TEAM:     'bg-blue-50 text-blue-700',
  AGENT:    'bg-purple-50 text-purple-700',
  INTERNAL: 'bg-amber-50 text-amber-700',
}

export default function InternalOrgPicker({
  label,
  onSelect,
}: {
  label:    string                     // e.g. "billing information" / "export templates"
  onSelect: (orgId: string, orgName: string) => void
}) {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<WorkspaceOption[]>([])
  const [open, setOpen]         = useState(false)
  const [searching, setSearching] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  function search(q: string) {
    if (debounce.current) clearTimeout(debounce.current)
    if (!q.trim()) { setResults([]); setOpen(false); return }

    debounce.current = setTimeout(async () => {
      setSearching(true)
      try {
        // Use console workspaces-search (this is apps/admin so we need the right endpoint)
        // The endpoint is on apps/cs, so fall back to workspace/billing-search if needed
        const res = await fetch(
          `/api/workspace/org-search?q=${encodeURIComponent(q)}`
        )
        const json = await res.json()
        setResults(json.workspaces ?? [])
        setOpen(true)
      } catch { /* silent */ }
      finally { setSearching(false) }
    }, 250)
  }

  function select(ws: WorkspaceOption) {
    setQuery(ws.name)
    setResults([])
    setOpen(false)
    onSelect(ws.id, ws.name)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-64 gap-4">
      {/* Icon */}
      <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
        <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold text-gray-900">Select a workspace</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Search for a workspace to view its {label}
        </p>
      </div>

      {/* Search input */}
      <div className="relative w-72">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); search(e.target.value) }}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Search workspace name…"
            autoComplete="off"
            className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Dropdown */}
        {open && results.length > 0 && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
            {results.map(ws => (
              <button
                key={ws.id}
                onClick={() => select(ws)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors ${
                  ws.status !== 'ACTIVE' ? 'opacity-50' : ''
                }`}
              >
                <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${TYPE_CLS[ws.workspace_type] ?? 'bg-gray-100 text-gray-500'}`}>
                  {ws.workspace_type}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{ws.name}</div>
                  {ws.contact_email && (
                    <div className="text-xs text-gray-400 truncate">{ws.contact_email}</div>
                  )}
                </div>
                {ws.status !== 'ACTIVE' && (
                  <span className="text-xs text-red-500 flex-shrink-0">{ws.status}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {open && !searching && query.trim() && results.length === 0 && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow px-3 py-3 text-sm text-gray-400 text-center">
            No workspaces found
          </div>
        )}
      </div>

      <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
        Internal staff — viewing any workspace
      </p>
    </div>
  )
}
