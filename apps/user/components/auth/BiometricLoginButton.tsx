'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  authenticateBiometricOnThisDevice,
  getBiometricStatusForCurrentUser,
  isBiometricLoginShortcutEnabled,
} from '@/lib/auth/biometric-auth'

type Props = {
  emailHint?: string
  redirectTo: string
}

export function BiometricLoginButton({ emailHint, redirectTo }: Props) {
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      if (!isBiometricLoginShortcutEnabled()) {
        if (active) {
          setVisible(false)
          setLoading(false)
        }
        return
      }

      try {
        const status = await getBiometricStatusForCurrentUser()
        if (!active) return
        setVisible(status.readyForLoginShortcut)
      } catch {
        if (!active) return
        setVisible(false)
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  if (loading || !visible) return null

  async function handleClick() {
    setBusy(true)
    setError(null)
    try {
      await authenticateBiometricOnThisDevice(emailHint)
      router.push(redirectTo)
      router.refresh()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to sign in with biometrics.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={S.wrap}>
      <button
        type="button"
        onClick={handleClick}
        style={{ ...S.button, opacity: busy ? 0.75 : 1 }}
        disabled={busy}
      >
        {busy ? 'Checking biometrics…' : 'Use biometrics on this phone'}
      </button>
      <div style={S.note}>Or sign in with email and password below.</div>
      {error && <div style={S.error}>{error}</div>}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 },
  button: { width: '100%', padding: '12px 20px', backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  note: { fontSize: 12, color: '#64748b', textAlign: 'center', lineHeight: 1.5 },
  error: { padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, lineHeight: 1.5 },
}
