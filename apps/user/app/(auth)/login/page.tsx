'use client'
// apps/user/app/(auth)/login/page.tsx
//
// Login screen for returning users.
// Invite-only note is shown — no self-registration link.
// Handles URL error params forwarded from auth/callback.
// Shows success banner after first-login password reset.

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BiometricLoginButton } from '@/components/auth/BiometricLoginButton'

const URL_ERRORS: Record<string, string> = {
  invalid_link: 'Your invitation link is invalid or has expired. Please request a new one from your admin.',
  invalid_code: 'This confirmation link is no longer valid. Please try logging in directly.',
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/home'
  const urlErrorKey = searchParams.get('error')
  const passwordChanged = searchParams.get('passwordChanged') === '1'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    urlErrorKey ? (URL_ERRORS[urlErrorKey] ?? 'Something went wrong. Please try again.') : null,
  )

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const supabase = createClient()

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    setIsLoading(false)

    if (signInError) {
      setError(
        signInError.message.toLowerCase().includes('invalid login credentials')
          ? 'Incorrect email or password. Please try again.'
          : signInError.message,
      )
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>myexpensio</div>

        <h1 style={S.title}>Sign in</h1>
        <p style={S.subtitle}>
          This is an invite-only platform. If you don&apos;t have an account, check your email for an invitation.
        </p>

        {passwordChanged && (
          <div style={S.successBanner}>
            Password changed successfully. Please sign in again using your new password.
          </div>
        )}

        {error && <div style={S.errorBanner}>{error}</div>}

        <BiometricLoginButton emailHint={email} redirectTo={redirectTo} />

        <form onSubmit={handleLogin} style={S.form}>
          <div style={S.field}>
            <label style={S.label} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={S.input}
              required
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <div style={S.field}>
            <label style={S.labelRow} htmlFor="password">
              <span>Password</span>
              <a href="/forgot-password" style={S.forgotLink} tabIndex={-1}>
                Forgot password?
              </a>
            </label>

            <div style={S.passwordWrap}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                style={S.passwordInput}
                required
                autoComplete="current-password"
                disabled={isLoading}
              />

              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={S.eyeBtn}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                disabled={isLoading}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            style={{ ...S.primaryBtn, opacity: isLoading ? 0.65 : 1 }}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={S.helperNote}>
          Biometric login can be enabled later from Settings on supported devices. Password sign-in always remains available.
        </div>

        <p style={S.footer}>
          Have an invite? <a href="/accept-invite" style={S.inlineLink}>Accept your invitation</a>
        </p>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: 24,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    border: '1px solid #e2e8f0',
    padding: '40px 36px',
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  },
  logo: {
    fontSize: 18,
    fontWeight: 800,
    color: '#0f172a',
    marginBottom: 28,
    letterSpacing: '-0.5px',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 8px',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    margin: '0 0 24px',
    lineHeight: 1.65,
  },
  errorBanner: {
    padding: '10px 14px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 1.5,
  },
  successBanner: {
    padding: '10px 14px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 8,
    color: '#15803d',
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 1.5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
  },
  labelRow: {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotLink: {
    fontSize: 12,
    color: '#64748b',
    textDecoration: 'none',
    fontWeight: 400,
  },
  input: {
    padding: '10px 14px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    color: '#0f172a',
    outline: 'none',
    backgroundColor: '#fff',
    width: '100%',
    boxSizing: 'border-box',
  },
  passwordWrap: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    padding: '10px 44px 10px 14px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    color: '#0f172a',
    outline: 'none',
    backgroundColor: '#fff',
    width: '100%',
    boxSizing: 'border-box',
  },
  eyeBtn: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: 16,
    color: '#64748b',
    padding: 0,
    lineHeight: 1,
  },
  primaryBtn: {
    marginTop: 8,
    padding: '12px 20px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
  },
  helperNote: {
    marginTop: 14,
    fontSize: 12,
    color: '#64748b',
    lineHeight: 1.6,
    textAlign: 'center',
  },
  footer: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 0,
  },
  inlineLink: {
    color: '#0f172a',
    fontWeight: 600,
    textDecoration: 'none',
  },
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div />}>
      <LoginContent />
    </Suspense>
  )
}

