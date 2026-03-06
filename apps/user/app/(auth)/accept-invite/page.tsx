'use client'
// apps/user/app/(auth)/accept-invite/page.tsx
//
// Invite acceptance flow — reached after /auth/callback verifies the token.
// URL shape: /accept-invite?invite_id=<uuid>
//
// States:
//   loading   → fetching invite details from /api/invite/validate
//   valid     → showing the "set password + join org" form
//   submitting → form submitted, waiting for /api/invite/accept
//   success   → membership provisioned, redirecting to /home
//   error     → invalid / expired / already-used invite
//
// Security note: password set via supabase.auth.updateUser() (client-side,
// requires the session established by the callback route).
// Membership provisioning happens server-side in /api/invite/accept.

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────────────────

type InviteDetails = {
  id: string
  email: string
  org_role: 'OWNER' | 'MANAGER' | 'MEMBER' | string
  org_id: string
  org_name: string
  expires_at: string
}

type PageState =
  | 'loading'
  | 'valid'
  | 'submitting'
  | 'success'
  | 'error'

const ROLE_LABELS: Record<string, string> = {
  OWNER:   'Owner',
  MANAGER: 'Manager',
  MEMBER:  'Member',
}

const ERROR_DISPLAY: Record<string, { title: string; hint: string }> = {
  INVITE_EXPIRED:    { title: 'Invitation Expired',   hint: 'Please ask your admin to send a new invitation.' },
  INVITE_ALREADY_USED: { title: 'Already Accepted',   hint: 'This invitation has already been used. Please log in instead.' },
  NOT_FOUND:         { title: 'Invitation Not Found', hint: 'This link may be invalid or was deleted. Contact your admin.' },
  MISSING_INVITE:    { title: 'Invalid Link',         hint: 'No invitation ID was found. Please use the exact link from your email.' },
  FORBIDDEN:         { title: 'Wrong Account',        hint: 'This invitation was sent to a different email address. Please log in with the correct account.' },
}

// ── Inner component (needs useSearchParams) ────────────────────────────────

function AcceptInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteId = searchParams.get('invite_id')

  const [pageState, setPageState]   = useState<PageState>('loading')
  const [invite, setInvite]         = useState<InviteDetails | null>(null)
  const [errorCode, setErrorCode]   = useState<string>('')
  const [errorMsg, setErrorMsg]     = useState<string>('')

  // Form fields
  const [displayName,     setDisplayName]     = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError,       setFormError]       = useState<string | null>(null)

  // ── Step 1: validate the invite on mount ──────────────────────────────────
  useEffect(() => {
    if (!inviteId) {
      setErrorCode('MISSING_INVITE')
      setErrorMsg('')
      setPageState('error')
      return
    }

    async function validate() {
      const res  = await fetch(`/api/invite/validate?invite_id=${inviteId}`)
      const json = await res.json()

      if (!res.ok) {
        setErrorCode(json.error?.code ?? 'UNKNOWN')
        setErrorMsg(json.error?.message ?? 'Something went wrong.')
        setPageState('error')
        return
      }

      setInvite(json.invite)
      setPageState('valid')
    }

    validate()
  }, [inviteId])

  // ── Step 2: handle form submission ────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    // Client-side validation
    if (!password) {
      setFormError('Password is required.')
      return
    }
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.')
      return
    }

    setPageState('submitting')

    const supabase = createClient()

    // Set the password (user has a session from the callback route)
    const { error: pwError } = await supabase.auth.updateUser({ password })
    if (pwError) {
      setPageState('valid')
      setFormError(`Could not set password: ${pwError.message}`)
      return
    }

    // Provision org membership server-side
    const res  = await fetch('/api/invite/accept', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ invite_id: inviteId, display_name: displayName }),
    })
    const json = await res.json()

    if (!res.ok) {
      setPageState('valid')
      setFormError(json.error?.message ?? 'Failed to join organisation. Please try again.')
      return
    }

    // All done — redirect to app
    setPageState('success')
    setTimeout(() => router.push('/home'), 1400)
  }

  // ── Render states ─────────────────────────────────────────────────────────

  if (pageState === 'loading') {
    return (
      <Layout>
        <p style={S.muted}>Verifying your invitation…</p>
      </Layout>
    )
  }

  if (pageState === 'success') {
    return (
      <Layout>
        <div style={S.iconCircle('#f0fdf4', '#16a34a')}>✓</div>
        <h1 style={S.title}>Welcome aboard!</h1>
        <p style={S.subtitle}>You've joined <strong>{invite?.org_name}</strong>. Taking you to the app…</p>
      </Layout>
    )
  }

  if (pageState === 'error') {
    const info = ERROR_DISPLAY[errorCode] ?? {
      title: 'Something Went Wrong',
      hint:  errorMsg || 'Please try using the original link from your invitation email.',
    }
    return (
      <Layout>
        <div style={S.iconCircle('#fef2f2', '#dc2626')}>✕</div>
        <h1 style={S.title}>{info.title}</h1>
        <p style={S.subtitle}>{info.hint}</p>
        <a href="/login" style={S.outlineBtn}>Back to Login</a>
      </Layout>
    )
  }

  // pageState === 'valid' | 'submitting'
  const isSubmitting = pageState === 'submitting'

  return (
    <Layout>
      <div style={S.logo}>myexpensio</div>

      <h1 style={S.title}>You're invited!</h1>
      <p style={S.subtitle}>
        You've been invited to join{' '}
        <strong>{invite?.org_name}</strong> as{' '}
        <strong>{ROLE_LABELS[invite?.org_role ?? ''] ?? invite?.org_role}</strong>.
      </p>

      <div style={S.emailBadge}>{invite?.email}</div>

      <form onSubmit={handleSubmit} style={S.form}>

        <Field label="Your Name (optional)">
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="e.g. Ahmad Eff"
            style={S.input}
            disabled={isSubmitting}
            autoComplete="name"
          />
        </Field>

        <Field label="Set Password">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            style={S.input}
            required
            disabled={isSubmitting}
            autoComplete="new-password"
          />
        </Field>

        <Field label="Confirm Password">
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Repeat your password"
            style={S.input}
            required
            disabled={isSubmitting}
            autoComplete="new-password"
          />
        </Field>

        {formError && <p style={S.errorText}>{formError}</p>}

        <button
          type="submit"
          style={{ ...S.primaryBtn, opacity: isSubmitting ? 0.65 : 1 }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Joining…' : `Join ${invite?.org_name ?? 'Organisation'}`}
        </button>
      </form>

      <p style={S.footer}>
        Already have an account?{' '}
        <a href="/login" style={S.inlineLink}>Log in</a>
      </p>
    </Layout>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={S.page}>
      <div style={S.card}>{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={S.field}>
      <label style={S.label}>{label}</label>
      {children}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight:       '100vh',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: '#f8fafc',
    padding:         24,
    fontFamily:      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius:    16,
    border:          '1px solid #e2e8f0',
    padding:         '40px 36px',
    width:           '100%',
    maxWidth:        420,
    boxShadow:       '0 4px 24px rgba(0,0,0,0.06)',
  },
  logo: {
    fontSize:      18,
    fontWeight:    800,
    color:         '#0f172a',
    marginBottom:  24,
    letterSpacing: '-0.5px',
  },
  title: {
    fontSize:     22,
    fontWeight:   700,
    color:        '#0f172a',
    margin:       '0 0 8px',
  },
  subtitle: {
    fontSize:     14,
    color:        '#64748b',
    margin:       '0 0 20px',
    lineHeight:   1.65,
  },
  emailBadge: {
    display:         'inline-block',
    padding:         '4px 12px',
    backgroundColor: '#f1f5f9',
    borderRadius:    20,
    fontSize:        13,
    color:           '#475569',
    marginBottom:    24,
    fontWeight:      500,
  },
  form: {
    display:       'flex',
    flexDirection: 'column',
    gap:           16,
  },
  field: {
    display:       'flex',
    flexDirection: 'column',
    gap:           6,
  },
  label: {
    fontSize:   13,
    fontWeight: 600,
    color:      '#374151',
  },
  input: {
    padding:         '10px 14px',
    border:          '1px solid #d1d5db',
    borderRadius:    8,
    fontSize:        14,
    color:           '#0f172a',
    outline:         'none',
    backgroundColor: '#fff',
    width:           '100%',
    boxSizing:       'border-box',
  },
  errorText: {
    fontSize:        13,
    color:           '#dc2626',
    margin:          0,
    padding:         '9px 12px',
    backgroundColor: '#fef2f2',
    borderRadius:    7,
    border:          '1px solid #fecaca',
    lineHeight:      1.5,
  },
  primaryBtn: {
    marginTop:       8,
    padding:         '12px 20px',
    backgroundColor: '#0f172a',
    color:           '#ffffff',
    border:          'none',
    borderRadius:    8,
    fontSize:        15,
    fontWeight:      600,
    cursor:          'pointer',
    width:           '100%',
    transition:      'background-color 0.15s',
  },
  outlineBtn: {
    display:         'inline-block',
    marginTop:       16,
    padding:         '10px 20px',
    backgroundColor: '#f1f5f9',
    color:           '#0f172a',
    borderRadius:    8,
    textDecoration:  'none',
    fontSize:        14,
    fontWeight:      600,
  },
  footer: {
    fontSize:   13,
    color:      '#94a3b8',
    textAlign:  'center',
    marginTop:  20,
    marginBottom: 0,
  },
  inlineLink: {
    color:          '#0f172a',
    fontWeight:     600,
    textDecoration: 'none',
  },
  muted: {
    color:    '#64748b',
    fontSize: 14,
    margin:   0,
  },
}

function iconCircle(bg: string, color: string): React.CSSProperties {
  return {
    width:           48,
    height:          48,
    backgroundColor: bg,
    borderRadius:    '50%',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    16,
    fontSize:        22,
    color,
  }
}

// Attach as method so TSX can call S.iconCircle(...)
S.iconCircle = iconCircle as unknown as React.CSSProperties

// ── Export (wrapped in Suspense for useSearchParams) ─────────────────────

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#64748b' }}>
          Loading…
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  )
}
