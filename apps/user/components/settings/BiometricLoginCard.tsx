'use client'

import { useMemo, useState } from 'react'
import {
  enrollBiometricOnThisDevice,
  getBiometricSupport,
} from '@/lib/auth/biometric-auth'

export default function BiometricLoginCard() {
  const support = useMemo(() => getBiometricSupport(), [])
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(support.reason)

  async function handleEnable() {
    setBusy(true)
    setSuccess(null)
    setError(null)

    const result = await enrollBiometricOnThisDevice({
      friendlyName: 'This phone',
    })

    if (result.ok) {
      setSuccess(result.message)
      setError(null)
    } else {
      setSuccess(null)
      setError(result.message)
      if (result.details) {
        console.warn('[BiometricLoginCard] details:', result.details)
      }
    }

    setBusy(false)
  }

  const buttonDisabled = busy || !support.available

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <div>
          <h3 style={styles.title}>Biometric Login on This Phone</h3>
          <p style={styles.subtitle}>
            First sign in with email and password, then enable phone biometrics
            for this device when the project is ready.
          </p>
        </div>
        <span
          style={{
            ...styles.badge,
            backgroundColor: support.available ? '#dcfce7' : '#f1f5f9',
            color: support.available ? '#166534' : '#475569',
          }}
        >
          {support.available ? 'Ready to try' : 'Safe fallback'}
        </span>
      </div>

      <div style={styles.infoBox}>
        <div style={styles.infoLine}>
          <strong>Secure context:</strong>{' '}
          {support.secureContext ? 'Yes' : 'No'}
        </div>
        <div style={styles.infoLine}>
          <strong>WebAuthn available:</strong>{' '}
          {support.hasPublicKeyCredential ? 'Yes' : 'No'}
        </div>
        <div style={styles.infoLine}>
          <strong>Top-level app window:</strong>{' '}
          {support.topLevelContext ? 'Yes' : 'No'}
        </div>
        <div style={styles.infoLine}>
          <strong>Project flag enabled:</strong>{' '}
          {support.enabledByFlag ? 'Yes' : 'No'}
        </div>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}
      {success && <div style={styles.successBox}>{success}</div>}

      <div style={styles.actions}>
        <button
          type="button"
          onClick={handleEnable}
          disabled={buttonDisabled}
          style={{
            ...styles.button,
            opacity: buttonDisabled ? 0.55 : 1,
            cursor: buttonDisabled ? 'not-allowed' : 'pointer',
          }}
        >
          {busy ? 'Enabling…' : 'Enable biometric login'}
        </button>
      </div>

      <p style={styles.note}>
        Password login remains available as the safe fallback.
      </p>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    background: '#fff',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: '#0f172a',
  },
  subtitle: {
    margin: '4px 0 0',
    fontSize: 13,
    color: '#64748b',
    lineHeight: 1.5,
  },
  badge: {
    borderRadius: 999,
    padding: '6px 10px',
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  infoBox: {
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    display: 'grid',
    gap: 6,
  },
  infoLine: {
    fontSize: 13,
    color: '#334155',
  },
  errorBox: {
    border: '1px solid #fecaca',
    background: '#fef2f2',
    color: '#b91c1c',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    lineHeight: 1.5,
  },
  successBox: {
    border: '1px solid #bbf7d0',
    background: '#f0fdf4',
    color: '#166534',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    gap: 10,
  },
  button: {
    border: 'none',
    borderRadius: 10,
    background: '#0f172a',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    padding: '12px 16px',
  },
  note: {
    margin: 0,
    fontSize: 12,
    color: '#64748b',
  },
}
