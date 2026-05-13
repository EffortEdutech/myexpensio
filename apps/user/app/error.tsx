'use client'
// apps/user/app/error.tsx
// Global error boundary — catches unhandled React render errors.
// Next.js requires this to be a Client Component.

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to console in production; swap for Sentry/LogRocket if added later
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.icon}>⚠️</div>
        <h1 style={S.title}>Something went wrong</h1>
        <p style={S.message}>
          An unexpected error occurred. Your data is safe — please try again.
        </p>
        {error.digest && (
          <div style={S.digest}>Error ref: {error.digest}</div>
        )}
        <button onClick={reset} style={S.btn}>Try Again</button>
        <a href="/home" style={S.link}>← Go to Home</a>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page:    { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: 24, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  card:    { backgroundColor: '#ffffff', borderRadius: 20, padding: '48px 32px', maxWidth: 380, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  icon:    { fontSize: 48, marginBottom: 16 },
  title:   { fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 12px' },
  message: { fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: '0 0 8px' },
  digest:  { fontSize: 11, color: '#94a3b8', marginBottom: 24, fontFamily: 'monospace' },
  btn:     { display: 'block', width: '100%', padding: '13px 0', borderRadius: 12, border: 'none', backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 12, boxSizing: 'border-box' },
  link:    { display: 'block', fontSize: 13, color: '#64748b', textDecoration: 'none', marginTop: 4 },
}
