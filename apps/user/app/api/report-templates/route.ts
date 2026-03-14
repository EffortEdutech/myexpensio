// apps/user/app/api/report-templates/route.ts
//
// GET /api/report-templates
//
// Returns active export templates for the authenticated user's org.
// Used by the User App export page to populate the Template dropdown.
//
// Auth: any active org member can call this.
// Ordering: default template first, then alphabetical.

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(_request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHORIZED', 'Not authenticated', 401)

  // Get user's org membership
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE')
    .limit(1)
    .single()

  if (!membership) return err('NOT_MEMBER', 'No active organisation membership', 403)

  const { data: templates, error } = await supabase
    .from('report_templates')
    .select('id, name, description, schema, is_default')
    .eq('org_id', membership.org_id)
    .eq('is_active', true)
    .order('is_default', { ascending: false })  // default first
    .order('name', { ascending: true })

  if (error) {
    console.error('[/api/report-templates] DB error:', error)
    return err('DB_ERROR', 'Failed to fetch templates', 500)
  }

  // If no templates exist (pre-migration), return empty so UI falls back gracefully
  return NextResponse.json({ templates: templates ?? [] })
}
