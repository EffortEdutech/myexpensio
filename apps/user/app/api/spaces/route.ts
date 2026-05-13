// apps/user/app/api/spaces/route.ts
//
// GET — list all spaces for the authenticated user.
//       Auto-creates the PERSONAL space if it doesn't exist yet
//       (handles new sign-ups after the migration ran).
//
// No POST here — spaces are created automatically:
//   PERSONAL → on first GET (this file)
//   BUSINESS → when user upgrades to Premium (billing webhook)

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  // Auto-create PERSONAL space if missing (idempotent)
  const { error: upsertError } = await supabase
    .from('spaces')
    .upsert(
      { user_id: user.id, type: 'PERSONAL', name: 'Personal', is_default: true },
      { onConflict: 'user_id,type', ignoreDuplicates: true },
    )

  if (upsertError) {
    console.error('[GET /api/spaces] upsert PERSONAL:', upsertError.message)
  }

  const { data, error } = await supabase
    .from('spaces')
    .select('id, type, name, currency, is_default, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[GET /api/spaces]', error.message)
    return err('SERVER_ERROR', 'Failed to load spaces.', 500)
  }

  return NextResponse.json({ spaces: data ?? [] })
}
