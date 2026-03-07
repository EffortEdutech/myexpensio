// apps/user/lib/pdf-builder.ts
//
// Generates a professional A4 "ready-to-submit" expense claim PDF.
//
// INSTALL (run once in apps/user):
//   npm install pdfkit
//   npm install --save-dev @types/pdfkit
//
// next.config.ts — add to the config object:
//   serverExternalPackages: ['pdfkit']
//
// PDF structure:
//   Page 1  : Header · Claimant info · Claims summary table
//   Page 2+ : Detailed items per claim (auto-paginated)
//   Last    : Declaration + signature block
//   Appendix: One page per receipt image (fetched from Supabase Storage)

import PDFDocument from 'pdfkit'
import type { SupabaseClient } from '@supabase/supabase-js'
import { buildExportRows, type ExportFilters, type ExportRow } from './export-builder'

// ── A4 layout ─────────────────────────────────────────────────────────────────
const A4_W  = 595.28
const A4_H  = 841.89
const ML    = 50
const MT    = 50
const MB    = 60
const CW    = A4_W - ML - ML   // 495.28

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
// Widths must exactly sum to CW (495)

// Items detail: 60+58+172+55+60+90 = 495 ✓
const ITEM_COLS = [
  { key: 'date',   header: 'Date',         w: 60,  align: 'left'   },
  { key: 'type',   header: 'Type',         w: 58,  align: 'left'   },
  { key: 'desc',   header: 'Description',  w: 172, align: 'left'   },
  { key: 'qty',    header: 'Qty / KM',     w: 55,  align: 'right'  },
  { key: 'rate',   header: 'Rate (MYR)',   w: 60,  align: 'right'  },
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

const ROW_H = 19   // standard row height

// ── Internal types ────────────────────────────────────────────────────────────

type ColDef = { key: string; header: string; w: number; align: string }

type PdfItem = {
  id:           string
  type:         string
  date:         string
  description:  string
  qty:          string
  rate:         string
  amount_myr:   number
  receipt_path: string | null   // actual Supabase Storage path for receipt download
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

export type PdfData = {
  org_name:      string
  claimer_name:  string
  claimer_email: string
  generated_at:  string
  claims:        PdfClaim[]
}

// ── Build PDF data (hierarchical, with receipt paths) ─────────────────────────

export async function buildPdfData(
  supabase: SupabaseClient,
  filters:  ExportFilters,
  userId:   string,
): Promise<{ data: PdfData | null; error: string | null }> {

  // 1. Flat rows (reuse existing builder)
  const { rows, error } = await buildExportRows(supabase, filters)
  if (error)             return { data: null, error }
  if (rows.length === 0) return { data: null, error: 'No claim items found for the selected claims.' }

  // 2. Fetch receipt_url (storage path) for items that have receipts.
  //    ExportRow only stores receipt_present:'Y'|'N', not the raw path.
  const itemsWithReceipt = rows.filter(r => r.receipt_present === 'Y').map(r => r.item_id)
  const receiptPaths: Record<string, string> = {}

  if (itemsWithReceipt.length > 0) {
    const { data: itemRows } = await supabase
      .from('claim_items')
      .select('id, receipt_url')
      .in('id', itemsWithReceipt)
    for (const row of itemRows ?? []) {
      if (row.receipt_url) receiptPaths[row.id] = row.receipt_url
    }
  }

  // 3. Claimer profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, email')
    .eq('id', userId)
    .single()

  // 4. Org name
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, organizations(name)')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .limit(1)
    .single()

  const orgName = (membership?.organizations as { name?: string } | null)?.name ?? 'My Organisation'

  // 5. Group flat rows into hierarchical claims
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
      date:         row.item_date || '—',
      description:  buildItemDescription(row),
      qty:          row.item_qty       || '—',
      rate:         row.item_rate_myr  || '—',
      amount_myr,
      receipt_path: receiptPaths[row.item_id] ?? null,
    })
  }

  return {
    data: {
      org_name:      orgName,
      claimer_name:  profile?.display_name ?? 'Claimant',
      claimer_email: profile?.email        ?? '',
      generated_at:  new Date().toLocaleString('en-MY', {
        timeZone: 'Asia/Kuala_Lumpur',
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }),
      claims: Array.from(claimMap.values()),
    },
    error: null,
  }
}

// ── Main generator — returns a PDF Buffer ─────────────────────────────────────

