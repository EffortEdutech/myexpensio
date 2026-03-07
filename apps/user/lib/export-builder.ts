// apps/user/lib/export-builder.ts
// Shared export data logic.
//
// INSTALL (run once):
//   npm install exceljs
//
// Responsibilities:
//   1. Fetch claims + items + trips from DB for given filters
//   2. Build flat rows per Doc 17 (one row per claim item)
//   3. Generate CSV string
//   4. Generate XLSX Buffer via exceljs

import type { SupabaseClient } from '@supabase/supabase-js'
import ExcelJS from 'exceljs'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ExportFilters = {
  org_id:        string
  claim_ids?:    string[]  // when set — export exactly these claims (ignores date/status filters)
  date_from?:    string    // YYYY-MM-DD  (filter on period_start)
  date_to?:      string    // YYYY-MM-DD  (filter on period_end)
  filter_status: 'SUBMITTED' | 'DRAFT' | 'ALL'
}

export type ExportRow = {
  // Claim
  claim_id:           string
  claim_title:        string
  claim_status:       string
  period_start:       string
  period_end:         string
  submitted_at:       string
  claim_currency:     string
  claim_total_myr:    string

  // Item
  item_id:            string
  item_type:          string
  item_date:          string
  item_mode:          string
  item_meal_session:  string
  item_merchant:      string
  item_qty:           string
  item_unit:          string
  item_rate_myr:      string
  item_amount_myr:    string
  receipt_present:    string   // Y | N
  item_notes:         string

  // Mileage extras (blank for MEAL/LODGING)
  trip_id:                    string
  trip_started_at:            string
  trip_ended_at:              string
  gps_distance_km:            string
  selected_route_distance_km: string
  odometer_distance_km:       string
  odometer_mode:              string
  final_distance_km:          string
  distance_source:            string
}

// ── Column headers (order matters — matches ExportRow keys) ───────────────────

export const EXPORT_COLUMNS: { key: keyof ExportRow; header: string }[] = [
  // Claim
  { key: 'claim_id',           header: 'Claim ID'           },
  { key: 'claim_title',        header: 'Claim Title'        },
  { key: 'claim_status',       header: 'Status'             },
  { key: 'period_start',       header: 'Period Start'       },
  { key: 'period_end',         header: 'Period End'         },
  { key: 'submitted_at',       header: 'Submitted At'       },
  { key: 'claim_currency',     header: 'Currency'           },
  { key: 'claim_total_myr',    header: 'Claim Total (MYR)'  },
  // Item
  { key: 'item_id',            header: 'Item ID'            },
  { key: 'item_type',          header: 'Item Type'          },
  { key: 'item_date',          header: 'Item Date'          },
  { key: 'item_mode',          header: 'Mode'               },
  { key: 'item_meal_session',  header: 'Meal Session'       },
  { key: 'item_merchant',      header: 'Merchant'           },
  { key: 'item_qty',           header: 'Qty'                },
  { key: 'item_unit',          header: 'Unit'               },
  { key: 'item_rate_myr',      header: 'Rate (MYR)'         },
  { key: 'item_amount_myr',    header: 'Amount (MYR)'       },
  { key: 'receipt_present',    header: 'Receipt'            },
  { key: 'item_notes',         header: 'Notes'              },
  // Trip / mileage audit trail
  { key: 'trip_id',                    header: 'Trip ID'                    },
  { key: 'trip_started_at',            header: 'Trip Start'                 },
  { key: 'trip_ended_at',              header: 'Trip End'                   },
  { key: 'gps_distance_km',            header: 'GPS Distance (KM)'          },
  { key: 'selected_route_distance_km', header: 'Route Distance (KM)'        },
  { key: 'odometer_distance_km',       header: 'Odometer Distance (KM)'     },
  { key: 'odometer_mode',              header: 'Odometer Mode'              },
  { key: 'final_distance_km',          header: 'Official Distance (KM)'     },
  { key: 'distance_source',            header: 'Distance Source'            },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const mToKm = (m: number | null | undefined): string =>
  m != null ? (m / 1000).toFixed(2) : ''

const fmtDateOnly = (iso: string | null | undefined): string =>
  iso ? iso.slice(0, 10) : ''

const fmtDateTime = (iso: string | null | undefined): string => {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-MY', {
    timeZone:  'Asia/Kuala_Lumpur',
    year:      'numeric', month: '2-digit', day: '2-digit',
    hour:      '2-digit', minute: '2-digit',
  })
}

const fmtNum = (n: number | null | undefined): string =>
  n != null ? Number(n).toFixed(2) : ''

// ── Main: fetch + build rows ──────────────────────────────────────────────────

