// apps/user/lib/pdf-builder.ts
//
// Template-driven PDF generator.
// Every visual setting is read from PdfLayoutConfig — nothing hardcoded.
//
// PdfLayoutConfig (set in admin app → Export Templates → PDF Settings tab):
//   orientation           'portrait' | 'landscape'
//   grouping              'BY_DATE' | 'BY_CATEGORY'
//   show_summary_table    boolean
//   show_receipt_appendix boolean
//   show_tng_appendix     boolean
//   show_declaration      boolean
//   accent_color          hex string (header bar + table header bg)
//
// Flow:
//   route.ts → buildPdfData(supabase, filters, userId, layoutConfig)
//            → generatePDF(supabase, pdfData, signatureDataUrl)
//
// PdfData.layout carries the FULL PdfLayoutConfig so every draw function
// can read orientation + accent + show_* without extra parameters.

import PDFDocument          from 'pdfkit'
import { PDFDocument as PdfLibDocument } from 'pdf-lib'
import type { SupabaseClient } from '@supabase/supabase-js'
import { buildExportRows, type ExportFilters, type ExportRow } from './export-builder'

// ── PDF Layout Config — mirrors admin TemplateEditor PDF Settings ─────────────
export type PdfLayoutConfig = {
  orientation:           'portrait' | 'landscape'
  grouping:              'BY_DATE' | 'BY_CATEGORY'
  show_summary_table:    boolean
  show_receipt_appendix: boolean
  show_tng_appendix:     boolean
  show_declaration:      boolean
  accent_color:          string    // hex — header bar + table header background
}

export const DEFAULT_PDF_LAYOUT: PdfLayoutConfig = {
  orientation:           'portrait',
  grouping:              'BY_DATE',
  show_summary_table:    true,
  show_receipt_appendix: true,
  show_tng_appendix:     true,
  show_declaration:      true,
  accent_color:          '#0f172a',
}

// ── Fixed margins (same for portrait and landscape) ───────────────────────────
const ML = 50   // margin left = margin right
const MT = 50   // margin top
const MB = 60   // margin bottom

// ── Page dimensions — computed at runtime from orientation ────────────────────
// Portrait  A4: 595.28 × 841.89 pt  →  CW = 595.28 - 100 = 495.28
// Landscape A4: 841.89 × 595.28 pt  →  CW = 841.89 - 100 = 741.89

type PageDimensions = {
  PW:  number   // page width
  PH:  number   // page height
  CW:  number   // content width
}

function getDimensions(orientation: 'portrait' | 'landscape'): PageDimensions {
  if (orientation === 'landscape') {
    return { PW: 841.89, PH: 595.28, CW: 741.89 }
  }
  return { PW: 595.28, PH: 841.89, CW: 495.28 }
}

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
const ROW_H   = 19

// ── Column width builders — proportional, sum = CW ───────────────────────────
// Widths are expressed as fractions that multiply CW, so they scale with orientation.

type ColDef = { key: string; header: string; w: number; align: string }

function makeColsDate(cw: number): ColDef[] {
  // date(12%) type(11%) desc(35%) qty(11%) rate(12%) amount(19%) — sum = 100%
  const d = Math.round(cw * 0.12)
  const t = Math.round(cw * 0.11)
  const q = Math.round(cw * 0.11)
  const r = Math.round(cw * 0.12)
  const a = Math.round(cw * 0.19)
  const desc = cw - d - t - q - r - a   // remainder so total = exact CW
  return [
    { key: 'date',   header: 'Date',         w: d,    align: 'left'   },
    { key: 'type',   header: 'Type',         w: t,    align: 'left'   },
    { key: 'desc',   header: 'Description',  w: desc, align: 'left'   },
    { key: 'qty',    header: 'Qty / KM',     w: q,    align: 'right'  },
    { key: 'rate',   header: 'Rate (MYR)',   w: r,    align: 'right'  },
    { key: 'amount', header: 'Amount (MYR)', w: a,    align: 'right'  },
  ]
}

