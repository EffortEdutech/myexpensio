import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, msg: string, s: number) {
  return NextResponse.json({ error: { code, message: msg } }, { status: s })
}

type LimitValue = number | null

function toNullableInt(value: unknown): LimitValue {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.floor(n)
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function normalizePlan(raw: unknown, fallbackLabel: string) {
  const obj = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {}
  return {
    routes_per_month: toNullableInt(obj.routes_per_month),
    trips_per_month: toNullableInt(obj.trips_per_month),
    exports_per_month: toNullableInt(obj.exports_per_month),
    label: toNullableString(obj.label) ?? fallbackLabel,
  }
}

function normalizeOverride(raw: unknown) {
  const obj = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {}
  const preset = String(obj.preset ?? 'DEFAULT').trim().toUpperCase()
  return {
    preset: preset === 'CUSTOM' || preset === 'BETA_UNLIMITED' ? preset : 'DEFAULT',
    routes_per_month: toNullableInt(obj.routes_per_month),
    trips_per_month: toNullableInt(obj.trips_per_month),
    exports_per_month: toNullableInt(obj.exports_per_month),
    label: toNullableString(obj.label),
    expires_at: toNullableString(obj.expires_at),
    notes: toNullableString(obj.notes),
  }
}

function normalizeOrgProfile(raw: unknown) {
  const obj = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {}
  return {
    name: toNullableString(obj.name),
    display_name: toNullableString(obj.display_name),
    contact_email: toNullableString(obj.contact_email),
    contact_phone: toNullableString(obj.contact_phone),
    address: toNullableString(obj.address),
    notes: toNullableString(obj.notes),
  }
}

export async function POST(req: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Body required', 400)

  if (body.action === 'create_org') {
    if (!body.name?.trim()) return err('VALIDATION_ERROR', 'name required', 400)

    const db = createServiceRoleClient()
    const cleanName = String(body.name).trim()

    const { data: org, error: orgErr } = await db
      .from('organizations')
      .insert({
        name: cleanName,
        display_name: String(body.display_name ?? cleanName).trim() || cleanName,
        contact_email: toNullableString(body.contact_email),
        contact_phone: toNullableString(body.contact_phone),
        address: toNullableString(body.address),
        notes: toNullableString(body.notes),
        status: 'ACTIVE',
      })
      .select('id, name, display_name, contact_email, contact_phone, address, notes, status, created_at, updated_at')
      .single()

    if (orgErr) {
      if (orgErr.code === '23505') return err('CONFLICT', `Organisation "${cleanName}" already exists`, 409)
      return err('DB_ERROR', orgErr.message, 500)
    }

    await db.from('subscription_status').insert({ org_id: org.id, tier: 'FREE' })

    await db.from('audit_logs').insert({
      actor_user_id: ctx.userId,
      entity_type: 'organization',
      entity_id: org.id,
      action: 'ORG_CREATED',
      metadata: { name: org.name, display_name: org.display_name },
    })

    return NextResponse.json({ org }, { status: 201 })
  }

  return err('VALIDATION_ERROR', 'Unknown action', 400)
}

export async function PATCH(req: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Body required', 400)

  const db = createServiceRoleClient()

  if (body.scope === 'platform') {
    const freePlan = normalizePlan(body?.plans?.FREE, 'Free')
    const proPlan = normalizePlan(body?.plans?.PRO, 'Pro Unlimited')

    const settings = { plans: { FREE: freePlan, PRO: proPlan } }
    const { error } = await db.from('platform_settings').upsert({
      id: true,
      settings,
      updated_at: new Date().toISOString(),
      updated_by: ctx.userId,
    })

    if (error) return err('DB_ERROR', error.message, 500)
    return NextResponse.json({ success: true })
  }

  if (!body.org_id) return err('VALIDATION_ERROR', 'org_id required', 400)

  if (body.status !== undefined) {
    if (!['ACTIVE', 'SUSPENDED'].includes(body.status)) return err('VALIDATION_ERROR', 'Invalid status', 400)
    const { error } = await db.from('organizations').update({ status: body.status }).eq('id', body.org_id)
    if (error) return err('DB_ERROR', error.message, 500)
  }

  if (body.tier !== undefined) {
    if (!['FREE', 'PRO'].includes(body.tier)) return err('VALIDATION_ERROR', 'Invalid tier', 400)
    const { error } = await db.from('subscription_status').upsert({
      org_id: body.org_id,
      tier: body.tier,
      updated_at: new Date().toISOString(),
    })
    if (error) return err('DB_ERROR', error.message, 500)
  }

  if (body.org_profile) {
    const orgProfile = normalizeOrgProfile(body.org_profile)
    if (!orgProfile.name) return err('VALIDATION_ERROR', 'Organisation name is required.', 400)

    const { error } = await db
      .from('organizations')
      .update({
        name: orgProfile.name,
        display_name: orgProfile.display_name ?? orgProfile.name,
        contact_email: orgProfile.contact_email,
        contact_phone: orgProfile.contact_phone,
        address: orgProfile.address,
        notes: orgProfile.notes,
      })
      .eq('id', body.org_id)

    if (error) return err('DB_ERROR', error.message, 500)
  }

  if (body.scope === 'org' || body.limits_override !== undefined) {
    const { data: existing } = await db
      .from('admin_settings')
      .select('settings')
      .eq('org_id', body.org_id)
      .maybeSingle()

    const current = (existing?.settings && typeof existing.settings === 'object')
      ? existing.settings as Record<string, unknown>
      : {}

    const limits = normalizeOverride(body.limits_override)
    const merged = { ...current, limits }

    const { error } = await db.from('admin_settings').upsert({
      org_id: body.org_id,
      settings: merged,
      updated_at: new Date().toISOString(),
      updated_by: ctx.userId,
    })

    if (error) return err('DB_ERROR', error.message, 500)
  }

  return NextResponse.json({ success: true })
}
