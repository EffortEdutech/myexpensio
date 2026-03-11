// apps/user/lib/pdf-builder.ts
//
// Generates a professional A4 "ready-to-submit" expense claim PDF.
//
// ── INSTALL (run once in apps/user) ──────────────────────────────────────────
//   npm install pdf-lib
//   npm install pdfkit            (if not already installed)
//   npm install --save-dev @types/pdfkit
//
// next.config.ts — ensure:
//   serverExternalPackages: ['pdfkit']
//   (pdf-lib is pure JS, does NOT need to be in serverExternalPackages)
//
// ── TWO LAYOUT MODES (pdf_layout in PdfData) ─────────────────────────────────
//
//   BY_DATE (default)
//     Page 1   : Header · Claimant info · Summary table
//     Page 2+  : Item detail per claim — items sorted by date ascending
//     Last     : Declaration + signature
//     Appendix A: Receipt pages (one per page)
//     Appendix B: TNG Statement pages (pdf-lib merge, if any)
//
//   BY_CATEGORY
//     Page 1   : Header · Claimant info · Summary table
//     Page 2+  : One section per expense type (each starts on new page)
//                Items from all claims merged, sorted by date.
//                Column 2 = Claim name (not Type).
//     Last     : Declaration + signature
//     Appendix A: Receipt pages
//     Appendix B: TNG Statement pages
//
// ── TNG EVIDENCE IN PDF ───────────────────────────────────────────────────────
//   - TOLL/PARKING items linked to a TNG transaction show [TNG #trans_no]
//     in their description, e.g.: "AYER KEROH → BANDAR SERENIA  [TNG #62313]"
//   - Appendix B embeds the original TNG statement PDFs (saved at import time
//     to bucket: tng-statements). Pages are merged using pdf-lib after pdfkit
//     generates the main document.

import PDFDocument from 'pdfkit'
import { PDFDocument as PdfLibDocument } from 'pdf-lib'
import type { SupabaseClient } from '@supabase/supabase-js'
import { buildExportRows, type ExportFilters, type ExportRow } from './export-builder'

// ── A4 layout ─────────────────────────────────────────────────────────────────
const A4_W = 595.28
const A4_H = 841.89
const ML   = 50
const MT   = 50
const MB   = 60
const CW   = A4_W - ML - ML   // 495.28

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
  dark:   '#0f172a',
  mid:    '#334155',
  muted:  '#64748b',
  border: '#cbd5e1',
  light:  '#f1f5f9',
  white:  '#ffffff',
  green:  '#15803d',
  amber:  '#b45309',
}

const BOLD    = 'Helvetica-Bold'
const REGULAR = 'Helvetica'
const OBLIQUE = 'Helvetica-Oblique'

// ── Table column definitions ──────────────────────────────────────────────────
// All widths must sum exactly to CW (495.28 ≈ 495)

// BY_DATE detail: 60+58+172+55+60+90 = 495 ✓
const ITEM_COLS_DATE = [
  { key: 'date',   header: 'Date',         w: 60,  align: 'left'   },
  { key: 'type',   header: 'Type',         w: 58,  align: 'left'   },
  { key: 'desc',   header: 'Description',  w: 172, align: 'left'   },
  { key: 'qty',    header: 'Qty / KM',     w: 55,  align: 'right'  },
  { key: 'rate',   header: 'Rate (MYR)',   w: 60,  align: 'right'  },
  { key: 'amount', header: 'Amount (MYR)', w: 90,  align: 'right'  },
]

// BY_CATEGORY detail — Type column removed, Claim column added: 60+130+155+60+90 = 495 ✓
const ITEM_COLS_CATEGORY = [
  { key: 'date',   header: 'Date',         w: 60,  align: 'left'   },
  { key: 'claim',  header: 'Claim',        w: 130, align: 'left'   },
  { key: 'desc',   header: 'Description',  w: 155, align: 'left'   },
  { key: 'qty',    header: 'Qty / KM',     w: 60,  align: 'right'  },
  { key: 'amount', header: 'Amount (MYR)', w: 90,  align: 'right'  },
]

// Summary table: 185+110+80+40+80 = 495 ✓
const SUMM_COLS = [
  { key: 'title',  header: 'Claim / Period', w: 185, align: 'left'   },
  { key: 'period', header: 'Period',         w: 110, align: 'left'   },
  { key: 'status', header: 'Status',         w: 80,  align: 'center' },
  { key: 'items',  header: 'Items',          w: 40,  align: 'center' },
  { key: 'total',  header: 'Total (MYR)',    w: 80,  align: 'right'  },
]

const ROW_H = 19

// ── Category config (BY_CATEGORY layout) ─────────────────────────────────────

type CategoryConfig = {
  type:     string
  label:    string
  headerBg: string
  headerFg: string
}

