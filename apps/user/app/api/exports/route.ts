import { type NextRequest, NextResponse } from 'next/server'
import { createClientForRequest } from '@/lib/supabase/api-client'
import { buildExport } from '@/lib/export-builder'
import { buildPdfData, generatePDF, DEFAULT_PDF_LAYOUT } from '@/lib/pdf-builder'
import type { PdfData, PdfClaim, PdfItem, PdfLayoutConfig } from '@/lib/pdf-builder'
import { PDFDocument as PdfLibDocument } from 'pdf-lib'
import { highlightTransNos } from '@/lib/tng-highlighter'
import { PRESET_COLUMNS, resolveColumns, type ExportColumnKey } from '@/lib/export-columns'
import type { ClaimForExport, ItemForExport, TripForExport } from '@/lib/export-builder'
import {
  incrementUsageCounter,
  limitForCounter,
  loadTierAndEntitlements,
  periodKeyForCurrentMonth,
  readUsageCounters,
} from '@/lib/usage-limits'

export const runtime = 'nodejs'

// ── Mobile TNG highlight + merge ─────────────────────────────────────────────

type MobileTngStatement = {
  statementLabel: string
  pdfBase64: string
  items: Array<{ transNo: string; amountCents: number }>
}

/**
 * Highlight claimed rows in each mobile TNG statement PDF (via Render.com scan
 * service) then append pages to the main report PDF using pdf-lib.
 * Mirrors V1's mergeTngStatements() but accepts inline base64 bytes instead of
 * downloading from Supabase Storage.
 * Safe: any error on a single statement is skipped, export never fails.
 */
async function mergeMobileTngStatements(mainBuf: Buffer, statements: MobileTngStatement[]): Promise<Buffer> {
  const mainPdf = await PdfLibDocument.load(mainBuf)

  for (const stmt of statements) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let stmtBuf: any = Buffer.from(stmt.pdfBase64, 'base64')

      // Highlight claimed rows via scan service (same as V1)
      if (stmt.items.length > 0) {
        const highlightItems = stmt.items.map((i) => ({
          trans_no: i.transNo,
          amount:   (i.amountCents / 100).toFixed(2),
        }))
        stmtBuf = await highlightTransNos(stmtBuf, highlightItems)
      }

      // Merge pages into main PDF
      const stmtPdf = await PdfLibDocument.load(stmtBuf)
      const pages   = await mainPdf.copyPages(stmtPdf, stmtPdf.getPageIndices())
      for (const page of pages) mainPdf.addPage(page)

      console.log(`[exports/mobile] merged TNG statement: ${stmt.statementLabel} (${pages.length} pages)`)
    } catch (e) {
      console.warn(`[exports/mobile] TNG merge failed for ${stmt.statementLabel}:`, e)
    }
  }

  return Buffer.from(await mainPdf.save())
}

// ── Mobile payload → PdfData mapper ──────────────────────────────────────────

type MobileExportPreviewClaim = {
  id: string; title: string | null; periodStart: string | null; periodEnd: string | null
  totalAmountCents: number; status: string
}
type MobileExportPreviewRow = {
  claimId: string; claimTitle: string; itemId: string; itemType: string; title: string
  amountCents: number; currency: string; itemDate: string; notes: string | null
  paidViaTng: boolean; receiptPresent: boolean; tngTransNo: string | null
}
type MobilePayload = { claims: MobileExportPreviewClaim[]; rows: MobileExportPreviewRow[]; generatedAt: string }

