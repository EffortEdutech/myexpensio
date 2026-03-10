// =============================================================================
// apps/user/lib/__tests__/tng-matcher.test.ts
//
// Run:  npx jest tng-matcher  (from apps/user/)
//
// Tests cover:
//   - Score rubric (date, amount, location, sector)
//   - Greedy one-to-one assignment (no double-linking)
//   - TNG-pending items (amount=0, mode='TNG')
//   - RETAIL rows are excluded
//   - No candidates below threshold 30
//   - tngDateMyt timezone conversion
//   - daysBetween arithmetic
// =============================================================================

import {
  matchTngToClaimItems,
  tngDateMyt,
  daysBetween,
  scorePair,
  type MatchableClaimItem,
  type MatchableTngRow,
} from '../tng-matcher'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TOLL_ITEM: MatchableClaimItem = {
  id:         'item-toll-1',
  type:       'TOLL',
  claim_date: '2026-02-26',
  amount:     11.60,
  merchant:   'AYER KEROH SUBANG',
  mode:       'MANUAL',
}

const PARKING_ITEM: MatchableClaimItem = {
  id:         'item-park-1',
  type:       'PARKING',
  claim_date: '2026-02-26',
  amount:     4.00,
  merchant:   'Columbia Asia',
  mode:       'MANUAL',
}

const TNG_TOLL: MatchableTngRow = {
  id:             'tng-toll-1',
  sector:         'TOLL',
  exit_datetime:  '2026-02-26T03:30:00Z',  // 11:30 MYT = 2026-02-26 MYT
  entry_datetime: '2026-02-26T02:00:00Z',
  entry_location: 'AYER KEROH',
  exit_location:  'BANDAR SERENIA SUBANG',
  amount:         11.60,
  trans_no:       '62313',
}

const TNG_PARKING: MatchableTngRow = {
  id:             'tng-park-1',
  sector:         'PARKING',
  exit_datetime:  '2026-02-26T04:15:00Z',  // 12:15 MYT
  entry_datetime: '2026-02-26T03:00:00Z',
  entry_location: 'COLUMBIA ASIA CHERAS',
  exit_location:  null,
  amount:         4.00,
  trans_no:       '62401',
}

// ── tngDateMyt ────────────────────────────────────────────────────────────────

describe('tngDateMyt', () => {
  it('converts UTC midnight to MYT same day when UTC+8 does not flip', () => {
    // 2026-02-26T00:00:00Z = 2026-02-26T08:00:00 MYT → date: 2026-02-26
    expect(tngDateMyt('2026-02-26T00:00:00Z')).toBe('2026-02-26')
  })

  it('flips day correctly for near-midnight UTC (MYT next day)', () => {
    // 2026-02-25T17:00:00Z = 2026-02-26T01:00:00 MYT → date: 2026-02-26
    expect(tngDateMyt('2026-02-25T17:00:00Z')).toBe('2026-02-26')
  })

  it('returns empty string for null', () => {
    expect(tngDateMyt(null)).toBe('')
  })

  it('returns empty string for invalid string', () => {
    expect(tngDateMyt('not-a-date')).toBe('')
  })
})

// ── daysBetween ───────────────────────────────────────────────────────────────

describe('daysBetween', () => {
  it('returns 0 for same date', () => {
    expect(daysBetween('2026-02-26', '2026-02-26')).toBe(0)
  })

  it('returns 1 for adjacent dates', () => {
    expect(daysBetween('2026-02-25', '2026-02-26')).toBe(1)
  })

  it('returns negative when b is before a', () => {
    expect(daysBetween('2026-02-26', '2026-02-25')).toBe(-1)
  })
})

// ── scorePair ─────────────────────────────────────────────────────────────────

