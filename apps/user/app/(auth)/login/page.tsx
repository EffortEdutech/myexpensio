import Link from 'next/link'

export default function LoginPage() {
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Login</h1>
      <p style={{ opacity: 0.8, marginBottom: 16 }}>
        Invite-only onboarding. Users should sign in, or accept an invite link.
      </p>

      <div style={{ display: 'grid', gap: 8 }}>
        <Link href="/accept-invite">Accept Invite</Link>
        <Link href="/forgot-password">Forgot Password</Link>
        <Link href="/home">Go to App (placeholder)</Link>
      </div>

      <div style={{ marginTop: 16, fontSize: 12, opacity: 0.7 }}>
        Dev tip: You can keep /auth-test for local checks, but real flow is invite-only.
      </div>
    </div>
  )
}