function buildPdfDataFromMobilePayload(
  payload: MobilePayload,
  profile: { display_name?: string | null; email?: string | null; department?: string | null; location?: string | null; company_name?: string | null } | null,
  orgName: string,
  layoutOverride?: Partial<PdfLayoutConfig>,
): PdfData {
  const rowsByClaimId = new Map<string, MobileExportPreviewRow[]>()
  for (const row of payload.rows) {
    const arr = rowsByClaimId.get(row.claimId) ?? []
    arr.push(row)
    rowsByClaimId.set(row.claimId, arr)
  }

  const claims: PdfClaim[] = payload.claims.map((claim) => {
    const items = rowsByClaimId.get(claim.id) ?? []
    return {
      id: claim.id,
      title: claim.title || mobilePeriodLabel(claim.periodStart, claim.periodEnd),
      period: mobilePeriodLabel(claim.periodStart, claim.periodEnd),
      status: claim.status?.toUpperCase() ?? 'DRAFT',
      submitted_at: '',
      total_myr: claim.totalAmountCents / 100,
      items: items.map((row): PdfItem => ({
        id: row.itemId,
        type: row.itemType?.toUpperCase() ?? 'MISC',
        claim_title: claim.title ?? '',
        date: row.itemDate ? new Date(row.itemDate).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
        date_iso: row.itemDate ?? '',
        description: row.title || row.itemType,
        qty: '—',
        rate: '—',
        amount_myr: row.amountCents / 100,
        receipt_path: null,
        tng_trans_no: row.tngTransNo ?? null,
      })),
    }
  })

  return {
    org_name: orgName,
    claimer_name: profile?.display_name ?? 'Claimant',
    claimer_email: profile?.email ?? '',
    claimer_department: profile?.department ?? '',
    claimer_location: profile?.location ?? '',
    claimer_company_name: profile?.company_name ?? '',
    generated_at: new Date(payload.generatedAt).toLocaleString('en-MY', {
      timeZone: 'Asia/Kuala_Lumpur', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }),
    layout: { ...DEFAULT_PDF_LAYOUT, ...layoutOverride },
    claims,
    tng_statements: [],
  }
}

/**
 * Maps V2 mobile SQLite payload → ClaimForExport[] for buildExport (CSV/XLSX).
 * Fields not present in the mobile payload are set to safe nulls.
 */
function buildClaimsFromMobilePayload(
  payload: MobilePayload,
  profile: { display_name?: string | null; email?: string | null } | null,
): ClaimForExport[] {
  const rowsByClaimId = new Map<string, MobileExportPreviewRow[]>()
  for (const row of payload.rows) {
    const arr = rowsByClaimId.get(row.claimId) ?? []
    arr.push(row)
    rowsByClaimId.set(row.claimId, arr)
  }

  return payload.claims.map((claim) => {
    const rows = rowsByClaimId.get(claim.id) ?? []
    return {
      id: claim.id,
      title: claim.title || mobilePeriodLabel(claim.periodStart, claim.periodEnd),
      status: claim.status?.toUpperCase() ?? 'DRAFT',
      period_start: claim.periodStart ?? null,
      period_end: claim.periodEnd ?? null,
      submitted_at: null,
      total_amount: claim.totalAmountCents / 100,
      currency: 'MYR',
      user_name: profile?.display_name ?? null,
      user_email: profile?.email ?? null,
      items: rows.map((row): ItemForExport => ({
        id: row.itemId,
        type: row.itemType?.toUpperCase() ?? 'MISC',
        amount: row.amountCents / 100,
        currency: row.currency ?? 'MYR',
        claim_date: row.itemDate ?? null,
        merchant: null,
        notes: row.notes ?? null,
        receipt_url: null,
        rate: null,
        paid_via_tng: row.paidViaTng ?? false,
        tng_transaction_id: null,
        tng_trans_no: row.tngTransNo ?? null,
        perdiem_days: null,
        perdiem_rate_myr: null,
        perdiem_destination: null,
        meal_session: null,
        lodging_check_in: null,
        lodging_check_out: null,
        trip: null,
      })),
    }
  })
}

function mobilePeriodLabel(start: string | null | undefined, end: string | null | undefined): string {
  if (!start) return 'Untitled'
  const s = new Date(start)
  if (!end) return s.toLocaleDateString('en-MY', { month: 'short', year: 'numeric' })
  const e = new Date(end)
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return s.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })
  }
  return `${s.toLocaleDateString('en-MY', { month: 'short' })} – ${e.toLocaleDateString('en-MY', { month: 'short', year: 'numeric' })}`
}


function err(code: string, message: string, status: number, details?: object) {
  return NextResponse.json({ error: { code, message, ...(details ? { details } : {}) } }, { status })
}

