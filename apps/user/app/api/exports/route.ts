// apps/user/app/api/exports/route.ts
//
// POST /api/exports — synchronous export, streams file immediately.
//
// Uses stored line-item values only. No current rate lookup.
//
// PATCH (09 Apr 2026):
//   - Restore manual PDF grouping choice from user export screen.
//   - Template still provides the default PDF layout.
//   - User-chosen pdf_layout now overrides template grouping only.

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildExport } from '@/lib/export-builder'
import { buildPdfData, generatePDF } from '@/lib/pdf-builder'
import { PRESET_COLUMNS, resolveColumns, type ExportColumnKey } from '@/lib/export-columns'
import type { ClaimForExport, ItemForExport, TripForExport } from '@/lib/export-builder'

export const runtime = 'nodejs'

type PdfGrouping = 'BY_DATE' | 'BY_CATEGORY'

type PdfLayoutConfig = {
  orientation: 'portrait' | 'landscape'
  grouping: PdfGrouping
  show_summary_table: boolean
  show_receipt_appendix: boolean
  show_tng_appendix: boolean
  show_declaration: boolean
  accent_color: string
}

const DEFAULT_PDF_LAYOUT: PdfLayoutConfig = {
  orientation: 'portrait',
  grouping: 'BY_DATE',
  show_summary_table: true,
  show_receipt_appendix: true,
  show_tng_appendix: true,
  show_declaration: true,
  accent_color: '#0f172a',
}

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

