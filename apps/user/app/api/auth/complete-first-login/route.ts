// apps/user/app/api/auth/complete-first-login/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function POST() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return err('UNAUTHENTICATED', 'Login required.', 401)
  }

  try {
    const service = createServiceRoleClient()

    const nextAppMetadata = {
      ...(user.app_metadata ?? {}),
      must_change_password: false,
    }

    const { error } = await service.auth.admin.updateUserById(user.id, {
      app_metadata: nextAppMetadata,
    })

    if (error) {
      return err('SERVER_ERROR', `Failed to complete first login: ${error.message}`, 500)
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected server error.'
    return err('SERVER_ERROR', message, 500)
  }
}