// apps/user/app/api/tng/statements/[batch_id]/route.ts
//
// DELETE /api/tng/statements/[batch_id]
//
// Full sequence:
//   1. Fetch batch rows — ownership check, claimed guard, collect storage paths
//   2. Delete DB rows
//   3. Verify DB rows are actually gone (re-query)
//   4. Delete storage files
//   5. Verify storage files are actually gone (re-list)
//   6. If storage delete failed → write to audit_logs so admin app can see
//      the orphaned file and clean it manually from the bucket
//
// Response:
//   {
//     deleted_count:   number       — rows removed from tng_transactions
//     storage_cleaned: boolean      — true if ALL storage files confirmed deleted
//     storage_orphans: string[]     — paths that could not be deleted (if any)
//   }

import { createClient }    from '@/lib/supabase/server'
import { getActiveOrg }    from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ batch_id: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { batch_id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  // ── 1. Fetch batch rows ───────────────────────────────────────────────────
  // Include source_file_url so we know which storage file(s) to delete.
  const { data: rows, error: fetchErr } = await supabase
    .from('tng_transactions')
    .select('id, claimed, source_file_url')
    .eq('upload_batch_id', batch_id)
    .eq('user_id', user.id)
    .eq('org_id', org.org_id)

  if (fetchErr) {
    console.error('[DELETE tng/statements] fetch error:', fetchErr.message)
    return err('SERVER_ERROR', 'Failed to verify batch.', 500)
  }

  if (!rows || rows.length === 0) {
    return err('NOT_FOUND', 'No transactions found for this statement batch.', 404)
  }

  // Block if any row is claimed — audit trail must be preserved
  const claimedCount = rows.filter(r => r.claimed).length
  if (claimedCount > 0) {
    return err(
      'CONFLICT',
      `Cannot remove: ${claimedCount} transaction${claimedCount !== 1 ? 's' : ''} in this batch have already been claimed. Remove the linked claim items first.`,
      409,
    )
  }

  // Collect unique storage paths (multiple rows share the same PDF path)
  const storagePaths = [
    ...new Set(
      rows
        .map(r => r.source_file_url as string | null)
        .filter((p): p is string => !!p),
    ),
  ]

  const totalRows = rows.length

  // ── 2. Delete DB rows ─────────────────────────────────────────────────────
  const { error: deleteErr, count: deletedCount } = await supabase
    .from('tng_transactions')
    .delete({ count: 'exact' })
    .eq('upload_batch_id', batch_id)
    .eq('user_id', user.id)
    .eq('org_id', org.org_id)

  if (deleteErr) {
    console.error('[DELETE tng/statements] DB delete error:', deleteErr.message)
    return err('SERVER_ERROR', 'Failed to delete transactions.', 500)
  }

  // ── 3. Verify DB rows are gone ────────────────────────────────────────────
  const { data: remainingRows, error: verifyDbErr } = await supabase
    .from('tng_transactions')
    .select('id')
    .eq('upload_batch_id', batch_id)
    .eq('user_id', user.id)
    .eq('org_id', org.org_id)
    .limit(1)

  const dbVerified     = !verifyDbErr && (remainingRows?.length ?? 0) === 0
  const dbRowsDeleted  = deletedCount ?? 0

  if (!dbVerified) {
    // RLS silently blocked or partial delete — rare but worth knowing
    console.error(
      '[DELETE tng/statements] DB verification failed — rows may still exist.',
      { batch_id, deletedCount, verifyErr: verifyDbErr?.message },
    )
    return err(
      'SERVER_ERROR',
      'Transactions could not be deleted. This may be a permissions issue — please contact support.',
      500,
    )
  }

  console.log(`[DELETE tng/statements] DB: deleted ${dbRowsDeleted}/${totalRows} rows — verified clear`)

  // ── 4. Delete storage files ───────────────────────────────────────────────
  const storageOrphans: string[] = []

  if (storagePaths.length === 0) {
    // No storage files associated with this batch (imported before bucket existed)
    return NextResponse.json({
      deleted_count:   dbRowsDeleted,
      storage_cleaned: true,
      storage_orphans: [],
    })
  }

  const { error: storageErr } = await supabase.storage
    .from('tng-statements')
    .remove(storagePaths)

  if (storageErr) {
    console.error('[DELETE tng/statements] storage remove error:', storageErr.message)
    // Don't return error — DB is clean; storage failure is secondary
    storageOrphans.push(...storagePaths)
  }

  // ── 5. Verify storage files are gone ─────────────────────────────────────
  // Even if remove() succeeded, verify by listing the paths.
  // Supabase storage.remove() returns success even for non-existent files,
  // so we only verify if the remove call itself did NOT error.
  const confirmedOrphans: string[] = [...storageOrphans]  // start with any that already failed

  if (storageOrphans.length === 0) {
    // Remove succeeded — now verify files are actually gone
    for (const storagePath of storagePaths) {
      try {
        // Extract folder from path (format: "{user_id}/{uuid}.pdf")
        const parts  = storagePath.split('/')
        const folder = parts.slice(0, -1).join('/')
        const file   = parts[parts.length - 1]

        const { data: listed } = await supabase.storage
          .from('tng-statements')
          .list(folder, { search: file })

        const stillExists = (listed ?? []).some(f => f.name === file)

        if (stillExists) {
          console.warn('[DELETE tng/statements] file still in bucket after remove:', storagePath)
          confirmedOrphans.push(storagePath)
        }
      } catch (e) {
        // Verification error — assume orphan to be safe
        console.warn('[DELETE tng/statements] verification exception for', storagePath, (e as Error).message)
        confirmedOrphans.push(storagePath)
      }
    }
  }

  const storageFullyCleaned = confirmedOrphans.length === 0

  // ── 6. Log orphans to audit_logs for admin visibility ─────────────────────
  // If any storage file could not be confirmed deleted, write an audit entry
  // so it appears in the admin app Audit Log with enough detail to clean manually.
  if (confirmedOrphans.length > 0) {
    console.error(
      '[DELETE tng/statements] ORPHANED STORAGE FILES — manual cleanup needed:',
      confirmedOrphans,
    )

    // Write to audit_logs — visible in admin app → Audit Log
    // action: TNG_STORAGE_ORPHAN
    // metadata includes: paths needing deletion, batch_id, user info, instructions
    const { error: auditErr } = await supabase
      .from('audit_logs')
      .insert({
        org_id:         org.org_id,
        actor_user_id:  user.id,
        entity_type:    'tng_statement',
        entity_id:      batch_id,
        action:         'TNG_STORAGE_ORPHAN',
        metadata: {
          message:        'TNG statement batch deleted from DB but storage file(s) could not be removed. Manual cleanup required.',
          batch_id,
          orphaned_paths: confirmedOrphans,
          bucket:         'tng-statements',
          deleted_rows:   dbRowsDeleted,
          storage_error:  storageErr?.message ?? null,
          instruction:    'Go to Supabase Storage → tng-statements bucket → delete the listed paths manually.',
        },
      })

    if (auditErr) {
      // Audit log write also failed — last resort: structured server log
      console.error(
        '[DELETE tng/statements] AUDIT LOG WRITE FAILED — full orphan detail:',
        JSON.stringify({
          action:          'TNG_STORAGE_ORPHAN',
          org_id:          org.org_id,
          user_id:         user.id,
          batch_id,
          orphaned_paths:  confirmedOrphans,
          bucket:          'tng-statements',
          audit_err:       auditErr.message,
        }),
      )
    } else {
      console.log('[DELETE tng/statements] orphan logged to audit_logs — admin will see it in Audit Log')
    }
  } else {
    console.log(`[DELETE tng/statements] storage: ${storagePaths.length} file(s) confirmed deleted`)
  }

  // ── 7. Return result ──────────────────────────────────────────────────────
  return NextResponse.json({
    deleted_count:   dbRowsDeleted,
    storage_cleaned: storageFullyCleaned,
    storage_orphans: confirmedOrphans,
  })
}
