// apps/user/app/api/uploads/sign/route.ts
// POST /api/uploads/sign
//
// Returns a signed PUT URL so the browser can upload directly to
// Supabase Storage without exposing service keys.
//
// Flow:
//   1. Client POSTs { purpose, content_type, file_name }
//   2. Server validates + builds storage path
//   3. Server generates signed upload URL (60s expiry)
//   4. Client PUTs binary to upload_url
//   5. Client saves file_path to claim item via PATCH

import { createClient } from '@/lib/supabase/server'
import { getActiveOrg }  from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'

const BUCKET          = 'receipts'
const SIGN_EXPIRY_SEC = 60          // 60s to start the upload
const MAX_SIZE_BYTES  = 5_242_880   // 5 MB

const ALLOWED_PURPOSES      = ['RECEIPT'] as const
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic',
]

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

function sanitiseFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 100)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const body = await request.json().catch(() => ({})) as {
    purpose?:      string
    content_type?: string
    file_name?:    string
  }

  // ── Validate ──────────────────────────────────────────────────────────────
  const purpose      = body.purpose?.toUpperCase() ?? ''
  const content_type = body.content_type ?? ''
  const file_name    = body.file_name    ?? 'upload'

  if (!ALLOWED_PURPOSES.includes(purpose as typeof ALLOWED_PURPOSES[number]))
    return err('VALIDATION_ERROR', `purpose must be one of: ${ALLOWED_PURPOSES.join(', ')}.`, 400)

  if (!ALLOWED_CONTENT_TYPES.includes(content_type))
    return err('VALIDATION_ERROR', 'Unsupported file type. Use JPEG, PNG, or WebP.', 400)

  // ── Build storage path ────────────────────────────────────────────────────
  // Pattern: receipts/{org_id}/{user_id}/{timestamp}_{sanitised_name}
  const ext       = content_type === 'image/png' ? 'png'
                  : content_type === 'image/webp' ? 'webp'
                  : 'jpg'
  const ts        = Date.now()
  const safeName  = sanitiseFilename(file_name.replace(/\.[^.]+$/, ''))
  const storagePath = `${org.org_id}/${user.id}/${ts}_${safeName}.${ext}`

  // ── Generate signed upload URL ────────────────────────────────────────────
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(storagePath)

  if (error) {
    console.error('[POST /api/uploads/sign]', error.message)
    return err('SERVER_ERROR', 'Failed to generate upload URL.', 500)
  }

  return NextResponse.json({
    upload_url:   data.signedUrl,
    storage_path: storagePath,   // client saves this as receipt_path on the item
    token:        data.token,
    expires_in:   SIGN_EXPIRY_SEC,
    max_bytes:    MAX_SIZE_BYTES,
  })
}
