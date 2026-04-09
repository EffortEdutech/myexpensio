'use client'

import { useEffect } from 'react'

export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    if (window.location.protocol !== 'https:' && !isLocalhost) return

    let cancelled = false

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        if (cancelled) return

        if (reg.waiting) {
          window.dispatchEvent(new CustomEvent('pwa:update-available'))
        }

        reg.addEventListener('updatefound', () => {
          const worker = reg.installing
          if (!worker) return
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              window.dispatchEvent(new CustomEvent('pwa:update-available'))
            }
          })
        })
      } catch (error) {
        console.error('[PwaRegister] service worker registration failed', error)
      }
    }

    window.addEventListener('load', register)

    return () => {
      cancelled = true
      window.removeEventListener('load', register)
    }
  }, [])

  return null
}
