// apps/user/app/api/exports/history/route.ts
//
// GET /api/exports/history
//
// Returns the current user's export job history (most recent 50).
// This is a dedicated GET endpoint so that the existing POST /api/exports
// route (which generates and streams the file) is not conflated with history reads.
//
// The ExportsPage calls this on mount and after every successful generation
// to refresh the history list.
//
// Response shape:
// {
//   items: ExportJobRow[]
// }
//
// ExportJobRow:
// {
//   id:               string
//   format:           'CSV' | 'XLSX' | 'PDF'
//   status:           'PENDING' | 'RUNNING' | 'DONE' | 'FAILED'
//   row_count:        number | null
//   filter_date_from: string | null   — from filters jsonb
//   filter_date_to:   string | null   — from filters jsonb
//   filter_status:    string          — from filters jsonb
//   created_at:       string
// }

import { NextResponse }  from 'next/server'
import { createClient }  from '@/lib/supabase/server'
import { getActiveOrg }  from '@/lib/org'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const { data, error } = await supabase
    .from('export_jobs')
    .select('id, format, status, row_count, filters, created_at, completed_at')
    .eq('org_id', org.org_id)
    .eq('user_id', user.id)          // users see only their own exports
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[/api/exports/history] DB error:', error)
    return err('DB_ERROR', 'Failed to fetch export history.', 500)
  }

  // Flatten the filters jsonb into top-level fields that the ExportsPage expects
  const items = (data ?? []).map((row) => {
    const f = (row.filters ?? {}) as {
      date_from?:     string
      date_to?:       string
      filter_status?: string
    }
    return {
      id:               row.id,
      format:           row.format,
      status:           row.status,
      row_count:        row.row_count,
      filter_date_from: f.date_from     ?? null,
      filter_date_to:   f.date_to       ?? null,
      filter_status:    f.filter_status ?? 'ALL',
      created_at:       row.created_at,
      completed_at:     row.completed_at,
    }
  })

  return NextResponse.json({ items })
}
