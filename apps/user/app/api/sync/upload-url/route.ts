// apps/user/app/api/sync/upload-url/route.ts
//
// POST /api/sync/upload-url
//
// Returns a signed Supabase Storage upload URL for a receipt file.
// The mobile app uploads the binary directly to Storage using this URL,
// then calls POST /api/sync/push with entity_type "receipt" to register it.
//
// Request:
//   { receipt_id: string, mime_type: string, file_size: number }
//
// Response:
//   { upload_url: string, storage_path: string, expires_at: string }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const RECEIPTS_BUCKET = 'receipts'
const SIGNED_URL_EXPIRES_SECONDS = 300 // 5 minutes

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
])

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const body = await request.json().catch(() => null)
  if (!body?.receipt_id || typeof body.receipt_id !== 'string') {
    return err('INVALID_REQUEST', 'receipt_id is required.', 400)
  }
  if (!body?.mime_type || !ALLOWED_MIME_TYPES.has(body.mime_type)) {
    return err('INVALID_MIME', `Unsupported file type. Allowed: ${[...ALLOWED_MIME_TYPES].join(', ')}`, 400)
  }
  if (body.file_size && body.file_size > MAX_FILE_SIZE_BYTES) {
    return err('FILE_TOO_LARGE', `Max file size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.`, 400)
  }

  // Storage path: receipts/{user_id}/{receipt_id}
  // Extension derived from mime type for clean filenames
  const ext = mimeToExtension(body.mime_type)
  const storagePath = `${user.id}/${body.receipt_id}${ext}`

  const { data, error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUploadUrl(storagePath)

  if (error || !data?.signedUrl) {
    return err('STORAGE_ERROR', 'Failed to create upload URL.', 500)
  }

  const expiresAt = new Date(Date.now() + SIGNED_URL_EXPIRES_SECONDS * 1000).toISOString()

  return NextResponse.json({
    upload_url: data.signedUrl,
    storage_path: storagePath,
    expires_at: expiresAt,
  })
}

function mimeToExtension(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/heic': '.heic',
    'application/pdf': '.pdf',
  }
  return map[mime] ?? ''
}
