'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ChangePasswordPage() {
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function validatePassword(value: string): string | null {
    if (!value) return 'Password is required.'
    if (value.length < 8) return 'Password must be at least 8 characters.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSaving(true)

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      const res = await fetch('/api/auth/complete-first-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(json.error?.message ?? 'Password updated, but failed to complete first-login setup.')
        return
      }

      setSuccess('Password updated successfully. You will be logged out now.')

      await supabase.auth.signOut()

      setTimeout(() => {
        router.replace('/login?passwordChanged=1')
      }, 900)
    } catch {
      setError('Unable to update password right now. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>myexpensio</div>

        <h1 style={S.title}>Set your new password</h1>
        <p style={S.subtitle}>
          This is your first login with a temporary password. Please set your own password before continuing.
        </p>

        {error && <div style={S.errorBanner}>{error}</div>}
        {success && <div style={S.successBanner}>{success}</div>}

        <form onSubmit={handleSubmit} style={S.form}>
          <PasswordField
            id="new-password"
            label="New password"
            value={password}
            onChange={setPassword}
            placeholder="At least 8 characters"
            show={showPassword}
            onToggle={() => setShowPassword((v) => !v)}
            disabled={saving}
          />

          <PasswordField
            id="confirm-password"
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Re-enter your new password"
            show={showConfirmPassword}
            onToggle={() => setShowConfirmPassword((v) => !v)}
            disabled={saving}
          />

          <button
            type="submit"
            style={{ ...S.primaryBtn, opacity: saving ? 0.65 : 1 }}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save password and continue'}
          </button>
        </form>
      </div>
    </div>
  )
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  show,
  onToggle,
  disabled,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  show: boolean
  onToggle: () => void
  disabled?: boolean
}) {
  return (
    <div style={S.field}>
      <label style={S.label} htmlFor={id}>
        {label}
      </label>

      <div style={S.passwordWrap}>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={S.passwordInput}
          autoComplete="new-password"
          required
          disabled={disabled}
        />

        <button
          type="button"
          onClick={onToggle}
          style={{ ...S.eyeBtn, opacity: disabled ? 0.5 : 1 }}
          aria-label={show ? 'Hide password' : 'Show password'}
          title={show ? 'Hide password' : 'Show password'}
          disabled={disabled}
        >
          {show ? '🙈' : '👁'}
        </button>
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
    maxWidth: 420,
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
  passwordWrap: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    padding: '10px 44px 10px 12px',
    border: '1.5px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
    WebkitTextFillColor: '#0f172a',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
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
}  