function normalizePdfGrouping(value: unknown): PdfGrouping | null {
  return value === 'BY_CATEGORY' || value === 'BY_DATE' ? value : null
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
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

  const body = await request.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required', 400)

  const { claim_ids, format, template_id, pdf_layout, signature_data_url } = body
  if (!claim_ids?.length) return err('VALIDATION_ERROR', 'claim_ids is required', 400)
  if (!['CSV', 'XLSX', 'PDF'].includes(format)) return err('VALIDATION_ERROR', 'format must be CSV | XLSX | PDF', 400)

  let columns: ExportColumnKey[] = PRESET_COLUMNS.STANDARD
  let templatePdfLayout: Partial<PdfLayoutConfig> = {}

  if (template_id) {
    const { data: templateRow } = await supabase
      .from('report_templates')
      .select('schema, export_formats ( format_type, columns ), is_active')
      .eq('id', template_id)
      .eq('is_active', true)
      .maybeSingle()

    if (templateRow) {
      const exportFormats = Array.isArray(templateRow.export_formats)
        ? templateRow.export_formats
        : [templateRow.export_formats]
      const formatOverride = (exportFormats as Array<{ format_type: string; columns?: unknown } | null>)
        .find((row) => row?.format_type === format)

      if (Array.isArray(formatOverride?.columns) && formatOverride.columns.length > 0) {
        columns = formatOverride.columns as ExportColumnKey[]
      } else {
        columns = resolveColumns(templateRow.schema as Parameters<typeof resolveColumns>[0])
      }

      const schemaPdfLayout = (templateRow.schema as Record<string, unknown>)?.pdf_layout
      if (schemaPdfLayout && typeof schemaPdfLayout === 'object') {
        templatePdfLayout = schemaPdfLayout as Partial<PdfLayoutConfig>
      }
    }
  }

  const { data: claims, error: claimsError } = await supabase
    .from('claims')
    .select(`
      id, title, status, period_start, period_end,
      submitted_at, total_amount, currency,
      rate_version_id, user_rate_version_id,
      profiles ( display_name, email ),
      claim_items (
        id, type, amount, currency, claim_date,
        merchant, notes, receipt_url,
        rate,
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
    .in('id', claim_ids)
    .eq('org_id', membership.org_id)
    .eq('user_id', user.id)

  if (claimsError) {
    console.error('[/api/exports] claims fetch error:', claimsError)
    return err('DB_ERROR', 'Failed to fetch claims', 500)
  }
  if (!claims?.length) return err('VALIDATION_ERROR', 'No claims found for the given IDs', 400)

  const shaped: ClaimForExport[] = claims.map((claim) => {
    const profile = Array.isArray(claim.profiles) ? claim.profiles[0] : claim.profiles
    const items = (Array.isArray(claim.claim_items) ? claim.claim_items : [claim.claim_items]).filter(Boolean)

    return {
      id: claim.id,
      title: claim.title,
      status: claim.status,
      period_start: claim.period_start,
      period_end: claim.period_end,
      submitted_at: claim.submitted_at,
      total_amount: claim.total_amount,
      currency: claim.currency,
      user_name: profile?.display_name ?? null,
      user_email: profile?.email ?? null,
      items: items.map((item: Record<string, unknown>) => {
        const tngTx = Array.isArray(item.tng_transactions) ? item.tng_transactions[0] : item.tng_transactions
        const trip = Array.isArray(item.trips) ? item.trips[0] : item.trips
        return {
          id: item.id,
          type: item.type,
          amount: item.amount,
          currency: item.currency,
          claim_date: item.claim_date,
          merchant: item.merchant,
          notes: item.notes,
          receipt_url: item.receipt_url,
          rate: item.rate,
          paid_via_tng: item.paid_via_tng,
          tng_transaction_id: item.tng_transaction_id,
          tng_trans_no: (tngTx as Record<string, unknown> | null)?.trans_no as string ?? null,
          perdiem_days: item.perdiem_days,
          perdiem_rate_myr: item.perdiem_rate_myr,
          perdiem_destination: item.perdiem_destination,
          meal_session: item.meal_session,
          lodging_check_in: item.lodging_check_in,
          lodging_check_out: item.lodging_check_out,
          trip: trip ? {
            id: (trip as Record<string, unknown>).id,
            origin_text: (trip as Record<string, unknown>).origin_text,
            destination_text: (trip as Record<string, unknown>).destination_text,
            final_distance_m: (trip as Record<string, unknown>).final_distance_m,
            distance_source: (trip as Record<string, unknown>).distance_source,
            transport_type: (trip as Record<string, unknown>).transport_type,
            odometer_mode: (trip as Record<string, unknown>).odometer_mode,
          } as TripForExport : null,
        } as ItemForExport
      }),
    }
  })

  const rowCount = shaped.reduce((sum, claim) => sum + Math.max(claim.items.length, 1), 0)
  const manualGrouping = normalizePdfGrouping(pdf_layout)
  const resolvedLayout: PdfLayoutConfig = {
    ...DEFAULT_PDF_LAYOUT,
    ...templatePdfLayout,
    ...(manualGrouping ? { grouping: manualGrouping } : {}),
  }

  const { data: jobRow } = await supabase
    .from('export_jobs')
    .insert({
      org_id: membership.org_id,
      user_id: user.id,
      filters: { claim_ids },
      format,
      status: 'RUNNING',
      template_id: template_id ?? null,
      pdf_layout: resolvedLayout.grouping,
      row_count: rowCount,
    })
    .select('id')
    .single()

  try {
    if (format === 'PDF') {
      const { data: pdfData, error: pdfErr } = await buildPdfData(
        supabase,
        { org_id: membership.org_id, claim_ids },
        user.id,
        resolvedLayout,
      )

      if (pdfErr || !pdfData) {
        if (jobRow?.id) {
          await supabase.from('export_jobs').update({ status: 'FAILED', completed_at: new Date().toISOString() }).eq('id', jobRow.id)
        }
        return err('PDF_DATA_ERROR', pdfErr ?? 'No data found', 500)
      }

      const pdfBuffer = await generatePDF(supabase, pdfData, signature_data_url ?? null)
      if (jobRow?.id) {
        await supabase.from('export_jobs').update({ status: 'DONE', completed_at: new Date().toISOString() }).eq('id', jobRow.id)
      }

      const filename = `myexpensio-claim-${new Date().toISOString().slice(0, 10)}.pdf`
      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': String(pdfBuffer.length),
          'Cache-Control': 'no-store',
          'X-Row-Count': String(rowCount),
        },
      })
    }

    const { buffer, contentType, extension } = await buildExport(shaped, format as 'CSV' | 'XLSX', { columns })
    if (jobRow?.id) {
      await supabase.from('export_jobs').update({ status: 'DONE', completed_at: new Date().toISOString() }).eq('id', jobRow.id)
    }

    const filename = `myexpensio-export-${new Date().toISOString().slice(0, 10)}.${extension}`
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-store',
        'X-Row-Count': String(rowCount),
      },
    })
  } catch (buildError) {
    console.error('[/api/exports] build error:', buildError)
    if (jobRow?.id) {
      await supabase
        .from('export_jobs')
        .update({ status: 'FAILED', error_message: buildError instanceof Error ? buildError.message : 'Unknown', completed_at: new Date().toISOString() })
        .eq('id', jobRow.id)
    }
    return err('BUILD_ERROR', 'Failed to generate export file', 500)
  }
}