describe('scorePair', () => {
  it('scores HIGH_CONFIDENCE for exact date + exact amount + location overlap', () => {
    const { score } = scorePair(TOLL_ITEM, TNG_TOLL)
    // +40 exact date, +30 exact amount, +10 location, +5 sector = 85
    expect(score).toBe(85)
  })

  it('scores correctly for exact date + exact amount, no location', () => {
    const item: MatchableClaimItem = { ...TOLL_ITEM, merchant: null }
    const { score } = scorePair(item, TNG_TOLL)
    // +40 date, +30 amount, +0 location, +5 sector = 75
    expect(score).toBe(75)
  })

  it('scores ±1 day date fallback correctly', () => {
    const item: MatchableClaimItem = { ...TOLL_ITEM, claim_date: '2026-02-27' }
    const { score } = scorePair(item, TNG_TOLL)
    // +20 ±1 day, +30 exact amount, +0 location (different date word drift), +5 sector = 55
    expect(score).toBeGreaterThanOrEqual(55)
  })

  it('skips amount scoring for TNG-pending items (amount=0, mode=TNG)', () => {
    const item: MatchableClaimItem = {
      ...TOLL_ITEM,
      amount: 0,
      mode:   'TNG',
    }
    const { score, breakdown } = scorePair(item, TNG_TOLL)
    // +40 exact date, +0 amount skipped, +5 sector minimum = 45+
    expect(score).toBeGreaterThanOrEqual(45)
    const amountBreakdown = breakdown.find(b => b.reason === 'Amount pending (TNG mode)')
    expect(amountBreakdown).toBeDefined()
    expect(amountBreakdown?.points).toBe(0)
  })

  it('penalises near-but-not-exact amounts with partial score', () => {
    const item: MatchableClaimItem = { ...TOLL_ITEM, amount: 11.55 } // diff = 0.05
    const { score, breakdown } = scorePair(item, TNG_TOLL)
    const amtBreak = breakdown.find(b => b.reason.startsWith('Amount ±'))
    expect(amtBreak?.points).toBe(15)
    // should NOT have exact amount breakdown
    const exact = breakdown.find(b => b.reason.startsWith('Exact amount'))
    expect(exact).toBeUndefined()
  })

  it('does not award amount points when diff > 0.10', () => {
    const item: MatchableClaimItem = { ...TOLL_ITEM, amount: 15.00 }
    const { score } = scorePair(item, TNG_TOLL)
    // +40 date, +0 amount, +10 location, +5 sector = 55
    expect(score).toBeLessThan(80)
  })
})

// ── matchTngToClaimItems ──────────────────────────────────────────────────────