export async function buildExportRows(
  supabase: SupabaseClient,
  filters: ExportFilters,
): Promise<{ rows: ExportRow[]; error: string | null }> {

  // 1. Fetch claims matching filters
  let claimsQ = supabase
    .from('claims')
    .select(`
      id, title, status,
      period_start, period_end,
      submitted_at, currency, total_amount
    `)
    .eq('org_id', filters.org_id)
    .order('period_start', { ascending: false })

  if (filters.claim_ids && filters.claim_ids.length > 0) {
    // Specific claim IDs — ignore date/status filters
    claimsQ = claimsQ.in('id', filters.claim_ids)
  } else {
    if (filters.filter_status !== 'ALL')
      claimsQ = claimsQ.eq('status', filters.filter_status)
    if (filters.date_from)
      claimsQ = claimsQ.gte('period_start', filters.date_from)
    if (filters.date_to)
      claimsQ = claimsQ.lte('period_start', filters.date_to)
  }

  const { data: claims, error: claimsErr } = await claimsQ
  if (claimsErr)
    return { rows: [], error: `Failed to fetch claims: ${claimsErr.message}` }
  if (!claims || claims.length === 0)
    return { rows: [], error: null }   // empty export is valid

  const claimIds = claims.map(c => c.id)

  // 2. Fetch all items for matched claims
  const { data: items, error: itemsErr } = await supabase
    .from('claim_items')
    .select(`
      id, claim_id, type, mode,
      trip_id, qty, unit, rate, amount,
      receipt_url, merchant, notes,
      claim_date, meal_session,
      lodging_check_in, lodging_check_out
    `)
    .in('claim_id', claimIds)
    .order('claim_id', { ascending: true })
    .order('claim_date', { ascending: true })

  if (itemsErr)
    return { rows: [], error: `Failed to fetch items: ${itemsErr.message}` }

  // 3. Fetch all linked trips
  const tripIds = [...new Set(
    (items ?? []).map(i => i.trip_id).filter(Boolean)
  )] as string[]

  let tripsMap: Record<string, {
    started_at: string | null; ended_at: string | null
    gps_distance_m: number | null; selected_route_distance_m: number | null
    odometer_distance_m: number | null; odometer_mode: string | null
    final_distance_m: number | null; distance_source: string | null
  }> = {}

  if (tripIds.length > 0) {
    const { data: trips, error: tripsErr } = await supabase
      .from('trips')
      .select(`
        id, started_at, ended_at,
        gps_distance_m, selected_route_distance_m,
        odometer_distance_m, odometer_mode,
        final_distance_m, distance_source
      `)
      .in('id', tripIds)

    if (tripsErr)
      return { rows: [], error: `Failed to fetch trips: ${tripsErr.message}` }

    ;(trips ?? []).forEach(t => { tripsMap[t.id] = t })
  }

  // 4. Build flat rows (one row per item, claim data repeated)
  const claimsMap: Record<string, typeof claims[0]> = {}
  claims.forEach(c => { claimsMap[c.id] = c })

  const rows: ExportRow[] = (items ?? []).map(item => {
    const claim = claimsMap[item.claim_id]
    const trip  = item.trip_id ? tripsMap[item.trip_id] : null

    const itemDate = item.claim_date
      ?? item.lodging_check_in
      ?? null

    return {
      // ── Claim ──────────────────────────────────────────────────
      claim_id:        claim.id,
      claim_title:     claim.title ?? '',
      claim_status:    claim.status,
      period_start:    fmtDateOnly(claim.period_start),
      period_end:      fmtDateOnly(claim.period_end),
      submitted_at:    fmtDateTime(claim.submitted_at),
      claim_currency:  claim.currency ?? 'MYR',
      claim_total_myr: fmtNum(claim.total_amount),

      // ── Item ───────────────────────────────────────────────────
      item_id:           item.id,
      item_type:         item.type,
      item_date:         fmtDateOnly(itemDate),
      item_mode:         item.mode ?? '',
      item_meal_session: item.meal_session ?? '',
      item_merchant:     item.merchant ?? '',
      item_qty:          fmtNum(item.qty),
      item_unit:         item.unit ?? '',
      item_rate_myr:     fmtNum(item.rate),
      item_amount_myr:   fmtNum(item.amount),
      receipt_present:   item.receipt_url ? 'Y' : 'N',
      item_notes:        item.notes ?? '',

      // ── Trip / mileage audit trail ─────────────────────────────
      trip_id:                    trip ? (item.trip_id ?? '') : '',
      trip_started_at:            trip ? fmtDateTime(trip.started_at)           : '',
      trip_ended_at:              trip ? fmtDateTime(trip.ended_at)             : '',
      gps_distance_km:            trip ? mToKm(trip.gps_distance_m)            : '',
      selected_route_distance_km: trip ? mToKm(trip.selected_route_distance_m) : '',
      odometer_distance_km:       trip ? mToKm(trip.odometer_distance_m)       : '',
      odometer_mode:              trip ? (trip.odometer_mode ?? '')             : '',
      final_distance_km:          trip ? mToKm(trip.final_distance_m)          : '',
      distance_source:            trip ? (trip.distance_source ?? '')           : '',
    }
  })

  return { rows, error: null }
}

