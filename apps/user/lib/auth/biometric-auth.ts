'use client'

import { createClient } from '@/lib/supabase/client'
import { getBiometricSupport, type BiometricSupport } from './biometric-capabilities'
import {
  clearStoredBiometricDevice,
  getStoredBiometricDevice,
  hasBiometricMarkerOnThisDevice,
  markStoredBiometricDeviceUsed,
  saveStoredBiometricDevice,
  type StoredBiometricDevice,
} from './biometric-device'

export type BiometricFactorSummary = {
  id: string
  friendlyName: string | null
  status: string | null
  createdAt: string | null
}

export type BiometricStatus = {
  support: BiometricSupport
  userEmail: string | null
  marker: StoredBiometricDevice | null
  factors: BiometricFactorSummary[]
  hasServerFactor: boolean | null
  enabledOnThisDevice: boolean
  readyForLoginShortcut: boolean
}

function normalizeError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error.trim()) return error
  return fallback
}

function unwrapData<T>(result: any): T {
  if (result && typeof result === 'object' && 'data' in result) return result.data as T
  return result as T
}

function getResultError(result: any): Error | null {
  const value = result && typeof result === 'object' ? result.error : null
  if (!value) return null
  if (value instanceof Error) return value
  if (typeof value?.message === 'string') return new Error(value.message)
  return new Error('Unknown biometric error.')
}

function collectArrayValues(input: unknown): any[] {
  if (!input || typeof input !== 'object') return []
  const values = Object.values(input as Record<string, unknown>)
  return values.flatMap((value) => (Array.isArray(value) ? value : []))
}

function normalizeFactors(rawFactors: any[]): BiometricFactorSummary[] {
  return rawFactors
    .filter(Boolean)
    .filter((factor) => {
      const factorType = String(
        factor?.factor_type ??
          factor?.factorType ??
          factor?.type ??
          '',
      ).toLowerCase()
      return factorType.includes('webauthn') || factorType.includes('passkey')
    })
    .map((factor) => ({
      id: String(factor?.id ?? factor?.factor_id ?? factor?.factorId ?? ''),
      friendlyName:
        factor?.friendly_name ??
        factor?.friendlyName ??
        factor?.name ??
        factor?.factor_name ??
        null,
      status:
        factor?.status ??
        factor?.state ??
        null,
      createdAt:
        factor?.created_at ??
        factor?.createdAt ??
        null,
    }))
    .filter((factor) => factor.id.length > 0)
}

function getWebauthnApi(supabase: any) {
  const api = supabase?.auth?.mfa?.webauthn
  if (!api || typeof api !== 'object') {
    throw new Error(
      'This Supabase project does not currently expose a browser WebAuthn API in the installed SDK.'
    )
  }
  return api
}

async function callVariants<T>(fn: (...args: any[]) => Promise<any>, variants: any[][], fallback: string) {
  let lastError: unknown = null

  for (const args of variants) {
    try {
      const result = await fn(...args)
      const resultError = getResultError(result)
      if (resultError) throw resultError
      return unwrapData<T>(result)
    } catch (error) {
      lastError = error
    }
  }

  throw new Error(normalizeError(lastError, fallback))
}

function getFriendlyDeviceName(email: string | null) {
  const platform = typeof navigator !== 'undefined' ? navigator.platform : 'device'
  const brand = typeof navigator !== 'undefined' ? navigator.userAgent : 'browser'
  const compactBrand = brand.replace(/\s+/g, ' ').slice(0, 48)
  return email ? `myexpensio on ${platform} · ${email}` : `myexpensio on ${platform} · ${compactBrand}`
}

export function isBiometricLoginShortcutEnabled() {
  return process.env.NEXT_PUBLIC_BIOMETRIC_LOGIN_SHORTCUT === 'true'
}

export async function listBiometricFactors(): Promise<BiometricFactorSummary[]> {
  const supabase = createClient() as any
  const auth = supabase.auth as any

  const buckets: any[] = []

  if (typeof auth?.mfa?.listFactors === 'function') {
    try {
      const result = await auth.mfa.listFactors()
      const error = getResultError(result)
      if (!error) {
        const data = unwrapData<any>(result)
        buckets.push(...collectArrayValues(data))
      }
    } catch {
      // fall through to webauthn-specific listing
    }
  }

  if (auth?.mfa?.webauthn && typeof auth.mfa.webauthn.list === 'function') {
    try {
      const result = await auth.mfa.webauthn.list()
      const error = getResultError(result)
      if (!error) {
        const data = unwrapData<any>(result)
        if (Array.isArray(data)) buckets.push(...data)
        else buckets.push(...collectArrayValues(data))
      }
    } catch {
      // ignore and return whatever we already found
    }
  }

  return normalizeFactors(buckets)
}

