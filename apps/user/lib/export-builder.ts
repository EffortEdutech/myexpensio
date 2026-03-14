// apps/user/lib/export-builder.ts
//
// Export builder — generates CSV, XLSX, and PDF claim exports.
//
// PHASE B CHANGES:
//   - Accepts optional `columns` param from a report template
//   - Falls back to STANDARD preset columns if no template provided
//   - Distance: stored as meters internally, exported as KM (2 decimal places)
//   - All values deterministic from DB — no recalculation after submission
//
// Column registry is in lib/export-columns.ts (shared with admin app).
// Place that file at apps/user/lib/export-columns.ts before running.
//
// COMPATIBILITY SHIM (added 14 Mar 2026):
//   pdf-builder.ts uses an older "flat row" API: buildExportRows / ExportFilters / ExportRow.
//   Those types and that function are added at the bottom of this file so pdf-builder.ts
//   continues to compile without modification. They bridge to the same DB data.

import ExcelJS from 'exceljs'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  PRESET_COLUMNS,
  getColumnLabel,
  type ExportColumnKey,
} from './export-columns'

// ── Types ──────────────────────────────────────────────────────────────────────
export type ClaimForExport = {
  id:            string
  title:         string | null
  status:        string
  period_start:  string | null
  period_end:    string | null
  submitted_at:  string | null
  total_amount:  number
  currency:      string
  user_name:     string | null
  user_email:    string | null
  items:         ItemForExport[]
}

export type ItemForExport = {
  id:                   string
  type:                 string
  amount:               number
  currency:             string
  claim_date:           string | null
  merchant:             string | null
  notes:                string | null
  receipt_url:          string | null
  paid_via_tng:         boolean
  tng_transaction_id:   string | null
  tng_trans_no:         string | null        // joined from tng_transactions
  perdiem_days:         number | null
  perdiem_rate_myr:     number | null
  perdiem_destination:  string | null
  meal_session:         string | null
  lodging_check_in:     string | null
  lodging_check_out:    string | null
  trip:                 TripForExport | null
}

export type TripForExport = {
  id:               string
  origin_text:      string | null
  destination_text: string | null
  final_distance_m: number | null    // meters — convert to KM on export
  distance_source:  string | null
  transport_type:   string | null
  odometer_mode:    string | null
}

