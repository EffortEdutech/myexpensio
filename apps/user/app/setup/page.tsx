'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function SetupPage() {
  const [orgName, setOrgName] = useState('MyExpensio Dev Org')
  const [status, setStatus] = useState<string>('Ready')
  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null)

  async function createOrg() {
    setStatus('Creating org...')
    setCreatedOrgId(null)

    const { data, error } = await supabase.rpc('bootstrap_create_org', { p_name: orgName })
    if (error) {
      setStatus('Error: ' + error.message)
      return
    }

    setCreatedOrgId(String(data))
    setStatus('Done ✅ Org created and you are OWNER')
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui', maxWidth: 520 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Setup</h1>
      <p>Create your organization for local development.</p>

      <label style={{ display: 'block', marginTop: 12 }}>Organization name</label>
      <input
        value={orgName}
        onChange={(e) => setOrgName(e.target.value)}
        style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 8 }}
      />

      <button
        onClick={createOrg}
        style={{ marginTop: 12, padding: 10, border: '1px solid #ccc', borderRadius: 8 }}
      >
        Create Org + Make Me Owner
      </button>

      <p style={{ marginTop: 12 }}><b>Status:</b> {status}</p>
      {createdOrgId && <p><b>Org ID:</b> {createdOrgId}</p>}
    </div>
  )
}