// apps/cs/app/api/console/me/route.ts
// Returns the authenticated console user's role.
// Used by client components to determine SUPER_ADMIN vs SUPPORT capabilities.

import { NextResponse } from 'next/server'
import { requireConsoleAuth } from '@/lib/auth'

export async function GET() {
  const ctx = await requireConsoleAuth('api')
  if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 403 })

  return NextResponse.json({
    user_id:      ctx.userId,
    email:        ctx.email,
    display_name: ctx.displayName,
    role:         ctx.role,
  })
}