describe('matchTngToClaimItems', () => {
  it('returns expected matches for clean 1:1 case', () => {
    const result = matchTngToClaimItems({
      claimItems: [TOLL_ITEM, PARKING_ITEM],
      tngRows:    [TNG_TOLL, TNG_PARKING],
    })

    expect(result.matches).toHaveLength(2)

    const tollMatch = result.matches.find(m => m.claim_item_id === 'item-toll-1')
    expect(tollMatch).toBeDefined()
    expect(tollMatch?.tng_transaction_id).toBe('tng-toll-1')
    expect(tollMatch?.confidence).toBe('HIGH_CONFIDENCE')
    expect(tollMatch?.pre_ticked).toBe(true)

    const parkMatch = result.matches.find(m => m.claim_item_id === 'item-park-1')
    expect(parkMatch).toBeDefined()
    expect(parkMatch?.tng_transaction_id).toBe('tng-park-1')
    expect(parkMatch?.pre_ticked).toBe(true)

    expect(result.unmatched_claim_items).toHaveLength(0)
    expect(result.unmatched_tng_rows).toHaveLength(0)
  })

  it('enforces one-to-one: a TNG row is not matched twice', () => {
    // Two claim items with similar date/amount, only one TNG row
    const item2: MatchableClaimItem = {
      id:         'item-toll-2',
      type:       'TOLL',
      claim_date: '2026-02-26',
      amount:     11.60,
      merchant:   'SUBANG',
      mode:       'MANUAL',
    }

    const result = matchTngToClaimItems({
      claimItems: [TOLL_ITEM, item2],
      tngRows:    [TNG_TOLL],   // only one TNG row
    })

    expect(result.matches).toHaveLength(1)
    expect(result.unmatched_claim_items).toHaveLength(1)
  })

  it('excludes RETAIL sector TNG rows from matching', () => {
    const retailRow: MatchableTngRow = {
      id:             'tng-retail-1',
      sector:         'RETAIL',
      exit_datetime:  '2026-02-26T03:30:00Z',
      entry_datetime: null,
      entry_location: 'MYDIN MITC',
      exit_location:  null,
      amount:         25.00,
      trans_no:       'R001',
    }

    const result = matchTngToClaimItems({
      claimItems: [TOLL_ITEM],
      tngRows:    [TNG_TOLL, retailRow],
    })

    // RETAIL should not appear in unmatched_tng_rows either
    expect(result.unmatched_tng_rows.find(r => r.id === 'tng-retail-1')).toBeUndefined()
  })

  it('does not cross-match TOLL items with PARKING TNG rows', () => {
    const result = matchTngToClaimItems({
      claimItems: [TOLL_ITEM],
      tngRows:    [TNG_PARKING],   // PARKING sector ≠ TOLL type
    })

    expect(result.matches).toHaveLength(0)
    expect(result.unmatched_claim_items).toHaveLength(1)
    expect(result.unmatched_tng_rows).toHaveLength(1)
  })

  it('returns unmatched_tng_rows for unclaimed rows with no claim item', () => {
    const extraTng: MatchableTngRow = {
      id:             'tng-toll-extra',
      sector:         'TOLL',
      exit_datetime:  '2026-01-10T06:00:00Z',
      entry_datetime: null,
      entry_location: 'TAPAH',
      exit_location:  'IPOH',
      amount:         5.10,
      trans_no:       '99001',
    }

    const result = matchTngToClaimItems({
      claimItems: [TOLL_ITEM],
      tngRows:    [TNG_TOLL, extraTng],
    })

    expect(result.matches).toHaveLength(1)
    expect(result.unmatched_tng_rows).toHaveLength(1)
    expect(result.unmatched_tng_rows[0].id).toBe('tng-toll-extra')
  })

  it('filters out pairs with score < 30', () => {
    const farItem: MatchableClaimItem = {
      id:         'item-far',
      type:       'TOLL',
      claim_date: '2026-01-01',  // very different date
      amount:     50.00,         // very different amount
      merchant:   null,
      mode:       'MANUAL',
    }

    const result = matchTngToClaimItems({
      claimItems: [farItem],
      tngRows:    [TNG_TOLL],
    })

    expect(result.matches).toHaveLength(0)
    expect(result.unmatched_claim_items).toHaveLength(1)
    expect(result.unmatched_tng_rows).toHaveLength(1)
  })

  it('sorts matches: HIGH_CONFIDENCE first, then SUGGESTED, then POSSIBLE', () => {
    const highItem: MatchableClaimItem = { ...TOLL_ITEM, id: 'item-h' }
    const suggestedItem: MatchableClaimItem = {
      ...TOLL_ITEM,
      id:         'item-s',
      claim_date: '2026-02-27',  // +1 day → SUGGESTED range
      amount:     11.60,
      merchant:   null,
    }

    const highTng: MatchableTngRow = { ...TNG_TOLL, id: 'tng-h' }
    const suggestedTng: MatchableTngRow = {
      ...TNG_TOLL,
      id:            'tng-s',
      trans_no:      '99999',
      exit_datetime: '2026-02-28T03:30:00Z',  // date: 2026-02-28 MYT
    }

    const result = matchTngToClaimItems({
      claimItems: [suggestedItem, highItem],   // deliberately reversed order
      tngRows:    [suggestedTng, highTng],
    })

    // HIGH_CONFIDENCE should appear first regardless of input order
    expect(result.matches[0].confidence).toBe('HIGH_CONFIDENCE')
  })
})
