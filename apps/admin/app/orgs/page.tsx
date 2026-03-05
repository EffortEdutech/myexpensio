import Link from 'next/link'

export default function OrgsListPage() {
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Organizations</h1>
      <p style={{ opacity: 0.8 }}>Placeholder list. Next: list orgs and manage invites.</p>
      <div style={{ marginTop: 12 }}>
        <Link href="/orgs/new">Create Organization</Link>
      </div>
    </div>
  )
}