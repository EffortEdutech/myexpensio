import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, department, location, company_name')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('[GET /api/settings/profile]', error.message)
    return err('SERVER_ERROR', 'Failed to load profile.', 500)
  }

  return NextResponse.json({
    profile: {
      id: data.id,
      email: data.email ?? '',
      display_name: data.display_name ?? '',
      department: data.department ?? '',
      location: data.location ?? '',
      company_name: data.company_name ?? '',
    },
    note: 'Profile email here is used for claims/reports contact details. It does not change your sign-in email.',
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const body = await request.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Body required.', 400)

  const payload = {
    display_name: clean(body.display_name),
    email: clean(body.email),
    department: clean(body.department),
    location: clean(body.location),
    company_name: clean(body.company_name),
  }

  if (!payload.display_name) return err('VALIDATION_ERROR', 'Name is required.', 400)

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', user.id)
    .select('id, email, display_name, department, location, company_name')
    .single()

  if (error) {
    console.error('[POST /api/settings/profile]', error.message)
    return err('SERVER_ERROR', 'Failed to save profile.', 500)
  }

  return NextResponse.json({
    profile: {
      id: data.id,
      email: data.email ?? '',
      display_name: data.display_name ?? '',
      department: data.department ?? '',
      location: data.location ?? '',
      company_name: data.company_name ?? '',
    },
  })
}
