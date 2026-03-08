'use client'
// apps/user/components/DocumentScanner.tsx
//
// Step 1 (current): Camera open → capture photo → return JPEG blob.
// Image processing (OpenCV) will be added separately in a later step.
//
// Props:
//   onScanComplete  — called with captured JPEG Blob
//   onClose         — called when user cancels
//   purpose         — 'RECEIPT' | 'ODOMETER' (label only)

import { useEffect, useRef, useState, useCallback } from 'react'

type Props = {
  onScanComplete: (blob: Blob) => void
  onClose:        () => void
  purpose?:       'RECEIPT' | 'ODOMETER'
}

export function DocumentScanner({ onScanComplete, onClose, purpose = 'RECEIPT' }: Props) {
  const [ready, setReady] = useState(false)   // camera stream is live
  const [error, setError] = useState<string | null>(null)

  const videoRef  = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const label = purpose === 'ODOMETER' ? 'Scan Odometer' : 'Scan Receipt'

  // ── Stop camera ──────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const cancel = useCallback(() => { stopCamera(); onClose() }, [stopCamera, onClose])

  // ── Start camera ─────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true

    async function start() {
      try {
        let stream: MediaStream
        try {
          // Prefer rear camera on mobile
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } },
            audio: false,
          })
        } catch {
          // Fallback — any camera (desktop webcam)
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        }

        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return }

        streamRef.current = stream
        const video = videoRef.current!
        video.srcObject = stream
        await video.play()
        setReady(true)
      } catch (e: unknown) {
        if (!mounted) return
        const msg = (e as Error).message ?? ''
        if (/denied|permission|not allowed/i.test(msg)) {
          setError('Camera permission denied. Allow camera access in your browser settings.')
        } else if (/not found|no device|notfound|notreadable/i.test(msg)) {
          // No camera — close silently
          onClose()
        } else {
          setError('Camera error: ' + msg)
        }
      }
    }

    start()
    return () => { mounted = false; stopCamera() }
  }, [stopCamera, onClose])

  // ── Capture ───────────────────────────────────────────────────────────────
  const capture = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const canvas = document.createElement('canvas')
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)

    canvas.toBlob(blob => {
      if (!blob) return
      stopCamera()
      onScanComplete(blob)
    }, 'image/jpeg', 0.92)
  }, [stopCamera, onScanComplete])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={S.backdrop}>
      <div style={S.sheet}>

        {/* Header */}
        <div style={S.header}>
          <span style={S.title}>📷 {label}</span>
          <button onClick={cancel} style={S.closeBtn}>✕</button>
        </div>

        {/* Body */}
        <div style={S.body}>

          {/* Error state */}
          {error && (
            <div style={S.center}>
              <span style={{ fontSize: 40 }}>⚠️</span>
              <p style={S.errMsg}>{error}</p>
              <button onClick={cancel} style={S.btnCancel}>Close</button>
            </div>
          )}

          {/* Camera loading */}
          {!error && !ready && (
            <div style={S.center}>
              <div style={S.spinner} />
              <p style={S.hint}>Opening camera…</p>
            </div>
          )}

          {/* Live viewfinder */}
          {!error && (
            <video
              ref={videoRef}
              playsInline
              muted
              style={{ ...S.video, display: ready ? 'block' : 'none' }}
            />
          )}

          {/* Shutter button */}
          {ready && !error && (
            <button onClick={capture} style={S.shutterWrap} aria-label="Capture photo">
              <div style={S.shutterRing}>
                <div style={S.shutterInner} />
              </div>
            </button>
          )}
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.92)',
    zIndex: 3000,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  },
  sheet: {
    backgroundColor: '#0f172a',
    borderRadius: '18px 18px 0 0',
    width: '100%', maxWidth: 640, height: '95vh',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
  },
  title:   { fontSize: 15, fontWeight: 700, color: '#f1f5f9' },
  closeBtn: {
    background: 'none', border: 'none',
    color: '#64748b', fontSize: 18, cursor: 'pointer', padding: '4px 8px',
  },
  body: {
    flex: 1, position: 'relative',
    backgroundColor: '#000',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  video: {
    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
  },
  center: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 16, padding: 32, textAlign: 'center',
  },
  spinner: {
    width: 44, height: 44, borderRadius: '50%',
    border: '3px solid rgba(255,255,255,0.1)',
    borderTop: '3px solid #3b82f6',
    animation: 'spin 0.75s linear infinite',
  },
  hint:   { fontSize: 14, color: '#94a3b8', margin: 0 },
  errMsg: { fontSize: 14, color: '#f87171', margin: 0, maxWidth: 280, lineHeight: 1.6 },
  shutterWrap: {
    position: 'absolute', bottom: 28,
    left: '50%', transform: 'translateX(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
  },
  shutterRing: {
    width: 72, height: 72, borderRadius: '50%',
    border: '3px solid rgba(255,255,255,0.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  shutterInner: {
    width: 54, height: 54, borderRadius: '50%',
    backgroundColor: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
  },
  btnCancel: {
    padding: '10px 24px', backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10, fontSize: 14, cursor: 'pointer',
  },
}
