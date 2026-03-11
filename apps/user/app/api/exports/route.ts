// apps/user/app/api/exports/route.ts
// POST /api/exports  — generate + stream file directly
// GET  /api/exports  — list export history

import { createClient }    from '@/lib/supabase/server'
import { getActiveOrg }    from '@/lib/org'
import {
  buildExportRows,
  generateCSV,
  generateXLSX,
} from '@/lib/export-builder'
import {
  buildPdfData,
  generatePDF,
} from '@/lib/pdf-builder'
import { type NextRequest, NextResponse } from 'next/server'

function errJson(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// ── GET — list history ────────────────────────────────────────────────────────

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return errJson('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return errJson('NO_ORG', 'No organisation found.', 400)

  const { data, error } = await supabase
    .from('export_jobs')
    .select('id, format, status, filters, created_at, completed_at')
    .eq('org_id', org.org_id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('[GET /api/exports]', error.message)
    return NextResponse.json({ items: [] })
  }

  const items = (data ?? []).map((j: {
    id: string; format: string; status: string;
    filters: { date_from?: string; date_to?: string; filter_status?: string; row_count?: number } | null;
    created_at: string; completed_at: string | null;
  }) => ({
    id:               j.id,
    format:           j.format,
    status:           j.status,
    row_count:        j.filters?.row_count    ?? null,
    filter_date_from: j.filters?.date_from    ?? null,
    filter_date_to:   j.filters?.date_to      ?? null,
    filter_status:    j.filters?.filter_status ?? 'ALL',
    created_at:       j.created_at,
  }))

  return NextResponse.json({ items })
}

// ── POST — generate + stream file directly ────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return errJson('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return errJson('NO_ORG', 'No organisation found.', 400)

  const body = await request.json().catch(() => ({})) as {
    format?:             string
    claim_ids?:          string[]
    date_from?:          string
    date_to?:            string
    filter_status?:      string
    signature_data_url?: string
    // ── PDF layout option ──────────────────────────────────────────────────
    // BY_DATE     : all items sorted chronologically per claim (default)
    // BY_CATEGORY : each item type gets its own page section
    pdf_layout?:         'BY_DATE' | 'BY_CATEGORY'
  }

  const format = (body.format ?? 'XLSX').toUpperCase()
  if (!['CSV', 'XLSX', 'PDF'].includes(format)) {
    return errJson('VALIDATION_ERROR', 'format must be CSV, XLSX, or PDF.', 400)
  }

  const filterStatus = body.filter_status ?? 'ALL'
  const dateStamp    = new Date().toISOString().slice(0, 10).replace(/-/g, '')

  // ── Flat rows (used by all formats for job metadata) ──────────────────────
  const { rows, error: rowErr } = await buildExportRows(supabase, {
    org_id:        org.org_id,
    claim_ids:     body.claim_ids ?? undefined,
    date_from:     body.date_from ?? undefined,
    date_to:       body.date_to   ?? undefined,
    filter_status: filterStatus as 'SUBMITTED' | 'DRAFT' | 'ALL',
  })

  if (rowErr) return errJson('SERVER_ERROR', rowErr, 500)
  if (rows.length === 0) return errJson('NOT_FOUND', 'No claim items found for the selected claims.', 404)

  // ── Log export job (best-effort, non-blocking) ────────────────────────────
  let jobId: string | null = null
  try {
    const { data: job } = await supabase
      .from('export_jobs')
      .insert({
        org_id:    org.org_id,
        user_id:   user.id,
        format,
        status:    'DONE',
        filters: {
          date_from:     body.date_from   ?? null,
          date_to:       body.date_to     ?? null,
          filter_status: filterStatus,
          row_count:     rows.length,
          pdf_layout:    format === 'PDF' ? (body.pdf_layout ?? 'BY_DATE') : undefined,
        },
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    jobId = job?.id ?? null
  } catch (e) {
    console.error('[POST /api/exports] insert job:', e)
  }

  // ── CSV ───────────────────────────────────────────────────────────────────
  if (format === 'CSV') {
    const csv = generateCSV(rows)
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="myexpensio_claims_${dateStamp}.csv"`,
        'Cache-Control':       'no-store',
        'X-Row-Count':         String(rows.length),
        'X-Job-Id':            jobId ?? '',
      },
    })
  }

  // ── PDF ───────────────────────────────────────────────────────────────────
  if (format === 'PDF') {
    try {
      const pdfLayout = body.pdf_layout ?? 'BY_DATE'

      const { data: pdfData, error: pdfErr } = await buildPdfData(
        supabase,
        {
          org_id:        org.org_id,
          claim_ids:     body.claim_ids ?? undefined,
          date_from:     body.date_from ?? undefined,
          date_to:       body.date_to   ?? undefined,
          filter_status: filterStatus as 'SUBMITTED' | 'DRAFT' | 'ALL',
        },
        user.id,
        pdfLayout,    // ← new param
      )

      if (pdfErr || !pdfData) {
        console.error('[POST /api/exports] PDF build error:', pdfErr)
        return errJson('SERVER_ERROR', pdfErr ?? 'Failed to build PDF data.', 500)
      }

      const pdfBuf = await generatePDF(supabase, pdfData, body.signature_data_url ?? null)

      return new NextResponse(new Uint8Array(pdfBuf), {
        status: 200,
        headers: {
          'Content-Type':        'application/pdf',
          'Content-Disposition': `attachment; filename="myexpensio_claim_${dateStamp}.pdf"`,
          'Cache-Control':       'no-store',
          'X-Row-Count':         String(rows.length),
          'X-Job-Id':            jobId ?? '',
        },
      })
    } catch (pdfEx: unknown) {
      const msg = pdfEx instanceof Error ? pdfEx.message : String(pdfEx)
      console.error('[POST /api/exports] PDF threw:', msg)
      return errJson('SERVER_ERROR', `PDF generation failed: ${msg}`, 500)
    }
  }

  // ── XLSX ──────────────────────────────────────────────────────────────────
  const buf = await generateXLSX(rows)
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="myexpensio_claims_${dateStamp}.xlsx"`,
      'Cache-Control':       'no-store',
      'X-Row-Count':         String(rows.length),
      'X-Job-Id':            jobId ?? '',
    },
  })
}
