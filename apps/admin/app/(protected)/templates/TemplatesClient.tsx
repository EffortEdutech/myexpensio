'use client'
// apps/admin/app/(protected)/templates/TemplatesClient.tsx
//
// Manages export templates across all organisations.
// Uses the two-tab TemplateEditor (Columns + PDF Settings).
//
// Template JSONB schema stored:
//   {
//     version:    2,
//     preset:     'STANDARD' | 'COMPLETE' | 'CUSTOM',
//     columns:    ExportColumnKey[],   ← ordered, IS the export column order
//     pdf_layout: PdfLayoutConfig      ← controls PDF rendering
//   }

import { useState } from 'react'
import TemplateEditor, { DEFAULT_PDF_LAYOUT, type PdfLayoutConfig } from '@/components/TemplateEditor'
import { PRESET_COLUMNS, type ExportColumnKey } from '@/lib/export-columns'

type Org = { id: string; name: string }

type TemplateSchema = {
  version:    number
  preset:     string
  columns:    ExportColumnKey[]
  pdf_layout?: Partial<PdfLayoutConfig>
}

type TemplateRow = {
  id:            string
  org_id:        string
  name:          string
  description:   string | null
  schema:        TemplateSchema
  is_active:     boolean
  is_default:    boolean
  created_at:    string
  updated_at:    string
  organizations: { name: string } | null
}

type FormState = {
  org_id:      string
  name:        string
  description: string
  columns:     ExportColumnKey[]
  pdf_layout:  PdfLayoutConfig
  is_default:  boolean
}

