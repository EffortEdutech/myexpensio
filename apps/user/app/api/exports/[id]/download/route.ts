// apps/user/app/api/exports/[id]/download/route.ts
//
// GET /api/exports/[id]/download
//
// Re-generates and streams an export file on demand.
// No storage bucket required — the file is built fresh from the DB
// using the claim_ids stored in the job's `filters` jsonb.
//
// Content-Disposition: attachment triggers browser download.
//
// FIXED (14 Mar 2026):
//   Replaced non-existent imports (buildExportRows, generateCSV, generateXLSX)
//   with the correct exports from export-builder.ts (buildExport, ClaimForExport,
//   ItemForExport, TripForExport) and inline claim-fetching — same pattern used
//   by /api/exports/route.ts (POST).

import { type NextRequest, NextResponse } from 'next/server'
import { createClient }  from '@/lib/supabase/server'
import { getActiveOrg }  from '@/lib/org'
import { buildExport, type ClaimForExport, type ItemForExport, type TripForExport } from '@/lib/export-builder'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id }   = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  // ── 1. Load the export job record ────────────────────────────────────────
  const { data: job, error: jobErr } = await supabase
    .from('export_jobs')
    .select('id, org_id, user_id, format, filters, created_at')
    .eq('id', id)
    .eq('org_id', org.org_id)   // org-scope guard
    .eq('user_id', user.id)     // users can only re-download their own exports
    .single()

  if (jobErr || !job) return err('NOT_FOUND', 'Export job not found.', 404)

  if (job.format === 'PDF') {
    // PDF re-download is not supported in Phase 1 (no storage bucket).
    return err('NOT_SUPPORTED', 'PDF re-download is not available. Please regenerate the export.', 400)
  }

  // ── 2. Recover claim_ids from stored filters ──────────────────────────────
  const f = (job.filters ?? {}) as { claim_ids?: string[] }
  const claimIds = f.claim_ids ?? []

  if (claimIds.length === 0) {
    return err('VALIDATION_ERROR', 'No claim IDs stored for this export job.', 400)
  }

  // ── 3. Re-fetch claims (org-scoped, user's own, submitted only) ───────────
  const { data: claims, error: claimsError } = await supabase
    .from('claims')
    .select(`
      id, title, status, period_start, period_end,
      submitted_at, total_amount, currency,
      profiles ( display_name, email ),
      claim_items (
        id, type, amount, currency, claim_date,
        merchant, notes, receipt_url,
        paid_via_tng, tng_transaction_id,
        perdiem_days, perdiem_rate_myr, perdiem_destination,
        meal_session, lodging_check_in, lodging_check_out,
        trip_id,
        tng_transactions ( trans_no ),
        trips (
          id, origin_text, destination_text,
          final_distance_m, distance_source,
          transport_type, odometer_mode
        )
      )
    `)
    .in('id', claimIds)
    .eq('org_id', job.org_id)
    .eq('user_id', user.id)
    .eq('status', 'SUBMITTED')

  if (claimsError) {
    console.error('[/api/exports/[id]/download] claims fetch error:', claimsError)
    return err('DB_ERROR', 'Failed to fetch claims for export.', 500)
  }

  if (!claims?.length) {
    return err('NOT_FOUND', 'No submitted claims found for this export job.', 404)
  }

  // ── 4. Get current mileage rate ───────────────────────────────────────────
  const { data: rateRow } = await supabase
    .from('rate_versions')
    .select('mileage_rate_per_km')
    .eq('org_id', job.org_id)
    .order('effective_from', { ascending: false })
    .limit(1)
    .single()

  const mileageRatePerKm = rateRow?.mileage_rate_per_km ?? undefined

  // ── 5. Shape claims → ClaimForExport ─────────────────────────────────────
  const shaped: ClaimForExport[] = claims.map((c) => {
    const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
    const items   = (Array.isArray(c.claim_items) ? c.claim_items : [c.claim_items]).filter(Boolean)

    return {
      id:           c.id,
      title:        c.title,
      status:       c.status,
      period_start: c.period_start,
      period_end:   c.period_end,
      submitted_at: c.submitted_at,
      total_amount: c.total_amount,
      currency:     c.currency,
      user_name:    profile?.display_name ?? null,
      user_email:   profile?.email ?? null,
      items: items.map((item: Record<string, unknown>) => {
        const tngTx = Array.isArray(item.tng_transactions)
          ? item.tng_transactions[0]
          : item.tng_transactions
        const trip = Array.isArray(item.trips) ? item.trips[0] : item.trips

        return {
          id:                  item.id,
          type:                item.type,
          amount:              item.amount,
          currency:            item.currency,
          claim_date:          item.claim_date,
          merchant:            item.merchant,
          notes:               item.notes,
          receipt_url:         item.receipt_url,
          paid_via_tng:        item.paid_via_tng,
          tng_transaction_id:  item.tng_transaction_id,
          tng_trans_no:        tngTx?.trans_no ?? null,
          perdiem_days:        item.perdiem_days,
          perdiem_rate_myr:    item.perdiem_rate_myr,
          perdiem_destination: item.perdiem_destination,
          meal_session:        item.meal_session,
          lodging_check_in:    item.lodging_check_in,
          lodging_check_out:   item.lodging_check_out,
          trip: trip ? {
            id:               trip.id,
            origin_text:      trip.origin_text,
            destination_text: trip.destination_text,
            final_distance_m: trip.final_distance_m,
            distance_source:  trip.distance_source,
            transport_type:   trip.transport_type,
            odometer_mode:    trip.odometer_mode,
          } as TripForExport : null,
        } as ItemForExport
      }),
    }
  })

  // ── 6. Build file using correct export-builder API ────────────────────────
  try {
    const format = job.format as 'CSV' | 'XLSX'

    const { buffer, contentType, extension } = await buildExport(shaped, format, {
      mileageRatePerKm,
    })

    const dateStamp = new Date(job.created_at).toISOString().slice(0, 10).replace(/-/g, '')
    const filename  = `myexpensio_claims_${dateStamp}.${extension}`

    // NextResponse requires a BodyInit — Buffer is not directly accepted.
    // Wrapping in Uint8Array satisfies the type and preserves the bytes.
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':        contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length':      String(buffer.length),
        'Cache-Control':       'no-store',
        'X-Row-Count':         String(shaped.reduce((n, c) => n + Math.max(c.items.length, 1), 0)),
      },
    })
  } catch (buildError) {
    console.error('[/api/exports/[id]/download] build error:', buildError)
    return err('BUILD_ERROR', 'Failed to generate export file.', 500)
  }
}
