// apps/admin/app/api/workspace/me/route.ts
//
// GET /api/workspace/me
// Returns the current user's workspace auth context.
// Used by client pages to detect if the logged-in user is internal staff
// (SUPER_ADMIN / SUPPORT) so they can show the org picker.

import { NextResponse } from 'next/server'
import { requireWorkspaceAuth } from '@/lib/workspace-auth'

export async function GET() {
  const ctx = await requireWorkspaceAuth('api')
  if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 403 })

  return NextResponse.json({
    userId:           ctx.userId,
    email:            ctx.email,
    displayName:      ctx.displayName,
    platformRole:     ctx.platformRole,
    isInternalStaff:  ctx.isInternalStaff,
    isSuperAdmin:     ctx.isSuperAdmin,
    orgId:            ctx.orgId,
    orgName:          ctx.orgName,
    orgRole:          ctx.orgRole,
    workspaceType:    ctx.workspaceType,
    isTeamWorkspace:  ctx.isTeamWorkspace,
    isAgentWorkspace: ctx.isAgentWorkspace,
  })
}
