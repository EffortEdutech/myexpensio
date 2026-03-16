// apps/user/app/api/report-templates/route.ts
//
// GET /api/report-templates
//
// Returns active export templates assigned to the authenticated user's org.
// Queries via org_template_assignments junction table (post-migration).
// Default template is first, then alphabetical.

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(_request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHORIZED', 'Not authenticated', 401)

  // Get user's org
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE')
    .limit(1)
    .single()

  if (!membership) return err('NOT_MEMBER', 'No active organisation membership', 403)

  // Query via junction table: org_template_assignments → report_templates
  // Only return templates that are both assigned to this org AND is_active in the library
  const { data: assignments, error } = await supabase
    .from('org_template_assignments')
    .select(`
      is_default,
      report_templates (
        id, name, description, schema, is_active
      )
    `)
    .eq('org_id', membership.org_id)
    .order('is_default', { ascending: false })  // default first

  if (error) {
    console.error('[/api/report-templates] DB error:', error.message)
    return err('DB_ERROR', 'Failed to fetch templates', 500)
  }

  // Flatten: filter out inactive templates, attach is_default to each
  const templates = (assignments ?? [])
    .map(a => {
      const t = Array.isArray(a.report_templates) ? a.report_templates[0] : a.report_templates
      if (!t || !t.is_active) return null
      return {
        id:          t.id,
        name:        t.name,
        description: t.description,
        schema:      t.schema,
        is_default:  a.is_default,
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      // Default first, then alphabetical
      if (a!.is_default && !b!.is_default) return -1
      if (!a!.is_default && b!.is_default) return 1
      return a!.name.localeCompare(b!.name)
    })

  return NextResponse.json({ templates })
}
