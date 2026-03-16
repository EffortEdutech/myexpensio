'use client'
// apps/admin/app/(protected)/templates/TemplatesClient.tsx
//
// Two-panel template management:
//
//   LEFT — Global Template Library
//     List all templates (name, preset, columns, PDF settings)
//     Create / Edit / Deactivate / Delete
//     Templates here are global — editing affects all orgs that use them
//
//   RIGHT — Org Assignment Manager
//     Select an org
//     See which templates are assigned + which is default
//     Assign / Unassign / Set Default buttons per template

import { useState } from 'react'
import TemplateEditor, { DEFAULT_PDF_LAYOUT, type PdfLayoutConfig } from '@/components/TemplateEditor'
import { PRESET_COLUMNS, type ExportColumnKey } from '@/lib/export-columns'

// ── Types ─────────────────────────────────────────────────────────────────────

type Org = { id: string; name: string }

type TemplateSchema = {
  version:     number
  preset:      string
  columns:     ExportColumnKey[]
  pdf_layout?: Partial<PdfLayoutConfig>
}

type Template = {
  id:          string
  name:        string
  description: string | null
  schema:      TemplateSchema
  is_active:   boolean
  created_at:  string
  updated_at:  string
}

type Assignment = {
  org_id:      string
  template_id: string
  is_default:  boolean
  assigned_at: string
}

type FormState = {
  name:        string
  description: string
  columns:     ExportColumnKey[]
  pdf_layout:  PdfLayoutConfig
}

