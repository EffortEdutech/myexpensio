'use client'

const DEVICE_MARKER_KEY = 'myexpensio.biometric.enrolled.v1'

export function defaultFriendlyName() {
  if (typeof navigator === 'undefined') return 'This device'
  const ua = navigator.userAgent || ''
  if (/iPhone/i.test(ua)) return 'This iPhone'
  if (/iPad/i.test(ua)) return 'This iPad'
  if (/Android/i.test(ua)) return 'This Android phone'
  return 'This device'
}

export function markBiometricEnrolledOnThisDevice(value: boolean) {
  if (typeof window === 'undefined') return
  if (value) window.localStorage.setItem(DEVICE_MARKER_KEY, '1')
  else window.localStorage.removeItem(DEVICE_MARKER_KEY)
}

export function isBiometricMarkedOnThisDevice(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(DEVICE_MARKER_KEY) === '1'
}
