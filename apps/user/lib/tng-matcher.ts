// =============================================================================
// apps/user/lib/tng-matcher.ts
//
// TNG ↔ Claim Item matching engine.
//
// PURPOSE
//   Given a claim's TOLL/PARKING items and a user's unclaimed TNG transactions,
//   produce a scored, one-to-one match set that the UI presents for confirmation.
//
// DESIGN PRINCIPLES
//   - Deterministic: same inputs always produce same scores (no randomness/ML).
//   - Server-only: never imported into browser bundles.
//   - One-to-one: a single TNG transaction can match at most one claim item,
//     and vice versa. Greedy assignment by score DESC enforces this.
//   - Transparent: every match carries a breakdown[] so the UI can explain
//     why it was suggested (shown as badge text to the user).
//   - Zero external deps: only native TypeScript + date arithmetic.
//
// SCORING RUBRIC (max 115 points)
//   +40  exact date match       (tng exit_datetime date == claim_date, MYT)
//   +20  ±1 day proximity       (fallback for overnight tolls, late-night exits)
//   +30  exact amount match     (tng.amount == claim_item.amount, to 2 dp)
//   +15  near amount match      (|tng.amount - claim_item.amount| ≤ 0.10)
//   +10  location word overlap  (claim merchant contains a word from tng location)
//    +5  sector↔type match      (redundant gate, but adds confidence signal)
//
// THRESHOLDS
//   ≥ 80 → HIGH_CONFIDENCE  (pre-ticked ON)
//   ≥ 50 → SUGGESTED        (pre-ticked ON, amber badge)
//   ≥ 30 → POSSIBLE         (pre-ticked OFF, shown collapsed)
//    < 30 → not returned
//
// USAGE (server-side API route only)
//   import { matchTngToClaimItems } from '@/lib/tng-matcher'
//
//   const result = await matchTngToClaimItems({
//     claimItems: tollParkingItems,
//     tngRows:    unclaimedTngRows,
//   })
// =============================================================================

// ── Timezone constant ─────────────────────────────────────────────────────────
// All TNG timestamps are stored as UTC timestamptz.
// For date comparison we convert to MYT (UTC+8).
const MYT_OFFSET_MS = 8 * 60 * 60 * 1000

// ── Input types ───────────────────────────────────────────────────────────────

export type MatchableClaimItem = {
  id:          string            // claim_items.id
  type:        'TOLL' | 'PARKING' | 'TAXI' | 'GRAB' | 'TRAIN' | 'BUS'
  claim_date:  string            // YYYY-MM-DD (stored date, already MYT)
  amount:      number            // MYR, 0 if mode = 'TNG' (pending)
  merchant:    string | null     // free-text entry/exit label user typed
  mode:        string | null     // 'TNG' | 'MANUAL' | null
}

export type MatchableTngRow = {
  id:              string        // tng_transactions.id
  sector:          'TOLL' | 'PARKING' | 'RETAIL'
  exit_datetime:   string | null // ISO timestamptz string from Supabase
  entry_datetime:  string | null
  entry_location:  string | null
  exit_location:   string | null
  amount:          number        // MYR
  trans_no:        string | null
}

// ── Output types ──────────────────────────────────────────────────────────────

export type MatchConfidence = 'HIGH_CONFIDENCE' | 'SUGGESTED' | 'POSSIBLE'

export type ScoreBreakdown = {
  reason:  string   // human-readable label for the UI badge
  points:  number
}

export type TngMatch = {
  claim_item_id:       string
  tng_transaction_id:  string
  score:               number
  confidence:          MatchConfidence
  pre_ticked:          boolean          // true for HIGH_CONFIDENCE + SUGGESTED
  breakdown:           ScoreBreakdown[] // shown in the UI as "why matched"

  // Denormalised display fields (avoids a second DB fetch in the API route)
  claim_item_type:     'TOLL' | 'PARKING' | 'TAXI' | 'GRAB' | 'TRAIN' | 'BUS'
  claim_item_date:     string           // YYYY-MM-DD
  claim_item_amount:   number
  claim_item_merchant: string | null
  claim_item_mode:     string | null

  tng_amount:          number
  tng_date:            string           // YYYY-MM-DD MYT derived from exit_datetime
  tng_location:        string           // "ENTRY → EXIT" or single location
  tng_trans_no:        string | null
}

export type UnmatchedClaimItem = {
  id:       string
  type:     'TOLL' | 'PARKING' | 'TAXI' | 'GRAB' | 'TRAIN' | 'BUS'
  date:     string
  amount:   number
  merchant: string | null
  mode:     string | null
}

export type UnmatchedTngRow = {
  id:       string
  sector:   'TOLL' | 'PARKING' | 'RETAIL'
  date:     string
  amount:   number
  location: string
  trans_no: string | null
}

export type MatchResult = {
  matches:               TngMatch[]
  unmatched_claim_items: UnmatchedClaimItem[]
  unmatched_tng_rows:    UnmatchedTngRow[]
}

