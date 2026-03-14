// apps/user/lib/export-columns.ts
//
// Copied from packages/shared/export-columns.ts
// CANONICAL column registry for the export template system.
// Keep in sync with DB schema — if you add a new claim_items field, add it here.

export type ExportColumnKey =
  // ── Claim-level ──────────────────────────────────────────
  | 'claim_id'
  | 'claim_title'
  | 'user_name'
  | 'user_email'
  | 'period_start'
  | 'period_end'
  | 'submitted_at'
  | 'total_amount'
  // ── Item-level (core) ────────────────────────────────────
  | 'item_id'
  | 'item_type'
  | 'item_date'
  | 'amount'
  | 'currency'
  | 'merchant'
  | 'notes'
  | 'receipt_present'
  | 'receipt_url'
  // ── Mileage / trip ───────────────────────────────────────
  | 'trip_origin'
  | 'trip_destination'
  | 'distance_km'
  | 'distance_source'
  | 'mileage_rate'
  | 'transport_type'
  | 'odometer_mode'
  // ── Transport / TNG ──────────────────────────────────────
  | 'tng_trans_no'
  | 'paid_via_tng'
  // ── Per Diem ─────────────────────────────────────────────
  | 'perdiem_days'
  | 'perdiem_rate'
  | 'perdiem_destination'
  // ── Meal / Lodging ───────────────────────────────────────
  | 'meal_session'
  | 'lodging_check_in'
  | 'lodging_check_out'

export type ColumnPreset = 'STANDARD' | 'COMPLETE'

export type ColumnDef = {
  key: ExportColumnKey
  label: string
  description: string
  presets: ColumnPreset[]
  group: string
}