export type BuildExportOptions = {
  columns?:           ExportColumnKey[]     // from template — if empty, use STANDARD preset
  pdfLayout?:         'BY_DATE' | 'BY_CATEGORY'
  signatureDataUrl?:  string
  mileageRatePerKm?:  number               // from rate_version at time of claim
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function metersToKm(m: number | null): string {
  if (m === null || m === undefined) return ''
  return (m / 1000).toFixed(2)
}

function formatDate(d: string | null | undefined): string {
  if (!d) return ''
  return d.split('T')[0]   // YYYY-MM-DD
}

function yesNo(v: boolean | null | undefined): string {
  return v ? 'Y' : 'N'
}

// ── Cell value extractor ───────────────────────────────────────────────────────
// Extracts the value for a given column key from a claim+item pair.
// Returns string — ExcelJS will keep numbers as-is when we set the cell type.

function getCellValue(
  key: ExportColumnKey,
  claim: ClaimForExport,
  item: ItemForExport,
  mileageRate?: number,
): string | number {
  switch (key) {
    // Claim-level
    case 'claim_id':          return claim.id
    case 'claim_title':       return claim.title ?? ''
    case 'user_name':         return claim.user_name ?? ''
    case 'user_email':        return claim.user_email ?? ''
    case 'period_start':      return formatDate(claim.period_start)
    case 'period_end':        return formatDate(claim.period_end)
    case 'submitted_at':      return claim.submitted_at ? formatDate(claim.submitted_at) : ''
    case 'total_amount':      return claim.total_amount

    // Item-level core
    case 'item_id':           return item.id ?? ''
    case 'item_type':         return item.type ?? ''
    case 'item_date':         return formatDate(item.claim_date)
    case 'amount':            return item.amount ?? 0
    case 'currency':          return item.currency ?? ''
    case 'merchant':          return item.merchant ?? ''
    case 'notes':             return item.notes ?? ''
    case 'receipt_present':   return yesNo(!!item.receipt_url)
    case 'receipt_url':       return item.receipt_url ?? ''

    // Mileage / trip
    case 'trip_origin':       return item.trip?.origin_text ?? ''
    case 'trip_destination':  return item.trip?.destination_text ?? ''
    case 'distance_km':       return item.trip ? metersToKm(item.trip.final_distance_m) : ''
    case 'distance_source':   return item.trip?.distance_source ?? ''
    case 'mileage_rate':      return mileageRate ?? ''
    case 'transport_type':    return item.trip?.transport_type ?? ''
    case 'odometer_mode':     return item.trip?.odometer_mode ?? ''

    // TNG
    case 'tng_trans_no':      return item.tng_trans_no ?? ''
    case 'paid_via_tng':      return yesNo(item.paid_via_tng)

    // Per Diem
    case 'perdiem_days':      return item.perdiem_days ?? ''
    case 'perdiem_rate':      return item.perdiem_rate_myr ?? ''
    case 'perdiem_destination': return item.perdiem_destination ?? ''

    // Meal / Lodging
    case 'meal_session':      return item.meal_session ?? ''
    case 'lodging_check_in':  return formatDate(item.lodging_check_in)
    case 'lodging_check_out': return formatDate(item.lodging_check_out)

    default:                  return ''
  }
}

// ── Flatten: claims → rows ─────────────────────────────────────────────────────
// Each item becomes one row. Claim-level columns repeat per item.
function flattenToRows(
  claims:      ClaimForExport[],
  columns:     ExportColumnKey[],
  mileageRate?: number,
): (string | number)[][] {
  const rows: (string | number)[][] = []

  for (const claim of claims) {
    if (claim.items.length === 0) {
      // Claim with no items — output one row of claim-level columns only
      rows.push(columns.map((k) => getCellValue(k, claim, {} as ItemForExport, mileageRate)))
    } else {
      for (const item of claim.items) {
        rows.push(columns.map((k) => getCellValue(k, claim, item, mileageRate)))
      }
    }
  }

  return rows
}

// ── CSV builder ───────────────────────────────────────────────────────────────
export function buildCSV(
  claims:  ClaimForExport[],
  options: BuildExportOptions = {},
): string {
  const columns = options.columns?.length ? options.columns : PRESET_COLUMNS.STANDARD
  const headers = columns.map(getColumnLabel)
  const rows    = flattenToRows(claims, columns, options.mileageRatePerKm)

  const escape = (v: string | number): string => {
    const s = String(v)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const lines = [
    headers.map(escape).join(','),
    ...rows.map((row) => row.map(escape).join(',')),
  ]

  return lines.join('\r\n')
}

// ── XLSX builder ──────────────────────────────────────────────────────────────
export async function buildXLSX(
  claims:  ClaimForExport[],
  options: BuildExportOptions = {},
): Promise<Buffer> {
  const columns = options.columns?.length ? options.columns : PRESET_COLUMNS.STANDARD
  const headers = columns.map(getColumnLabel)
  const rows    = flattenToRows(claims, columns, options.mileageRatePerKm)

  const workbook  = new ExcelJS.Workbook()
  workbook.creator = 'myexpensio'

  const sheet = workbook.addWorksheet('Claims', {
    pageSetup: { paperSize: 9, orientation: 'landscape' },
  })

  // Header row
  sheet.addRow(headers)
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8F0FE' },   // light blue
  }
  headerRow.border = {
    bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
  }

  // Data rows
  for (const row of rows) {
    sheet.addRow(row)
  }

  // Column widths — auto-fit with a minimum
  columns.forEach((_, i) => {
    const col       = sheet.getColumn(i + 1)
    const headerLen = headers[i]?.length ?? 10
    const maxDataLen = Math.min(
      50,
      Math.max(
        headerLen,
        ...rows.slice(0, 100).map((r) => String(r[i] ?? '').length)
      )
    )
    col.width = Math.max(10, maxDataLen + 2)
  })

  // Freeze header row
  sheet.views = [{ state: 'frozen', ySplit: 1 }]

  // Auto-filter on header
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to:   { row: 1, column: columns.length },
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// ── buildExport — main entry point ────────────────────────────────────────────
// Called by /api/exports route handler.
// Returns a Buffer + the appropriate content-type header value.

export async function buildExport(
  claims:  ClaimForExport[],
  format:  'CSV' | 'XLSX' | 'PDF',
  options: BuildExportOptions = {},
): Promise<{ buffer: Buffer; contentType: string; extension: string }> {
  switch (format) {
    case 'CSV': {
      const csv = buildCSV(claims, options)
      return {
        buffer:      Buffer.from(csv, 'utf-8'),
        contentType: 'text/csv; charset=utf-8',
        extension:   'csv',
      }
    }
    case 'XLSX': {
      const buf = await buildXLSX(claims, options)
      return {
        buffer:      buf,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension:   'xlsx',
      }
    }
    case 'PDF':
      // PDF path: pdf-builder.ts handles this.
      // The calling route should use buildPdfData() from pdf-builder, not this function.
      throw new Error('PDF format: use pdf-builder.ts → buildPdfData(), not buildExport()')

    default:
      throw new Error(`Unknown format: ${format}`)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPATIBILITY SHIM — Legacy flat-row API used by pdf-builder.ts
//
// pdf-builder.ts was written against an older version of this module that
// exposed a "fetch + flatten to flat rows" API. That API was replaced by the
// ClaimForExport/ItemForExport nested types above (used by CSV/XLSX builders).
//
// To avoid rewriting the 500-line pdf-builder.ts rendering engine, we re-expose
// the old types and function here as a bridge layer.
// ─────────────────────────────────────────────────────────────────────────────

// ── ExportFilters ─────────────────────────────────────────────────────────────
// Filter params accepted by buildExportRows.
export type ExportFilters = {
  org_id:          string
  claim_ids?:      string[]           // filter by specific IDs (preferred path)
  date_from?:      string             // YYYY-MM-DD — filter by period_start >=
  date_to?:        string             // YYYY-MM-DD — filter by period_end <=
  filter_status?:  'SUBMITTED' | 'DRAFT' | 'ALL'
}

// ── ExportRow ─────────────────────────────────────────────────────────────────
// One flat row per claim item — the format pdf-builder.ts uses internally.
// Field names follow the convention established in the original pdf-builder.
export type ExportRow = {
  // Claim-level (repeated per item)
  claim_id:            string
  claim_title:         string
  claim_status:        string
  period_start:        string         // YYYY-MM-DD
  period_end:          string         // YYYY-MM-DD
  submitted_at:        string         // YYYY-MM-DD or ''
  total_amount:        number
  // Item-level
  item_id:             string
  item_type:           string         // MILEAGE | MEAL | LODGING | TOLL | PARKING | ...
  item_date:           string         // YYYY-MM-DD
  item_amount_myr:     string         // string so pdf-builder can call parseFloat(row.item_amount_myr)
  item_merchant:       string
  item_notes:          string
  item_mode:           string         // FIXED_RATE | RECEIPT | ''
  item_qty:            string         // quantity as string
  item_rate_myr:       string         // rate as string (named item_rate_myr to match pdf-builder)
  receipt_present:     'Y' | 'N'
  receipt_url:         string
  item_meal_session:   string         // FULL_DAY | MORNING | NOON | EVENING | ''
  // Mileage / trip
  final_distance_km:   string         // e.g. '12.34' or ''
  distance_source:     string
  transport_type:      string
  odometer_mode:       string
  mileage_rate:        string         // rate per km as string, or ''
  // TNG
  tng_trans_no:        string
  paid_via_tng:        string         // 'Y' | 'N'
  tng_transaction_id:  string
  // Per Diem
  perdiem_days:        string
  perdiem_rate:        string
  perdiem_destination: string
  // Lodging
  lodging_check_in:    string
  lodging_check_out:   string
}

// ── buildExportRows ───────────────────────────────────────────────────────────
// Fetches claims from Supabase using the given filters and returns a flat list
// of ExportRow — one row per claim item (claim-level fields repeated per item).
//
// Called by pdf-builder.ts → buildPdfData() to load data for PDF generation.
// CSV/XLSX builders use the newer ClaimForExport path via /api/exports route.
export async function buildExportRows(
  supabase: SupabaseClient,
  filters:  ExportFilters,
): Promise<{ rows: ExportRow[]; error: string | null }> {

  // Build base query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('claims')
    .select(`
      id, title, status, period_start, period_end, submitted_at, total_amount,
      claim_items (
        id, type, amount, claim_date, merchant, notes, receipt_url,
        paid_via_tng, tng_transaction_id,
        qty, rate, mode,
        meal_session,
        lodging_check_in, lodging_check_out,
        perdiem_days, perdiem_rate_myr, perdiem_destination,
        tng_transactions ( trans_no ),
        trips (
          id, origin_text, destination_text,
          final_distance_m, distance_source,
          transport_type, odometer_mode
        )
      )
    `)
    .eq('org_id', filters.org_id)

  // Apply filters
  if (filters.claim_ids?.length) {
    query = query.in('id', filters.claim_ids)
  }
  if (filters.date_from) {
    query = query.gte('period_start', filters.date_from)
  }
  if (filters.date_to) {
    query = query.lte('period_end', filters.date_to)
  }
  if (filters.filter_status && filters.filter_status !== 'ALL') {
    query = query.eq('status', filters.filter_status)
  }

  const { data: claims, error } = await query.order('period_start', { ascending: false })

  if (error) {
    console.error('[buildExportRows] DB error:', error)
    return { rows: [], error: error.message }
  }

  if (!claims?.length) {
    return { rows: [], error: null }
  }

  // Flatten claims → ExportRow[]
  const rows: ExportRow[] = []

  for (const claim of claims) {
    const claimItems = Array.isArray(claim.claim_items)
      ? claim.claim_items
      : [claim.claim_items].filter(Boolean)

    for (const item of claimItems) {
      if (!item) continue

      const tngTx = Array.isArray(item.tng_transactions)
        ? item.tng_transactions[0]
        : item.tng_transactions
      const trip = Array.isArray(item.trips)
        ? item.trips[0]
        : item.trips

      rows.push({
        // Claim-level
        claim_id:            claim.id            ?? '',
        claim_title:         claim.title          ?? '',
        claim_status:        claim.status         ?? '',
        period_start:        formatDate(claim.period_start),
        period_end:          formatDate(claim.period_end),
        submitted_at:        formatDate(claim.submitted_at),
        total_amount:        Number(claim.total_amount ?? 0),
        // Item-level
        item_id:             item.id              ?? '',
        item_type:           item.type            ?? '',
        item_date:           formatDate(item.claim_date),
        item_amount_myr:     String(Number(item.amount ?? 0)),
        item_merchant:       item.merchant        ?? '',
        item_notes:          item.notes           ?? '',
        item_mode:           item.mode            ?? '',
        item_qty:            item.qty != null      ? String(item.qty)  : '',
        item_rate_myr:       item.rate != null     ? String(item.rate) : '',
        receipt_present:     item.receipt_url ? 'Y' : 'N',
        receipt_url:         item.receipt_url     ?? '',
        item_meal_session:   item.meal_session    ?? '',
        // Mileage / trip
        final_distance_km:   trip?.final_distance_m != null
          ? metersToKm(Number(trip.final_distance_m))
          : '',
        distance_source:     trip?.distance_source  ?? '',
        transport_type:      trip?.transport_type   ?? '',
        odometer_mode:       trip?.odometer_mode    ?? '',
        mileage_rate:        '',   // not stored on trips; fetched separately if needed
        // TNG
        tng_trans_no:        (tngTx as Record<string, unknown> | null)?.trans_no as string ?? '',
        paid_via_tng:        item.paid_via_tng ? 'Y' : 'N',
        tng_transaction_id:  item.tng_transaction_id ?? '',
        // Per Diem
        perdiem_days:        item.perdiem_days != null
          ? String(item.perdiem_days)
          : '',
        perdiem_rate:        item.perdiem_rate_myr != null
          ? String(item.perdiem_rate_myr)
          : '',
        perdiem_destination: item.perdiem_destination ?? '',
        // Lodging
        lodging_check_in:    formatDate(item.lodging_check_in),
        lodging_check_out:   formatDate(item.lodging_check_out),
      })
    }
  }

  return { rows, error: null }
}
