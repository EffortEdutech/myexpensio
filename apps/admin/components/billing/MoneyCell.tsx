'use client'

/**
 * apps/admin/components/billing/MoneyCell.tsx
 *
 * Standard MYR money display for tables and cards.
 * Format: RM 1,234.56  |  negative: −RM 50.00
 */

type MoneyCellProps = {
  amount: number | null | undefined
  currency?: string
  size?: 'sm' | 'md' | 'lg'
  dimZero?: boolean
}

/** Utility function — use this anywhere formatting is needed without JSX. */
export function formatMYR(amount: number | null | undefined, currency = 'MYR'): string {
  if (amount == null) return '—'
  const prefix = currency === 'MYR' ? 'RM' : currency
  const abs = Math.abs(amount)
  const formatted = abs.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return amount < 0 ? `−${prefix} ${formatted}` : `${prefix} ${formatted}`
}

const SIZE_STYLES: Record<string, { fontSize: string; fontWeight: number }> = {
  sm: { fontSize: '13px', fontWeight: 400 },
  md: { fontSize: '14px', fontWeight: 500 },
  lg: { fontSize: '18px', fontWeight: 600 },
}

export default function MoneyCell({
  amount,
  currency = 'MYR',
  size = 'md',
  dimZero = false,
}: MoneyCellProps) {
  const style = SIZE_STYLES[size] ?? SIZE_STYLES.md
  const isNeg = (amount ?? 0) < 0
  const isZero = amount === 0
  const color = isNeg ? '#dc2626' : isZero && dimZero ? '#9ca3af' : '#111827'

  return (
    <span style={{ ...style, color, fontVariantNumeric: 'tabular-nums' }}>
      {formatMYR(amount, currency)}
    </span>
  )
}
