'use client'
// apps/admin/app/(protected)/templates/TemplatesClient.tsx

import { useState } from 'react'

type Org = { id: string; name: string }
type Template = {
  id: string; org_id: string; name: string; description: string | null
  schema: { preset: string; columns: string[] }; is_active: boolean
  is_default: boolean; created_at: string; updated_at: string
  organizations: { name: string } | null
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function TemplatesClient({ initialTemplates, orgs }: { initialTemplates: Template[]; orgs: Org[] }) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [showForm,  setShowForm]  = useState(false)
  const [orgFilter, setOrgFilter] = useState('ALL')
  const [toast,     setToast]     = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  const [busy,      setBusy]      = useState<string | null>(null)

  // New template form
  const [fOrg,   setFOrg]   = useState(orgs[0]?.id ?? '')
  const [fName,  setFName]  = useState('')
  const [fDesc,  setFDesc]  = useState('')
  const [fPreset, setFPreset] = useState('STANDARD')
  const [fDefault, setFDefault] = useState(false)
  const [saving, setSaving] = useState(false)

  function toast_(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3500)
  }

  const filtered = orgFilter === 'ALL' ? templates : templates.filter(t => t.org_id === orgFilter)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!fOrg) { toast_('err', 'Select an organisation'); return }
    setSaving(true)
    try {
      const res  = await fetch('/api/admin/templates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: fOrg, name: fName.trim(), description: fDesc.trim() || null, preset: fPreset, is_default: fDefault }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      setTemplates(prev => [...prev, json.template])
      setShowForm(false); setFName(''); setFDesc('')
      toast_('ok', 'Template created')
    } catch (e: unknown) { toast_('err', e instanceof Error ? e.message : 'Failed') }
    finally { setSaving(false) }
  }

  async function toggleActive(t: Template) {
    setBusy(t.id)
    try {
      const res  = await fetch(`/api/admin/templates/${t.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !t.is_active }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      setTemplates(prev => prev.map(x => x.id === t.id ? { ...x, is_active: !t.is_active } : x))
      toast_('ok', t.is_active ? 'Template deactivated' : 'Template activated')
    } catch (e: unknown) { toast_('err', e instanceof Error ? e.message : 'Failed') }
    finally { setBusy(null) }
  }

  async function setDefault(t: Template) {
    if (t.is_default) return
    setBusy(t.id)
    try {
      const res  = await fetch(`/api/admin/templates/${t.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      setTemplates(prev => prev.map(x =>
        x.org_id === t.org_id ? { ...x, is_default: x.id === t.id } : x
      ))
      toast_('ok', `"${t.name}" set as default for this org`)
    } catch (e: unknown) { toast_('err', e instanceof Error ? e.message : 'Failed') }
    finally { setBusy(null) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Export Templates</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage report templates for all organisations</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          {showForm ? 'Cancel' : '+ New Template'}
        </button>
      </div>

      {toast && (
        <div className={`px-4 py-2.5 rounded-lg text-sm font-medium ${toast.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toast.msg}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">New Export Template</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organisation <span className="text-red-500">*</span></label>
              <select value={fOrg} onChange={e => setFOrg(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select org…</option>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template Name <span className="text-red-500">*</span></label>
              <input value={fName} onChange={e => setFName(e.target.value)} required placeholder="e.g. Standard Monthly"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Optional description"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Column Preset</label>
              <select value={fPreset} onChange={e => setFPreset(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="STANDARD">Standard — essential columns</option>
                <option value="COMPLETE">Complete — all columns including TNG & per diem</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={fDefault} onChange={e => setFDefault(e.target.checked)} className="rounded" />
              Set as default template for this organisation
            </label>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Creating…' : 'Create Template'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Org filter */}
      <div className="flex gap-3">
        <select value={orgFilter} onChange={e => setOrgFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none">
          <option value="ALL">All organisations</option>
          {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <span className="text-sm text-gray-400 self-center">{filtered.length} templates</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Org</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Template</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Preset</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Columns</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(t => {
                const org = Array.isArray(t.organizations) ? t.organizations[0] : t.organizations
                return (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{(org as {name?:string}|null)?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 font-medium">{t.name}</span>
                        {t.is_default && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Default</span>}
                      </div>
                      {t.description && <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs uppercase font-medium">{t.schema?.preset ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{t.schema?.columns?.length ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {t.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDate(t.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 justify-end">
                        {!t.is_default && t.is_active && (
                          <button disabled={busy === t.id} onClick={() => setDefault(t)}
                            className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-40">
                            Set default
                          </button>
                        )}
                        <button disabled={busy === t.id} onClick={() => toggleActive(t)}
                          className={`text-xs font-medium disabled:opacity-40 ${t.is_active ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}>
                          {busy === t.id ? '…' : t.is_active ? 'Deactivate' : 'Activate'}
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
    </div>
  )
}