// ── Main export ───────────────────────────────────────────────────────────────

export function matchTngToClaimItems(input: {
  claimItems: MatchableClaimItem[]
  tngRows:    MatchableTngRow[]
}): MatchResult {
  const { claimItems, tngRows } = input

  // Process TOLL / PARKING plus transport-via-TNG items.
  const eligibleItems = claimItems.filter(i => isSupportedClaimItemType(i.type))
  const eligibleTng = tngRows.filter(
    t => t.sector === 'TOLL' || t.sector === 'PARKING' || t.sector === 'RETAIL'
  )

  // ── Step 1: Score every (item, txn) pair that passes eligibility gates ───────
  type ScoredPair = {
    item:  MatchableClaimItem
    txn:   MatchableTngRow
    score: number
    breakdown: ScoreBreakdown[]
  }

  const allPairs: ScoredPair[] = []

  for (const item of eligibleItems) {
    for (const txn of eligibleTng) {
      // Gate: sector must match type
      const sectorMatch =
        (item.type === 'TOLL'    && txn.sector === 'TOLL') ||
        (item.type === 'PARKING' && txn.sector === 'PARKING')
      if (!sectorMatch) continue

      const { score, breakdown } = scorePair(item, txn)
      if (score >= 30) {
        allPairs.push({ item, txn, score, breakdown })
      }
    }
  }

  // ── Step 2: Sort all pairs by score DESC ─────────────────────────────────────
  allPairs.sort((a, b) => b.score - a.score)

  // ── Step 3: Greedy one-to-one assignment ─────────────────────────────────────
  // Assign highest-score pair first. Once either side is assigned, skip.
  const assignedItemIds = new Set<string>()
  const assignedTxnIds  = new Set<string>()
  const finalMatches: TngMatch[] = []

  for (const pair of allPairs) {
    if (assignedItemIds.has(pair.item.id)) continue
    if (assignedTxnIds.has(pair.txn.id))   continue

    assignedItemIds.add(pair.item.id)
    assignedTxnIds.add(pair.txn.id)

    const confidence = scoreToConfidence(pair.score)
    finalMatches.push({
      claim_item_id:       pair.item.id,
      tng_transaction_id:  pair.txn.id,
      score:               pair.score,
      confidence,
      pre_ticked:          confidence !== 'POSSIBLE',
      breakdown:           pair.breakdown,

      claim_item_type:     pair.item.type,
      claim_item_date:     pair.item.claim_date,
      claim_item_amount:   pair.item.amount,
      claim_item_merchant: pair.item.merchant,
      claim_item_mode:     pair.item.mode,

      tng_amount:          pair.txn.amount,
      tng_date:            tngDateMyt(pair.txn.exit_datetime ?? pair.txn.entry_datetime),
      tng_location:        buildLocation(pair.txn),
      tng_trans_no:        pair.txn.trans_no,
    })
  }

  // ── Step 4: Unmatched on both sides ─────────────────────────────────────────
  const unmatched_claim_items: UnmatchedClaimItem[] = eligibleItems
    .filter(i => !assignedItemIds.has(i.id))
    .map(i => ({
      id:       i.id,
      type:     i.type,
      date:     i.claim_date,
      amount:   i.amount,
      merchant: i.merchant,
      mode:     i.mode,
    }))

  const unmatched_tng_rows: UnmatchedTngRow[] = eligibleTng
    .filter(t => !assignedTxnIds.has(t.id))
    .map(t => ({
      id:       t.id,
      sector:   t.sector as 'TOLL' | 'PARKING' | 'RETAIL',
      date:     tngDateMyt(t.exit_datetime ?? t.entry_datetime),
      amount:   t.amount,
      location: buildLocation(t),
      trans_no: t.trans_no,
    }))

  // Sort final matches: HIGH_CONFIDENCE first, then SUGGESTED, then POSSIBLE.
  // Within the same confidence tier, sort by claim_item_date ASC.
  const confidenceOrder: Record<MatchConfidence, number> = {
    HIGH_CONFIDENCE: 0,
    SUGGESTED:       1,
    POSSIBLE:        2,
  }
  finalMatches.sort((a, b) => {
    const co = confidenceOrder[a.confidence] - confidenceOrder[b.confidence]
    if (co !== 0) return co
    return a.claim_item_date.localeCompare(b.claim_item_date)
  })

  return { matches: finalMatches, unmatched_claim_items, unmatched_tng_rows }
}

function isTransportClaimType(type: string): type is 'TAXI' | 'GRAB' | 'TRAIN' | 'BUS' {
  return type === 'TAXI' || type === 'GRAB' || type === 'TRAIN' || type === 'BUS'
}

function isSupportedClaimItemType(type: string): type is MatchableClaimItem['type'] {
  return type === 'TOLL' || type === 'PARKING' || isTransportClaimType(type)
}

function isCompatiblePair(type: MatchableClaimItem['type'], sector: MatchableTngRow['sector']): boolean {
  if (type === 'TOLL') return sector === 'TOLL'
  if (type === 'PARKING') return sector === 'PARKING'
  return isTransportClaimType(type) && sector === 'RETAIL'
}

