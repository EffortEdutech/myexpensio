// apps/user/app/api/exports/route.ts
// POST /api/exports  — generate + stream file directly (no storage needed)
// GET  /api/exports  — list export history (graceful empty if table missing)

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

  // Normalise: flatten jsonb filters into flat fields for the UI
  const items = (data ?? []).map((j: {
    id: string; format: string; status: string;
    filters: { date_from?: string; date_to?: string; filter_status?: string; row_count?: number } | null;
    created_at: string; completed_at: string | null;
  }) => ({
    id:               j.id,
    format:           j.format,
    status:           j.status,
    row_count:        j.filters?.row_count   ?? null,
    filter_date_from: j.filters?.date_from   ?? null,
    filter_date_to:   j.filters?.date_to     ?? null,
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
    format?:              string
    claim_ids?:           string[]   // export specific claims by ID
    date_from?:           string
    date_to?:             string
    filter_status?:       string
    signature_data_url?:  string     // base64 PNG from SignaturePad (PDF only)
  }

  // ── Validate ──────────────────────────────────────────────────────────────
  const format = (body.format ?? 'XLSX').toUpperCase()
  if (!['CSV', 'XLSX', 'PDF'].includes(format))
    return errJson('VALIDATION_ERROR', 'format must be CSV, XLSX, or PDF.', 400)

  const filterStatus = (body.filter_status ?? 'ALL').toUpperCase()
  if (!['SUBMITTED', 'DRAFT', 'ALL'].includes(filterStatus))
    return errJson('VALIDATION_ERROR', 'filter_status must be SUBMITTED, DRAFT, or ALL.', 400)

  const claim_ids = Array.isArray(body.claim_ids) && body.claim_ids.length > 0
    ? body.claim_ids
    : null

  const date_from = body.date_from ?? null
  const date_to   = body.date_to   ?? null

  if (!claim_ids && date_from && date_to && date_from > date_to)
    return errJson('VALIDATION_ERROR', 'date_from must be before date_to.', 400)

  // ── Build rows ────────────────────────────────────────────────────────────
  const { rows, error: buildErr } = await buildExportRows(supabase, {
    org_id:        org.org_id,
    claim_ids:     claim_ids ?? undefined,
    date_from:     date_from ?? undefined,
    date_to:       date_to   ?? undefined,
    filter_status: filterStatus as 'SUBMITTED' | 'DRAFT' | 'ALL',
  })

  if (buildErr)
    return errJson('SERVER_ERROR', buildErr, 500)

  if (rows.length === 0) {
    return errJson('NOT_FOUND', 'No claim items found for the selected period and status.', 404)
  }

  // ── Record job — matches actual DB schema (filters as jsonb) ────────────
  const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  let jobId: string | null = null
  try {
    const { data: job, error: jobErr } = await supabase
      .from('export_jobs')
      .insert({
        org_id:       org.org_id,
        user_id:      user.id,
        format,
        status:       'DONE',
        completed_at: new Date().toISOString(),
        filters: {
          date_from:     date_from,
          date_to:       date_to,
          filter_status: filterStatus,
          row_count:     rows.length,
        },
      })
      .select('id')
      .single()
    if (jobErr) console.error('[POST /api/exports] insert error:', jobErr.message)
    else jobId = job?.id ?? null
  } catch (e) {
    console.error('[POST /api/exports] insert exception:', e)
  }

  // ── Generate + stream file directly ──────────────────────────────────────
  const ext      = format === 'CSV' ? 'csv' : 'xlsx'
  const filename = `myexpensio_claims_${dateStamp}.${ext}`

  if (format === 'CSV') {
    const csv = generateCSV(rows)
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control':       'no-store',
        'X-Row-Count':         String(rows.length),
        'X-Job-Id':            jobId ?? '',
      },
    })
  }

  // PDF
  if (format === 'PDF') {
    try {
      const { data: pdfData, error: pdfErr } = await buildPdfData(supabase, {
        org_id:        org.org_id,
        claim_ids:     claim_ids ?? undefined,
        date_from:     date_from ?? undefined,
        date_to:       date_to   ?? undefined,
        filter_status: filterStatus as 'SUBMITTED' | 'DRAFT' | 'ALL',
      }, user.id)

      if (pdfErr || !pdfData) {
        console.error('[POST /api/exports] PDF data build error:', pdfErr)
        return errJson('SERVER_ERROR', pdfErr ?? 'Failed to build PDF data.', 500)
      }

      const pdfBuf = await generatePDF(supabase, pdfData, body.signature_data_url ?? null)
      const pdfFilename = `myexpensio_claim_${dateStamp}.pdf`

      return new NextResponse(pdfBuf, {
        status: 200,
        headers: {
          'Content-Type':        'application/pdf',
          'Content-Disposition': `attachment; filename="${pdfFilename}"`,
          'Cache-Control':       'no-store',
          'X-Row-Count':         String(rows.length),
          'X-Job-Id':            jobId ?? '',
        },
      })
    } catch (pdfEx: unknown) {
      const msg = pdfEx instanceof Error ? pdfEx.message : String(pdfEx)
      console.error('[POST /api/exports] PDF generation threw:', msg)
      // Common causes:
      //   - pdfkit not installed: run `npm install pdfkit` in apps/user
      //   - missing serverExternalPackages: ['pdfkit'] in next.config.ts
      return errJson('SERVER_ERROR', `PDF generation failed: ${msg}`, 500)
    }
  }

  // XLSX
  const buf = await generateXLSX(rows)
  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control':       'no-store',
      'X-Row-Count':         String(rows.length),
      'X-Job-Id':            jobId ?? '',
    },
  })
}