export async function getBiometricStatusForCurrentUser(): Promise<BiometricStatus> {
  const support = await getBiometricSupport()
  const marker = getStoredBiometricDevice()
  const supabase = createClient() as any

  const userResult = await supabase.auth.getUser()
  const userError = getResultError(userResult)
  if (userError) throw userError

  const user = unwrapData<any>(userResult)?.user ?? unwrapData<any>(userResult)
  const userEmail = (user?.email ?? null) as string | null

  let factors: BiometricFactorSummary[] = []
  let hasServerFactor: boolean | null = null

  if (userEmail) {
    try {
      factors = await listBiometricFactors()
      if (marker?.factorId) {
        hasServerFactor = factors.some((factor) => factor.id === marker.factorId)
      } else {
        hasServerFactor = factors.length > 0
      }
    } catch {
      hasServerFactor = null
    }
  }

  const enabledOnThisDevice =
    Boolean(marker?.enabled) &&
    (!userEmail || marker?.email?.toLowerCase() === userEmail.toLowerCase())

  return {
    support,
    userEmail,
    marker,
    factors,
    hasServerFactor,
    enabledOnThisDevice,
    readyForLoginShortcut: support.supported && enabledOnThisDevice,
  }
}

export async function enrollBiometricOnThisDevice() {
  const support = await getBiometricSupport()
  if (!support.supported) {
    throw new Error(support.reason ?? 'Biometric login is not available in this browser.')
  }

  const supabase = createClient() as any
  const userResult = await supabase.auth.getUser()
  const userError = getResultError(userResult)
  if (userError) throw userError

  const user = unwrapData<any>(userResult)?.user ?? unwrapData<any>(userResult)
  const userEmail = (user?.email ?? null) as string | null
  if (!userEmail) {
    throw new Error('You must be signed in before enabling biometrics on this device.')
  }

  const webauthn = getWebauthnApi(supabase)
  if (typeof webauthn.register !== 'function') {
    throw new Error('This SDK does not currently expose webauthn.register().')
  }

  const friendlyName = getFriendlyDeviceName(userEmail)

  const data = await callVariants<any>(
    webauthn.register.bind(webauthn),
    [
      [{ friendlyName, factorName: friendlyName, nickname: friendlyName, name: userEmail, email: userEmail }],
      [{ friendlyName }],
      [{}],
      [],
    ],
    'Unable to register biometrics on this device.'
  )

  const factorId =
    data?.id ??
    data?.factorId ??
    data?.factor_id ??
    data?.factor?.id ??
    data?.credential?.id ??
    null

  saveStoredBiometricDevice({
    enabled: true,
    email: userEmail,
    factorId: factorId ? String(factorId) : null,
    enrolledAt: new Date().toISOString(),
    lastUsedAt: null,
  })

  return {
    factorId: factorId ? String(factorId) : null,
    email: userEmail,
  }
}

export async function authenticateBiometricOnThisDevice(emailHint?: string | null) {
  const support = await getBiometricSupport()
  if (!support.supported) {
    throw new Error(support.reason ?? 'Biometric login is not available in this browser.')
  }

  const supabase = createClient() as any
  const webauthn = getWebauthnApi(supabase)
  if (typeof webauthn.authenticate !== 'function') {
    throw new Error('This SDK does not currently expose webauthn.authenticate().')
  }

  const marker = getStoredBiometricDevice()
  const normalizedEmail = emailHint?.trim().toLowerCase() || marker?.email || null

  const data = await callVariants<any>(
    webauthn.authenticate.bind(webauthn),
    [
      [marker?.factorId ? { factorId: marker.factorId, factor_id: marker.factorId, email: normalizedEmail } : { email: normalizedEmail }],
      [marker?.factorId ? { factorId: marker.factorId } : {}],
      [{}],
      [],
    ],
    'Biometric authentication failed.'
  )

  if (hasBiometricMarkerOnThisDevice(normalizedEmail)) {
    markStoredBiometricDeviceUsed()
  }

  return data
}

export async function disableBiometricOnThisDevice() {
  const supabase = createClient() as any
  const marker = getStoredBiometricDevice()

  if (marker?.factorId) {
    try {
      const webauthn = getWebauthnApi(supabase)
      if (typeof webauthn.unenroll === 'function') {
        const result = await callVariants<any>(
          webauthn.unenroll.bind(webauthn),
          [
            [{ factorId: marker.factorId, factor_id: marker.factorId }],
            [marker.factorId],
          ],
          'Unable to remove this biometric credential.'
        )
        clearStoredBiometricDevice()
        return result
      }
    } catch {
      // fall back to generic MFA unenroll
    }

    const genericMfa = supabase?.auth?.mfa
    if (genericMfa && typeof genericMfa.unenroll === 'function') {
      const result = await callVariants<any>(
        genericMfa.unenroll.bind(genericMfa),
        [
          [{ factorId: marker.factorId, factor_id: marker.factorId }],
          [marker.factorId],
        ],
        'Unable to remove this biometric credential.'
      )
      clearStoredBiometricDevice()
      return result
    }
  }

  clearStoredBiometricDevice()
  return { removed: true }
}