// ── Scoring logic ─────────────────────────────────────────────────────────────

function scorePair(
  item: MatchableClaimItem,
  txn:  MatchableTngRow,
): { score: number; breakdown: ScoreBreakdown[] } {
  const breakdown: ScoreBreakdown[] = []
  let score = 0

  // ── Date scoring ────────────────────────────────────────────────────────────
  // Use exit_datetime if available (toll exit = the chargeable moment),
  // fall back to entry_datetime.
  const txnDateStr = tngDateMyt(txn.exit_datetime ?? txn.entry_datetime)
  const itemDateStr = item.claim_date  // YYYY-MM-DD

  if (txnDateStr && itemDateStr) {
    const dayDiff = Math.abs(daysBetween(txnDateStr, itemDateStr))
    if (dayDiff === 0) {
      score += 40
      breakdown.push({ reason: 'Exact date match', points: 40 })
    } else if (dayDiff === 1) {
      score += 20
      breakdown.push({ reason: '±1 day', points: 20 })
    }
    // dayDiff > 1: no date points, pair may still score on amount/location
  }

  // ── Amount scoring ───────────────────────────────────────────────────────────
  // If claim item is TNG-pending (mode='TNG', amount=0), skip amount scoring —
  // we don't know the amount yet; date + sector is enough to suggest a match.
  const itemAmountKnown = item.mode !== 'TNG' && item.amount > 0

  if (itemAmountKnown) {
    const diff = Math.abs(txn.amount - item.amount)
    if (diff < 0.005) {   // essentially equal (floating point safe)
      score += 30
      breakdown.push({ reason: `Exact amount RM${txn.amount.toFixed(2)}`, points: 30 })
    } else if (diff <= 0.10) {
      score += 15
      breakdown.push({ reason: `Amount ±RM${diff.toFixed(2)}`, points: 15 })
    }
  } else if (item.mode === 'TNG') {
    // TNG-pending item: treat as neutral (no penalty, no bonus)
    breakdown.push({ reason: 'Amount pending (TNG mode)', points: 0 })
  }

  // ── Location word overlap ────────────────────────────────────────────────────
  const tngLocationWords = extractWords(buildLocation(txn))
  const merchantWords    = extractWords(item.merchant ?? '')

  if (tngLocationWords.length > 0 && merchantWords.length > 0) {
    const overlap = merchantWords.some(w => tngLocationWords.includes(w))
    if (overlap) {
      score += 10
      breakdown.push({ reason: 'Location match', points: 10 })
    }
  }

  // ── Sector confirmation bonus ────────────────────────────────────────────────
  // Sector ↔ type already gated before scoring, so this is a small "belt +
  // braces" signal that the pair is categorically coherent.
  score += 5
  breakdown.push({ reason: `${item.type} ↔ ${txn.sector}`, points: 5 })

  return { score, breakdown }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Convert an ISO timestamptz string (UTC from Supabase) to YYYY-MM-DD in MYT.
 * Returns '' if input is null / unparseable.
 */
function tngDateMyt(isoString: string | null | undefined): string {
  if (!isoString) return ''
  try {
    const utcMs  = new Date(isoString).getTime()
    if (isNaN(utcMs)) return ''
    const mytMs  = utcMs + MYT_OFFSET_MS
    const d      = new Date(mytMs)
    const yyyy   = d.getUTCFullYear()
    const mm     = String(d.getUTCMonth() + 1).padStart(2, '0')
    const dd     = String(d.getUTCDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  } catch {
    return ''
  }
}

/**
 * Days between two YYYY-MM-DD strings.
 * Positive if b is later than a.
 */
function daysBetween(a: string, b: string): number {
  const msA = new Date(a).getTime()
  const msB = new Date(b).getTime()
  return Math.round((msB - msA) / (1000 * 60 * 60 * 24))
}

/**
 * Build a human-readable location string from a TNG row.
 * "ENTRY → EXIT" if both present, otherwise whichever is available.
 */
export function buildLocation(txn: Pick<MatchableTngRow, 'entry_location' | 'exit_location'>): string {
  const entry = txn.entry_location?.trim() ?? ''
  const exit  = txn.exit_location?.trim()  ?? ''
  if (entry && exit && entry !== exit) return `${entry} → ${exit}`
  return exit || entry || '—'
}

/**
 * Extract lowercase words ≥ 4 characters from a string.
 * Short words (the, di, ke, etc.) add noise to location matching.
 */
function extractWords(str: string): string[] {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4)
}

function scoreToConfidence(score: number): MatchConfidence {
  if (score >= 80) return 'HIGH_CONFIDENCE'
  if (score >= 50) return 'SUGGESTED'
  return 'POSSIBLE'
}

// ── Unit-testable sub-exports (for test files) ────────────────────────────────
export { tngDateMyt, daysBetween, scorePair, scoreToConfidence }
