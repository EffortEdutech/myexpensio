import Link from 'next/link'

export default function AdminLoginPage() {
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Admin Login</h1>
      <p style={{ opacity: 0.8 }}>Placeholder admin login.</p>
      <div style={{ marginTop: 12 }}>
        <Link href="/orgs">Go to Organizations</Link>
      </div>
    </div>
  )
}