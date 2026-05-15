// apps/user/app/api/upload/bill-document/route.ts
//
// POST /api/upload/bill-document
//
// Accepts a multipart/form-data body with a `file` field (PDF or image).
// Uploads to Supabase Storage bucket `bill-documents` under the user's folder.
// Returns { path, signedUrl } — signed URL expires in 1 hour.
//
// The caller saves `path` as `document_storage_path` and `signedUrl` as
// `document_url` via PATCH /api/commitments/[id].
//
// Limits: 20 MB (agreements/policy docs tend to be larger), PDF + image only.

import { NextResponse } from 'next/server'
import { createClient }        from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'

const BUCKET       = 'bill-documents'
const MAX_BYTES    = 20 * 1024 * 1024   // 20 MB
const SIGNED_TTL   = 3600               // 1 hour

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function POST(req: Request) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  // ── Parse multipart body ──────────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return err('VALIDATION_ERROR', 'Multipart form data required.', 400)
  }

  const file       = formData.get('file')
  const commitmentId = formData.get('commitmentId') as string | null   // optional — for path organisation

  if (!file || !(file instanceof File)) {
    return err('VALIDATION_ERROR', 'file field is required.', 400)
  }

  if (file.size > MAX_BYTES) {
    return err('VALIDATION_ERROR', 'File too large — maximum 20 MB.', 400)
  }

  const mime = file.type.toLowerCase()
  if (!ALLOWED_MIME.has(mime)) {
    return err('VALIDATION_ERROR', 'Only PDF, JPEG, PNG, WEBP, HEIC files are accepted.', 400)
  }

  // ── Build storage path: {userId}/{commitmentId|misc}/{uuid}.{ext} ──────────
  const ext    = mime === 'application/pdf' ? 'pdf'
               : mime === 'image/jpeg'       ? 'jpg'
               : mime === 'image/png'        ? 'png'
               : mime === 'image/webp'       ? 'webp'
               :                              'heic'

  const folder = commitmentId ? `${user.id}/${commitmentId}` : `${user.id}/misc`
  const uuid   = crypto.randomUUID()
  const path   = `${folder}/${uuid}.${ext}`

  // ── Upload ──────────────────────────────────────────────────────────────────
  const service = createServiceRoleClient()
  const buffer  = Buffer.from(await file.arrayBuffer())

  const { error: uploadErr } = await service.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mime, upsert: false })

  if (uploadErr) {
    console.error('[upload/bill-document]', uploadErr.message)
    return err('SERVER_ERROR', 'Upload failed. Please try again.', 500)
  }

  // ── Signed URL ──────────────────────────────────────────────────────────────
  const { data: signed, error: signErr } = await service.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_TTL)

  if (signErr || !signed?.signedUrl) {
    return err('SERVER_ERROR', 'Failed to generate download URL.', 500)
  }

  return NextResponse.json({
    path,
    signedUrl: signed.signedUrl,
    bucket:    BUCKET,
    mime,
    sizeBytes: file.size,
    expiresIn: SIGNED_TTL,
  })
}