function makeEmptyForm(defaultOrgId: string): FormState {
  return {
    org_id:      defaultOrgId,
    name:        '',
    description: '',
    columns:     PRESET_COLUMNS.STANDARD,
    pdf_layout:  { ...DEFAULT_PDF_LAYOUT },
    is_default:  false,
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

function PresetBadge({ cols }: { cols: ExportColumnKey[] }) {
  const stdCount  = PRESET_COLUMNS.STANDARD.length
  const compCount = PRESET_COLUMNS.COMPLETE.length
  const stdKeys   = new Set(PRESET_COLUMNS.STANDARD)
  const isStd     = cols.length === stdCount  && cols.every(k => stdKeys.has(k))
  const isComp    = cols.length === compCount
  const label     = isStd ? 'Standard' : isComp ? 'Complete' : 'Custom'
  const style     = isStd
    ? 'bg-blue-50 text-blue-700'
    : isComp
    ? 'bg-purple-50 text-purple-700'
    : 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${style}`}>
      {label} · {cols.length} cols
    </span>
  )
}

function GroupingBadge({ layout }: { layout?: Partial<PdfLayoutConfig> }) {
  const g = layout?.grouping ?? 'BY_DATE'
  return (
    <span className="text-xs text-gray-400">
      PDF: {g === 'BY_DATE' ? 'By date' : 'By category'} · {layout?.orientation ?? 'portrait'}
    </span>
  )
}

export default function TemplatesClient({
  initialTemplates,
  orgs,
}: {
  initialTemplates: TemplateRow[]
  orgs:             Org[]
}) {
  const [templates, setTemplates]   = useState(initialTemplates)
  const [showForm,  setShowForm]    = useState(false)
  const [editTarget, setEditTarget] = useState<TemplateRow | null>(null)
  const [form,       setForm]       = useState<FormState>(makeEmptyForm(orgs[0]?.id ?? ''))
  const [saving,     setSaving]     = useState(false)
  const [toast,      setToast]      = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  const [orgFilter,  setOrgFilter]  = useState('ALL')
  const [busy,       setBusy]       = useState<string | null>(null)

  function toast_(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3500)
  }

  const filtered = orgFilter === 'ALL' ? templates : templates.filter(t => t.org_id === orgFilter)
  const active   = filtered.filter(t => t.is_active)
  const inactive = filtered.filter(t => !t.is_active)

  function openCreate() {
    setEditTarget(null)
    setForm(makeEmptyForm(orgs[0]?.id ?? ''))
    setShowForm(true)
  }

  function openEdit(t: TemplateRow) {
    setEditTarget(t)
    setForm({
      org_id:      t.org_id,
      name:        t.name,
      description: t.description ?? '',
      columns:     t.schema.columns ?? PRESET_COLUMNS.STANDARD,
      pdf_layout:  { ...DEFAULT_PDF_LAYOUT, ...(t.schema.pdf_layout ?? {}) },
      is_default:  t.is_default,
    })
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim())         { toast_('err', 'Template name is required');   return }
    if (!form.org_id)              { toast_('err', 'Select an organisation');       return }
    if (form.columns.length === 0) { toast_('err', 'Select at least one column'); return }

    setSaving(true)
    try {
      const isEdit = editTarget !== null
      const url    = isEdit ? `/api/admin/templates/${editTarget.id}` : '/api/admin/templates'
      const method = isEdit ? 'PATCH' : 'POST'

      const stdKeys  = new Set(PRESET_COLUMNS.STANDARD)
      const isStd    = form.columns.length === PRESET_COLUMNS.STANDARD.length && form.columns.every(k => stdKeys.has(k))
      const isComp   = form.columns.length === PRESET_COLUMNS.COMPLETE.length
      const preset   = isStd ? 'STANDARD' : isComp ? 'COMPLETE' : 'CUSTOM'

      const res  = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id:      form.org_id,
          name:        form.name.trim(),
          description: form.description.trim() || null,
          preset,
          columns:     form.columns,
          pdf_layout:  form.pdf_layout,
          is_default:  form.is_default,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to save')

      if (isEdit) {
        setTemplates(prev => prev.map(t => t.id === editTarget.id ? { ...t, ...json.template } : t))
        toast_('ok', `"${form.name}" updated`)
      } else {
        setTemplates(prev => [...prev, json.template])
        toast_('ok', `"${form.name}" created`)
      }
      setShowForm(false); setEditTarget(null)

    } catch (e: unknown) {
      toast_('err', e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleSetDefault(templateId: string, orgId: string) {
    setBusy(templateId)
    try {
      const res  = await fetch(`/api/admin/templates/${templateId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      setTemplates(prev => prev.map(t =>
        t.org_id === orgId ? { ...t, is_default: t.id === templateId } : t
      ))
      toast_('ok', 'Default template updated')
    } catch (e: unknown) { toast_('err', e instanceof Error ? e.message : 'Failed') }
    finally { setBusy(null) }
  }

  async function handleToggleActive(t: TemplateRow) {
    setBusy(t.id)
    try {
      const res  = await fetch(`/api/admin/templates/${t.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !t.is_active }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      setTemplates(prev => prev.map(x => x.id === t.id ? { ...x, is_active: !t.is_active } : x))
      toast_('ok', t.is_active ? `"${t.name}" deactivated` : `"${t.name}" activated`)
    } catch (e: unknown) { toast_('err', e instanceof Error ? e.message : 'Failed') }
    finally { setBusy(null) }
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Export Templates</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Define column sets, export order, and PDF layout for each organisation
          </p>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          + New Template
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`px-4 py-2.5 rounded-lg text-sm font-medium ${
          toast.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>{toast.msg}</div>
      )}

      {/* ── Create / Edit modal ─────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 py-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 my-4">

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">
                {editTarget ? `Edit: ${editTarget.name}` : 'New Export Template'}
              </h2>
              <button type="button" onClick={() => { setShowForm(false); setEditTarget(null) }}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">

              {/* Org + Name + Description */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organisation <span className="text-red-500">*</span>
                  </label>
                  <select value={form.org_id} onChange={e => setForm(f => ({ ...f, org_id: e.target.value }))}
                    required disabled={!!editTarget}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-50">
                    <option value="">Select org…</option>
                    {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input type="text" required value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Monthly Finance Report"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input type="text" value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Short description for staff"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Template editor (two tabs) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template configuration <span className="text-red-500">*</span>
                </label>
                <TemplateEditor
                  initialColumns={form.columns}
                  initialPdfLayout={form.pdf_layout}
                  onChangeColumns={cols     => setForm(f => ({ ...f, columns: cols }))}
                  onChangePdfLayout={layout => setForm(f => ({ ...f, pdf_layout: layout }))}
                />
              </div>

              {/* Set as default */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_default}
                  onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700">
                  Set as default template for this organisation
                  <span className="text-gray-400"> (shown first in user export dropdown)</span>
                </span>
              </label>

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => { setShowForm(false); setEditTarget(null) }}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving || form.columns.length === 0}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Org filter */}
      <div className="flex gap-3">
        <select value={orgFilter} onChange={e => setOrgFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none">
          <option value="ALL">All organisations</option>
          {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <span className="text-sm text-gray-400 self-center">{active.length} active template{active.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Active templates table */}
      {active.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-10 text-center text-sm text-gray-400">
          No templates yet. Create one to let users choose column sets when exporting.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Org</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Template</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Columns</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">PDF</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {active.map(t => {
                  const org  = Array.isArray(t.organizations) ? t.organizations[0] : t.organizations
                  const cols = t.schema?.columns ?? []
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {(org as { name?: string } | null)?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">{t.name}</span>
                          {t.is_default && (
                            <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded font-medium">Default</span>
                          )}
                        </div>
                        {t.description && <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <PresetBadge cols={cols} />
                        {cols.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5 max-w-xs">
                            {cols.slice(0, 4).map((k, i) => (
                              <span key={k} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">
                                {i + 1}·{k.replace(/_/g, ' ')}
                              </span>
                            ))}
                            {cols.length > 4 && <span className="text-xs text-gray-400">+{cols.length - 4}</span>}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <GroupingBadge layout={t.schema?.pdf_layout} />
                        <div className="flex items-center gap-3 mt-1">
                          {/* Accent color swatch */}
                          {t.schema?.pdf_layout?.accent_color && (
                            <span
                              style={{ backgroundColor: t.schema.pdf_layout.accent_color }}
                              className="inline-block h-3 w-3 rounded-full border border-gray-200"
                            />
                          )}
                          <span className="text-xs text-gray-400">
                            {[
                              t.schema?.pdf_layout?.show_summary_table    !== false ? 'Summary' : null,
                              t.schema?.pdf_layout?.show_receipt_appendix !== false ? 'Receipts' : null,
                              t.schema?.pdf_layout?.show_declaration       !== false ? 'Declaration' : null,
                            ].filter(Boolean).join(' · ') || 'No sections'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDate(t.updated_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 justify-end">
                          {!t.is_default && (
                            <button disabled={busy === t.id} onClick={() => handleSetDefault(t.id, t.org_id)}
                              className="text-xs text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-40">
                              Set default
                            </button>
                          )}
                          <button disabled={busy === t.id} onClick={() => openEdit(t)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-40">
                            Edit
                          </button>
                          <button disabled={busy === t.id} onClick={() => handleToggleActive(t)}
                            className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-40">
                            {busy === t.id ? '…' : 'Deactivate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inactive */}
      {inactive.length > 0 && (
        <details className="mt-2">
          <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-600 select-none">
            Inactive templates ({inactive.length})
          </summary>
          <div className="mt-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-50">
                {inactive.map(t => {
                  const org = Array.isArray(t.organizations) ? t.organizations[0] : t.organizations
                  return (
                    <tr key={t.id} className="opacity-50 hover:opacity-75">
                      <td className="px-5 py-2.5 text-gray-500">{(org as { name?: string } | null)?.name ?? '—'}</td>
                      <td className="px-4 py-2.5 text-gray-500">{t.name}</td>
                      <td className="px-4 py-2.5">
                        <button disabled={busy === t.id} onClick={() => handleToggleActive(t)}
                          className="text-xs text-green-600 hover:text-green-800 font-medium disabled:opacity-40">
                          {busy === t.id ? '…' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  )
}
