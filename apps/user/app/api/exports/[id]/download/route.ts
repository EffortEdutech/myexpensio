// apps/user/app/api/exports/[id]/download/route.ts
//
// GET /api/exports/[id]/download — rebuilds and re-streams a past CSV/XLSX export.
//
// FIX (15 Mar): tng_transactions FK hint
// FIX (15 Mar): removed .eq('status','SUBMITTED') — DRAFT claims exportable

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveOrg } from '@/lib/org'
import {
  buildExport,
  type ClaimForExport,
  type ItemForExport,
  type TripForExport,
} from '@/lib/export-builder'

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

  const { data: job, error: jobErr } = await supabase
    .from('export_jobs')
    .select('id, org_id, user_id, format, filters, created_at')
    .eq('id', id)
    .eq('org_id', org.org_id)
    .eq('user_id', user.id)
    .single()

  if (jobErr || !job) return err('NOT_FOUND', 'Export job not found.', 404)

  if (job.format === 'PDF') {
    return err('NOT_SUPPORTED', 'PDF re-download is not available. Please regenerate.', 400)
  }

  const f        = (job.filters ?? {}) as { claim_ids?: string[] }
  const claimIds = f.claim_ids ?? []

  if (claimIds.length === 0) {
    return err('VALIDATION_ERROR', 'No claim IDs stored for this export job.', 400)
  }

  // FIX: no status filter — DRAFT and SUBMITTED both downloadable
  // FIX: tng_transactions FK hint
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
        tng_transactions!claim_items_tng_transaction_id_fkey ( trans_no ),
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

  if (claimsError) {
    console.error('[/api/exports/[id]/download] claims fetch error:', claimsError)
    return err('DB_ERROR', 'Failed to fetch claims for export.', 500)
  }

  if (!claims?.length) {
    return err('NOT_FOUND', 'No claims found for this export job.', 404)
  }

  const { data: rateRow } = await supabase
    .from('rate_versions')
    .select('mileage_rate_per_km')
    .eq('org_id', job.org_id)
    .order('effective_from', { ascending: false })
    .limit(1)
    .single()

  const mileageRatePerKm = rateRow?.mileage_rate_per_km ?? undefined

  const shaped: ClaimForExport[] = claims.map(c => {
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
      user_email:   profile?.email        ?? null,
      items: items.map((item: Record<string, unknown>) => {
        const tngTx = Array.isArray(item.tng_transactions)
          ? item.tng_transactions[0]
          : item.tng_transactions
        const trip  = Array.isArray(item.trips) ? item.trips[0] : item.trips

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
          tng_trans_no:        (tngTx as Record<string, unknown> | null)?.trans_no as string ?? null,
          perdiem_days:        item.perdiem_days,
          perdiem_rate_myr:    item.perdiem_rate_myr,
          perdiem_destination: item.perdiem_destination,
          meal_session:        item.meal_session,
          lodging_check_in:    item.lodging_check_in,
          lodging_check_out:   item.lodging_check_out,
          trip: trip ? {
            id:               (trip as Record<string, unknown>).id,
            origin_text:      (trip as Record<string, unknown>).origin_text,
            destination_text: (trip as Record<string, unknown>).destination_text,
            final_distance_m: (trip as Record<string, unknown>).final_distance_m,
            distance_source:  (trip as Record<string, unknown>).distance_source,
            transport_type:   (trip as Record<string, unknown>).transport_type,
            odometer_mode:    (trip as Record<string, unknown>).odometer_mode,
          } as TripForExport : null,
        } as ItemForExport
      }),
    }
  })

  try {
    const format = job.format as 'CSV' | 'XLSX'

    const { buffer, contentType, extension } = await buildExport(shaped, format, { mileageRatePerKm })

    const dateStamp = new Date(job.created_at).toISOString().slice(0, 10).replace(/-/g, '')
    const filename  = `myexpensio_claims_${dateStamp}.${extension}`

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
