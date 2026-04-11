'use client'

export type StoredBiometricDevice = {
  version: 1
  enabled: boolean
  email: string | null
  factorId: string | null
  enrolledAt: string
  lastUsedAt: string | null
}

const STORAGE_KEY = 'myexpensio.biometric.device.v1'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function getStoredBiometricDevice(): StoredBiometricDevice | null {
  if (!canUseStorage()) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredBiometricDevice
    if (!parsed || parsed.version !== 1) return null
    return parsed
  } catch {
    return null
  }
}

export function saveStoredBiometricDevice(input: Omit<StoredBiometricDevice, 'version'>) {
  if (!canUseStorage()) return
  const payload: StoredBiometricDevice = {
    version: 1,
    ...input,
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function clearStoredBiometricDevice() {
  if (!canUseStorage()) return
  window.localStorage.removeItem(STORAGE_KEY)
}

export function markStoredBiometricDeviceUsed() {
  const current = getStoredBiometricDevice()
  if (!current) return
  saveStoredBiometricDevice({
    ...current,
    lastUsedAt: new Date().toISOString(),
  })
}

export function hasBiometricMarkerOnThisDevice(emailHint?: string | null) {
  const current = getStoredBiometricDevice()
  if (!current?.enabled) return false
  if (!emailHint) return true
  return current.email?.toLowerCase() === emailHint.trim().toLowerCase()
}
