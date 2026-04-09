import Link from 'next/link'

export default function OfflinePage() {
  return (
    <main style={S.page}>
      <div style={S.card}>
        <div style={S.icon}>📴</div>
        <h1 style={S.title}>You are offline</h1>
        <p style={S.text}>
          myexpensio needs an internet connection for live route calculations,
          exports, uploads, and account actions. Reconnect and try again.
        </p>
        <div style={S.actions}>
          <Link href="/home" style={S.btnPrimary}>Go to Home</Link>
          <Link href="/settings" style={S.btnSecondary}>Open Settings</Link>
        </div>
      </div>
    </main>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#f8fafc' },
  card: { width: '100%', maxWidth: 420, backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 },
  icon: { fontSize: 40 },
  title: { margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a' },
  text: { margin: 0, fontSize: 14, lineHeight: 1.6, color: '#64748b' },
  actions: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 },
  btnPrimary: { padding: '12px 16px', backgroundColor: '#0f172a', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 700 },
  btnSecondary: { padding: '12px 16px', backgroundColor: '#fff', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 10, textDecoration: 'none', fontWeight: 600 },
}
