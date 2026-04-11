'use client'

export type BiometricSupport = {
  available: boolean
  enabledByFlag: boolean
  reason: string | null
  secureContext: boolean
  hasPublicKeyCredential: boolean
  topLevelContext: boolean
}

function envFlagEnabled() {
  return (
    process.env.NEXT_PUBLIC_BIOMETRIC_LOGIN_SHORTCUT === 'true' ||
    process.env.NEXT_PUBLIC_ENABLE_EXPERIMENTAL_BIOMETRIC === 'true'
  )
}

function isTopLevelContext() {
  try {
    return typeof window !== 'undefined' && window.top === window
  } catch {
    return false
  }
}

export function isBiometricLoginShortcutEnabled(): boolean {
  return envFlagEnabled()
}

export function getBiometricSupport(): BiometricSupport {
  const secureContext =
    typeof window !== 'undefined' ? window.isSecureContext === true : false

  const hasPublicKeyCredential =
    typeof window !== 'undefined' && 'PublicKeyCredential' in window

  const topLevelContext = isTopLevelContext()
  const enabledByFlag = envFlagEnabled()

  if (!secureContext) {
    return {
      available: false,
      enabledByFlag,
      reason:
        'Biometric login needs a secure context (HTTPS or supported localhost).',
      secureContext,
      hasPublicKeyCredential,
      topLevelContext,
    }
  }

  if (!topLevelContext) {
    return {
      available: false,
      enabledByFlag,
      reason:
        'Biometric login must run in the top-level app window, not inside an embedded frame.',
      secureContext,
      hasPublicKeyCredential,
      topLevelContext,
    }
  }

  if (!hasPublicKeyCredential) {
    return {
      available: false,
      enabledByFlag,
      reason:
        'This browser or device does not expose WebAuthn / passkey support.',
      secureContext,
      hasPublicKeyCredential,
      topLevelContext,
    }
  }

  if (!enabledByFlag) {
    return {
      available: false,
      enabledByFlag,
      reason:
        'Biometric login is not enabled for this project yet. Password login remains available.',
      secureContext,
      hasPublicKeyCredential,
      topLevelContext,
    }
  }

  return {
    available: true,
    enabledByFlag,
    reason: null,
    secureContext,
    hasPublicKeyCredential,
    topLevelContext,
  }
}
