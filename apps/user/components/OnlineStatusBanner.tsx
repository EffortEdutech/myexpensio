'use client'

import { useEffect, useRef, useState } from 'react'

export function OnlineStatusBanner() {
  const [isOnline, setIsOnline] = useState(true)
  const [showBackOnline, setShowBackOnline] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const sync = () => setIsOnline(navigator.onLine)
    sync()

    const onOnline = () => {
      setIsOnline(true)
      setShowBackOnline(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setShowBackOnline(false), 2800)
    }

    const onOffline = () => {
      setIsOnline(false)
      setShowBackOnline(false)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  if (isOnline && !showBackOnline) return null

  const offline = !isOnline

  return (
    <div
      style={{
        ...S.banner,
        backgroundColor: offline ? '#fef2f2' : '#f0fdf4',
        borderColor: offline ? '#fecaca' : '#bbf7d0',
        color: offline ? '#b91c1c' : '#15803d',
      }}
      role="status"
      aria-live="polite"
    >
      {offline
        ? '📡 You are offline. myexpensio needs internet for routes, exports, uploads, and account actions.'
        : '✅ Back online.'}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  banner: { padding: '10px 12px', border: '1px solid', borderRadius: 10, fontSize: 12, fontWeight: 600, lineHeight: 1.5 },
}
