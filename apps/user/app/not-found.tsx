// apps/user/app/not-found.tsx
// Shown for any URL that doesn't match a route.

import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Page Not Found' }

export default function NotFound() {
  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.code}>404</div>
        <h1 style={S.title}>Page not found</h1>
        <p style={S.message}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/home" style={S.btn}>← Back to Home</Link>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page:    { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: 24, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  card:    { backgroundColor: '#ffffff', borderRadius: 20, padding: '48px 32px', maxWidth: 380, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  code:    { fontSize: 72, fontWeight: 900, color: '#e2e8f0', lineHeight: 1, marginBottom: 16 },
  title:   { fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 12px' },
  message: { fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: '0 0 28px' },
  btn:     { display: 'inline-block', padding: '12px 24px', borderRadius: 12, backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 700, fontSize: 14, textDecoration: 'none' },
}
