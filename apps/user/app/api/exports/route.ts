// apps/user/app/api/exports/route.ts
//
// POST /api/exports
//
// Synchronous export — builds the file inline and streams it back.
// The export job row is recorded for history (re-download via /api/exports/[id]/download).
//
// Accepts optional template_id to use admin-defined column sets.
// Falls back to STANDARD preset columns if no template provided.
//
// Request body:
//   {
//     claim_ids:           string[]
//     format:              'CSV' | 'XLSX' | 'PDF'
//     template_id?:        string
//     pdf_layout?:         'BY_DATE' | 'BY_CATEGORY'
//     signature_data_url?: string
//   }
//
// Response:
//   200  — file buffer with Content-Disposition: attachment
//   4xx  — { error: { code, message } }
//   5xx  — { error: { code, message } }
//
// FIXES (14 Mar 2026):
//   FIX 1: formatOverride?.columns narrowed with explicit undefined guard before access
//           (was: `formatOverride?.columns?.length > 0` then `formatOverride.columns` —
//            TypeScript correctly rejects this as formatOverride is possibly undefined)
//   FIX 2: NextResponse body now uses `new Uint8Array(buffer)` instead of raw Buffer
//           (Buffer is not assignable to BodyInit in strict TypeScript)

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildExport } from '@/lib/export-builder'
import {
  PRESET_COLUMNS,
  resolveColumns,
  type ExportColumnKey,
} from '@/lib/export-columns'
import type { ClaimForExport, ItemForExport, TripForExport } from '@/lib/export-builder'

export const runtime = 'nodejs'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // ── Auth ──────────────────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHORIZED', 'Not authenticated', 401)

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE')
    .limit(1)
    .single()

  if (!membership) return err('NOT_MEMBER', 'No active org membership', 403)

  // ── Parse body ────────────────────────────────────────────────────────────
  const body = await request.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required', 400)

  const {
    claim_ids,
    format,
    template_id,
    pdf_layout,
    signature_data_url: _signature_data_url,  // reserved for PDF phase
  } = body

  if (!claim_ids?.length) return err('VALIDATION_ERROR', 'claim_ids is required', 400)
  if (!['CSV', 'XLSX', 'PDF'].includes(format)) {
    return err('VALIDATION_ERROR', 'format must be CSV | XLSX | PDF', 400)
  }

  // ── Resolve export columns from template ──────────────────────────────────
  let columns: ExportColumnKey[] = PRESET_COLUMNS.STANDARD

  if (template_id) {
    const { data: templateRow } = await supabase
      .from('report_templates')
      .select('schema, export_formats ( format_type, columns )')
      .eq('id', template_id)
      .eq('org_id', membership.org_id)
      .eq('is_active', true)
      .single()

    if (templateRow) {
      // Try format-specific column override first
      const exportFormats = Array.isArray(templateRow.export_formats)
        ? templateRow.export_formats
        : [templateRow.export_formats]

      const formatOverride = (exportFormats as Array<{ format_type: string; columns?: unknown } | null>)
        .find((f) => f?.format_type === format)

      // FIX 1: explicitly check formatOverride is defined before accessing .columns
      const overrideCols = formatOverride?.columns
      if (Array.isArray(overrideCols) && overrideCols.length > 0) {
        columns = overrideCols as ExportColumnKey[]
      } else {
        // Fall back to template schema columns
        columns = resolveColumns(templateRow.schema as Parameters<typeof resolveColumns>[0])
      }
    }
    // If template not found — silently fall back to STANDARD (backward compat)
  }

  // ── Fetch claims (SUBMITTED only, org-scoped, user's own) ─────────────────
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
    .in('id', claim_ids)
    .eq('org_id', membership.org_id)
    .eq('user_id', user.id)
    .eq('status', 'SUBMITTED')

  if (claimsError) {
    console.error('[/api/exports] claims fetch error:', claimsError)
    return err('DB_ERROR', 'Failed to fetch claims', 500)
  }

  if (!claims?.length) {
    return err('VALIDATION_ERROR', 'No submitted claims found for the given IDs', 400)
  }

  // ── Get mileage rate (latest rate version) ────────────────────────────────
  const { data: rateRow } = await supabase
    .from('rate_versions')
    .select('mileage_rate_per_km')
    .eq('org_id', membership.org_id)
    .order('effective_from', { ascending: false })
    .limit(1)
    .single()

  const mileageRatePerKm = rateRow?.mileage_rate_per_km ?? undefined

  // ── Shape claims → ClaimForExport ─────────────────────────────────────────
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

  // ── Record export job ─────────────────────────────────────────────────────
  const rowCount = shaped.reduce((n, c) => n + Math.max(c.items.length, 1), 0)

  const { data: jobRow } = await supabase
    .from('export_jobs')
    .insert({
      org_id:      membership.org_id,
      user_id:     user.id,
      filters:     { claim_ids },
      format,
      status:      'RUNNING',
      template_id: template_id ?? null,
      pdf_layout:  pdf_layout  ?? null,
      row_count:   rowCount,
    })
    .select('id')
    .single()

  // ── Build and stream file ─────────────────────────────────────────────────
  try {
    if (format === 'PDF') {
      // PDF generation is handled by pdf-builder (separate path).
      // Phase C will route PDF exports through pdf-builder with column support.
      if (jobRow?.id) {
        await supabase
          .from('export_jobs')
          .update({ status: 'FAILED', error_message: 'PDF not yet available via this route', completed_at: new Date().toISOString() })
          .eq('id', jobRow.id)
      }
      return err('NOT_IMPLEMENTED', 'PDF export coming in Phase C — use CSV or XLSX for now', 501)
    }

    const { buffer, contentType, extension } = await buildExport(shaped, format as 'CSV' | 'XLSX', {
      columns,
      mileageRatePerKm,
    })

    const filename = `myexpensio-export-${new Date().toISOString().slice(0, 10)}.${extension}`

    // Mark job done
    if (jobRow?.id) {
      await supabase
        .from('export_jobs')
        .update({ status: 'DONE', completed_at: new Date().toISOString() })
        .eq('id', jobRow.id)
    }

    // FIX 2: Buffer is not assignable to BodyInit — wrap in Uint8Array
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':        contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length':      String(buffer.length),
        'Cache-Control':       'no-store',
        'X-Row-Count':         String(rowCount),
      },
    })
  } catch (buildError) {
    console.error('[/api/exports] build error:', buildError)

    if (jobRow?.id) {
      await supabase
        .from('export_jobs')
        .update({
          status:        'FAILED',
          error_message: buildError instanceof Error ? buildError.message : 'Unknown error',
          completed_at:  new Date().toISOString(),
        })
        .eq('id', jobRow.id)
    }

    return err('BUILD_ERROR', 'Failed to generate export file', 500)
  }
}
