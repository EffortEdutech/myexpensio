// apps\admin\app\orgs\page.tsx
import Link from 'next/link'

const BETA_ORG = {
  id: '9ea0f094-bd28-49ad-bc25-756eaabb860b',
  name: 'Beta Organisation',
  status: 'ACTIVE',
}

export default function OrgsPage() {
  return (
    <div style={S.page}>
      <div>
        <h1 style={S.title}>Organizations</h1>
        <p style={S.subtitle}>
          Organisation management stays here. User onboarding now lives under Members &amp; Onboarding.
        </p>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>{BETA_ORG.name}</div>
        <div style={S.cardMeta}>Org ID: {BETA_ORG.id}</div>
        <div style={S.cardStatus}>Status: {BETA_ORG.status}</div>

        <div style={S.actions}>
          <Link href="/members" style={S.primaryLink}>
            Open Members &amp; Onboarding
          </Link>
          <Link href="/orgs/new" style={S.secondaryLink}>
            Create Organization
          </Link>
        </div>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    margin: 0,
    color: '#111827',
  },
  subtitle: {
    margin: '6px 0 0',
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 1.6,
  },
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: '#111827',
  },
  cardMeta: {
    marginTop: 8,
    fontSize: 12,
    color: '#6b7280',
    wordBreak: 'break-all',
  },
  cardStatus: {
    marginTop: 8,
    fontSize: 13,
    color: '#374151',
    fontWeight: 600,
  },
  actions: {
    display: 'flex',
    gap: 10,
    marginTop: 18,
    flexWrap: 'wrap',
  },
  primaryLink: {
    textDecoration: 'none',
    background: '#111827',
    color: '#fff',
    padding: '12px 16px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
  },
  secondaryLink: {
    textDecoration: 'none',
    background: '#fff',
    color: '#111827',
    border: '1px solid #d1d5db',
    padding: '12px 16px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
  },
}