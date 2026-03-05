import type { ReactNode } from 'react'
import Link from 'next/link'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', fontFamily: 'system-ui' }}>
      <header style={{ borderBottom: '1px solid #eee', padding: 12 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/home" style={{ textDecoration: 'none', fontWeight: 800 }}>MyExpensio</Link>
          <nav style={{ display: 'flex', gap: 12 }}>
            <Link href="/home">Home</Link>
            <Link href="/trips">Trips</Link>
            <Link href="/claims">Claims</Link>
            <Link href="/settings">Settings</Link>
          </nav>
          <div style={{ marginLeft: 'auto', opacity: 0.7, fontSize: 12 }}>User App</div>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: 16 }}>
        {children}
      </main>
    </div>
  )
}