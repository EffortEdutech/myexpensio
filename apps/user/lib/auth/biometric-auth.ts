'use client'

import { createClient } from '@/lib/supabase/client'
import {
  getBiometricSupport,
  isBiometricLoginShortcutEnabled,
  type BiometricSupport,
} from '@/lib/auth/biometric-capabilities'
import {
  defaultFriendlyName,
  isBiometricMarkedOnThisDevice,
  markBiometricEnrolledOnThisDevice,
} from '@/lib/auth/biometric-device'

export { getBiometricSupport, isBiometricLoginShortcutEnabled }
export type { BiometricSupport }

export type BiometricEnrollResult =
  | {
      ok: true
      message: string
      factorId?: string
    }
  | {
      ok: false
      code:
        | 'disabled'
        | 'unsupported'
        | 'not_secure_context'
        | 'not_top_level'
        | 'not_authenticated'
        | 'provider_unavailable'
        | 'provider_rejected'
        | 'unknown'
      message: string
      details?: string
    }

export type BiometricLoginShortcutStatus = {
  readyForLoginShortcut: boolean
  enrolledOnThisDevice: boolean
  available: boolean
  reason: string | null
}

function normalizeError(error: unknown): BiometricEnrollResult {
  const message =
    error instanceof Error ? error.message : 'Unknown biometric enrollment error.'

  const lower = message.toLowerCase()

  if (lower.includes('422') || lower.includes('unprocessable')) {
    return {
      ok: false,
      code: 'provider_rejected',
      message:
        'Biometric login is not available on this Supabase project yet.',
      details: message,
    }
  }

  if (
    lower.includes('not authenticated') ||
    lower.includes('auth session missing') ||
    lower.includes('jwt')
  ) {
    return {
      ok: false,
      code: 'not_authenticated',
      message: 'Please sign in again before enabling biometric login.',
      details: message,
    }
  }

  return {
    ok: false,
    code: 'unknown',
    message: 'Unable to enable biometric login right now.',
    details: message,
  }
}

export async function enrollBiometricOnThisDevice(
  options: { friendlyName?: string } = {},
): Promise<BiometricEnrollResult> {
  const friendlyName = options.friendlyName?.trim() || defaultFriendlyName()
  const support = getBiometricSupport()

  if (!support.enabledByFlag) {
    return {
      ok: false,
      code: 'disabled',
      message:
        support.reason ??
        'Biometric login is disabled for this project at the moment.',
    }
  }

  if (!support.secureContext) {
    return {
      ok: false,
      code: 'not_secure_context',
      message:
        support.reason ??
        'Biometric login requires HTTPS or a supported secure local environment.',
    }
  }

  if (!support.topLevelContext) {
    return {
      ok: false,
      code: 'not_top_level',
      message:
        support.reason ??
        'Biometric login must be used from the main app window.',
    }
  }

  if (!support.hasPublicKeyCredential) {
    return {
      ok: false,
      code: 'unsupported',
      message:
        support.reason ??
        'This browser or device does not support passkeys / WebAuthn.',
    }
  }

  const supabase = createClient()

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        ok: false,
        code: 'not_authenticated',
        message: 'Please sign in again before enabling biometric login.',
        details: userError?.message,
      }
    }

    const mfa = (supabase.auth as unknown as { mfa?: Record<string, unknown> })
      .mfa

    if (!mfa) {
      return {
        ok: false,
        code: 'provider_unavailable',
        message:
          'Biometric login is not available in this auth client configuration.',
      }
    }

    const webauthn = mfa['webauthn'] as
      | {
          register?: (args?: Record<string, unknown>) => Promise<unknown>
        }
      | undefined

    if (!webauthn || typeof webauthn.register !== 'function') {
      return {
        ok: false,
        code: 'provider_unavailable',
        message:
          'WebAuthn enrollment is not exposed by this Supabase client build.',
      }
    }

    const result = (await webauthn.register({
      friendlyName,
    })) as
      | {
          data?: { id?: string; factorId?: string }
          error?: { message?: string; status?: number }
        }
      | undefined

    if (result?.error) {
      return {
        ok: false,
        code: 'provider_rejected',
        message:
          result.error.message ||
          'Biometric login is not available on this project yet.',
        details:
          typeof result.error.status !== 'undefined'
            ? `status=${result.error.status}`
            : undefined,
      }
    }

    markBiometricEnrolledOnThisDevice(true)

    return {
      ok: true,
      message: `Biometric login has been enabled as "${friendlyName}".`,
      factorId: result?.data?.factorId ?? result?.data?.id,
    }
  } catch (error) {
    return normalizeError(error)
  }
}

export async function getBiometricStatusForCurrentUser(): Promise<BiometricLoginShortcutStatus> {
  const support = getBiometricSupport()

  return {
    readyForLoginShortcut: false,
    enrolledOnThisDevice: isBiometricMarkedOnThisDevice(),
    available: support.available,
    reason: support.reason,
  }
}

export async function authenticateBiometricOnThisDevice(
  _emailHint?: string,
): Promise<never> {
  const support = getBiometricSupport()

  throw new Error(
    support.reason ??
      'Biometric sign-in on this phone is not available yet. Please use email and password.',
  )
}