// ── CSV generator ─────────────────────────────────────────────────────────────

export function generateCSV(rows: ExportRow[]): string {
  const escape = (v: string) =>
    v.includes(',') || v.includes('"') || v.includes('\n')
      ? `"${v.replace(/"/g, '""')}"`
      : v

  const headers = EXPORT_COLUMNS.map(c => escape(c.header)).join(',')

  const dataRows = rows.map(row =>
    EXPORT_COLUMNS.map(c => escape(String(row[c.key] ?? ''))).join(',')
  )

  return [headers, ...dataRows].join('\r\n')
}

// ── XLSX generator ────────────────────────────────────────────────────────────

export async function generateXLSX(rows: ExportRow[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator  = 'myexpensio'
  wb.created  = new Date()

  const ws = wb.addWorksheet('Claims', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  // ── Columns + widths ────────────────────────────────────────────────────
  ws.columns = EXPORT_COLUMNS.map(c => ({
    key:   c.key,
    header: c.header,
    width:  colWidth(c.key),
  }))

  // ── Header row styling ──────────────────────────────────────────────────
  const headerRow = ws.getRow(1)
  headerRow.eachCell(cell => {
    cell.font      = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false }
    cell.border    = {
      bottom: { style: 'thin', color: { argb: 'FF334155' } }
    }
  })
  headerRow.height = 22

  // ── Data rows ───────────────────────────────────────────────────────────
  rows.forEach((row, i) => {
    const wsRow = ws.addRow(
      EXPORT_COLUMNS.reduce((acc, c) => {
        acc[c.key] = row[c.key] ?? ''
        return acc
      }, {} as Record<string, string>)
    )
    // Alternate row shading
    if (i % 2 === 0) {
      wsRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
      })
    }
    // Right-align numeric columns
    NUMERIC_KEYS.forEach(k => {
      const cell = wsRow.getCell(k)
      cell.alignment = { horizontal: 'right' }
    })
    wsRow.height = 18
  })

  // ── Summary row ─────────────────────────────────────────────────────────
  if (rows.length > 0) {
    ws.addRow({})   // blank separator

    const lastDataRow = rows.length + 1   // +1 for header
    const amtCol      = EXPORT_COLUMNS.findIndex(c => c.key === 'item_amount_myr') + 1
    const colLetter   = ws.getColumn(amtCol).letter

    const summaryRow = ws.addRow({
      claim_title:     `Total (${rows.length} items)`,
      item_amount_myr: { formula: `SUM(${colLetter}2:${colLetter}${lastDataRow})` },
    })
    summaryRow.getCell('claim_title').font = { bold: true }
    summaryRow.getCell('item_amount_myr').font      = { bold: true }
    summaryRow.getCell('item_amount_myr').alignment = { horizontal: 'right' }
  }

  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf)
}

// ── Column widths ─────────────────────────────────────────────────────────────

const NUMERIC_KEYS: Array<keyof ExportRow> = [
  'claim_total_myr', 'item_qty', 'item_rate_myr', 'item_amount_myr',
  'gps_distance_km', 'selected_route_distance_km', 'odometer_distance_km',
  'final_distance_km',
]

function colWidth(key: keyof ExportRow): number {
  const widths: Partial<Record<keyof ExportRow, number>> = {
    claim_id:                    36,
    claim_title:                 24,
    claim_status:                12,
    period_start:                14,
    period_end:                  14,
    submitted_at:                20,
    claim_currency:               8,
    claim_total_myr:             16,
    item_id:                     36,
    item_type:                   12,
    item_date:                   14,
    item_mode:                   14,
    item_meal_session:           16,
    item_merchant:               22,
    item_qty:                    10,
    item_unit:                    8,
    item_rate_myr:               12,
    item_amount_myr:             16,
    receipt_present:             10,
    item_notes:                  28,
    trip_id:                     36,
    trip_started_at:             20,
    trip_ended_at:               20,
    gps_distance_km:             18,
    selected_route_distance_km:  20,
    odometer_distance_km:        20,
    odometer_mode:               16,
    final_distance_km:           20,
    distance_source:             18,
  }
  return widths[key] ?? 16
}
