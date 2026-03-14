// apps/admin/app/(protected)/templates/TemplatesClient.tsx
'use client'

import { useState } from 'react'
import TemplateEditor from '@/components/TemplateEditor'
import { PRESET_COLUMNS, type ExportColumnKey, type ColumnPreset } from '@/lib/export-columns'

type TemplateSchema = {
  version: number
  preset: ColumnPreset | 'ORIGINAL_HIGHLIGHT'
  columns: ExportColumnKey[]
}

type TemplateRow = {
  id: string
  name: string
  description: string | null
  schema: TemplateSchema
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

type Props = { initialTemplates: TemplateRow[] }

type FormState = {
  name: string
  description: string
  preset: ColumnPreset
  columns: ExportColumnKey[]
  is_default: boolean
}

const EMPTY_FORM: FormState = {
  name:        '',
  description: '',
  preset:      'STANDARD',
  columns:     PRESET_COLUMNS.STANDARD,
  is_default:  false,
}

// ── Preset badge ──────────────────────────────────────────────────────────────
function PresetBadge({ preset }: { preset: string }) {
  const map: Record<string, string> = {
    STANDARD:           'bg-blue-50 text-blue-700',
    COMPLETE:           'bg-purple-50 text-purple-700',
    ORIGINAL_HIGHLIGHT: 'bg-amber-50 text-amber-700',
    CUSTOM:             'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${map[preset] ?? map.CUSTOM}`}>
      {preset}
    </span>
  )
}

export default function TemplatesClient({ initialTemplates }: Props) {
  const [templates, setTemplates]   = useState(initialTemplates)
  const [showForm, setShowForm]     = useState(false)
  const [editTarget, setEditTarget] = useState<TemplateRow | null>(null)
  const [form, setForm]             = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  function showToast(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  function openCreate() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(t: TemplateRow) {
    setEditTarget(t)
    setForm({
      name:        t.name,
      description: t.description ?? '',
      preset:      (t.schema.preset as ColumnPreset) ?? 'STANDARD',
      columns:     t.schema.columns ?? PRESET_COLUMNS.STANDARD,
      is_default:  t.is_default,
    })
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { showToast('err', 'Template name is required'); return }
    if (form.columns.length === 0) { showToast('err', 'Select at least one column'); return }

    setSaving(true)
    try {
      const isEdit = editTarget !== null
      const url    = isEdit ? `/api/admin/templates/${editTarget.id}` : '/api/admin/templates'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        form.name.trim(),
          description: form.description.trim() || null,
          preset:      form.preset,
          columns:     form.columns,
          is_default:  form.is_default,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')

      if (isEdit) {
        setTemplates((prev) =>
          prev.map((t) => t.id === editTarget.id ? { ...t, ...json.template } : t)
        )
        showToast('ok', 'Template updated')
      } else {
        setTemplates((prev) => [...prev, json.template])
        showToast('ok', `Template "${json.template.name}" created`)
      }
      setShowForm(false)
    } catch (e: unknown) {
      showToast('err', e instanceof Error ? e.message : 'Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  async function handleSetDefault(templateId: string) {
    try {
      const res = await fetch(`/api/admin/templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      // Update local state: clear all defaults, set this one
      setTemplates((prev) =>
        prev.map((t) => ({ ...t, is_default: t.id === templateId }))
      )
      showToast('ok', 'Default template updated')
    } catch (e: unknown) {
      showToast('err', e instanceof Error ? e.message : 'Failed')
    }
  }

  async function handleDeactivate(t: TemplateRow) {
    if (!confirm(`Deactivate template "${t.name}"? Users will not see it in exports.`)) return
    try {
      const res = await fetch(`/api/admin/templates/${t.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      setTemplates((prev) => prev.map((x) => x.id === t.id ? { ...x, is_active: false } : x))
      showToast('ok', `Template "${t.name}" deactivated`)
    } catch (e: unknown) {
      showToast('err', e instanceof Error ? e.message : 'Failed to deactivate')
    }
  }

  const active   = templates.filter((t) => t.is_active)
  const inactive = templates.filter((t) => !t.is_active)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Export Templates</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Define which columns appear in staff exports. The default template applies automatically.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium
                     hover:bg-blue-700 transition-colors"
        >
          + New Template
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium
          ${toast.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toast.msg}
        </div>
      )}

      {/* Active templates */}
      <div className="space-y-3">
        {active.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-700">
            No templates found. Run migration <code>20260313_admin_app_phase_b.sql</code> to seed defaults, or create one.
          </div>
        )}
        {active.map((t) => {
          const colCount = t.schema.columns?.length ?? 0
          return (
            <div key={t.id}
              className={`bg-white rounded-xl border p-5 
                ${t.is_default ? 'border-blue-300 ring-1 ring-blue-200' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-gray-900">{t.name}</h3>
                    <PresetBadge preset={t.schema.preset ?? 'CUSTOM'} />
                    {t.is_default && (
                      <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  {t.description && (
                    <p className="text-xs text-gray-500 mt-1">{t.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1.5">{colCount} column{colCount !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!t.is_default && (
                    <button
                      onClick={() => handleSetDefault(t.id)}
                      className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      Set default
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(t)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeactivate(t)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Inactive templates (collapsed) */}
      {inactive.length > 0 && (
        <details className="mt-6">
          <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-600">
            Inactive templates ({inactive.length})
          </summary>
          <div className="mt-2 space-y-2">
            {inactive.map((t) => (
              <div key={t.id}
                className="bg-gray-50 rounded-xl border border-gray-100 px-5 py-3 opacity-60">
                <span className="text-sm font-medium text-gray-600">{t.name}</span>
                <span className="ml-2 text-xs text-gray-400">inactive</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* ── Create / Edit Modal ───────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center
                        bg-black/40 px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">
              {editTarget ? `Edit: ${editTarget.name}` : 'New Export Template'}
            </h2>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Standard Report, Full Audit, Finance Export"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Short description for staff"
                />
              </div>

              {/* Column picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Columns <span className="text-red-500">*</span>
                </label>
                <TemplateEditor
                  initialColumns={form.columns}
                  initialPreset={form.preset}
                  onChange={(cols) => setForm((f) => ({ ...f, columns: cols }))}
                />
              </div>

              {/* Set as default */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Set as default template{' '}
                  <span className="text-gray-400">(shown first in user export dropdown)</span>
                </span>
              </label>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditTarget(null) }}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-sm
                             font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || form.columns.length === 0}
                  className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm
                             font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