const CATEGORY_ORDER: CategoryConfig[] = [
  { type: 'MILEAGE', label: 'Mileage',  headerBg: '#1e40af', headerFg: '#fff' },
  { type: 'MEAL',    label: 'Meal',     headerBg: '#92400e', headerFg: '#fff' },
  { type: 'LODGING', label: 'Lodging',  headerBg: '#5b21b6', headerFg: '#fff' },
  { type: 'TOLL',    label: 'Toll',     headerBg: '#0369a1', headerFg: '#fff' },
  { type: 'PARKING', label: 'Parking',  headerBg: '#a16207', headerFg: '#fff' },
  { type: 'TAXI',    label: 'Taxi',     headerBg: '#713f12', headerFg: '#fff' },
  { type: 'GRAB',    label: 'Grab',     headerBg: '#166534', headerFg: '#fff' },
  { type: 'TRAIN',   label: 'Train',    headerBg: '#1e293b', headerFg: '#fff' },
  { type: 'FLIGHT',  label: 'Flight',   headerBg: '#0c4a6e', headerFg: '#fff' },
]

// ── Internal types ────────────────────────────────────────────────────────────

type ColDef = { key: string; header: string; w: number; align: string }

type PdfItem = {
  id:           string
  type:         string
  claim_title:  string        // denormalized — used as column in BY_CATEGORY
  date:         string        // display string
  date_iso:     string        // YYYY-MM-DD for sorting
  description:  string        // may include [TNG #xxxxx] suffix
  qty:          string
  rate:         string
  amount_myr:   number
  receipt_path: string | null
  tng_trans_no: string | null // from tng_transactions.trans_no (if linked)
}

type PdfClaim = {
  id:           string
  title:        string
  period:       string
  status:       string
  submitted_at: string
  total_myr:    number
  items:        PdfItem[]
}

// TNG statement metadata for Appendix B
type TngStatement = {
  path:     string        // storage path within bucket tng-statements
  trans_nos: string[]     // trans_nos from this statement that appear in this export
}

export type PdfData = {
  org_name:       string
  claimer_name:   string
  claimer_email:  string
  generated_at:   string
  pdf_layout:     'BY_DATE' | 'BY_CATEGORY'
  claims:         PdfClaim[]
  tng_statements: TngStatement[]   // empty array if no TNG data
}

// ── Build PDF data ────────────────────────────────────────────────────────────

export async function buildPdfData(
  supabase:  SupabaseClient,
  filters:   ExportFilters,
  userId:    string,
  pdfLayout: 'BY_DATE' | 'BY_CATEGORY' = 'BY_DATE',
): Promise<{ data: PdfData | null; error: string | null }> {

  // 1. Flat rows from export-builder
  const { rows, error } = await buildExportRows(supabase, filters)
  if (error)             return { data: null, error }
  if (rows.length === 0) return { data: null, error: 'No claim items found for the selected claims.' }

  // 2. Receipt paths for items with receipts
  const itemsWithReceipt = rows.filter(r => r.receipt_present === 'Y').map(r => r.item_id)
  const receiptPaths: Record<string, string> = {}
  if (itemsWithReceipt.length > 0) {
    const { data: itemRows } = await supabase
      .from('claim_items').select('id, receipt_url').in('id', itemsWithReceipt)
    for (const row of itemRows ?? []) {
      if (row.receipt_url) receiptPaths[row.id] = row.receipt_url
    }
  }

  // 3. Profile + org
  const { data: profile }    = await supabase
    .from('profiles').select('display_name, email').eq('id', userId).single()
  const { data: membership } = await supabase
    .from('org_members').select('org_id, organizations(name)')
    .eq('user_id', userId).eq('status', 'ACTIVE').limit(1).single()
  const orgName = (membership?.organizations as { name?: string } | null)?.name ?? 'My Organisation'

  // 4. Build claim hierarchy (items sorted by date ascending)
  const claimMap = new Map<string, PdfClaim>()
  for (const row of rows) {
    if (!claimMap.has(row.claim_id)) {
      claimMap.set(row.claim_id, {
        id:           row.claim_id,
        title:        row.claim_title || buildPeriodLabel(row.period_start, row.period_end),
        period:       buildPeriodLabel(row.period_start, row.period_end),
        status:       row.claim_status,
        submitted_at: row.submitted_at,
        total_myr:    0,
        items:        [],
      })
    }
    const claim      = claimMap.get(row.claim_id)!
    const amount_myr = parseFloat(row.item_amount_myr) || 0
    claim.total_myr += amount_myr
    claim.items.push({
      id:           row.item_id,
      type:         row.item_type,
      claim_title:  claim.title,
      date:         row.item_date || '—',
      date_iso:     row.item_date || '',
      description:  buildItemDescription(row),
      qty:          row.item_qty      || '—',
      rate:         row.item_rate_myr || '—',
      amount_myr,
      receipt_path: receiptPaths[row.item_id] ?? null,
      tng_trans_no: null,   // populated below
    })
  }

  // Sort items by date within each claim
  for (const claim of claimMap.values()) {
    claim.items.sort((a, b) => a.date_iso.localeCompare(b.date_iso))
  }

  // 5. ── TNG enrichment ──────────────────────────────────────────────────────
  // For TOLL/PARKING items: fetch tng_transaction_id → trans_no + source_file_url
  // Appends [TNG #trans_no] to item description.
  // Collects unique statement paths for Appendix B.

  const allItems = Array.from(claimMap.values()).flatMap(c => c.items)
  const tollParkingItemIds = allItems
    .filter(i => i.type === 'TOLL' || i.type === 'PARKING')
    .map(i => i.id)

  const tngStatements: TngStatement[] = []

  if (tollParkingItemIds.length > 0) {
    // a) Get tng_transaction_id per claim_item
    const { data: linkRows } = await supabase
      .from('claim_items')
      .select('id, tng_transaction_id')
      .in('id', tollParkingItemIds)

    const itemToTngId: Record<string, string> = {}
    for (const r of linkRows ?? []) {
      if (r.tng_transaction_id) itemToTngId[r.id] = r.tng_transaction_id
    }

    const tngIds = Object.values(itemToTngId)
    if (tngIds.length > 0) {
      // b) Fetch trans_no + source_file_url from tng_transactions
      const { data: tngRows } = await supabase
        .from('tng_transactions')
        .select('id, trans_no, source_file_url')
        .in('id', tngIds)

      const tngMap: Record<string, { trans_no: string | null; source_file_url: string | null }> = {}
      for (const t of tngRows ?? []) tngMap[t.id] = t

      // c) Augment items + collect statement paths
      // Group trans_nos by source_file_url for the appendix cover
      const statementMap = new Map<string, string[]>()   // path → trans_nos[]

      for (const item of allItems) {
        const tngId = itemToTngId[item.id]
        if (!tngId) continue
        const tng = tngMap[tngId]
        if (!tng) continue

        item.tng_trans_no = tng.trans_no

        // Append [TNG #trans_no] to description
        if (tng.trans_no) {
          item.description = `${item.description}  [TNG #${tng.trans_no}]`
        }

        // Collect for appendix
        if (tng.source_file_url) {
          if (!statementMap.has(tng.source_file_url)) statementMap.set(tng.source_file_url, [])
          if (tng.trans_no) statementMap.get(tng.source_file_url)!.push(tng.trans_no)
        }
      }

      for (const [path, trans_nos] of statementMap.entries()) {
        tngStatements.push({ path, trans_nos })
      }
    }
  }

  return {
    data: {
      org_name:       orgName,
      claimer_name:   profile?.display_name ?? 'Claimant',
      claimer_email:  profile?.email        ?? '',
      generated_at:   new Date().toLocaleString('en-MY', {
        timeZone: 'Asia/Kuala_Lumpur',
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }),
      pdf_layout:     pdfLayout,
      claims:         Array.from(claimMap.values()),
      tng_statements: tngStatements,
    },
    error: null,
  }
}