// ── Master column list ────────────────────────────────────────────────────────
export const ALL_COLUMNS: ColumnDef[] = [
  // Claim-level
  { key: 'claim_id',            label: 'Claim ID',            description: 'Unique claim identifier (UUID)',                  presets: ['STANDARD', 'COMPLETE'], group: 'Claim' },
  { key: 'claim_title',         label: 'Claim Title',         description: 'Title set by the staff member',                  presets: ['STANDARD', 'COMPLETE'], group: 'Claim' },
  { key: 'user_name',           label: 'Staff Name',          description: 'Display name of the claimant',                   presets: ['STANDARD', 'COMPLETE'], group: 'Claim' },
  { key: 'user_email',          label: 'Staff Email',         description: 'Email address of the claimant',                  presets: ['STANDARD', 'COMPLETE'], group: 'Claim' },
  { key: 'period_start',        label: 'Period Start',        description: 'Claim period start date',                        presets: ['STANDARD', 'COMPLETE'], group: 'Claim' },
  { key: 'period_end',          label: 'Period End',          description: 'Claim period end date',                          presets: ['STANDARD', 'COMPLETE'], group: 'Claim' },
  { key: 'submitted_at',        label: 'Submitted At',        description: 'Date the claim was submitted',                   presets: ['STANDARD', 'COMPLETE'], group: 'Claim' },
  { key: 'total_amount',        label: 'Total Amount (MYR)',  description: 'Total reimbursable amount',                      presets: ['STANDARD', 'COMPLETE'], group: 'Claim' },

  // Item-level core
  { key: 'item_id',             label: 'Item ID',             description: 'Unique item identifier (UUID)',                   presets: ['COMPLETE'],            group: 'Item' },
  { key: 'item_type',           label: 'Item Type',           description: 'MILEAGE / MEAL / LODGING / TOLL / PARKING / etc', presets: ['STANDARD', 'COMPLETE'], group: 'Item' },
  { key: 'item_date',           label: 'Item Date',           description: 'Date of the expense',                            presets: ['STANDARD', 'COMPLETE'], group: 'Item' },
  { key: 'amount',              label: 'Amount (MYR)',        description: 'Item amount in MYR',                             presets: ['STANDARD', 'COMPLETE'], group: 'Item' },
  { key: 'currency',            label: 'Currency',            description: 'Currency code (always MYR in Phase 1)',          presets: ['COMPLETE'],            group: 'Item' },
  { key: 'merchant',            label: 'Merchant',            description: 'Merchant or payee name',                         presets: ['STANDARD', 'COMPLETE'], group: 'Item' },
  { key: 'notes',               label: 'Notes',               description: 'Free-text notes for the item',                   presets: ['COMPLETE'],            group: 'Item' },
  { key: 'receipt_present',     label: 'Receipt Present',     description: 'Y if a receipt was uploaded',                    presets: ['STANDARD', 'COMPLETE'], group: 'Item' },
  { key: 'receipt_url',         label: 'Receipt URL',         description: 'Signed URL to the receipt file',                 presets: ['COMPLETE'],            group: 'Item' },

  // Mileage / trip
  { key: 'trip_origin',         label: 'Origin',              description: 'Trip origin address',                            presets: ['STANDARD', 'COMPLETE'], group: 'Mileage' },
  { key: 'trip_destination',    label: 'Destination',         description: 'Trip destination address',                       presets: ['STANDARD', 'COMPLETE'], group: 'Mileage' },
  { key: 'distance_km',         label: 'Distance (KM)',       description: 'Final distance in kilometres (2 decimals)',      presets: ['STANDARD', 'COMPLETE'], group: 'Mileage' },
  { key: 'distance_source',     label: 'Distance Source',     description: 'ROUTE_API / GPS / ODOMETER / MANUAL',           presets: ['COMPLETE'],            group: 'Mileage' },
  { key: 'mileage_rate',        label: 'Mileage Rate (MYR/km)', description: 'Rate per km at time of claim',               presets: ['STANDARD', 'COMPLETE'], group: 'Mileage' },
  { key: 'transport_type',      label: 'Transport Type',      description: 'CAR / MOTORCYCLE / VAN / etc',                  presets: ['COMPLETE'],            group: 'Mileage' },
  { key: 'odometer_mode',       label: 'Odometer Mode',       description: 'NONE / EVIDENCE_ONLY / OVERRIDE',              presets: ['COMPLETE'],            group: 'Mileage' },

  // TNG
  { key: 'tng_trans_no',        label: 'TNG Trans No',        description: 'TNG eWallet transaction number',                presets: ['COMPLETE'],            group: 'Transport' },
  { key: 'paid_via_tng',        label: 'Paid via TNG',        description: 'Y if paid through TNG eWallet',                presets: ['COMPLETE'],            group: 'Transport' },

  // Per Diem
  { key: 'perdiem_days',        label: 'Per Diem Days',       description: 'Number of days claimed',                        presets: ['COMPLETE'],            group: 'Per Diem' },
  { key: 'perdiem_rate',        label: 'Per Diem Rate (MYR)', description: 'Daily rate at time of claim',                  presets: ['COMPLETE'],            group: 'Per Diem' },
  { key: 'perdiem_destination', label: 'Destination',         description: 'Outstation destination for per diem',          presets: ['COMPLETE'],            group: 'Per Diem' },

  // Meal / Lodging
  { key: 'meal_session',        label: 'Meal Session',        description: 'FULL_DAY / MORNING / NOON / EVENING',          presets: ['COMPLETE'],            group: 'Meal & Lodging' },
  { key: 'lodging_check_in',    label: 'Check-in Date',       description: 'Lodging check-in date',                        presets: ['COMPLETE'],            group: 'Meal & Lodging' },
  { key: 'lodging_check_out',   label: 'Check-out Date',      description: 'Lodging check-out date',                       presets: ['COMPLETE'],            group: 'Meal & Lodging' },
]

// ── Preset column key sets ────────────────────────────────────────────────────
export const PRESET_COLUMNS: Record<ColumnPreset, ExportColumnKey[]> = {
  STANDARD: ALL_COLUMNS.filter((c) => c.presets.includes('STANDARD')).map((c) => c.key),
  COMPLETE: ALL_COLUMNS.map((c) => c.key),
}

// ── Helper: resolve columns for a template schema ────────────────────────────
export function resolveColumns(schema: {
  preset?: ColumnPreset
  columns?: ExportColumnKey[]
}): ExportColumnKey[] {
  if (schema.columns && schema.columns.length > 0) {
    const validKeys = new Set(ALL_COLUMNS.map((c) => c.key))
    return schema.columns.filter((k) => validKeys.has(k))
  }
  const preset = schema.preset ?? 'STANDARD'
  return PRESET_COLUMNS[preset] ?? PRESET_COLUMNS.STANDARD
}

// ── Column lookup by key ──────────────────────────────────────────────────────
export function getColumnDef(key: ExportColumnKey): ColumnDef | undefined {
  return ALL_COLUMNS.find((c) => c.key === key)
}

// ── Column header label lookup ────────────────────────────────────────────────
export function getColumnLabel(key: ExportColumnKey): string {
  return getColumnDef(key)?.label ?? key
}

// ── Groups list (for editor UI) ───────────────────────────────────────────────
export const COLUMN_GROUPS = [...new Set(ALL_COLUMNS.map((c) => c.group))]