'use client'

import { useEffect, useState } from 'react'
import {
  authenticateBiometricOnThisDevice,
  disableBiometricOnThisDevice,
  enrollBiometricOnThisDevice,
  getBiometricStatusForCurrentUser,
  type BiometricStatus,
} from '@/lib/auth/biometric-auth'

export function BiometricLoginCard() {
  const [status, setStatus] = useState<BiometricStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<'enable' | 'test' | 'disable' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    try {
      const next = await getBiometricStatusForCurrentUser()
      setStatus(next)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load biometric status.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function handleEnable() {
    setBusy('enable')
    setError(null)
    setSuccess(null)
    try {
      await enrollBiometricOnThisDevice()
      await refresh()
      setSuccess('Biometric login has been enabled on this device.')
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to enable biometrics.')
    } finally {
      setBusy(null)
    }
  }

  async function handleTest() {
    setBusy('test')
    setError(null)
    setSuccess(null)
    try {
      await authenticateBiometricOnThisDevice(status?.userEmail ?? null)
      setSuccess('Biometric verification succeeded on this device.')
      await refresh()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Biometric verification failed.')
    } finally {
      setBusy(null)
    }
  }

  async function handleDisable() {
    setBusy('disable')
    setError(null)
    setSuccess(null)
    try {
      await disableBiometricOnThisDevice()
      await refresh()
      setSuccess('Biometric login has been removed from this device.')
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to disable biometrics.')
    } finally {
      setBusy(null)
    }
  }

  const support = status?.support
  const unsupported = support && !support.supported
  const enabled = Boolean(status?.enabledOnThisDevice)

  return (
    <div style={S.card}>
      <div style={S.cardHead}>
        <span style={S.icon}>🔐</span>
        <div>
          <div style={S.title}>Biometric Login on This Phone</div>
          <div style={S.sub}>
            Uses your phone’s Face ID / Touch ID / fingerprint / device credential on supported browsers.
            Password login remains available.
          </div>
        </div>
      </div>

      {loading && <div style={S.info}>Checking biometric support on this device…</div>}

      {!loading && unsupported && (
        <div style={S.unsupportedBox}>
          <div style={S.unsupportedTitle}>Biometric login is not available here.</div>
          <div style={S.unsupportedText}>{support?.reason ?? 'This browser/device combination is not supported.'}</div>
          <div style={S.helperText}>
            Try HTTPS, Safari/Chrome, or an installed PWA on a supported phone.
          </div>
        </div>
      )}

      {!loading && !unsupported && !enabled && (
        <>
          <div style={S.info}>
            Enable biometrics on this device after normal password sign-in. This is stored per device / browser / PWA install.
            Clearing browser data may remove access on this phone.
          </div>
          <div style={S.actions}>
            <button
              type="button"
              onClick={handleEnable}
              style={S.btnPrimary}
              disabled={busy !== null}
            >
              {busy === 'enable' ? 'Enabling…' : 'Enable biometrics'}
            </button>
          </div>
        </>
      )}

      {!loading && !unsupported && enabled && (
        <>
          <div style={S.enabledBox}>
            <div style={S.enabledTitle}>Enabled on this device</div>
            <div style={S.enabledText}>
              Biometric login is enabled on this device. Password login remains available as backup.
            </div>
            {status?.marker?.enrolledAt && (
              <div style={S.metaLine}>Enabled: {new Date(status.marker.enrolledAt).toLocaleString()}</div>
            )}
            {status?.marker?.lastUsedAt && (
              <div style={S.metaLine}>Last used: {new Date(status.marker.lastUsedAt).toLocaleString()}</div>
            )}
            {status?.hasServerFactor === false && (
              <div style={S.warnText}>
                Local device enrollment exists, but the server factor could not be confirmed. Re-enable if this device stops working.
              </div>
            )}
          </div>

          <div style={S.actions}>
            <button
              type="button"
              onClick={handleTest}
              style={S.btnPrimary}
              disabled={busy !== null}
            >
              {busy === 'test' ? 'Testing…' : 'Test biometrics'}
            </button>
            <button
              type="button"
              onClick={handleDisable}
              style={S.btnSecondary}
              disabled={busy !== null}
            >
              {busy === 'disable' ? 'Disabling…' : 'Disable biometrics'}
            </button>
          </div>
        </>
      )}

      {error && <div style={S.error}>{error}</div>}
      {success && <div style={S.success}>{success}</div>}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  card: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 },
  cardHead: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 },
  icon: { fontSize: 22 },
  title: { fontSize: 14, fontWeight: 700, color: '#0f172a' },
  sub: { fontSize: 11, color: '#94a3b8', marginTop: 2, lineHeight: 1.6 },
  info: { padding: '10px 12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12, color: '#475569', lineHeight: 1.6 },
  unsupportedBox: { padding: '12px 14px', backgroundColor: '#fff7ed', border: '1px solid #fdba74', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 4 },
  unsupportedTitle: { fontSize: 13, fontWeight: 700, color: '#9a3412' },
  unsupportedText: { fontSize: 12, color: '#9a3412', lineHeight: 1.6 },
  helperText: { fontSize: 11, color: '#c2410c', lineHeight: 1.5 },
  enabledBox: { padding: '12px 14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 4 },
  enabledTitle: { fontSize: 13, fontWeight: 700, color: '#166534' },
  enabledText: { fontSize: 12, color: '#166534', lineHeight: 1.6 },
  metaLine: { fontSize: 11, color: '#15803d' },
  warnText: { fontSize: 11, color: '#b45309', lineHeight: 1.5 },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  btnPrimary: { padding: '10px 14px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnSecondary: { padding: '10px 14px', backgroundColor: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  error: { padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626' },
  success: { padding: '10px 12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13, color: '#15803d' },
}
