'use client'

export type BiometricSupport = {
  supported: boolean
  isSecureContext: boolean
  isTopLevelContext: boolean
  hasPublicKeyCredential: boolean
  hasPlatformAuthenticator: boolean | null
  hasConditionalMediation: boolean | null
  reason: string | null
}

function isLocalhost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

function safeIsTopLevelContext() {
  if (typeof window === 'undefined') return false
  try {
    return window.self === window.top
  } catch {
    return false
  }
}

export async function getBiometricSupport(): Promise<BiometricSupport> {
  if (typeof window === 'undefined') {
    return {
      supported: false,
      isSecureContext: false,
      isTopLevelContext: false,
      hasPublicKeyCredential: false,
      hasPlatformAuthenticator: null,
      hasConditionalMediation: null,
      reason: 'Biometric login is only available in the browser.',
    }
  }

  const hasPublicKeyCredential = typeof window.PublicKeyCredential !== 'undefined'
  const isSecureContextNow =
    window.isSecureContext ||
    window.location.protocol === 'https:' ||
    isLocalhost(window.location.hostname)

  const isTopLevelContext = safeIsTopLevelContext()

  let hasPlatformAuthenticator: boolean | null = null
  let hasConditionalMediation: boolean | null = null

  if (
    hasPublicKeyCredential &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
  ) {
    try {
      hasPlatformAuthenticator =
        await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    } catch {
      hasPlatformAuthenticator = null
    }
  }

  const conditionalMediationFn = (window.PublicKeyCredential as typeof PublicKeyCredential & {
    isConditionalMediationAvailable?: () => Promise<boolean>
  } | undefined)?.isConditionalMediationAvailable

  if (typeof conditionalMediationFn === 'function') {
    try {
      hasConditionalMediation = await conditionalMediationFn.call(window.PublicKeyCredential)
    } catch {
      hasConditionalMediation = null
    }
  }

  if (!hasPublicKeyCredential) {
    return {
      supported: false,
      isSecureContext: isSecureContextNow,
      isTopLevelContext,
      hasPublicKeyCredential,
      hasPlatformAuthenticator,
      hasConditionalMediation,
      reason: 'This browser does not support WebAuthn / passkeys.',
    }
  }

  if (!isSecureContextNow) {
    return {
      supported: false,
      isSecureContext: false,
      isTopLevelContext,
      hasPublicKeyCredential,
      hasPlatformAuthenticator,
      hasConditionalMediation,
      reason: 'Biometric login requires HTTPS or localhost.',
    }
  }

  if (!isTopLevelContext) {
    return {
      supported: false,
      isSecureContext: true,
      isTopLevelContext: false,
      hasPublicKeyCredential,
      hasPlatformAuthenticator,
      hasConditionalMediation,
      reason: 'Biometric login must run in a top-level browser context.',
    }
  }

  return {
    supported: true,
    isSecureContext: true,
    isTopLevelContext: true,
    hasPublicKeyCredential,
    hasPlatformAuthenticator,
    hasConditionalMediation,
    reason: null,
  }
}

export async function canOfferBiometricEnrollment() {
  const support = await getBiometricSupport()
  return support.supported
}
