// packages/types/src/transport-claims.ts
//
// Type additions for Transport Claims Upgrade (10 Mar 2026)
// Merge these into packages/types/src/index.ts
//
// Changes from existing types:
//   - ClaimItemType: extended with TOLL | PARKING | TAXI | GRAB | TRAIN | FLIGHT
//   - Trip: extended with transport_type field
//   - New: TransportType enum
//   - New: TngTransaction type
//   - New: TngParsedRow type (pre-save preview from /api/tng/parse)

// ── Claim item types (updated) ────────────────────────────────────────────────

export type ClaimItemType =
  | 'MILEAGE'
  | 'MEAL'
  | 'LODGING'
  | 'TOLL'
  | 'PARKING'
  | 'TAXI'
  | 'GRAB'
  | 'TRAIN'
  | 'FLIGHT'

// Display labels for UI and exports
export const CLAIM_ITEM_TYPE_LABELS: Record<ClaimItemType, string> = {
  MILEAGE: 'Mileage',
  MEAL:    'Meal',
  LODGING: 'Lodging',
  TOLL:    'Toll',
  PARKING: 'Parking',
  TAXI:    'Taxi',
  GRAB:    'Grab',
  TRAIN:   'Train',
  FLIGHT:  'Flight',
}

// ── Transport type for trips (new) ───────────────────────────────────────────

export type TransportType =
  | 'personal_car'
  | 'grab'
  | 'taxi'
  | 'train'
  | 'flight'
  | 'company_driver'

export const TRANSPORT_TYPE_LABELS: Record<TransportType, string> = {
  personal_car:   'Personal Car',
  grab:           'Grab',
  taxi:           'Taxi',
  train:          'Train / Commuter',
  flight:         'Flight',
  company_driver: 'Company Driver',
}

// Which claim item types are relevant per transport type
// (guides the UI — hides irrelevant add-item options)
export const TRANSPORT_ITEM_TYPES: Record<TransportType, ClaimItemType[]> = {
  personal_car:   ['MILEAGE', 'TOLL', 'PARKING'],
  grab:           ['GRAB', 'TOLL', 'PARKING'],
  taxi:           ['TAXI'],
  train:          ['TRAIN'],
  flight:         ['FLIGHT', 'TAXI', 'GRAB', 'PARKING'],
  company_driver: ['TOLL', 'PARKING'],
}

// ── TNG transaction (stored in DB) ───────────────────────────────────────────

export type TngSector = 'TOLL' | 'PARKING' | 'RETAIL'

export type TngTransaction = {
  id:              string
  org_id:          string
  user_id:         string
  trans_no:        string | null
  entry_datetime:  string | null   // ISO 8601 with +08:00
  exit_datetime:   string | null
  entry_location:  string | null
  exit_location:   string | null
  amount:          number           // MYR
  currency:        'MYR'
  sector:          TngSector
  source_file_url: string | null
  upload_batch_id: string | null
  claimed:         boolean
  claim_item_id:   string | null
  created_at:      string
}

// ── TNG parsed row (pre-save, returned by /api/tng/parse) ────────────────────

export type TngParsedRow = {
  trans_no:       string | null
  entry_datetime: string | null
  exit_datetime:  string | null
  entry_location: string | null
  exit_location:  string | null
  amount:         number
  sector:         'TOLL' | 'PARKING'   // RETAIL is filtered out before returning
}

// ── API response shapes ───────────────────────────────────────────────────────

// POST /api/tng/parse → TngParseResponse
export type TngParseResponse = {
  total_extracted: number
  toll_count:      number
  parking_count:   number
  rows:            TngParsedRow[]
  toll_rows:       TngParsedRow[]
  parking_rows:    TngParsedRow[]
}

// POST /api/tng/transactions → TngSaveResponse
export type TngSaveResponse = {
  upload_batch_id: string
  saved_count:     number
  skipped_count:   number
  message:         string
}

// GET /api/tng/transactions → TngTransactionsListResponse
export type TngTransactionsListResponse = {
  items: TngTransaction[]
  count: number
}

// ── Helper: display label for a TNG transaction ───────────────────────────────

export function tngTransactionLabel(txn: TngTransaction | TngParsedRow): string {
  if (txn.entry_location && txn.exit_location && txn.entry_location !== txn.exit_location) {
    return `${txn.entry_location} → ${txn.exit_location}`
  }
  return txn.entry_location ?? 'Unknown location'
}

// ── Helper: format MYR amount ────────────────────────────────────────────────

export function formatMYR(amount: number): string {
  return `RM${amount.toFixed(2)}`
}
