// apps/user/app/api/reports/tax-personal/route.ts
//
// GET /api/reports/tax-personal?year=2026
//
// Returns a breakdown of tax-deductible personal expenses
// grouped by tax_category, for a given calendar year.
//
// Used by: /personal/tax page — the LHDN filing reference summary.
//
// Access: any authenticated user (their own PERSONAL space only).
// No Premium gate — personal tax summary is a baseline feature.

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// Display labels for each LHDN relief category
const TAX_CATEGORY_LABELS: Record<string, string> = {
  LIFESTYLE:            'Lifestyle Relief',
  MEDICAL:              'Medical (Self / Spouse / Child)',
  EDUCATION:            'Education (Self)',
  LIFE_INSURANCE_EPF:   'Life Insurance / EPF',
  BOOKS:                'Books & Learning Materials',
  DISABILITY_EQUIPMENT: 'Equipment for Disability',
  OTHER:                'Other Deductible',
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const { searchParams } = new URL(req.url)
  const year = Number(searchParams.get('year') ?? new Date().getFullYear())

  if (isNaN(year) || year < 2020 || year > 2100) {
    return err('VALIDATION_ERROR', 'year must be a valid calendar year.', 400)
  }

  // Find user's PERSONAL space
  const { data: space } = await supabase
    .from('spaces')
    .select('id')
    .eq('user_id', user.id)
    .eq('type', 'PERSONAL')
    .maybeSingle()

  if (!space) {
    // Space doesn't exist yet — return empty (first-time user)
    return NextResponse.json({
      year,
      categories:  [],
      grand_total: 0,
      entry_count: 0,
      disclaimer:  "This summary is for reference only. Final tax submission is subject to LHDN rules and your tax agent's review.",
    })
  }

  // Fetch all tax-deductible EXPENSE entries for the year
  const { data: entries, error } = await supabase
    .from('ledger_entries')
    .select('id, amount, category, tax_category, description, entry_date')
    .eq('space_id', space.id)
    .eq('user_id', user.id)
    .eq('entry_type', 'EXPENSE')
    .eq('is_tax_deductible', true)
    .gte('entry_date', `${year}-01-01`)
    .lte('entry_date', `${year}-12-31`)
    .order('entry_date', { ascending: false })

  if (error) {
    console.error('[GET /api/reports/tax-personal]', error.message)
    return err('SERVER_ERROR', 'Failed to load tax summary.', 500)
  }

  // Group by tax_category
  const grouped: Record<string, { label: string; total: number; count: number }> = {}

  for (const entry of entries ?? []) {
    const key   = entry.tax_category?.toUpperCase() || 'OTHER'
    const label = TAX_CATEGORY_LABELS[key] ?? 'Other Deductible'
    if (!grouped[key]) grouped[key] = { label, total: 0, count: 0 }
    grouped[key].total += Number(entry.amount)
    grouped[key].count += 1
  }

  const categories = Object.entries(grouped).map(([key, val]) => ({
    key,
    label: val.label,
    total: Number(val.total.toFixed(2)),
    count: val.count,
  })).sort((a, b) => b.total - a.total)

  const grand_total = categories.reduce((s, c) => s + c.total, 0)

  return NextResponse.json({
    year,
    categories,
    grand_total:   Number(grand_total.toFixed(2)),
    entry_count:   (entries ?? []).length,
    disclaimer:    "This summary is for reference only. Final tax submission is subject to LHDN rules and your tax agent's review.",
  })
}