export async function POST(request: NextRequest) {
  const supabase = await createClientForRequest(request)
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

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = ['SUPER_ADMIN', 'SUPPORT'].includes(callerProfile?.role ?? '')
  const { entitlements } = await loadTierAndEntitlements(supabase, membership.org_id, isAdmin)
  const exportsLimit = limitForCounter(entitlements, 'exports_created')
  const periodKey = periodKeyForCurrentMonth()
  const counters = await readUsageCounters(supabase, membership.org_id, periodKey)
  const currentExportsUsed = counters.exports_created

  if (exportsLimit !== null && currentExportsUsed >= exportsLimit) {
    const periodEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10)

    return err(
      'LIMIT_REACHED',
      `You've reached your export generation limit${entitlements.limit_label ? ` (${entitlements.limit_label})` : ''}.`,
      429,
      {
        limit: exportsLimit,
        used: currentExportsUsed,
        period_end: periodEnd,
        label: entitlements.limit_label,
        preset: entitlements.limit_preset,
      },
    )
  }

  const body = await request.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required', 400)

  const { claim_ids, format, template_id, pdf_layout, signature_data_url, mobile_payload, mobile_tng_statements } = body
  if (!claim_ids?.length) return err('VALIDATION_ERROR', 'claim_ids is required', 400)
  if (!['CSV', 'XLSX', 'PDF'].includes(format)) return err('VALIDATION_ERROR', 'format must be CSV | XLSX | PDF', 400)

  // ── Mobile XLSX fast path ────────────────────────────────────────────────
  // Same mobile_payload approach as PDF — skips Supabase claims query.
  if (format === 'XLSX' && mobile_payload) {
    const { data: mobileProfile } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('id', user.id)
      .maybeSingle()

    const shaped: ClaimForExport[] = buildClaimsFromMobilePayload(
      mobile_payload,
      mobileProfile,
    )

    const { buffer, contentType, extension } = await buildExport(shaped, 'XLSX', {
      columns: PRESET_COLUMNS.STANDARD,
    })

    const filename = `myexpensio-claim-${new Date().toISOString().slice(0, 10)}.${extension}`
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-store',
      },
    })
  }

  // ── Mobile PDF fast path ──────────────────────────────────────────────────
  // V2 mobile sends its local SQLite data as mobile_payload so we never need
  // to re-query Supabase for claims that may not be synced yet.
  if (format === 'PDF' && mobile_payload) {
    const [{ data: mobileProfile }, { data: mobileOrg }] = await Promise.all([
      supabase.from('profiles').select('display_name, email, department, location, company_name').eq('id', user.id).maybeSingle(),
      supabase.from('organizations').select('name').eq('id', membership.org_id).maybeSingle(),
    ])

    const mobileLayoutOverride: Partial<PdfLayoutConfig> = pdf_layout
      ? { grouping: pdf_layout as 'BY_DATE' | 'BY_CATEGORY' }
      : {}

    const pdfData = buildPdfDataFromMobilePayload(
      mobile_payload,
      mobileProfile,
      mobileOrg?.name ?? 'My Organisation',
      mobileLayoutOverride,
    )

    // Generate main report PDF (TNG statements empty — we merge separately below)
    let pdfBuffer = await generatePDF(supabase, pdfData, signature_data_url ?? null)

    // Highlight + merge mobile TNG statement PDFs if provided
    if (Array.isArray(mobile_tng_statements) && mobile_tng_statements.length > 0) {
      pdfBuffer = await mergeMobileTngStatements(pdfBuffer, mobile_tng_statements)
    }

    const filename = `myexpensio-claim-${new Date().toISOString().slice(0, 10)}.pdf`
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'no-store',
      },
    })
  }

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
      const exportFormats = Array.isArray(templateRow.export_formats) ? templateRow.export_formats : [templateRow.export_formats]
      const formatOverride = (exportFormats as Array<{ format_type: string; columns?: unknown } | null>).find((row) => row?.format_type === format)

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
  const resolvedLayout: PdfLayoutConfig = {
    ...DEFAULT_PDF_LAYOUT,
    ...(pdf_layout ? { grouping: pdf_layout as 'BY_DATE' | 'BY_CATEGORY' } : {}),
    ...templatePdfLayout,
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
      const { data: pdfData, error: pdfErr } = await buildPdfData(supabase, { org_id: membership.org_id, claim_ids }, user.id, resolvedLayout)

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

      try {
        await incrementUsageCounter(supabase, membership.org_id, 'exports_created', periodKey)
      } catch (e: unknown) {
        console.warn('[/api/exports] exports_created usage update failed after PDF generation:', e)
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

    try {
      await incrementUsageCounter(supabase, membership.org_id, 'exports_created', periodKey)
    } catch (e: unknown) {
      console.warn('[/api/exports] exports_created usage update failed after export generation:', e)
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
