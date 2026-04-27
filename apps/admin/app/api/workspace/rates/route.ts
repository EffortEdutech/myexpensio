// apps/admin/app/api/workspace/rates/route.ts
//
// GET /api/workspace/rates
// Returns the global rate_versions library.
// Workspace users (OWNER/ADMIN/MANAGER) can read — they cannot create or edit.
// Internal staff use /api/admin/rates for full CRUD.
//
// Rate versions are GLOBAL — not per-org. They are managed by Console/internal
// staff and made available to all workspace users for reference.

import { NextResponse } from 'next/server'
import { requireWorkspaceAuth } from '@/lib/workspace-auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(req: Request) {
  const ctx = await requireWorkspaceAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { searchParams } = new URL(req.url)
  const templateName = searchParams.get('template_name')?.trim() || null

  const db = createServiceRoleClient()

  let query = db
    .from('rate_versions')
    .select(`
      id,
      template_name,
      effective_from,
      currency,
      mileage_rate_per_km,
      motorcycle_rate_per_km,
      meal_rate_default,
      meal_rate_per_session,
      meal_rate_full_day,
      meal_rate_morning,
      meal_rate_noon,
      meal_rate_evening,
      lodging_rate_default,
      perdiem_rate_myr,
      created_at,
      updated_at,
      profiles:created_by_user_id ( display_name, email )
    `)
    .order('template_name', { ascending: true })
    .order('effective_from',  { ascending: false })

  if (templateName) query = query.eq('template_name', templateName)

  const { data, error } = await query

  if (error) {
    console.error('[workspace/rates] GET error:', error)
    return err('SERVER_ERROR', 'Failed to fetch rate templates', 500)
  }

  const rates = (data ?? []).map((row) => ({
    ...row,
    profiles: Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles,
  }))

  const templateNames = Array.from(
    new Set(rates.map((r) => r.template_name).filter(Boolean)),
  )

  return NextResponse.json({ rates, templateNames })
}
