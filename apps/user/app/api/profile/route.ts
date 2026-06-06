// apps/user/app/api/profile/route.ts
//
// GET  /api/profile  — returns the authenticated user's profile
// POST /api/profile  — updates display_name, department, location, company_name

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, display_name, department, location, company_name')
    .eq('id', user.id)
    .maybeSingle()

  return NextResponse.json({ profile: profile ?? null })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const body = await request.json().catch(() => null)
  if (!body) return err('INVALID_REQUEST', 'Body required.', 400)

  // Only allow safe non-sensitive fields — email/role changes go through Supabase Auth
  const update: Record<string, string | null> = {}
  if (typeof body.display_name === 'string') update.display_name = body.display_name.trim() || null
  if (typeof body.department === 'string')   update.department   = body.department.trim()   || null
  if (typeof body.location === 'string')     update.location     = body.location.trim()     || null
  if (typeof body.company_name === 'string') update.company_name = body.company_name.trim() || null

  if (Object.keys(update).length === 0) {
    return err('NO_CHANGES', 'No valid fields to update.', 400)
  }

  const { error } = await supabase
    .from('profiles')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return err('UPDATE_FAILED', error.message, 500)

  return NextResponse.json({ ok: true })
}
