// apps/admin/app/api/workspace/settings/route.ts
//
// PATCH /api/workspace/settings
// Allows workspace OWNER / ADMIN to update their own org profile and
// rate template preference. Internal staff can scope to any org via ?org_id=.

import { NextResponse } from 'next/server'
import { requireWorkspaceAuth } from '@/lib/workspace-auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function PATCH(req: Request) {
  const ctx = await requireWorkspaceAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  // Only OWNER / ADMIN (or internal staff) may write settings
  if (!ctx.isInternalStaff && ctx.orgRole !== 'OWNER' && ctx.orgRole !== 'ADMIN') {
    return err('FORBIDDEN', 'Only workspace owners and admins can update settings', 403)
  }

  const orgId = ctx.isInternalStaff
    ? new URL(req.url).searchParams.get('org_id')
    : ctx.orgId

  if (!orgId) return err('VALIDATION_ERROR', 'org_id required for internal staff', 400)

  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required', 400)

  const db = createServiceRoleClient()

  // ── Profile update ────────────────────────────────────────────────────────────
  if (body.org_profile) {
    const { name, display_name, contact_email, contact_phone, address } = body.org_profile
    if (!String(name ?? '').trim()) return err('VALIDATION_ERROR', 'Workspace name is required', 400)

    const { error } = await db
      .from('organizations')
      .update({
        name:          String(name).trim(),
        display_name:  String(display_name ?? name).trim() || String(name).trim(),
        contact_email: contact_email?.trim() || null,
        contact_phone: contact_phone?.trim() || null,
        address:       address?.trim() || null,
      })
      .eq('id', orgId)

    if (error) return err('DB_ERROR', error.message, 500)
  }

  // ── Rate template preference ───────────────────────────────────────────────────
  // Stored in admin_settings.settings.rate_template_name (null = no assignment)
  if ('rate_template_name' in body) {
    const { data: existing } = await db
      .from('admin_settings')
      .select('settings')
      .eq('org_id', orgId)
      .maybeSingle()

    const current = (existing?.settings && typeof existing.settings === 'object')
      ? existing.settings as Record<string, unknown>
      : {}

    const merged = {
      ...current,
      rate_template_name: body.rate_template_name?.trim() || null,
    }

    const { error } = await db.from('admin_settings').upsert({
      org_id:     orgId,
      settings:   merged,
      updated_at: new Date().toISOString(),
      updated_by: ctx.userId,
    })

    if (error) return err('DB_ERROR', error.message, 500)
  }

  return NextResponse.json({ success: true })
}