// ── Main generator ────────────────────────────────────────────────────────────
// Step 1: pdfkit builds the main document (all pages + appendix A + appendix B cover)
// Step 2: pdf-lib merges original TNG statement PDF pages at the end (if any)

export async function generatePDF(
  supabase:         SupabaseClient,
  data:             PdfData,
  signatureDataUrl: string | null,
): Promise<Buffer> {

  // Step 1 — pdfkit
  const pdfkitBuf = await generatePdfKitBuffer(supabase, data, signatureDataUrl)

  // Step 2 — pdf-lib merge (only if TNG statements exist with valid paths)
  if (data.tng_statements.length > 0) {
    return mergeTngStatements(pdfkitBuf, data.tng_statements, supabase)
  }

  return pdfkitBuf
}

async function generatePdfKitBuffer(
  supabase:         SupabaseClient,
  data:             PdfData,
  signatureDataUrl: string | null,
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4', margins: { top: MT, bottom: MB, left: ML, right: ML },
    autoFirstPage: false,
    info: { Title: 'Expense Claim Form — myexpensio', Author: data.claimer_name, Creator: 'myexpensio' },
  })
  const chunks: Buffer[] = []
  doc.on('data', (chunk: Buffer) => chunks.push(chunk))
  await new Promise<void>((resolve, reject) => {
    doc.on('end',   resolve)
    doc.on('error', reject)
    buildDoc(doc, data, signatureDataUrl, supabase).then(() => doc.end()).catch(reject)
  })
  return Buffer.concat(chunks)
}

// ── Document orchestrator ─────────────────────────────────────────────────────

