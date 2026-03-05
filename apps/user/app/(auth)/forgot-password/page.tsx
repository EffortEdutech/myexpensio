import Link from 'next/link'

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Forgot Password</h1>
      <p style={{ opacity: 0.8 }}>
        Placeholder screen. Later this will trigger password reset and handle redirect callback.
      </p>

      <div style={{ marginTop: 16 }}>
        <Link href="/login">Back to Login</Link>
      </div>
    </div>
  )
}