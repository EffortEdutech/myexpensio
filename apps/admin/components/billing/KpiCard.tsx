'use client'

/**
 * apps/admin/components/billing/KpiCard.tsx
 */

type KpiCardProps = {
  label: string
  value: string | number
  sub?: string
  accent?: 'neutral' | 'green' | 'amber' | 'red' | 'blue'
  loading?: boolean
}

const ACCENT_COLORS: Record<string, string> = {
  neutral: '#6366f1',
  green:   '#059669',
  amber:   '#d97706',
  red:     '#dc2626',
  blue:    '#2563eb',
}

export default function KpiCard({
  label,
  value,
  sub,
  accent = 'neutral',
  loading = false,
}: KpiCardProps) {
  const bar = ACCENT_COLORS[accent] ?? ACCENT_COLORS.neutral

  return (
    <div
      style={{
        borderRadius: '10px',
        border: '1px solid #e5e7eb',
        background: '#ffffff',
        padding: '18px 20px',
        borderTop: `3px solid ${bar}`,
        minWidth: 0,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: '12px',
          color: '#6b7280',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </p>

      {loading ? (
        <div
          style={{
            marginTop: '10px',
            height: '28px',
            borderRadius: '6px',
            background: '#f3f4f6',
            width: '60%',
          }}
        />
      ) : (
        <p
          style={{
            margin: '8px 0 0',
            fontSize: '26px',
            fontWeight: 600,
            color: '#111827',
            lineHeight: 1.2,
          }}
        >
          {value}
        </p>
      )}

      {sub && !loading && (
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>
          {sub}
        </p>
      )}
    </div>
  )
}