async function buildDoc(
  doc:              PDFKit.PDFDocument,
  data:             PdfData,
  signatureDataUrl: string | null,
  supabase:         SupabaseClient,
) {
  doc.addPage()
  let y = MT
  y = drawHeader(doc, y)
  y = drawClaimantInfo(doc, y, data)
  y = drawSummaryTable(doc, y, data.claims)

  if (data.pdf_layout === 'BY_CATEGORY') {
    y = drawItemsByCategory(doc, y, data.claims)
  } else {
    y = drawItemsByDate(doc, y, data.claims)
  }

  drawDeclaration(doc, y, data, signatureDataUrl)

  // Appendix A — receipts
  await drawReceiptAppendix(doc, data, supabase)

  // Appendix B — TNG statement cover page (actual PDF pages merged later by pdf-lib)
  if (data.tng_statements.length > 0) {
    drawTngAppendixCover(doc, data.tng_statements)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Header
// ─────────────────────────────────────────────────────────────────────────────

function drawHeader(doc: PDFKit.PDFDocument, y: number): number {
  const H = 44
  doc.rect(ML, y, CW, H).fill(C.dark)
  doc.font(BOLD).fontSize(16).fillColor(C.white)
  doc.text('myexpensio', ML + 14, y + 11, { lineBreak: false })
  doc.font(REGULAR).fontSize(8.5).fillColor('#94a3b8')
  doc.text('EXPENSE CLAIM FORM', ML, y + 7, { width: CW - 14, align: 'right', lineBreak: false })
  doc.font(REGULAR).fontSize(7.5).fillColor('#64748b')
  doc.text('Mileage & Claims Automation', ML, y + 24, { width: CW - 14, align: 'right', lineBreak: false })
  return y + H + 18
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Claimant info
// ─────────────────────────────────────────────────────────────────────────────

function drawClaimantInfo(doc: PDFKit.PDFDocument, y: number, data: PdfData): number {
  const H    = 74
  const HALF = ML + CW / 2
  doc.rect(ML, y, CW, H).lineWidth(0.5).stroke(C.border)

  doc.font(BOLD).fontSize(7).fillColor(C.muted)
  doc.text('CLAIMANT', ML + 12, y + 10, { lineBreak: false })
  doc.font(BOLD).fontSize(11).fillColor(C.dark)
  doc.text(data.claimer_name, ML + 12, y + 21, { lineBreak: false, width: CW / 2 - 24 })
  doc.font(REGULAR).fontSize(8.5).fillColor(C.muted)
  doc.text(data.claimer_email, ML + 12, y + 36, { lineBreak: false })
  doc.text(data.org_name,      ML + 12, y + 50, { lineBreak: false })

  doc.moveTo(HALF - 4, y + 8).lineTo(HALF - 4, y + H - 8).lineWidth(0.5).stroke(C.border)

  const grand = data.claims.reduce((s, c) => s + c.total_myr, 0)
  const fields: [string, string, boolean][] = [
    ['GENERATED',   data.generated_at,          false],
    ['CLAIMS',      String(data.claims.length),  false],
    ['GRAND TOTAL', 'MYR ' + grand.toFixed(2),   true ],
  ]
  let ry = y + 10
  for (const [label, value, bold] of fields) {
    doc.font(BOLD).fontSize(7).fillColor(C.muted)
    doc.text(label, HALF + 10, ry, { lineBreak: false })
    doc.font(bold ? BOLD : REGULAR).fontSize(bold ? 10 : 8.5).fillColor(C.dark)
    doc.text(value, HALF + 90, ry - (bold ? 1 : 0), { lineBreak: false })
    ry += 21
  }
  return y + H + 20
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Summary table
// ─────────────────────────────────────────────────────────────────────────────

function drawSummaryTable(doc: PDFKit.PDFDocument, y: number, claims: PdfClaim[]): number {
  doc.font(BOLD).fontSize(8.5).fillColor(C.dark)
  doc.text('CLAIMS INCLUDED IN THIS EXPORT', ML, y, { lineBreak: false })
  y += 13
  y = drawTblHeader(doc, y, SUMM_COLS)

  for (let i = 0; i < claims.length; i++) {
    if (y + ROW_H > A4_H - MB) { doc.addPage(); y = MT; y = drawTblHeader(doc, y, SUMM_COLS) }
    const c = claims[i]
    drawTblRow(doc, y, SUMM_COLS, [
      c.title, c.period, c.status, String(c.items.length), c.total_myr.toFixed(2),
    ], i % 2 === 0 ? C.white : C.light, { status: statusCol(c.status) })
    y += ROW_H
  }

  const grand = claims.reduce((s, c) => s + c.total_myr, 0)
  doc.rect(ML, y, CW, ROW_H + 2).fill('#dde3ea')
  doc.font(BOLD).fontSize(8.5).fillColor(C.dark)
  doc.text('GRAND TOTAL', ML + 8, y + 6, { lineBreak: false })
  const amtX = ML + SUMM_COLS.slice(0, -1).reduce((s, c) => s + c.w, 0)
  doc.text('MYR ' + grand.toFixed(2), amtX + 4, y + 6, {
    width: SUMM_COLS[SUMM_COLS.length - 1].w - 8, align: 'right', lineBreak: false,
  })
  return y + ROW_H + 2 + 24
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout A: BY_DATE
// Items grouped under their claim header, sorted by date ascending.
// ─────────────────────────────────────────────────────────────────────────────

function drawItemsByDate(doc: PDFKit.PDFDocument, y: number, claims: PdfClaim[]): number {
  if (y + 50 > A4_H - MB) { doc.addPage(); y = MT }

  doc.font(BOLD).fontSize(8.5).fillColor(C.dark)
  doc.text('CLAIM ITEMS DETAIL', ML, y, { lineBreak: false })
  y += 13

  for (const claim of claims) {
    if (y + 42 > A4_H - MB) { doc.addPage(); y = MT }

    doc.rect(ML, y, CW, 22).fill('#e2e8f0')
    doc.font(BOLD).fontSize(8.5).fillColor(C.dark)
    doc.text(claim.title, ML + 8, y + 7, { lineBreak: false, width: CW * 0.55 })
    const statusStr = claim.status === 'SUBMITTED'
      ? `Submitted: ${claim.submitted_at}`
      : 'DRAFT — not yet submitted'
    doc.font(REGULAR).fontSize(7.5).fillColor(statusCol(claim.status))
    doc.text(statusStr, ML + CW * 0.55, y + 8, { width: CW * 0.43, align: 'right', lineBreak: false })
    y += 22 + 4

    y = drawTblHeader(doc, y, ITEM_COLS_DATE)

    for (let i = 0; i < claim.items.length; i++) {
      if (y + ROW_H > A4_H - MB) { doc.addPage(); y = MT; y = drawTblHeader(doc, y, ITEM_COLS_DATE) }
      const item = claim.items[i]
      const desc = item.receipt_path ? `${item.description}  [R]` : item.description
      drawTblRow(doc, y, ITEM_COLS_DATE, [
        item.date, item.type, desc, item.qty, item.rate, item.amount_myr.toFixed(2),
      ], i % 2 === 0 ? C.white : C.light)
      y += ROW_H
    }

    // Subtotal
    doc.rect(ML, y, CW, 18).fill('#f1f5f9')
    doc.font(REGULAR).fontSize(7.5).fillColor(C.muted)
    doc.text(`Subtotal — ${claim.title}`, ML + 8, y + 5, { lineBreak: false })
    const subtX = ML + ITEM_COLS_DATE.slice(0, -1).reduce((s, c) => s + c.w, 0)
    doc.font(BOLD).fontSize(8.5).fillColor(C.dark)
    doc.text('MYR ' + claim.total_myr.toFixed(2), subtX + 4, y + 5, {
      width: ITEM_COLS_DATE[ITEM_COLS_DATE.length - 1].w - 8, align: 'right', lineBreak: false,
    })
    y += 18 + 20
  }
  return y
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout B: BY_CATEGORY
// One page section per expense type, items from all claims merged and
// sorted by date. Column 2 = Claim title (not Type).
// ─────────────────────────────────────────────────────────────────────────────

function drawItemsByCategory(doc: PDFKit.PDFDocument, y: number, claims: PdfClaim[]): number {
  const allItems = claims.flatMap(c => c.items)

  // Group by type
  const typeMap = new Map<string, PdfItem[]>()
  for (const item of allItems) {
    if (!typeMap.has(item.type)) typeMap.set(item.type, [])
    typeMap.get(item.type)!.push(item)
  }
  for (const items of typeMap.values()) {
    items.sort((a, b) => a.date_iso.localeCompare(b.date_iso))
  }

  let firstSection = true
  for (const cat of CATEGORY_ORDER) {
    const items = typeMap.get(cat.type)
    if (!items || items.length === 0) continue

    if (firstSection && y + 80 < A4_H - MB) {
      // use remaining space on this page
    } else {
      doc.addPage(); y = MT
    }
    firstSection = false

    const catTotal = items.reduce((s, i) => s + i.amount_myr, 0)

    // Category header bar
    doc.rect(ML, y, CW, 30).fill(cat.headerBg)
    doc.font(BOLD).fontSize(12).fillColor(cat.headerFg)
    doc.text(cat.label, ML + 12, y + 9, { lineBreak: false })
    doc.font(REGULAR).fontSize(8).fillColor(cat.headerFg)
    doc.text(
      `${items.length} item${items.length !== 1 ? 's' : ''}  ·  MYR ${catTotal.toFixed(2)}`,
      ML + 12, y + 22, { lineBreak: false },
    )
    doc.font(REGULAR).fontSize(7.5).fillColor(cat.headerFg)
    doc.text('BY CATEGORY', ML, y + 10, { width: CW - 14, align: 'right', lineBreak: false })
    y += 30 + 6

    y = drawTblHeader(doc, y, ITEM_COLS_CATEGORY)

    for (let i = 0; i < items.length; i++) {
      if (y + ROW_H > A4_H - MB) {
        doc.addPage(); y = MT
        doc.rect(ML, y, CW, 18).fill(cat.headerBg)
        doc.font(BOLD).fontSize(8.5).fillColor(cat.headerFg)
        doc.text(`${cat.label} (continued)`, ML + 8, y + 5, { lineBreak: false })
        y += 18 + 4
        y = drawTblHeader(doc, y, ITEM_COLS_CATEGORY)
      }
      const item = items[i]
      const desc = item.receipt_path ? `${item.description}  [R]` : item.description
      drawTblRow(doc, y, ITEM_COLS_CATEGORY, [
        item.date, item.claim_title, desc, item.qty, item.amount_myr.toFixed(2),
      ], i % 2 === 0 ? C.white : C.light)
      y += ROW_H
    }

    // Subtotal
    doc.rect(ML, y, CW, 18).fill('#f1f5f9')
    doc.font(REGULAR).fontSize(7.5).fillColor(C.muted)
    doc.text(`Subtotal — ${cat.label}`, ML + 8, y + 5, { lineBreak: false })
    const subtX = ML + ITEM_COLS_CATEGORY.slice(0, -1).reduce((s, c) => s + c.w, 0)
    doc.font(BOLD).fontSize(8.5).fillColor(C.dark)
    doc.text('MYR ' + catTotal.toFixed(2), subtX + 4, y + 5, {
      width: ITEM_COLS_CATEGORY[ITEM_COLS_CATEGORY.length - 1].w - 8, align: 'right', lineBreak: false,
    })
    y += 18 + 24
  }

  // Defensive: render any item types not in CATEGORY_ORDER
  const knownTypes = new Set(CATEGORY_ORDER.map(c => c.type))
  for (const [type, items] of typeMap.entries()) {
    if (knownTypes.has(type) || items.length === 0) continue
    doc.addPage(); y = MT
    doc.rect(ML, y, CW, 30).fill(C.dark)
    doc.font(BOLD).fontSize(12).fillColor(C.white)
    doc.text(type, ML + 12, y + 9, { lineBreak: false })
    y += 30 + 6
    y = drawTblHeader(doc, y, ITEM_COLS_CATEGORY)
    for (let i = 0; i < items.length; i++) {
      if (y + ROW_H > A4_H - MB) { doc.addPage(); y = MT; y = drawTblHeader(doc, y, ITEM_COLS_CATEGORY) }
      const item = items[i]
      drawTblRow(doc, y, ITEM_COLS_CATEGORY, [
        item.date, item.claim_title, item.description, item.qty, item.amount_myr.toFixed(2),
      ], i % 2 === 0 ? C.white : C.light)
      y += ROW_H
    }
  }

  return y
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Declaration + signature
// ─────────────────────────────────────────────────────────────────────────────

function drawDeclaration(
  doc:              PDFKit.PDFDocument,
  y:                number,
  data:             PdfData,
  signatureDataUrl: string | null,
): void {
  if (y + 200 > A4_H - MB) { doc.addPage(); y = MT }

  doc.moveTo(ML, y).lineTo(ML + CW, y).lineWidth(0.5).stroke(C.border)
  y += 14

  doc.font(BOLD).fontSize(8.5).fillColor(C.dark)
  doc.text('DECLARATION BY CLAIMANT', ML, y, { lineBreak: false })
  y += 14

  const declarationText =
    'I hereby certify that the expenses claimed in this document were incurred wholly, ' +
    'exclusively and necessarily in the course and performance of my official duties. ' +
    'All amounts stated are true and accurate to the best of my knowledge, and where ' +
    'receipts are attached they are genuine documents. I understand that submitting a ' +
    'false or inaccurate claim may result in disciplinary action.'

  doc.font(REGULAR).fontSize(8.5).fillColor(C.mid)
  doc.text(declarationText, ML, y, { width: CW, align: 'justify', lineBreak: true })
  y = doc.y + 20

  const SIG_W = 200
  const SIG_H = 80
  doc.rect(ML, y, SIG_W, SIG_H).lineWidth(0.5).stroke(C.border)
  doc.font(BOLD).fontSize(7).fillColor(C.muted)
  doc.text('SIGNATURE', ML + 8, y + 7, { lineBreak: false })

  if (signatureDataUrl) {
    try {
      const buf = Buffer.from(signatureDataUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64')
      doc.image(buf, ML + 8, y + 18, { fit: [SIG_W - 16, SIG_H - 26], width: SIG_W - 16, height: SIG_H - 26 })
    } catch { sigLine(doc, ML, y, SIG_W, SIG_H) }
  } else {
    sigLine(doc, ML, y, SIG_W, SIG_H)
  }

  const RX = ML + SIG_W + 20
  let iy = y + 8
  for (const [lbl, val] of [
    ['FULL NAME',    data.claimer_name],
    ['ORGANISATION', data.org_name],
    ['DATE',         data.generated_at],
  ] as [string, string][]) {
    doc.font(BOLD).fontSize(7).fillColor(C.muted)
    doc.text(lbl, RX, iy, { lineBreak: false })
    doc.font(REGULAR).fontSize(9).fillColor(C.dark)
    doc.text(val, RX, iy + 11, { width: CW - SIG_W - 20, lineBreak: false, ellipsis: true })
    iy += 28
  }

  const footY = y + SIG_H + 20
  const layoutLabel = data.pdf_layout === 'BY_CATEGORY' ? 'Layout: By Category' : 'Layout: By Date'
  doc.font(OBLIQUE).fontSize(7).fillColor(C.muted)
  doc.text(
    `Generated by myexpensio · ${data.generated_at} · ${layoutLabel} · System-generated, audit-ready.`,
    ML, footY, { width: CW, align: 'center', lineBreak: false },
  )
}

function sigLine(doc: PDFKit.PDFDocument, ml: number, y: number, sigW: number, sigH: number) {
  doc.moveTo(ml + 10, y + sigH - 14).lineTo(ml + sigW - 10, y + sigH - 14).lineWidth(0.5).stroke(C.border)
  doc.font(OBLIQUE).fontSize(8).fillColor(C.border)
  doc.text('Sign here', ml + sigW / 2 - 20, y + sigH - 28, { lineBreak: false })
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Receipt appendix (Appendix A)
// ─────────────────────────────────────────────────────────────────────────────

async function drawReceiptAppendix(
  doc:      PDFKit.PDFDocument,
  data:     PdfData,
  supabase: SupabaseClient,
): Promise<void> {
  const receiptItems: Array<{ label: string; path: string }> = []
  for (const claim of data.claims) {
    for (const item of claim.items) {
      if (item.receipt_path) {
        receiptItems.push({
          label: `${claim.title}  ·  ${item.date}  ·  ${item.type}  ·  ${item.description}`.slice(0, 90),
          path:  item.receipt_path,
        })
      }
    }
  }
  if (receiptItems.length === 0) return

  doc.addPage()
  let y = MT

  doc.rect(ML, y, CW, 44).fill(C.dark)
  doc.font(BOLD).fontSize(13).fillColor(C.white)
  doc.text('APPENDIX A — RECEIPTS', ML + 14, y + 12, { lineBreak: false })
  doc.font(REGULAR).fontSize(8.5).fillColor('#94a3b8')
  doc.text(`${receiptItems.length} receipt${receiptItems.length !== 1 ? 's' : ''} — original uploads`, ML + 14, y + 29, { lineBreak: false })
  y += 44 + 20

  doc.font(OBLIQUE).fontSize(8).fillColor(C.muted)
  doc.text('Each receipt is printed on a dedicated page in the order it appears in the claim.', ML, y, { width: CW, lineBreak: false })

  for (const receipt of receiptItems) {
    let imgBuf: Buffer | null = null
    try {
      const { data: fileData, error } = await supabase.storage.from('receipts').download(receipt.path)
      if (!error && fileData) imgBuf = Buffer.from(await fileData.arrayBuffer())
    } catch { /* silently skip */ }

    doc.addPage(); y = MT
    doc.rect(ML, y, CW, 28).fill(C.light)
    doc.font(BOLD).fontSize(7).fillColor(C.muted)
    doc.text('RECEIPT FOR', ML + 8, y + 6, { lineBreak: false })
    doc.font(REGULAR).fontSize(8.5).fillColor(C.dark)
    doc.text(receipt.label, ML + 8, y + 17, { width: CW - 16, lineBreak: false, ellipsis: true })
    y += 28 + 12

    if (imgBuf) {
      const maxH = A4_H - y - MB - 10
      try { doc.image(imgBuf, ML, y, { fit: [CW, maxH], align: 'center' }) }
      catch { renderMissingImg(doc, y) }
    } else {
      renderMissingImg(doc, y)
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: TNG Appendix B — cover page only (pdfkit)
// Actual statement pages are merged separately by pdf-lib in mergeTngStatements()
// ─────────────────────────────────────────────────────────────────────────────

function drawTngAppendixCover(
  doc:           PDFKit.PDFDocument,
  tngStatements: TngStatement[],
): void {
  doc.addPage()
  let y = MT

  // Cover header
  doc.rect(ML, y, CW, 44).fill('#0369a1')
  doc.font(BOLD).fontSize(13).fillColor(C.white)
  doc.text('APPENDIX B — TNG STATEMENTS', ML + 14, y + 12, { lineBreak: false })
  doc.font(REGULAR).fontSize(8.5).fillColor('#bae6fd')
  doc.text(
    `${tngStatements.length} original TNG statement PDF${tngStatements.length !== 1 ? 's' : ''} embedded on the following pages`,
    ML + 14, y + 29, { lineBreak: false },
  )
  y += 44 + 20

  doc.font(OBLIQUE).fontSize(8).fillColor(C.muted)
  doc.text(
    'These are the original TNG eWallet Customer Transactions Statements imported into myexpensio. ' +
    'Transaction reference numbers shown below correspond to the [TNG #xxxxx] markers in the claim items above.',
    ML, y, { width: CW, lineBreak: true },
  )
  y = doc.y + 20

  // List each statement with its tagged trans_nos
  for (let i = 0; i < tngStatements.length; i++) {
    if (y + 60 > A4_H - MB) { doc.addPage(); y = MT }

    const stmt = tngStatements[i]
    doc.rect(ML, y, CW, 24).fill(C.light)
    doc.font(BOLD).fontSize(9).fillColor(C.dark)
    doc.text(`Statement ${i + 1} of ${tngStatements.length}`, ML + 10, y + 8, { lineBreak: false })
    y += 24 + 6

    if (stmt.trans_nos.length > 0) {
      doc.font(BOLD).fontSize(7.5).fillColor(C.muted)
      doc.text('Tagged transactions in this export:', ML + 10, y, { lineBreak: false })
      y += 12
      doc.font(REGULAR).fontSize(8.5).fillColor(C.dark)
      const refs = stmt.trans_nos.map(t => `#${t}`).join('   ')
      doc.text(refs, ML + 10, y, { width: CW - 20, lineBreak: true })
      y = doc.y + 8
    } else {
      doc.font(OBLIQUE).fontSize(8).fillColor(C.muted)
      doc.text('(no transaction references available)', ML + 10, y, { lineBreak: false })
      y += 18
    }

    y += 10
  }

  // Note about page order
  if (y + 40 < A4_H - MB) {
    doc.font(OBLIQUE).fontSize(7.5).fillColor(C.muted)
    doc.text(
      'Original statement pages follow immediately after this cover.',
      ML, y, { width: CW, align: 'center', lineBreak: false },
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// pdf-lib: merge original TNG statement PDFs after pdfkit output
// ─────────────────────────────────────────────────────────────────────────────

async function mergeTngStatements(
  mainBuf:       Buffer,
  tngStatements: TngStatement[],
  supabase:      SupabaseClient,
): Promise<Buffer> {
  let mainPdf: Awaited<ReturnType<typeof PdfLibDocument.load>>

  try {
    mainPdf = await PdfLibDocument.load(mainBuf)
  } catch (e) {
    console.error('[mergeTngStatements] failed to load main PDF:', e)
    return mainBuf   // return original if merge fails
  }

  for (const stmt of tngStatements) {
    let stmtBuf: Buffer | null = null

    try {
      // stmt.path is the path within the bucket (e.g. "{user_id}/{uuid}.pdf")
      const { data: fileData, error } = await supabase.storage
        .from('tng-statements')
        .download(stmt.path)

      if (!error && fileData) {
        stmtBuf = Buffer.from(await fileData.arrayBuffer())
      } else {
        console.warn('[mergeTngStatements] storage download error for', stmt.path, error?.message)
      }
    } catch (e) {
      console.warn('[mergeTngStatements] exception downloading', stmt.path, (e as Error).message)
    }

    if (!stmtBuf) continue   // skip this statement — don't abort the whole merge

    try {
      const stmtPdf = await PdfLibDocument.load(stmtBuf)
      const indices = stmtPdf.getPageIndices()
      const pages   = await mainPdf.copyPages(stmtPdf, indices)
      for (const page of pages) mainPdf.addPage(page)
    } catch (e) {
      console.warn('[mergeTngStatements] exception embedding', stmt.path, (e as Error).message)
      // Continue to next statement — partial merge is better than no merge
    }
  }

  try {
    const mergedBytes = await mainPdf.save()
    return Buffer.from(mergedBytes)
  } catch (e) {
    console.error('[mergeTngStatements] failed to save merged PDF:', e)
    return mainBuf   // fallback to original
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Table primitives
// ─────────────────────────────────────────────────────────────────────────────

function drawTblHeader(doc: PDFKit.PDFDocument, y: number, cols: ColDef[]): number {
  doc.rect(ML, y, CW, ROW_H + 2).fill(C.dark)
  let x = ML
  for (const col of cols) {
    doc.font(BOLD).fontSize(7.5).fillColor(C.white)
    doc.text(col.header, x + 5, y + 6, {
      width: col.w - 10, align: col.align as 'left' | 'right' | 'center',
      lineBreak: false, ellipsis: true,
    })
    x += col.w
  }
  return y + ROW_H + 2
}

function drawTblRow(
  doc:      PDFKit.PDFDocument,
  y:        number,
  cols:     ColDef[],
  values:   string[],
  bg:       string,
  colorMap: Record<string, string> = {},
): void {
  doc.rect(ML, y, CW, ROW_H).fill(bg)
  doc.moveTo(ML, y + ROW_H).lineTo(ML + CW, y + ROW_H).lineWidth(0.3).stroke(C.border)
  let x = ML
  for (let i = 0; i < cols.length; i++) {
    const col   = cols[i]
    const color = colorMap[col.key] ?? C.dark
    doc.font(REGULAR).fontSize(8).fillColor(color)
    doc.text(values[i] ?? '', x + 5, y + 5, {
      width: col.w - 10, align: col.align as 'left' | 'right' | 'center',
      lineBreak: false, ellipsis: true,
    })
    x += col.w
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildPeriodLabel(start: string, end: string): string {
  if (!start) return 'Untitled'
  const s = new Date(start)
  if (!end) return s.toLocaleDateString('en-MY', { month: 'short', year: 'numeric' })
  const e = new Date(end)
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear())
    return s.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })
  return `${s.toLocaleDateString('en-MY', { month: 'short' })} – ${e.toLocaleDateString('en-MY', { month: 'short', year: 'numeric' })}`
}

function buildItemDescription(row: ExportRow): string {
  // NOTE: [TNG #trans_no] is appended AFTER this function, in the TNG enrichment
  // step of buildPdfData, once we have the trans_no from tng_transactions.
  if (row.item_type === 'MILEAGE') {
    const p: string[] = []
    if (row.final_distance_km) p.push(`${row.final_distance_km} km`)
    if (row.distance_source)   p.push(row.distance_source.replace(/_/g, ' '))
    if (row.item_notes)        p.push(row.item_notes)
    return p.join(' · ') || 'Mileage'
  }
  if (row.item_type === 'MEAL') {
    const p: string[] = []
    if (row.item_meal_session) p.push(row.item_meal_session.replace(/_/g, ' '))
    if (row.item_merchant)     p.push(row.item_merchant)
    if (row.item_mode)         p.push(`(${row.item_mode.replace(/_/g, ' ').toLowerCase()})`)
    return p.join(' · ') || 'Meal'
  }
  if (row.item_type === 'LODGING') {
    const p: string[] = []
    if (row.item_merchant) p.push(row.item_merchant)
    if (row.item_qty)      p.push(`${row.item_qty} night${parseFloat(row.item_qty) !== 1 ? 's' : ''}`)
    return p.join(' · ') || 'Lodging'
  }
  if (row.item_type === 'TOLL') {
    // Base description — [TNG #trans_no] appended later if linked
    return row.item_merchant ?? 'Toll'
  }
  if (row.item_type === 'PARKING') {
    // Base description — [TNG #trans_no] appended later if linked
    return row.item_merchant ?? 'Parking'
  }
  return row.item_notes || row.item_merchant || row.item_type
}

function renderMissingImg(doc: PDFKit.PDFDocument, y: number) {
  doc.rect(ML, y, CW, 80).lineWidth(0.5).stroke(C.border)
  doc.font(REGULAR).fontSize(9).fillColor(C.muted)
  doc.text('Receipt image could not be loaded.', ML, y + 34, { width: CW, align: 'center', lineBreak: false })
}

function statusCol(status: string): string {
  return status === 'SUBMITTED' ? C.green : C.amber
}