function makeEmptyForm(): FormState {
  return {
    name:        '',
    description: '',
    columns:     PRESET_COLUMNS.STANDARD,
    pdf_layout:  { ...DEFAULT_PDF_LAYOUT },
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-MY', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function PresetBadge({ cols }: { cols: ExportColumnKey[] }) {
  const stdKeys = new Set(PRESET_COLUMNS.STANDARD)
  const isStd   = cols.length === PRESET_COLUMNS.STANDARD.length && cols.every(k => stdKeys.has(k))
  const isComp  = cols.length === PRESET_COLUMNS.COMPLETE.length
  const label   = isStd ? 'Standard' : isComp ? 'Complete' : 'Custom'
  const style   = isStd
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

// ── Main component ────────────────────────────────────────────────────────────

export default function TemplatesClient({
  initialTemplates,
  initialAssignments,
  orgs,
}: {
  initialTemplates:   Template[]
  initialAssignments: Assignment[]
  orgs:               Org[]
}) {
  const [templates,   setTemplates]   = useState(initialTemplates)
  const [assignments, setAssignments] = useState(initialAssignments)
  const [selectedOrg, setSelectedOrg] = useState(orgs[0]?.id ?? '')

  // Form state
  const [showForm,    setShowForm]    = useState(false)
  const [editTarget,  setEditTarget]  = useState<Template | null>(null)
  const [form,        setForm]        = useState<FormState>(makeEmptyForm())
  const [saving,      setSaving]      = useState(false)

  // Busy tracking for assignment buttons
  const [busyTemplate, setBusyTemplate] = useState<string | null>(null)

  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  function toast_(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Derived state ──────────────────────────────────────────────────────────
  const activeTemplates   = templates.filter(t =>  t.is_active)
  const inactiveTemplates = templates.filter(t => !t.is_active)

  const orgAssignments = assignments.filter(a => a.org_id === selectedOrg)
  const assignedIds    = new Set(orgAssignments.map(a => a.template_id))
  const defaultId      = orgAssignments.find(a => a.is_default)?.template_id ?? null
  const selectedOrgName = orgs.find(o => o.id === selectedOrg)?.name ?? ''
  const hasDefault     = !!defaultId

  // ── Form helpers ──────────────────────────────────────────────────────────
  function openCreate() {
    setEditTarget(null)
    setForm(makeEmptyForm())
    setShowForm(true)
  }

  function openEdit(t: Template) {
    setEditTarget(t)
    setForm({
      name:        t.name,
      description: t.description ?? '',
      columns:     t.schema.columns ?? PRESET_COLUMNS.STANDARD,
      pdf_layout:  { ...DEFAULT_PDF_LAYOUT, ...(t.schema.pdf_layout ?? {}) },
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditTarget(null)
  }

  // ── Save template (create or edit) ────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim())         { toast_('err', 'Name is required'); return }
    if (form.columns.length === 0) { toast_('err', 'Select at least one column'); return }

    setSaving(true)
    try {
      const isEdit = !!editTarget
      const url    = isEdit ? `/api/admin/templates/${editTarget!.id}` : '/api/admin/templates'
      const method = isEdit ? 'PATCH' : 'POST'

      const stdKeys = new Set(PRESET_COLUMNS.STANDARD)
      const isStd   = form.columns.length === PRESET_COLUMNS.STANDARD.length && form.columns.every(k => stdKeys.has(k))
      const isComp  = form.columns.length === PRESET_COLUMNS.COMPLETE.length
      const preset  = isStd ? 'STANDARD' : isComp ? 'COMPLETE' : 'CUSTOM'

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        form.name.trim(),
          description: form.description.trim() || null,
          preset,
          columns:     form.columns,
          pdf_layout:  form.pdf_layout,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to save')

      if (isEdit) {
        setTemplates(prev => prev.map(t => t.id === editTarget!.id ? { ...t, ...json.template } : t))
        toast_('ok', `"${form.name}" updated — all assigned orgs see the change immediately`)
      } else {
        setTemplates(prev => [...prev, json.template].sort((a, b) => a.name.localeCompare(b.name)))
        toast_('ok', `"${form.name}" added to library — assign it to orgs in the right panel`)
      }
      closeForm()
    } catch (e: unknown) {
      toast_('err', e instanceof Error ? e.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  // ── Deactivate / Reactivate template (global) ─────────────────────────────
  async function handleToggleActive(t: Template) {
    setBusyTemplate(t.id)
    try {
      const res  = await fetch(`/api/admin/templates/${t.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !t.is_active }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      setTemplates(prev => prev.map(x => x.id === t.id ? { ...x, is_active: !t.is_active } : x))
      toast_('ok', t.is_active ? `"${t.name}" deactivated globally` : `"${t.name}" reactivated`)
    } catch (e: unknown) { toast_('err', e instanceof Error ? e.message : 'Failed') }
    finally { setBusyTemplate(null) }
  }

  // ── Delete template from library ──────────────────────────────────────────
  async function handleDelete(t: Template) {
    if (!confirm(
      `Permanently delete "${t.name}" from the library?\n\n` +
      `This cannot be undone. If any org is still using it, you will be blocked.`
    )) return

    setBusyTemplate(t.id)
    try {
      const res  = await fetch(`/api/admin/templates/${t.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to delete')
      setTemplates(prev => prev.filter(x => x.id !== t.id))
      setAssignments(prev => prev.filter(a => a.template_id !== t.id))
      toast_('ok', `"${t.name}" deleted from library`)
    } catch (e: unknown) {
      toast_('err', e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusyTemplate(null)
    }
  }

  // ── Assign template to selected org ──────────────────────────────────────
  async function handleAssign(templateId: string, makeDefault: boolean) {
    setBusyTemplate(templateId)
    try {
      const res  = await fetch('/api/admin/assignments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: selectedOrg, template_id: templateId, is_default: makeDefault }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to assign')

      const newAssignment: Assignment = {
        org_id:      selectedOrg,
        template_id: templateId,
        is_default:  makeDefault,
        assigned_at: new Date().toISOString(),
      }

      setAssignments(prev => {
        const cleared = makeDefault ? prev.map(a => a.org_id === selectedOrg ? { ...a, is_default: false } : a) : prev
        return [...cleared, newAssignment]
      })

      const tName = templates.find(t => t.id === templateId)?.name ?? ''
      toast_('ok', `"${tName}" assigned to ${selectedOrgName}`)
    } catch (e: unknown) {
      toast_('err', e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusyTemplate(null)
    }
  }

  // ── Unassign template from selected org ──────────────────────────────────
  async function handleUnassign(templateId: string) {
    const tName = templates.find(t => t.id === templateId)?.name ?? ''
    if (!confirm(`Remove "${tName}" from ${selectedOrgName}?\n\nUsers in this org will no longer see this template.`)) return

    setBusyTemplate(templateId)
    try {
      const res  = await fetch('/api/admin/assignments', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: selectedOrg, template_id: templateId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to unassign')

      setAssignments(prev => prev.filter(a => !(a.org_id === selectedOrg && a.template_id === templateId)))
      toast_('ok', `"${tName}" removed from ${selectedOrgName}`)
    } catch (e: unknown) {
      toast_('err', e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusyTemplate(null)
    }
  }

  // ── Set default for selected org ──────────────────────────────────────────
  async function handleSetDefault(templateId: string) {
    setBusyTemplate(templateId)
    try {
      const res  = await fetch('/api/admin/assignments', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: selectedOrg, template_id: templateId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')

      setAssignments(prev => prev.map(a =>
        a.org_id === selectedOrg
          ? { ...a, is_default: a.template_id === templateId }
          : a
      ))
      const tName = templates.find(t => t.id === templateId)?.name ?? ''
      toast_('ok', `"${tName}" set as default for ${selectedOrgName}`)
    } catch (e: unknown) {
      toast_('err', e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusyTemplate(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Export Templates</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Templates are defined once globally, then assigned to organisations.
          Editing a template updates it for every org that uses it.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === 'ok' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'ok' ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      {/* ── Two panels ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-5 items-start">

        {/* ═══ LEFT: Global Template Library (3/5 width) ═══════════════════ */}
        <div className="col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Template Library</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {activeTemplates.length} active · {inactiveTemplates.length} inactive
              </p>
            </div>
            <button onClick={openCreate}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
              + New Template
            </button>
          </div>

          {/* Create / Edit form */}
          {showForm && (
            <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">
                  {editTarget ? `Edit: ${editTarget.name}` : 'New Template'}
                </h3>
                <button type="button" onClick={closeForm} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Template Name <span className="text-red-500">*</span>
                    </label>
                    <input type="text" required value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Standard Report"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <input type="text" value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Short description for staff"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <TemplateEditor
                  initialColumns={form.columns}
                  initialPdfLayout={form.pdf_layout}
                  onChangeColumns={cols   => setForm(f => ({ ...f, columns: cols }))}
                  onChangePdfLayout={lay  => setForm(f => ({ ...f, pdf_layout: lay }))}
                />

                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <button type="button" onClick={closeForm}
                    className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving || form.columns.length === 0}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Template'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Active templates */}
          {activeTemplates.length === 0 && !showForm ? (
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-10 text-center text-sm text-gray-400">
              No templates yet. Create one above.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Template</th>
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 uppercase">Columns</th>
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 uppercase">Orgs</th>
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {activeTemplates.map(t => {
                    const cols       = t.schema?.columns ?? []
                    const orgCount   = assignments.filter(a => a.template_id === t.id).length
                    const isBusy     = busyTemplate === t.id
                    return (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 text-sm">{t.name}</div>
                          {t.description && (
                            <div className="text-xs text-gray-400 mt-0.5">{t.description}</div>
                          )}
                          <div className="text-xs text-gray-400 mt-0.5">
                            Updated {fmtDate(t.updated_at)}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <PresetBadge cols={cols} />
                          <div className="text-xs text-gray-400 mt-1">
                            PDF: {t.schema?.pdf_layout?.orientation ?? 'portrait'} ·{' '}
                            {t.schema?.pdf_layout?.grouping === 'BY_CATEGORY' ? 'by category' : 'by date'}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          {orgCount === 0 ? (
                            <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                              unassigned
                            </span>
                          ) : (
                            <span className="text-xs text-green-700 bg-green-50 px-1.5 py-0.5 rounded font-medium">
                              {orgCount} org{orgCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            <button disabled={isBusy} onClick={() => openEdit(t)}
                              className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-40 transition-colors">
                              Edit
                            </button>
                            <button disabled={isBusy} onClick={() => handleToggleActive(t)}
                              className="text-xs text-amber-500 hover:text-amber-700 disabled:opacity-40 transition-colors">
                              {isBusy ? '…' : 'Deactivate'}
                            </button>
                            {orgCount === 0 && (
                              <button disabled={isBusy} onClick={() => handleDelete(t)}
                                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors">
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Inactive templates */}
          {inactiveTemplates.length > 0 && (
            <details>
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none py-1">
                Inactive ({inactiveTemplates.length}) — hidden from all orgs
              </summary>
              <div className="mt-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-50">
                    {inactiveTemplates.map(t => {
                      const isBusy   = busyTemplate === t.id
                      const orgCount = assignments.filter(a => a.template_id === t.id).length
                      return (
                        <tr key={t.id} className="opacity-60 hover:opacity-80 transition-opacity">
                          <td className="px-4 py-2.5 text-gray-600">{t.name}</td>
                          <td className="px-3 py-2.5">
                            <PresetBadge cols={t.schema?.columns ?? []} />
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex gap-3 justify-end">
                              <button disabled={isBusy} onClick={() => handleToggleActive(t)}
                                className="text-xs text-green-600 hover:text-green-800 font-medium disabled:opacity-40 transition-colors">
                                {isBusy ? '…' : 'Reactivate'}
                              </button>
                              {orgCount === 0 && (
                                <button disabled={isBusy} onClick={() => handleDelete(t)}
                                  className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors">
                                  Delete
                                </button>
                              )}
                            </div>
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

        {/* ═══ RIGHT: Org Assignment Manager (2/5 width) ════════════════════ */}
        <div className="col-span-2 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Org Assignments</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Choose which templates each org can use when exporting
            </p>
          </div>

          {/* Org selector */}
          <select
            value={selectedOrg}
            onChange={e => setSelectedOrg(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>

          {/* Status */}
          {selectedOrg && (
            <div className={`text-xs px-3 py-2 rounded-lg ${
              !hasDefault
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {orgAssignments.length === 0
                ? '⚠ No templates assigned — users cannot export'
                : !hasDefault
                ? `⚠ ${orgAssignments.length} template${orgAssignments.length !== 1 ? 's' : ''} assigned but no default set`
                : `✓ ${orgAssignments.length} template${orgAssignments.length !== 1 ? 's' : ''} · default: ${templates.find(t => t.id === defaultId)?.name ?? ''}`
              }
            </div>
          )}

          {/* Template list for this org */}
          {selectedOrg && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {templates.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  No templates in the library yet. Create one on the left.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-50">
                    {templates.map(t => {
                      const isAssigned = assignedIds.has(t.id)
                      const isDefault  = defaultId === t.id
                      const isBusy     = busyTemplate === t.id
                      const dimmed     = !t.is_active

                      return (
                        <tr key={t.id}
                          className={`transition-colors ${dimmed ? 'opacity-40' : 'hover:bg-gray-50'}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm font-medium ${isAssigned ? 'text-gray-900' : 'text-gray-400'}`}>
                                {t.name}
                              </span>
                              {isDefault && (
                                <span className="text-xs font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded">
                                  DEFAULT
                                </span>
                              )}
                              {!t.is_active && (
                                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                  inactive
                                </span>
                              )}
                            </div>
                            {t.description && (
                              <div className="text-xs text-gray-400 mt-0.5">{t.description}</div>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right whitespace-nowrap">
                            {isAssigned ? (
                              <div className="flex items-center gap-2 justify-end">
                                {!isDefault && (
                                  <button disabled={isBusy}
                                    onClick={() => handleSetDefault(t.id)}
                                    className="text-xs text-gray-500 hover:text-blue-600 disabled:opacity-40 transition-colors">
                                    Set default
                                  </button>
                                )}
                                <button disabled={isBusy}
                                  onClick={() => handleUnassign(t.id)}
                                  className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors">
                                  {isBusy ? '…' : 'Remove'}
                                </button>
                              </div>
                            ) : (
                              <button
                                disabled={isBusy || !t.is_active}
                                onClick={() => handleAssign(t.id, orgAssignments.length === 0)}
                                className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-40 transition-colors">
                                {isBusy ? '…' : '+ Assign'}
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          <p className="text-xs text-gray-400 leading-relaxed">
            When you assign the first template to an org it is automatically set as default.
            Users see only assigned templates when exporting — in the order shown above.
          </p>
        </div>
      </div>
    </div>
  )
}
