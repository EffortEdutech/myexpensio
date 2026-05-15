// apps/user/app/api/spaces/[spaceId]/summary/route.ts
//
// GET /api/spaces/:spaceId/summary?month=5&year=2026
//   → monthly totals (income, expense, net, entry_count)
//
// GET /api/spaces/:spaceId/summary?year=2026
//   → full-year totals including:
//       tax_deductible_total  — sum of EXPENSE entries where is_tax_deductible = true
//       bills_paid_total      — sum of commitment_payments.paid_amount for PAID/PARTIAL in year
//
// Defaults to the current month if neither month nor year is provided.
//
// Used by: Personal dashboard (yearly stats), Business dashboard (monthly).

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ spaceId: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const { spaceId } = await params
  if (!spaceId) return err('VALIDATION_ERROR', 'spaceId required.', 400)

  // Confirm user owns this space
  const { data: space } = await supabase
    .from('spaces')
    .select('id, type, name')
    .eq('id', spaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!space) return err('NOT_FOUND', 'Space not found.', 404)

  const now          = new Date()
  const { searchParams } = new URL(req.url)
  const yearParam    = searchParams.get('year')
  const monthParam   = searchParams.get('month')
  const yearlyMode   = yearParam && !monthParam   // year supplied, no month → full-year summary

  const year  = Number(yearParam  ?? now.getFullYear())
  const month = monthParam ? Math.min(12, Math.max(1, Number(monthParam))) : now.getMonth() + 1

  // ── Date range ──────────────────────────────────────────────────────────────
  let from: string
  let to:   string

  if (yearlyMode) {
    from = `${year}-01-01`
    to   = `${year}-12-31`
  } else {
    from = `${year}-${String(month).padStart(2, '0')}-01`
    to   = new Date(year, month, 0).toISOString().slice(0, 10)
  }

  // ── Ledger entries ──────────────────────────────────────────────────────────
  const { data: entries, error } = await supabase
    .from('ledger_entries')
    .select('entry_type, amount, is_tax_deductible')
    .eq('space_id', spaceId)
    .eq('user_id', user.id)
    .gte('entry_date', from)
    .lte('entry_date', to)

  if (error) {
    console.error('[GET /api/spaces/summary]', error.message)
    return err('SERVER_ERROR', 'Failed to load summary.', 500)
  }

  const rows    = entries ?? []
  const income  = rows.filter(e => e.entry_type === 'INCOME').reduce((s, e) => s + Number(e.amount), 0)
  const expense = rows.filter(e => e.entry_type === 'EXPENSE').reduce((s, e) => s + Number(e.amount), 0)
  const taxTotal = rows
    .filter(e => e.entry_type === 'EXPENSE' && e.is_tax_deductible)
    .reduce((s, e) => s + Number(e.amount), 0)

  // ── Bills paid total (yearly mode only) ─────────────────────────────────────
  let billsPaidTotal = 0

  if (yearlyMode) {
    // Get all commitment IDs for this user's space
    const { data: commitments } = await supabase
      .from('commitments')
      .select('id')
      .eq('space_id', spaceId)
      .eq('user_id', user.id)

    if (commitments && commitments.length > 0) {
      const ids = commitments.map(c => c.id)
      const { data: payments } = await supabase
        .from('commitment_payments')
        .select('paid_amount')
        .in('commitment_id', ids)
        .eq('year', year)
        .in('status', ['PAID', 'PARTIAL'])

      billsPaidTotal = (payments ?? []).reduce((s, p) => s + Number(p.paid_amount ?? 0), 0)
    }
  }

  // ── Response ────────────────────────────────────────────────────────────────
  const base = {
    space_id:   spaceId,
    space_type: space.type,
    year,
    income:     Number(income.toFixed(2)),
    expense:    Number(expense.toFixed(2)),
    net:        Number((income - expense).toFixed(2)),
    entry_count: rows.length,
  }

  if (yearlyMode) {
    return NextResponse.json({
      ...base,
      tax_deductible_total: Number(taxTotal.toFixed(2)),
      bills_paid_total:     Number(billsPaidTotal.toFixed(2)),
    })
  }

  return NextResponse.json({ ...base, month })
}
