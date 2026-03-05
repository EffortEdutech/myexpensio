import type { ReactNode } from 'react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'system-ui' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ marginBottom: 16 }}>
          <Link href="/login" style={{ textDecoration: 'none' }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>MyExpensio</div>
          </Link>
          <div style={{ opacity: 0.7, marginTop: 4 }}>User App • Auth</div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
          {children}
        </div>

        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
          Local Supabase Studio: http://127.0.0.1:54323 • Mailpit: http://127.0.0.1:54324
        </div>
      </div>
    </div>
  )
}