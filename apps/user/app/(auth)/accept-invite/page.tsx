import Link from 'next/link'

export default function AcceptInvitePage() {
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Accept Invite</h1>
      <p style={{ opacity: 0.8 }}>
        Placeholder screen. Later this page will read invite parameters from the URL, validate them,
        and let the invited user create password / sign in.
      </p>

      <div style={{ marginTop: 16 }}>
        <Link href="/login">Back to Login</Link>
      </div>
    </div>
  )
}