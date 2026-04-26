// apps/cs/app/api/console/workspaces-search/route.ts
// GET /api/console/workspaces-search?q=<query>&type=TEAM|AGENT|INTERNAL
// Lightweight search for workspace picker in Members & Onboarding form.

import { NextResponse } from 'next/server'
import { requireConsoleAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const ctx = await requireConsoleAuth('api')
  if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const q    = searchParams.get('q')?.trim() || ''
  const type = searchParams.get('type')?.trim() || null

  const db = createServiceRoleClient()

  let query = db
    .from('organizations')
    .select('id, name, workspace_type, status, contact_email')
    .eq('status', 'ACTIVE')
    .order('name', { ascending: true })
    .limit(20)

  if (q)    query = query.ilike('name', `%${q}%`)
  if (type) query = query.eq('workspace_type', type)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ workspaces: data ?? [] })
}
