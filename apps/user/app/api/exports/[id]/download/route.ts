// apps/user/app/api/exports/[id]/download/route.ts
// GET /api/exports/[id]/download
//
// Streams the export file directly from server — no storage bucket required.
// Re-generates the file using the filters stored in the job record.
// Content-Disposition: attachment triggers browser download.

import { createClient }    from '@/lib/supabase/server'
import { getActiveOrg }    from '@/lib/org'
import { buildExportRows, generateCSV, generateXLSX } from '@/lib/export-builder'
import { type NextRequest, NextResponse } from 'next/server'

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

  // ── Load job record ───────────────────────────────────────────────────────
  const { data: job, error: jobErr } = await supabase
    .from('export_jobs')
    .select('id, org_id, format, filters, created_at')
    .eq('id', id)
    .eq('org_id', org.org_id)   // RLS + org scope double-check
    .single()

  if (jobErr || !job) return err('NOT_FOUND', 'Export job not found.', 404)

  // ── Re-fetch data using stored filters (jsonb) ────────────────────────────
  const f = (job.filters ?? {}) as { date_from?: string; date_to?: string; filter_status?: string }
  const { rows, error: buildErr } = await buildExportRows(supabase, {
    org_id:        job.org_id,
    date_from:     f.date_from     ?? undefined,
    date_to:       f.date_to       ?? undefined,
    filter_status: (f.filter_status ?? 'ALL') as 'SUBMITTED' | 'DRAFT' | 'ALL',
  })

  if (buildErr) return err('SERVER_ERROR', buildErr, 500)

  // ── Generate filename ─────────────────────────────────────────────────────
  const dateStamp = new Date(job.created_at).toISOString().slice(0, 10).replace(/-/g, '')
  const ext       = job.format === 'CSV' ? 'csv' : 'xlsx'
  const filename  = `myexpensio_claims_${dateStamp}.${ext}`

  // ── Generate and stream file ──────────────────────────────────────────────
  if (job.format === 'CSV') {
    const csv = generateCSV(rows)
    return new NextResponse(csv, {
      status:  200,
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control':       'no-store',
      },
    })
  }

  // XLSX — wrap Buffer in Uint8Array for BodyInit compatibility
  const buf = await generateXLSX(rows)
  return new NextResponse(new Uint8Array(buf), {
    status:  200,
    headers: {
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control':       'no-store',
    },
  })
}
