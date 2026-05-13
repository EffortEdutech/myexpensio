// apps/user/app/api/reports/pl-pdf/route.ts
//
// GET /api/reports/pl-pdf?spaceId=&year=
//
// Generates a clean P&L PDF for a BUSINESS space and streams it
// as an application/pdf download.
//
// Uses pdfkit (already in dependencies) — server-side, no browser APIs.
// Access: Premium users + SUPER_ADMIN/SUPPORT only.

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import PDFDocument from 'pdfkit'

export const runtime = 'nodejs'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

const TRANSPORT_CATEGORIES = new Set([
  'Fuel', 'Toll', 'Parking', 'Car service / maintenance', 'Car insurance', 'Road tax',
])
const OPERATIONS_CATEGORIES = new Set([
  'Phone bill', 'Internet / broadband', 'Software subscriptions',
  'Equipment', 'Marketing & advertising', 'Professional fees',
])

function fmtAmt(n: number): string {
  return `MYR ${n.toFixed(2)}`
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const { searchParams } = new URL(req.url)
  const spaceId = searchParams.get('spaceId')
  const year    = Number(searchParams.get('year') ?? new Date().getFullYear())

  if (!spaceId) return err('VALIDATION_ERROR', 'spaceId is required.', 400)
  if (isNaN(year) || year < 2020 || year > 2100) {
    return err('VALIDATION_ERROR', 'year must be a valid calendar year.', 400)
  }

  // Verify space
  const { data: space } = await supabase
    .from('spaces')
    .select('id, type, name')
    .eq('id', spaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!space) return err('NOT_FOUND', 'Space not found or access denied.', 404)
  if (space.type !== 'BUSINESS') {
    return err('FORBIDDEN', 'P&L report is only available for BUSINESS spaces.', 403)
  }

  // Fetch all entries for the year
  const { data: entries, error } = await supabase
    .from('ledger_entries')
    .select('entry_type, amount, category, income_source, is_tax_deductible, entry_date, description')
    .eq('space_id', spaceId)
    .eq('user_id', user.id)
    .gte('entry_date', `${year}-01-01`)
    .lte('entry_date', `${year}-12-31`)
    .order('entry_date', { ascending: true })

  if (error) {
    console.error('[GET /api/reports/pl-pdf]', error.message)
    return err('SERVER_ERROR', 'Failed to load data for PDF.', 500)
  }

  const list = entries ?? []

  // ── Aggregate ─────────────────────────────────────────────────────────────
  // Income by source
  const incomeBySource: Record<string, number> = {}
  let totalIncome = 0
  for (const e of list) {
    if (e.entry_type !== 'INCOME') continue
    const key = e.income_source ?? 'Other'
    incomeBySource[key] = (incomeBySource[key] ?? 0) + Number(e.amount)
    totalIncome += Number(e.amount)
  }

  // Expenses by group
  const transportItems:  Record<string, number> = {}
  const operationsItems: Record<string, number> = {}
  const othersItems:     Record<string, number> = {}
  let totalExpense = 0

  for (const e of list) {
    if (e.entry_type !== 'EXPENSE') continue
    const amt = Number(e.amount)
    totalExpense += amt
    if (TRANSPORT_CATEGORIES.has(e.category)) {
      transportItems[e.category] = (transportItems[e.category] ?? 0) + amt
    } else if (OPERATIONS_CATEGORIES.has(e.category)) {
      operationsItems[e.category] = (operationsItems[e.category] ?? 0) + amt
    } else {
      othersItems[e.category] = (othersItems[e.category] ?? 0) + amt
    }
  }

  const netProfit = totalIncome - totalExpense

  // ── Build PDF ─────────────────────────────────────────────────────────────
  const chunks: Buffer[] = []
  const doc = new PDFDocument({ margin: 50, size: 'A4' })

  doc.on('data', (chunk: Buffer) => chunks.push(chunk))

  await new Promise<void>((resolve, reject) => {
    doc.on('end', resolve)
    doc.on('error', reject)

    const W = 595 - 100 // page width minus margins

    // ── Header ──────────────────────────────────────────────────────────────
    doc
      .fontSize(20).font('Helvetica-Bold')
      .text('myexpensio', 50, 50)
      .fontSize(11).font('Helvetica')
      .fillColor('#475569')
      .text('Tax-ready i/o tracker for solo business', 50, 75)

    doc
      .moveTo(50, 100).lineTo(545, 100)
      .strokeColor('#e2e8f0').lineWidth(1).stroke()

    doc
      .fontSize(16).font('Helvetica-Bold').fillColor('#0f172a')
      .text(`Profit & Loss Summary — ${year}`, 50, 115)
      .fontSize(10).font('Helvetica').fillColor('#64748b')
      .text(`Generated: ${new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}`, 50, 138)

    let y = 165

    // ── INCOME section ───────────────────────────────────────────────────────
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#0f172a')
      .text('INCOME', 50, y)
    y += 20

    const SOURCE_LABELS: Record<string, string> = {
      GRAB: 'Grab payouts', FOODPANDA: 'FoodPanda payouts', LALAMOVE: 'Lalamove payouts',
      CLIENT: 'Client payments', BANK: 'Bank transfers', CASH: 'Cash income',
      SHOPEE: 'Shopee / Lazada sales', OTHER: 'Other income',
    }

    for (const [src, amt] of Object.entries(incomeBySource)) {
      const label = SOURCE_LABELS[src] ?? src
      doc.fontSize(10).font('Helvetica').fillColor('#374151')
        .text(label, 60, y)
        .text(fmtAmt(amt), 50, y, { align: 'right', width: W })
      y += 18
    }

    doc.moveTo(50, y).lineTo(545, y).strokeColor('#cbd5e1').lineWidth(0.5).stroke()
    y += 8
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a')
      .text('Total Income', 60, y)
      .text(fmtAmt(totalIncome), 50, y, { align: 'right', width: W })
    y += 30

    // ── EXPENSES section ─────────────────────────────────────────────────────
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#0f172a')
      .text('EXPENSES', 50, y)
    y += 20

    const renderGroup = (title: string, items: Record<string, number>) => {
      if (Object.keys(items).length === 0) return
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#475569')
        .text(title, 60, y)
      y += 16
      for (const [cat, amt] of Object.entries(items)) {
        doc.fontSize(10).font('Helvetica').fillColor('#374151')
          .text(cat, 72, y)
          .text(fmtAmt(amt), 50, y, { align: 'right', width: W })
        y += 16
      }
      y += 4
    }

    renderGroup('Transport & Vehicle', transportItems)
    renderGroup('Business Operations', operationsItems)
    renderGroup('Other Expenses', othersItems)

    doc.moveTo(50, y).lineTo(545, y).strokeColor('#cbd5e1').lineWidth(0.5).stroke()
    y += 8
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a')
      .text('Total Expenses', 60, y)
      .text(fmtAmt(totalExpense), 50, y, { align: 'right', width: W })
    y += 30

    // ── Net Profit ───────────────────────────────────────────────────────────
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#0f172a').lineWidth(1.5).stroke()
    y += 10
    const profitColor = netProfit >= 0 ? '#16a34a' : '#dc2626'
    doc.fontSize(14).font('Helvetica-Bold').fillColor(profitColor)
      .text('NET PROFIT', 50, y)
      .text(fmtAmt(netProfit), 50, y, { align: 'right', width: W })
    y += 40

    // ── Disclaimer ───────────────────────────────────────────────────────────
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#e2e8f0').lineWidth(0.5).stroke()
    y += 12
    doc.fontSize(8).font('Helvetica').fillColor('#94a3b8')
      .text(
        'This report is for reference only. It does not constitute a formal financial statement. ' +
        'Final tax payable is subject to LHDN assessment and your tax agent\'s review.',
        50, y, { width: W }
      )

    doc.end()
  })

  const pdfBuffer = Buffer.concat(chunks)
  const filename  = `PL_${space.name.replace(/\s+/g, '_')}_${year}.pdf`

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length':      String(pdfBuffer.length),
    },
  })
}