export async function generatePDF(
  supabase:         SupabaseClient,
  data:             PdfData,
  signatureDataUrl: string | null,
): Promise<Buffer> {

  const doc = new PDFDocument({
    size:          'A4',
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
    buildDoc(doc, data, signatureDataUrl, supabase)
      .then(() => doc.end())
      .catch(reject)
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
  y = drawItemsDetail(doc, y, data.claims)
  drawDeclaration(doc, y, data, signatureDataUrl)
  await drawReceiptAppendix(doc, data, supabase)
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
// Section: Claimant info box
// ─────────────────────────────────────────────────────────────────────────────

function drawClaimantInfo(doc: PDFKit.PDFDocument, y: number, data: PdfData): number {
  const H    = 74
  const HALF = ML + CW / 2

  doc.rect(ML, y, CW, H).lineWidth(0.5).stroke(C.border)

  // Left: name + email + org
  doc.font(BOLD).fontSize(7).fillColor(C.muted)
  doc.text('CLAIMANT', ML + 12, y + 10, { lineBreak: false })
  doc.font(BOLD).fontSize(11).fillColor(C.dark)
  doc.text(data.claimer_name, ML + 12, y + 21, { lineBreak: false, width: CW / 2 - 24 })
  doc.font(REGULAR).fontSize(8.5).fillColor(C.muted)
  doc.text(data.claimer_email, ML + 12, y + 36, { lineBreak: false })
  doc.font(REGULAR).fontSize(8.5).fillColor(C.muted)
  doc.text(data.org_name, ML + 12, y + 50, { lineBreak: false })

  // Vertical divider
  doc.moveTo(HALF - 4, y + 8).lineTo(HALF - 4, y + H - 8).lineWidth(0.5).stroke(C.border)

  // Right: generated date + claim count + grand total
  const grand  = data.claims.reduce((s, c) => s + c.total_myr, 0)
  const fields: [string, string, boolean][] = [
    ['GENERATED',   data.generated_at,            false],
    ['CLAIMS',      String(data.claims.length),   false],
    ['GRAND TOTAL', 'MYR ' + grand.toFixed(2),    true ],
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
// Section: Claims summary table
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

  // Grand total row
  const grand = claims.reduce((s, c) => s + c.total_myr, 0)
  doc.rect(ML, y, CW, ROW_H + 2).fill('#dde3ea')
  doc.font(BOLD).fontSize(8.5).fillColor(C.dark)
  doc.text('GRAND TOTAL', ML + 8, y + 6, { lineBreak: false })
  const amtX = ML + SUMM_COLS.slice(0, -1).reduce((s, c) => s + c.w, 0)
  doc.text('MYR ' + grand.toFixed(2), amtX + 4, y + 6, {
    width: SUMM_COLS[SUMM_COLS.length - 1].w - 8, align: 'right', lineBreak: false,
  })
  y += ROW_H + 2

  return y + 24
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Items detail
// ─────────────────────────────────────────────────────────────────────────────

function drawItemsDetail(doc: PDFKit.PDFDocument, y: number, claims: PdfClaim[]): number {
  if (y + 50 > A4_H - MB) { doc.addPage(); y = MT }

  doc.font(BOLD).fontSize(8.5).fillColor(C.dark)
  doc.text('CLAIM ITEMS DETAIL', ML, y, { lineBreak: false })
  y += 13

  for (const claim of claims) {
    if (y + 42 > A4_H - MB) { doc.addPage(); y = MT }

    // Claim group header bar
    doc.rect(ML, y, CW, 22).fill('#e2e8f0')
    doc.font(BOLD).fontSize(8.5).fillColor(C.dark)
    doc.text(claim.title, ML + 8, y + 7, { lineBreak: false, width: CW * 0.55 })
    const statusStr = claim.status === 'SUBMITTED'
      ? `Submitted: ${claim.submitted_at}`
      : 'DRAFT — not yet submitted'
    doc.font(REGULAR).fontSize(7.5).fillColor(statusCol(claim.status))
    doc.text(statusStr, ML + CW * 0.55, y + 8, { width: CW * 0.43, align: 'right', lineBreak: false })
    y += 22 + 4

    y = drawTblHeader(doc, y, ITEM_COLS)

    for (let i = 0; i < claim.items.length; i++) {
      if (y + ROW_H > A4_H - MB) {
        doc.addPage(); y = MT
        y = drawTblHeader(doc, y, ITEM_COLS)
      }
      const item = claim.items[i]
      const desc = item.receipt_path ? `${item.description}  [R]` : item.description
      drawTblRow(doc, y, ITEM_COLS, [
        item.date, item.type, desc, item.qty, item.rate, item.amount_myr.toFixed(2),
      ], i % 2 === 0 ? C.white : C.light)
      y += ROW_H
    }

    // Subtotal bar
    doc.rect(ML, y, CW, 18).fill('#f1f5f9')
    doc.font(REGULAR).fontSize(7.5).fillColor(C.muted)
    doc.text(`Subtotal — ${claim.title}`, ML + 8, y + 5, { lineBreak: false })
    const subtX = ML + ITEM_COLS.slice(0, -1).reduce((s, c) => s + c.w, 0)
    doc.font(BOLD).fontSize(8.5).fillColor(C.dark)
    doc.text('MYR ' + claim.total_myr.toFixed(2), subtX + 4, y + 5, {
      width: ITEM_COLS[ITEM_COLS.length - 1].w - 8, align: 'right', lineBreak: false,
    })
    y += 18 + 20
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

  // Divider
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

  // Signature box
  doc.rect(ML, y, SIG_W, SIG_H).lineWidth(0.5).stroke(C.border)
  doc.font(BOLD).fontSize(7).fillColor(C.muted)
  doc.text('SIGNATURE', ML + 8, y + 7, { lineBreak: false })

  if (signatureDataUrl) {
    try {
      const b64 = signatureDataUrl.replace(/^data:image\/\w+;base64,/, '')
      const buf = Buffer.from(b64, 'base64')
      doc.image(buf, ML + 8, y + 18, {
        fit:    [SIG_W - 16, SIG_H - 26],
        width:  SIG_W - 16,
        height: SIG_H - 26,
      })
    } catch {
      sigLine(doc, ML, y, SIG_W, SIG_H)
    }
  } else {
    sigLine(doc, ML, y, SIG_W, SIG_H)
  }

  // Right: Name / Org / Date
  const RX = ML + SIG_W + 20
  const infoFields: [string, string][] = [
    ['FULL NAME',    data.claimer_name],
    ['ORGANISATION', data.org_name],
    ['DATE',         data.generated_at],
  ]
  let iy = y + 8
  for (const [lbl, val] of infoFields) {
    doc.font(BOLD).fontSize(7).fillColor(C.muted)
    doc.text(lbl, RX, iy, { lineBreak: false })
    doc.font(REGULAR).fontSize(9).fillColor(C.dark)
    doc.text(val, RX, iy + 11, { width: CW - SIG_W - 20, lineBreak: false, ellipsis: true })
    iy += 28
  }

  // Footer
  const footY = y + SIG_H + 20
  doc.font(OBLIQUE).fontSize(7).fillColor(C.muted)
  doc.text(
    `Generated by myexpensio · ${data.generated_at} · System-generated, audit-ready.`,
    ML, footY, { width: CW, align: 'center', lineBreak: false },
  )
}

function sigLine(doc: PDFKit.PDFDocument, ml: number, y: number, sigW: number, sigH: number) {
  doc.moveTo(ml + 10, y + sigH - 14).lineTo(ml + sigW - 10, y + sigH - 14)
    .lineWidth(0.5).stroke(C.border)
  doc.font(OBLIQUE).fontSize(8).fillColor(C.border)
  doc.text('Sign here', ml + sigW / 2 - 20, y + sigH - 28, { lineBreak: false })
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Receipt appendix
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

  // Appendix cover page
  doc.addPage()
  let y = MT
  doc.rect(ML, y, CW, 44).fill(C.dark)
  doc.font(BOLD).fontSize(13).fillColor(C.white)
  doc.text('RECEIPT APPENDIX', ML + 14, y + 12, { lineBreak: false })
  doc.font(REGULAR).fontSize(8.5).fillColor('#94a3b8')
  doc.text(
    `${receiptItems.length} receipt${receiptItems.length !== 1 ? 's' : ''} — original uploads`,
    ML + 14, y + 29, { lineBreak: false },
  )
  y += 44 + 20

  doc.font(OBLIQUE).fontSize(8).fillColor(C.muted)
  doc.text(
    'Each receipt is printed on a dedicated page in the order it appears in the claim.',
    ML, y, { width: CW, lineBreak: false },
  )

  // One receipt per page
  for (const receipt of receiptItems) {
    let imgBuf: Buffer | null = null

    try {
      const { data: fileData, error } = await supabase.storage
        .from('receipts')
        .download(receipt.path)

      if (!error && fileData) {
        const ab = await fileData.arrayBuffer()
        imgBuf = Buffer.from(ab)
      }
    } catch {
      // Silently skip — image unavailable
    }

    doc.addPage()
    y = MT

    // Reference label bar
    doc.rect(ML, y, CW, 28).fill(C.light)
    doc.font(BOLD).fontSize(7).fillColor(C.muted)
    doc.text('RECEIPT FOR', ML + 8, y + 6, { lineBreak: false })
    doc.font(REGULAR).fontSize(8.5).fillColor(C.dark)
    doc.text(receipt.label, ML + 8, y + 17, { width: CW - 16, lineBreak: false, ellipsis: true })
    y += 28 + 12

    if (imgBuf) {
      const maxH = A4_H - y - MB - 10
      try {
        doc.image(imgBuf, ML, y, { fit: [CW, maxH], align: 'center' })
      } catch {
        renderMissingImg(doc, y)
      }
    } else {
      renderMissingImg(doc, y)
    }
  }
}

function renderMissingImg(doc: PDFKit.PDFDocument, y: number) {
  doc.rect(ML, y, CW, 80).lineWidth(0.5).stroke(C.border)
  doc.font(REGULAR).fontSize(9).fillColor(C.muted)
  doc.text('Receipt image could not be loaded.', ML, y + 34, { width: CW, align: 'center', lineBreak: false })
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
    if (row.item_mode)     p.push(`(${row.item_mode.replace(/_/g, ' ').toLowerCase()})`)
    return p.join(' · ') || 'Lodging'
  }
  return row.item_notes || row.item_type
}

function statusCol(status: string): string {
  return status === 'SUBMITTED' ? C.green : C.amber
}
