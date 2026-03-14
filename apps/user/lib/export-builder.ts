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

import ExcelJS from 'exceljs'
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

function formatDate(d: string | null): string {
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
    case 'item_id':           return item.id
    case 'item_type':         return item.type
    case 'item_date':         return formatDate(item.claim_date)
    case 'amount':            return item.amount
    case 'currency':          return item.currency
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
    const col = sheet.getColumn(i + 1)
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
      // PDF path: existing pdf-builder.ts handles this.
      // The calling route should pass options.columns to pdf-builder for column filtering.
      // For now we throw — the /api/exports route handles PDF separately.
      throw new Error('PDF format: use pdf-builder.ts, not buildExport()')

    default:
      throw new Error(`Unknown format: ${format}`)
  }
}