function makeColsCategory(cw: number): ColDef[] {
  // date(10%) claim(24%) desc(35%) qty(11%) amount(20%) — sum = 100%
  const d = Math.round(cw * 0.10)
  const c = Math.round(cw * 0.24)
  const q = Math.round(cw * 0.11)
  const a = Math.round(cw * 0.20)
  const desc = cw - d - c - q - a
  return [
    { key: 'date',   header: 'Date',         w: d,    align: 'left'   },
    { key: 'claim',  header: 'Claim',        w: c,    align: 'left'   },
    { key: 'desc',   header: 'Description',  w: desc, align: 'left'   },
    { key: 'qty',    header: 'Qty / KM',     w: q,    align: 'right'  },
    { key: 'amount', header: 'Amount (MYR)', w: a,    align: 'right'  },
  ]
}

function makeColsSummary(cw: number): ColDef[] {
  // title(36%) period(22%) status(16%) items(8%) total(18%) — sum = 100%
  const p = Math.round(cw * 0.22)
  const s = Math.round(cw * 0.16)
  const i = Math.round(cw * 0.08)
  const t = Math.round(cw * 0.18)
  const title = cw - p - s - i - t
  return [
    { key: 'title',  header: 'Claim / Period', w: title, align: 'left'   },
    { key: 'period', header: 'Period',         w: p,     align: 'left'   },
    { key: 'status', header: 'Status',         w: s,     align: 'center' },
    { key: 'items',  header: 'Items',          w: i,     align: 'center' },
    { key: 'total',  header: 'Total (MYR)',    w: t,     align: 'right'  },
  ]
}

// ── Category order for BY_CATEGORY layout ─────────────────────────────────────
const CATEGORY_ORDER = [
  { type: 'MILEAGE',  label: 'Mileage',  headerBg: '#1e40af', headerFg: '#fff' },
  { type: 'MEAL',     label: 'Meal',     headerBg: '#92400e', headerFg: '#fff' },
  { type: 'LODGING',  label: 'Lodging',  headerBg: '#5b21b6', headerFg: '#fff' },
  { type: 'TOLL',     label: 'Toll',     headerBg: '#0369a1', headerFg: '#fff' },
  { type: 'PARKING',  label: 'Parking',  headerBg: '#a16207', headerFg: '#fff' },
  { type: 'TAXI',     label: 'Taxi',     headerBg: '#713f12', headerFg: '#fff' },
  { type: 'GRAB',     label: 'Grab',     headerBg: '#166534', headerFg: '#fff' },
  { type: 'TRAIN',    label: 'Train',    headerBg: '#1e293b', headerFg: '#fff' },
  { type: 'FLIGHT',   label: 'Flight',   headerBg: '#0c4a6e', headerFg: '#fff' },
  { type: 'BUS',      label: 'Bus',      headerBg: '#365314', headerFg: '#fff' },
  { type: 'PER_DIEM', label: 'Per Diem', headerBg: '#4c1d95', headerFg: '#fff' },
]

// ── Internal types ────────────────────────────────────────────────────────────

