// apps/admin/components/StatCard.tsx
//
// Dashboard stat card with optional sublabel and colour variant.

type Variant = 'default' | 'blue' | 'green' | 'amber' | 'red'

type Props = {
  label: string
  value: string | number
  sublabel?: string
  variant?: Variant
}

const variantStyles: Record<Variant, { card: string; value: string }> = {
  default: { card: 'bg-white border-gray-200', value: 'text-gray-900' },
  blue:    { card: 'bg-white border-blue-200',  value: 'text-blue-700' },
  green:   { card: 'bg-white border-green-200', value: 'text-green-700' },
  amber:   { card: 'bg-white border-amber-200', value: 'text-amber-700' },
  red:     { card: 'bg-white border-red-200',   value: 'text-red-700' },
}

export default function StatCard({ label, value, sublabel, variant = 'default' }: Props) {
  const styles = variantStyles[variant]
  return (
    <div className={`rounded-xl border p-5 ${styles.card}`}>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${styles.value}`}>{value}</p>
      {sublabel && <p className="mt-1 text-xs text-gray-400">{sublabel}</p>}
    </div>
  )
}
