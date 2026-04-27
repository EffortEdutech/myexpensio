'use client'
// apps/admin/app/(protected)/templates/page.tsx
//
// Export Templates — workspace-scoped read-only view.
// Internal staff see a workspace picker first, then the templates.

import { useEffect, useState } from 'react'
import InternalOrgPicker from '@/components/InternalOrgPicker'

// ── Types ──────────────────────────────────────────────────────────────────────

type Template = {
  id:          string
  name:        string
  description: string | null
  schema:      Record<string, unknown>
  is_active:   boolean
  is_default:  boolean
  assigned_at: string
  created_at:  string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(val: string | null) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('en-MY', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ── Template card ─────────────────────────────────────────────────────────────

function TemplateCard({ template }: { template: Template }) {
  const [expanded, setExpanded] = useState(false)
  const columns = template.schema?.columns as string[] | undefined

  return (
    <div className={`bg-white rounded-xl border-2 overflow-hidden ${
      template.is_default ? 'border-blue-300' : 'border-gray-200'
    }`}>
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-gray-900">{template.name}</h3>
              {template.is_default && (
                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  ★ Default
                </span>
              )}
              {!template.is_active && (
                <span className="text-xs text-gray-400 px-2 py-0.5 rounded bg-gray-100">Inactive</span>
              )}
            </div>
            {template.description && (
              <p className="text-sm text-gray-500 mt-1">{template.description}</p>
            )}
          </div>
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 flex-shrink-0"
          >
            {expanded ? 'Hide' : 'View columns'}
            <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
          <span>Assigned {fmtDate(template.assigned_at)}</span>
          <span>Created {fmtDate(template.created_at)}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
          {columns && columns.length > 0 ? (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Columns ({columns.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {columns.map(col => (
                  <span key={col}
                    className="inline-flex px-2 py-0.5 rounded bg-white border border-gray-200 text-xs text-gray-700 font-mono">
                    {col}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-400 italic">
              Column configuration is managed by the platform team.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Templates view ────────────────────────────────────────────────────────────

function TemplatesView({
  templates,
  orgName,
  onChangeWorkspace,
}: {
  templates:         Template[]
  orgName:           string | null
  onChangeWorkspace?: () => void
}) {
  const activeTemplates   = templates.filter(t => t.is_active)
  const inactiveTemplates = templates.filter(t => !t.is_active)
  const defaultTemplate   = templates.find(t => t.is_default)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Export Templates</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {orgName ? (
            <>
              {orgName}
              {onChangeWorkspace && (
                <button
                  onClick={onChangeWorkspace}
                  className="ml-2 text-blue-600 hover:text-blue-800 text-xs font-medium underline"
                >
                  Change workspace
                </button>
              )}
            </>
          ) : (
            'Templates assigned to your workspace'
          )}
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
        <strong>Read-only view.</strong> Export templates are assigned by the platform team.
        The <strong>default template</strong> is used automatically when exporting without selecting a template.
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2 bg-white rounded-xl border border-gray-200">
          <p className="text-sm text-gray-400">No templates assigned to this workspace</p>
          <p className="text-xs text-gray-400">Contact EffortEdutech to assign export templates</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Assigned', value: templates.length },
              { label: 'Active',   value: activeTemplates.length },
              { label: 'Default',  value: defaultTemplate?.name ?? 'None set' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          {/* Active */}
          {activeTemplates.length > 0 && (
            <div className="space-y-3">
              {activeTemplates.map(t => <TemplateCard key={t.id} template={t} />)}
            </div>
          )}

          {/* Inactive */}
          {inactiveTemplates.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Inactive ({inactiveTemplates.length})
              </p>
              <div className="space-y-3 opacity-50">
                {inactiveTemplates.map(t => <TemplateCard key={t.id} template={t} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const [templates, setTemplates]   = useState<Template[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [isInternal, setIsInternal] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<{ id: string; name: string } | null>(null)

  function loadTemplates(orgId: string | null) {
    setLoading(true); setError(null)
    const url = orgId ? `/api/workspace/templates?org_id=${orgId}` : '/api/workspace/templates'

    fetch(url)
      .then(async res => {
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error?.message ?? 'Failed to load templates')
        setTemplates(json.templates ?? [])
        setShowPicker(false)
      })
      .catch(e => {
        const msg = e instanceof Error ? e.message : 'Error'
        if (msg.includes('org_id required')) {
          setIsInternal(true)
          setShowPicker(true)
        } else {
          setError(msg)
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadTemplates(null) }, [])

  function handleOrgSelect(orgId: string, orgName: string) {
    setSelectedOrg({ id: orgId, name: orgName })
    loadTemplates(orgId)
  }

  if (showPicker || (isInternal && !templates.length && !error)) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Export Templates</h1>
          <p className="text-sm text-gray-500 mt-0.5">Select a workspace to view its assigned templates</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 py-8">
          <InternalOrgPicker label="export templates" onSelect={handleOrgSelect} />
        </div>
      </div>
    )
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-sm text-gray-400">Loading…</div>
  )

  if (error) return (
    <div className="space-y-5">
      <h1 className="text-lg font-semibold text-gray-900">Export Templates</h1>
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
    </div>
  )

  return (
    <TemplatesView
      templates={templates}
      orgName={selectedOrg?.name ?? null}
      onChangeWorkspace={isInternal ? () => { setTemplates([]); setShowPicker(true) } : undefined}
    />
  )
}