type PdfItem = {
  id:           string
  type:         string
  claim_title:  string
  date:         string
  date_iso:     string
  description:  string
  qty:          string
  rate:         string
  amount_myr:   number
  receipt_path: string | null
  tng_trans_no: string | null
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

type TngStatement = {
  path:      string
  trans_nos: string[]
}

// ── PdfData — carries ALL template settings through to every draw function ────
export type PdfData = {
  org_name:       string
  claimer_name:   string
  claimer_email:  string
  generated_at:   string
  layout:         PdfLayoutConfig   // full config — replaces old pdf_layout string
  claims:         PdfClaim[]
  tng_statements: TngStatement[]
}

// ── Build PDF data ────────────────────────────────────────────────────────────
// Accepts full PdfLayoutConfig so all settings are preserved in PdfData.layout.

export async function buildPdfData(
  supabase:     SupabaseClient,
  filters:      ExportFilters,
  userId:       string,
  layoutConfig: PdfLayoutConfig = DEFAULT_PDF_LAYOUT,
): Promise<{ data: PdfData | null; error: string | null }> {

  const layout: PdfLayoutConfig = { ...DEFAULT_PDF_LAYOUT, ...layoutConfig }

  const { rows, error } = await buildExportRows(supabase, filters)
  if (error)             return { data: null, error }
  if (rows.length === 0) return { data: null, error: 'No claim items found for the selected claims.' }

  // Receipt paths
  const itemsWithReceipt = rows.filter(r => r.receipt_present === 'Y').map(r => r.item_id)
  const receiptPaths: Record<string, string> = {}
  if (itemsWithReceipt.length > 0) {
    const { data: itemRows } = await supabase
      .from('claim_items').select('id, receipt_url').in('id', itemsWithReceipt)
    for (const row of itemRows ?? []) {
      if (row.receipt_url) receiptPaths[row.id] = row.receipt_url
    }
  }

  // Profile + org
  const { data: profile }    = await supabase
    .from('profiles').select('display_name, email').eq('id', userId).single()
  const { data: membership } = await supabase
    .from('org_members').select('org_id, organizations(name)')
    .eq('user_id', userId).eq('status', 'ACTIVE').limit(1).single()
  const orgName = (membership?.organizations as { name?: string } | null)?.name ?? 'My Organisation'

  // Build claim hierarchy
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
      tng_trans_no: null,
    })
  }

  for (const claim of claimMap.values()) {
    claim.items.sort((a, b) => a.date_iso.localeCompare(b.date_iso))
  }

  // TNG enrichment
  const allItems           = Array.from(claimMap.values()).flatMap(c => c.items)
  const tollParkingItemIds = allItems.filter(i => i.type === 'TOLL' || i.type === 'PARKING').map(i => i.id)
  const tngStatements: TngStatement[] = []

  if (tollParkingItemIds.length > 0) {
    const { data: linkRows } = await supabase
      .from('claim_items').select('id, tng_transaction_id').in('id', tollParkingItemIds)

    const itemToTngId: Record<string, string> = {}
    for (const r of linkRows ?? []) {
      if (r.tng_transaction_id) itemToTngId[r.id] = r.tng_transaction_id
    }

    const tngIds = Object.values(itemToTngId)
    if (tngIds.length > 0) {
      const { data: tngRows } = await supabase
        .from('tng_transactions').select('id, trans_no, source_file_url').in('id', tngIds)

      const tngMap: Record<string, { trans_no: string | null; source_file_url: string | null }> = {}
      for (const t of tngRows ?? []) tngMap[t.id] = t

      const stmtMap = new Map<string, string[]>()
      for (const item of allItems) {
        const tngId = itemToTngId[item.id]
        if (!tngId) continue
        const tng = tngMap[tngId]
        if (!tng) continue
        item.tng_trans_no = tng.trans_no
        if (tng.trans_no) item.description = `${item.description}  [TNG #${tng.trans_no}]`
        if (tng.source_file_url) {
          if (!stmtMap.has(tng.source_file_url)) stmtMap.set(tng.source_file_url, [])
          if (tng.trans_no) stmtMap.get(tng.source_file_url)!.push(tng.trans_no)
        }
      }

      for (const [path, trans_nos] of stmtMap.entries()) {
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
      layout,                           // full PdfLayoutConfig
      claims:         Array.from(claimMap.values()),
      tng_statements: tngStatements,
    },
    error: null,
  }
}

// ── Main generator ────────────────────────────────────────────────────────────

export async function generatePDF(
  supabase:         SupabaseClient,
  data:             PdfData,
  signatureDataUrl: string | null,
): Promise<Buffer> {
  const pdfkitBuf = await generatePdfKitBuffer(supabase, data, signatureDataUrl)
  if (data.layout.show_tng_appendix && data.tng_statements.length > 0) {
    return mergeTngStatements(pdfkitBuf, data.tng_statements, supabase)
  }
  return pdfkitBuf
}

