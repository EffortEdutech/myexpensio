// apps/user/app/api/uploads/view/route.ts
// GET /api/uploads/view?path={storage_path}
//
// Generates a short-lived (5 min) signed GET URL so the browser can
// display a private receipt image. Never exposes raw storage paths
// or service keys to the browser.

import { createClient } from '@/lib/supabase/server'
import { getActiveOrg }  from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'

const BUCKET          = 'receipts'
const VIEW_EXPIRY_SEC = 300   // 5 minutes

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const storagePath = new URL(request.url).searchParams.get('path') ?? ''
  if (!storagePath)
    return err('VALIDATION_ERROR', 'path is required.', 400)

  // ── Security: ensure path belongs to caller's org ─────────────────────────
  // Path format: {org_id}/{user_id}/{filename}
  const pathOrgId = storagePath.split('/')[0]
  if (pathOrgId !== org.org_id)
    return err('FORBIDDEN', 'Access denied.', 403)

  // ── Generate signed view URL ──────────────────────────────────────────────
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, VIEW_EXPIRY_SEC)

  if (error) {
    console.error('[GET /api/uploads/view]', error.message)
    return err('SERVER_ERROR', 'Failed to generate view URL.', 500)
  }

  return NextResponse.json({
    url:        data.signedUrl,
    expires_in: VIEW_EXPIRY_SEC,
  })
}
