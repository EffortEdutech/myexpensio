// apps/admin/app/api/workspace/org-search/route.ts
//
// GET /api/workspace/org-search?q=<query>
// Internal staff only — typeahead search for workspace picker.
// Used by InternalOrgPicker component in billing, templates, claims etc.

import { NextResponse } from 'next/server'
import { requireWorkspaceAuth } from '@/lib/workspace-auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const ctx = await requireWorkspaceAuth('api')
  if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 403 })

  // Only internal staff need the picker — customers already have ctx.orgId
  if (!ctx.isInternalStaff) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const q    = searchParams.get('q')?.trim() || ''
  const type = searchParams.get('type')?.trim() || null

  const db = createServiceRoleClient()

  let query = db
    .from('organizations')
    .select('id, name, workspace_type, status, contact_email')
    .order('name', { ascending: true })
    .limit(20)

  if (q)    query = query.ilike('name', `%${q}%`)
  if (type) query = query.eq('workspace_type', type)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ workspaces: data ?? [] })
}