async function generatePdfKitBuffer(
  supabase:         SupabaseClient,
  data:             PdfData,
  signatureDataUrl: string | null,
): Promise<Buffer> {
  const { orientation } = data.layout

  // Set page size based on orientation — this is the primary fix for landscape
  const pageSize: [number, number] = orientation === 'landscape'
    ? [841.89, 595.28]   // landscape: width > height
    : [595.28, 841.89]   // portrait:  height > width

  const doc = new PDFDocument({
    size:          pageSize,
    margins:       { top: MT, bottom: MB, left: ML, right: ML },
    autoFirstPage: false,
    info: {
      Title:   'Expense Claim Form — myexpensio',
      Author:  data.claimer_name,
      Creator: 'myexpensio',
    },
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
// Reads data.layout for every rendering decision.

async function buildDoc(
  doc:              PDFKit.PDFDocument,
  data:             PdfData,
  signatureDataUrl: string | null,
  supabase:         SupabaseClient,
) {
  const { layout } = data
  const dim = getDimensions(layout.orientation)

  doc.addPage()
  let y = MT

  y = drawHeader(doc, y, dim, layout.accent_color)
  y = drawClaimantInfo(doc, y, dim, data)

  if (layout.show_summary_table) {
    y = drawSummaryTable(doc, y, dim, data.claims, layout.accent_color)
  }

  if (layout.grouping === 'BY_CATEGORY') {
    y = drawItemsByCategory(doc, y, dim, data.claims, layout.accent_color)
  } else {
    y = drawItemsByDate(doc, y, dim, data.claims, layout.accent_color)
  }

  if (layout.show_declaration) {
    drawDeclaration(doc, y, dim, data, signatureDataUrl)
  }

  if (layout.show_receipt_appendix) {
    await drawReceiptAppendix(doc, dim, data, supabase, layout.accent_color)
  }

  if (layout.show_tng_appendix && data.tng_statements.length > 0) {
    drawTngAppendixCover(doc, dim, data.tng_statements, layout.accent_color)
  }
}

// ── Section: Header ───────────────────────────────────────────────────────────

function drawHeader(
  doc: PDFKit.PDFDocument,
  y:   number,
  dim: PageDimensions,
  accent: string,
): number {
  const H = 44
  doc.rect(ML, y, dim.CW, H).fill(accent)
  doc.font(BOLD).fontSize(16).fillColor(C.white)
  doc.text('myexpensio', ML + 14, y + 11, { lineBreak: false })
  doc.font(REGULAR).fontSize(8.5).fillColor('rgba(255,255,255,0.6)')
  doc.text('EXPENSE CLAIM FORM', ML, y + 7, { width: dim.CW - 14, align: 'right', lineBreak: false })
  doc.font(REGULAR).fontSize(7.5).fillColor('rgba(255,255,255,0.4)')
  doc.text('Mileage & Claims Automation', ML, y + 24, { width: dim.CW - 14, align: 'right', lineBreak: false })
  return y + H + 18
}

// ── Section: Claimant info ────────────────────────────────────────────────────

function drawClaimantInfo(
  doc:  PDFKit.PDFDocument,
  y:    number,
  dim:  PageDimensions,
  data: PdfData,
): number {
  const H    = 74
  const HALF = ML + dim.CW / 2
  doc.rect(ML, y, dim.CW, H).lineWidth(0.5).stroke(C.border)
  doc.font(BOLD).fontSize(7).fillColor(C.muted)
  doc.text('CLAIMANT', ML + 12, y + 10, { lineBreak: false })
  doc.font(BOLD).fontSize(11).fillColor(C.dark)
  doc.text(data.claimer_name, ML + 12, y + 21, { lineBreak: false, width: dim.CW / 2 - 24 })
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

// ── Section: Summary table ────────────────────────────────────────────────────

function drawSummaryTable(
  doc:    PDFKit.PDFDocument,
  y:      number,
  dim:    PageDimensions,
  claims: PdfClaim[],
  accent: string,
): number {
  const cols = makeColsSummary(dim.CW)
  doc.font(BOLD).fontSize(8.5).fillColor(C.dark)
  doc.text('CLAIMS INCLUDED IN THIS EXPORT', ML, y, { lineBreak: false })
  y += 13
  y = drawTblHeader(doc, y, cols, accent)
  for (let i = 0; i < claims.length; i++) {
    if (y + ROW_H > dim.PH - MB) { doc.addPage(); y = MT; y = drawTblHeader(doc, y, cols, accent) }
    const c = claims[i]
    drawTblRow(doc, y, cols, [
      c.title, c.period, c.status, String(c.items.length), c.total_myr.toFixed(2),
    ], i % 2 === 0 ? C.white : C.light, { status: statusCol(c.status) })
    y += ROW_H
  }
  const grand = claims.reduce((s, c) => s + c.total_myr, 0)
  doc.rect(ML, y, dim.CW, ROW_H + 2).fill('#dde3ea')
  doc.font(BOLD).fontSize(8.5).fillColor(C.dark)
  doc.text('GRAND TOTAL', ML + 8, y + 6, { lineBreak: false })
  const lastCol = cols[cols.length - 1]
  const amtX    = ML + cols.slice(0, -1).reduce((s, c) => s + c.w, 0)
  doc.text('MYR ' + grand.toFixed(2), amtX + 4, y + 6, {
    width: lastCol.w - 8, align: 'right', lineBreak: false,
  })
  return y + ROW_H + 2 + 24
}

// ── Layout A: BY_DATE ─────────────────────────────────────────────────────────

function drawItemsByDate(
  doc:    PDFKit.PDFDocument,
  y:      number,
  dim:    PageDimensions,
  claims: PdfClaim[],
  accent: string,
): number {
  const cols = makeColsDate(dim.CW)
  if (y + 50 > dim.PH - MB) { doc.addPage(); y = MT }
  doc.font(BOLD).fontSize(8.5).fillColor(C.dark)
  doc.text('CLAIM ITEMS DETAIL', ML, y, { lineBreak: false })
  y += 13

  for (const claim of claims) {
    if (y + 42 > dim.PH - MB) { doc.addPage(); y = MT }
    doc.rect(ML, y, dim.CW, 22).fill('#e2e8f0')
    doc.font(BOLD).fontSize(8.5).fillColor(C.dark)
    doc.text(claim.title, ML + 8, y + 7, { lineBreak: false, width: dim.CW * 0.55 })
    const statusStr = claim.status === 'SUBMITTED'
      ? `Submitted: ${claim.submitted_at}`
      : 'DRAFT — not yet submitted'
    doc.font(REGULAR).fontSize(7.5).fillColor(statusCol(claim.status))
    doc.text(statusStr, ML + dim.CW * 0.55, y + 8, { width: dim.CW * 0.43, align: 'right', lineBreak: false })
    y += 22 + 4
    y = drawTblHeader(doc, y, cols, accent)

    for (let i = 0; i < claim.items.length; i++) {
      if (y + ROW_H > dim.PH - MB) { doc.addPage(); y = MT; y = drawTblHeader(doc, y, cols, accent) }
      const item = claim.items[i]
      const desc = item.receipt_path ? `${item.description}  [R]` : item.description
      drawTblRow(doc, y, cols, [
        item.date, item.type, desc, item.qty, item.rate, item.amount_myr.toFixed(2),
      ], i % 2 === 0 ? C.white : C.light)
      y += ROW_H
    }

    doc.rect(ML, y, dim.CW, 18).fill('#f1f5f9')
    doc.font(REGULAR).fontSize(7.5).fillColor(C.muted)
    doc.text(`Subtotal — ${claim.title}`, ML + 8, y + 5, { lineBreak: false })
    const subtX = ML + cols.slice(0, -1).reduce((s, c) => s + c.w, 0)
    doc.font(BOLD).fontSize(8.5).fillColor(C.dark)
    doc.text('MYR ' + claim.total_myr.toFixed(2), subtX + 4, y + 5, {
      width: cols[cols.length - 1].w - 8, align: 'right', lineBreak: false,
    })
    y += 18 + 20
  }
  return y
}

// ── Layout B: BY_CATEGORY ─────────────────────────────────────────────────────

function drawItemsByCategory(
  doc:    PDFKit.PDFDocument,
  y:      number,
  dim:    PageDimensions,
  claims: PdfClaim[],
  accent: string,
): number {
  const cols = makeColsCategory(dim.CW)
  const typeMap = new Map<string, PdfItem[]>()
  for (const claim of claims) {
    for (const item of claim.items) {
      if (!typeMap.has(item.type)) typeMap.set(item.type, [])
      typeMap.get(item.type)!.push(item)
    }
  }
  for (const items of typeMap.values()) items.sort((a, b) => a.date_iso.localeCompare(b.date_iso))

  const knownTypes = new Set(CATEGORY_ORDER.map(c => c.type))

  const renderCat = (label: string, headerBg: string, headerFg: string, items: PdfItem[]) => {
    doc.addPage(); y = MT
    const catTotal = items.reduce((s, i) => s + i.amount_myr, 0)
    doc.rect(ML, y, dim.CW, 30).fill(headerBg)
    doc.font(BOLD).fontSize(12).fillColor(headerFg)
    doc.text(label, ML + 12, y + 9, { lineBreak: false })
    doc.font(REGULAR).fontSize(8).fillColor(headerFg)
    doc.text(`${items.length} item${items.length !== 1 ? 's' : ''}  ·  MYR ${catTotal.toFixed(2)}`, ML + 12, y + 21, { lineBreak: false })
    y += 30 + 6
    y = drawTblHeader(doc, y, cols, accent)

    for (let i = 0; i < items.length; i++) {
      if (y + ROW_H > dim.PH - MB) { doc.addPage(); y = MT; y = drawTblHeader(doc, y, cols, accent) }
      const item = items[i]
      const desc = item.receipt_path ? `${item.description}  [R]` : item.description
      drawTblRow(doc, y, cols, [
        item.date, item.claim_title, desc, item.qty, item.amount_myr.toFixed(2),
      ], i % 2 === 0 ? C.white : C.light)
      y += ROW_H
    }

    doc.rect(ML, y, dim.CW, 18).fill('#f1f5f9')
    doc.font(REGULAR).fontSize(7.5).fillColor(C.muted)
    doc.text(`Subtotal — ${label}`, ML + 8, y + 5, { lineBreak: false })
    const subtX = ML + cols.slice(0, -1).reduce((s, c) => s + c.w, 0)
    doc.font(BOLD).fontSize(8.5).fillColor(C.dark)
    doc.text('MYR ' + catTotal.toFixed(2), subtX + 4, y + 5, {
      width: cols[cols.length - 1].w - 8, align: 'right', lineBreak: false,
    })
    y += 18 + 24
  }

  for (const cat of CATEGORY_ORDER) {
    const items = typeMap.get(cat.type)
    if (!items || items.length === 0) continue
    renderCat(cat.label, cat.headerBg, cat.headerFg, items)
  }
  // Any types not in CATEGORY_ORDER
  for (const [type, items] of typeMap.entries()) {
    if (knownTypes.has(type) || items.length === 0) continue
    renderCat(type, accent, C.white, items)
  }
  return y
}

// ── Section: Declaration ──────────────────────────────────────────────────────

function drawDeclaration(
  doc:              PDFKit.PDFDocument,
  y:                number,
  dim:              PageDimensions,
  data:             PdfData,
  signatureDataUrl: string | null,
): void {
  if (y + 200 > dim.PH - MB) { doc.addPage(); y = MT }

  doc.moveTo(ML, y).lineTo(ML + dim.CW, y).lineWidth(0.5).stroke(C.border)
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
  doc.text(declarationText, ML, y, { width: dim.CW, align: 'justify', lineBreak: true })
  y = doc.y + 20

  const SIG_W = 200
  const SIG_H = 80

  doc.font(BOLD).fontSize(7).fillColor(C.muted)
  doc.text('SIGNATURE', ML + 8, y + 7, { lineBreak: false })

  if (signatureDataUrl) {
    try {
      const buf = Buffer.from(signatureDataUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64')
      doc.image(buf, ML + 8, y + 18, { fit: [SIG_W - 16, SIG_H - 26], width: SIG_W - 16, height: SIG_H - 26 })
    } catch { /* embed failed — draw line only */ }
  }

  doc.moveTo(ML + 10, y + SIG_H - 14)
    .lineTo(ML + SIG_W - 10, y + SIG_H - 14)
    .lineWidth(0.5).stroke(C.border)

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
    doc.text(val, RX, iy + 11, { width: dim.CW - SIG_W - 20, lineBreak: false, ellipsis: true })
    iy += 28
  }

  const footY = y + SIG_H + 20
  doc.font(OBLIQUE).fontSize(7).fillColor(C.muted)
  doc.text(
    'Generated by myexpensio · System-generated · audit-ready',
    ML, footY, { width: dim.CW, align: 'center', lineBreak: false },
  )
}

// ── Section: Receipt appendix ─────────────────────────────────────────────────

async function drawReceiptAppendix(
  doc:      PDFKit.PDFDocument,
  dim:      PageDimensions,
  data:     PdfData,
  supabase: SupabaseClient,
  accent:   string,
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
  doc.rect(ML, y, dim.CW, 44).fill(accent)
  doc.font(BOLD).fontSize(13).fillColor(C.white)
  doc.text('APPENDIX A — RECEIPTS', ML + 14, y + 12, { lineBreak: false })
  doc.font(REGULAR).fontSize(8.5).fillColor('rgba(255,255,255,0.6)')
  doc.text(`${receiptItems.length} receipt${receiptItems.length !== 1 ? 's' : ''} — original uploads`, ML + 14, y + 29, { lineBreak: false })
  y += 44 + 20
  doc.font(OBLIQUE).fontSize(8).fillColor(C.muted)
  doc.text('Each receipt is printed on a dedicated page in the order it appears in the claim.', ML, y, { width: dim.CW, lineBreak: false })
  y += 20

  for (const { label, path } of receiptItems) {
    doc.addPage(); y = MT
    doc.font(BOLD).fontSize(8).fillColor(C.muted)
    doc.text(label, ML, y, { width: dim.CW, lineBreak: false })
    y += 14
    try {
      const { data: blob, error } = await supabase.storage.from('receipts').download(path)
      if (error || !blob) throw new Error('Download failed')
      const imgBuf = Buffer.from(await blob.arrayBuffer())
      const maxH   = dim.PH - MT - MB - 20
      doc.image(imgBuf, ML, y, { fit: [dim.CW, maxH], align: 'center' })
    } catch {
      doc.rect(ML, y, dim.CW, 80).lineWidth(0.5).stroke(C.border)
      doc.font(REGULAR).fontSize(9).fillColor(C.muted)
      doc.text('Receipt image could not be loaded.', ML, y + 34, { width: dim.CW, align: 'center', lineBreak: false })
    }
  }
}

// ── Section: TNG appendix cover ───────────────────────────────────────────────

function drawTngAppendixCover(
  doc:           PDFKit.PDFDocument,
  dim:           PageDimensions,
  tngStatements: TngStatement[],
  accent:        string,
): void {
  doc.addPage()
  let y = MT
  doc.rect(ML, y, dim.CW, 44).fill(accent)
  doc.font(BOLD).fontSize(13).fillColor(C.white)
  doc.text('APPENDIX B — TNG eWALLET STATEMENTS', ML + 14, y + 12, { lineBreak: false })
  doc.font(REGULAR).fontSize(8.5).fillColor('rgba(255,255,255,0.6)')
  doc.text(`${tngStatements.length} statement${tngStatements.length !== 1 ? 's' : ''} embedded on the following pages`, ML + 14, y + 29, { lineBreak: false })
  y += 44 + 20
  doc.font(OBLIQUE).fontSize(8).fillColor(C.muted)
  doc.text('These are the original TNG eWallet Customer Transactions Statements. Transaction reference numbers shown below correspond to the [TNG #xxxxx] markers in the claim items above.', ML, y, { width: dim.CW, lineBreak: true })
  y = doc.y + 20

  for (let i = 0; i < tngStatements.length; i++) {
    if (y + 60 > dim.PH - MB) { doc.addPage(); y = MT }
    const stmt = tngStatements[i]
    doc.rect(ML, y, dim.CW, 24).fill(C.light)
    doc.font(BOLD).fontSize(9).fillColor(C.dark)
    doc.text(`Statement ${i + 1} of ${tngStatements.length}`, ML + 10, y + 8, { lineBreak: false })
    y += 24 + 6
    if (stmt.trans_nos.length > 0) {
      doc.font(BOLD).fontSize(7.5).fillColor(C.muted)
      doc.text('Tagged transactions:', ML + 10, y, { lineBreak: false })
      y += 12
      doc.font(REGULAR).fontSize(8.5).fillColor(C.dark)
      doc.text(stmt.trans_nos.map(t => `#${t}`).join('   '), ML + 10, y, { width: dim.CW - 20, lineBreak: true })
      y = doc.y + 8
    }
    y += 10
  }
}

// ── TNG PDF merge ─────────────────────────────────────────────────────────────

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
    return mainBuf
  }

  for (const stmt of tngStatements) {
    let stmtBuf: Buffer | null = null
    try {
      const { data: fileData, error } = await supabase.storage.from('tng-statements').download(stmt.path)
      if (!error && fileData) stmtBuf = Buffer.from(await fileData.arrayBuffer())
      else console.warn('[mergeTngStatements] download error', stmt.path, error?.message)
    } catch (e) {
      console.warn('[mergeTngStatements] exception', stmt.path, (e as Error).message)
    }
    if (!stmtBuf) continue

    try {
      const stmtPdf = await PdfLibDocument.load(stmtBuf)
      const pages   = await mainPdf.copyPages(stmtPdf, stmtPdf.getPageIndices())
      for (const page of pages) mainPdf.addPage(page)
    } catch (e) {
      console.warn('[mergeTngStatements] embed error', stmt.path, (e as Error).message)
    }
  }

  try {
    return Buffer.from(await mainPdf.save())
  } catch (e) {
    console.error('[mergeTngStatements] save error:', e)
    return mainBuf
  }
}

// ── Table primitives ──────────────────────────────────────────────────────────

function drawTblHeader(
  doc:    PDFKit.PDFDocument,
  y:      number,
  cols:   ColDef[],
  accent: string,
): number {
  const totalW = cols.reduce((s, c) => s + c.w, 0)
  doc.rect(ML, y, totalW, ROW_H + 2).fill(accent)
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
  const totalW = cols.reduce((s, c) => s + c.w, 0)
  doc.rect(ML, y, totalW, ROW_H).fill(bg)
  doc.moveTo(ML, y + ROW_H).lineTo(ML + totalW, y + ROW_H).lineWidth(0.3).stroke(C.border)
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusCol(status: string): string {
  return status === 'SUBMITTED' ? C.green : C.amber
}

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
  if (row.item_type === 'TOLL')    return row.item_merchant ?? 'Toll'
  if (row.item_type === 'PARKING') return row.item_merchant ?? 'Parking'
  return row.item_notes || row.item_merchant || row.item_type
}
