'use client'
// apps/user/components/DocumentScanner.tsx
//
// Opens the device NATIVE camera (full zoom, flash, HDR — everything the
// phone manufacturer built) via <input capture="environment">.
// Returns a JPEG blob to the parent via onScanComplete.
//
// Props:
//   onScanComplete — called with captured JPEG Blob
//   onClose        — called when user cancels
//   purpose        — 'RECEIPT' | 'ODOMETER' (label only)

import { useEffect, useRef, useState } from 'react'

type Props = {
  onScanComplete: (blob: Blob) => void
  onClose:        () => void
  purpose?:       'RECEIPT' | 'ODOMETER'
}

export function DocumentScanner({ onScanComplete, onClose, purpose = 'RECEIPT' }: Props) {
  const inputRef   = useRef<HTMLInputElement>(null)
  const [waiting, setWaiting] = useState(true)

  const label = purpose === 'ODOMETER' ? 'odometer' : 'receipt'

  // Auto-open native camera picker on mount
  useEffect(() => {
    const t = setTimeout(() => {
      inputRef.current?.click()
    }, 120)   // small delay — iOS needs the element to be in DOM first
    return () => clearTimeout(t)
  }, [])

  // Detect cancel — window regains focus but no file was selected
  useEffect(() => {
    function onFocus() {
      // Wait a tick for onChange to fire first if a file was picked
      setTimeout(() => {
        if (inputRef.current && !inputRef.current.files?.length) {
          onClose()
        }
      }, 400)
    }
    window.addEventListener('focus', onFocus, { once: true })
    return () => window.removeEventListener('focus', onFocus)
  }, [onClose])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setWaiting(false)
    const file = e.target.files?.[0]
    if (!file) { onClose(); return }

    // Force image/jpeg — some Android browsers return empty type
    const blob = new Blob([file], { type: 'image/jpeg' })
    onScanComplete(blob)
  }

  return (
    <>
      {/* Hidden native camera input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        style={{ display: 'none' }}
      />

      {/* Minimal overlay shown while picker is opening */}
      {waiting && (
        <div style={S.backdrop}>
          <div style={S.sheet}>
            <p style={S.hint}>📷 Opening camera for {label}…</p>
            <button onClick={onClose} style={S.cancelBtn}>Cancel</button>
          </div>
        </div>
      )}
    </>
  )
}

const S: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(2,6,23,0.85)',
    zIndex: 3000,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  },
  sheet: {
    backgroundColor: '#0f172a',
    borderRadius: '18px 18px 0 0',
    width: '100%', maxWidth: 640,
    padding: '32px 24px 48px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 24,
  },
  hint: {
    fontSize: 16, color: '#94a3b8',
    margin: 0, textAlign: 'center',
  },
  cancelBtn: {
    padding: '12px 40px',
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#e2e8f0',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12, fontSize: 15, cursor: 'pointer',
  },
}
