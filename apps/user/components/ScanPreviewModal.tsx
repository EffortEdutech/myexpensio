'use client'
// apps/user/components/ScanPreviewModal.tsx
//
// Shows captured photo from DocumentScanner.
// Provides three actions:
//   ↩ Retake    — discard, reopen camera
//   ⚡ Enhance  — send to Python OpenCV API, show before/after
//   ✓ Use Photo — confirm and upload (original or enhanced)
//
// Props:
//   blob        — raw JPEG blob from DocumentScanner
//   purpose     — 'RECEIPT' | 'ODOMETER' controls processing mode
//   onConfirm   — called with final blob to proceed to upload
//   onRetake    — user wants to retake photo
//   onClose     — user cancels entirely

import { useEffect, useRef, useState, useCallback } from 'react'

type Props = {
  blob:      Blob
  purpose?:  'RECEIPT' | 'ODOMETER'
  onConfirm: (blob: Blob) => void
  onRetake:  () => void
  onClose:   () => void
}

type EnhanceState = 'IDLE' | 'PROCESSING' | 'DONE' | 'FAILED'
type ViewMode     = 'ORIGINAL' | 'ENHANCED'

export function ScanPreviewModal({
  blob,
  purpose = 'RECEIPT',
  onConfirm,
  onRetake,
  onClose,
}: Props) {
  const [originalUrl,  setOriginalUrl]  = useState<string | null>(null)
  const [enhancedUrl,  setEnhancedUrl]  = useState<string | null>(null)
  const [enhancedBlob, setEnhancedBlob] = useState<Blob | null>(null)
  const [enhState,     setEnhState]     = useState<EnhanceState>('IDLE')
  const [enhError,     setEnhError]     = useState<string | null>(null)
  const [viewMode,     setViewMode]     = useState<ViewMode>('ORIGINAL')
  const [appliedOps,   setAppliedOps]   = useState<string[]>([])

  const originalUrlRef = useRef<string | null>(null)
  const enhancedUrlRef = useRef<string | null>(null)

  const label = purpose === 'ODOMETER' ? 'Odometer Photo' : 'Receipt Photo'
  const mode  = purpose === 'ODOMETER' ? 'ODOMETER' : 'RECEIPT'

  // ── Create object URL from original blob ─────────────────────────────────
  useEffect(() => {
    const url = URL.createObjectURL(blob)
    originalUrlRef.current = url
    setOriginalUrl(url)
    return () => {
      URL.revokeObjectURL(url)
      if (enhancedUrlRef.current) URL.revokeObjectURL(enhancedUrlRef.current)
    }
  }, [blob])

  // ── Enhance — call Python API via Next.js proxy ───────────────────────────
  const handleEnhance = useCallback(async () => {
    setEnhState('PROCESSING')
    setEnhError(null)

    try {
      // Convert blob to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload  = () => {
          const result = reader.result as string
          // Strip data URI prefix — send raw base64 only
          resolve(result.split(',')[1] ?? result)
        }
        reader.onerror = () => reject(new Error('Could not read image.'))
        reader.readAsDataURL(blob)
      })

      // POST to Next.js proxy (which forwards to Python service)
      const res  = await fetch('/api/scan/process', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ image: base64, mode }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.error?.message ?? `Server error ${res.status}`)
      }

      // Decode result base64 → blob
      const binary     = atob(json.result)
      const bytes      = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const resultBlob = new Blob([bytes], { type: 'image/jpeg' })

      // Create object URL for preview
      const url = URL.createObjectURL(resultBlob)
      enhancedUrlRef.current = url
      setEnhancedUrl(url)
      setEnhancedBlob(resultBlob)
      setAppliedOps(json.applied ?? [])
      setEnhState('DONE')
      setViewMode('ENHANCED')    // auto-switch to enhanced view
    } catch (e: unknown) {
      const msg = (e as Error).message ?? 'Enhancement failed.'
      setEnhError(msg)
      setEnhState('FAILED')
    }
  }, [blob, mode])

  // ── Confirm ────────────────────────────────────────────────────────────────
  function handleConfirm() {
    // Use enhanced blob if available + user is viewing enhanced
    const finalBlob = (viewMode === 'ENHANCED' && enhancedBlob) ? enhancedBlob : blob
    onConfirm(finalBlob)
  }

  // ── Ops label map ──────────────────────────────────────────────────────────
  function opLabel(op: string): string {
    const map: Record<string, string> = {
      perspective_warp:          '✓ Perspective corrected',
      no_warp_corners_not_found: '⚠ Edges not detected — original angle kept',
      auto_contrast:             '✓ Contrast enhanced',
      sharpen:                   '✓ Sharpened',
      brightness_contrast:       '✓ Brightness boosted',
    }
    return map[op] ?? op
  }

  const currentUrl = viewMode === 'ENHANCED' && enhancedUrl ? enhancedUrl : originalUrl

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={S.backdrop}>
      <div style={S.sheet}>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div style={S.header}>
          <div style={S.headerLeft}>
            <span style={{ fontSize: 18 }}>🖼</span>
            <span style={S.headerTitle}>Review {label}</span>
          </div>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        {/* ── Before / After toggle (visible after enhance) ─────────────── */}
        {enhState === 'DONE' && (
          <div style={S.toggleBar}>
            <button
              onClick={() => setViewMode('ORIGINAL')}
              style={{ ...S.toggleBtn, ...(viewMode === 'ORIGINAL' ? S.toggleActive : {}) }}
            >
              Original
            </button>
            <button
              onClick={() => setViewMode('ENHANCED')}
              style={{ ...S.toggleBtn, ...(viewMode === 'ENHANCED' ? S.toggleActive : {}) }}
            >
              Enhanced
            </button>
          </div>
        )}

        {/* ── Image area ───────────────────────────────────────────────── */}
        <div style={S.imageArea}>
          {currentUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentUrl}
              alt={viewMode === 'ENHANCED' ? 'Enhanced photo' : 'Original photo'}
              style={S.image}
            />
          ) : (
            <div style={S.center}>
              <div style={S.spinner} />
            </div>
          )}

          {/* Processing overlay */}
          {enhState === 'PROCESSING' && (
            <div style={S.processingOverlay}>
              <div style={S.spinner} />
              <p style={S.processingText}>
                {mode === 'RECEIPT'
                  ? 'Detecting edges + correcting perspective…'
                  : 'Enhancing sharpness and contrast…'}
              </p>
            </div>
          )}
        </div>

        {/* ── Applied ops (after enhance) ───────────────────────────────── */}
        {enhState === 'DONE' && appliedOps.length > 0 && (
          <div style={S.opsBar}>
            {appliedOps.map(op => (
              <span key={op} style={{
                ...S.opChip,
                color: op.includes('not_found') ? '#fbbf24' : '#86efac',
              }}>
                {opLabel(op)}
              </span>
            ))}
          </div>
        )}

        {/* ── Error bar ────────────────────────────────────────────────── */}
        {enhState === 'FAILED' && enhError && (
          <div style={S.errorBar}>
            <span style={{ fontSize: 14 }}>⚠️</span>
            <span style={S.errorText}>{enhError}</span>
          </div>
        )}

        {/* ── Info bar (idle state) ─────────────────────────────────────── */}
        {enhState === 'IDLE' && (
          <div style={S.infoBar}>
            <span style={S.infoText}>
              {purpose === 'ODOMETER'
                ? '📷 Tap Enhance to sharpen digits. Use Photo to save as-is.'
                : '🧾 Tap Enhance to auto-correct angle + contrast.'}
            </span>
          </div>
        )}

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <div style={S.actions}>

          <button
            onClick={onRetake}
            style={S.btnRetake}
            disabled={enhState === 'PROCESSING'}
          >
            ↩ Retake
          </button>

          {/* Enhance button — shows spinner while processing, retry if failed */}
          {enhState !== 'DONE' && (
            <button
              onClick={handleEnhance}
              style={{
                ...S.btnEnhance,
                opacity: enhState === 'PROCESSING' ? 0.7 : 1,
              }}
              disabled={enhState === 'PROCESSING'}
            >
              {enhState === 'PROCESSING' ? '⚙ Enhancing…'
                : enhState === 'FAILED'  ? '↺ Retry Enhance'
                : '⚡ Enhance'}
            </button>
          )}

          <button
            onClick={handleConfirm}
            style={S.btnConfirm}
            disabled={enhState === 'PROCESSING'}
          >
            {viewMode === 'ENHANCED' && enhancedBlob
              ? '✓ Use Enhanced'
              : '✓ Use Photo'}
          </button>

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
    backgroundColor: 'rgba(2,6,23,0.97)',
    zIndex: 3100,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  },
  sheet: {
    backgroundColor: '#0f172a',
    borderRadius: '18px 18px 0 0',
    width: '100%', maxWidth: 640, height: '95vh',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
  },
  header: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
  },
  headerLeft:  { display: 'flex', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 15, fontWeight: 700, color: '#f1f5f9' },
  closeBtn: {
    background: 'none', border: 'none',
    color: '#475569', fontSize: 18, cursor: 'pointer', padding: '4px 8px',
  },
  toggleBar: {
    display: 'flex', gap: 0,
    padding: '8px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
  },
  toggleBtn: {
    flex: 1, padding: '8px 0', fontSize: 13, fontWeight: 600,
    border: '1px solid rgba(255,255,255,0.12)',
    backgroundColor: 'transparent', color: '#64748b', cursor: 'pointer',
  },
  toggleActive: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    color: '#34d399',
    borderColor: 'rgba(16,185,129,0.4)',
  },
  imageArea: {
    flex: 1, position: 'relative',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#020617', overflow: 'hidden', padding: 12,
  },
  image: {
    maxWidth: '100%', maxHeight: '100%',
    objectFit: 'contain', borderRadius: 8,
    boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
  },
  center: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  processingOverlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(2,6,23,0.8)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  processingText: {
    fontSize: 14, color: '#93c5fd', margin: 0,
    textAlign: 'center', maxWidth: 260,
  },
  spinner: {
    width: 44, height: 44, borderRadius: '50%',
    border: '3px solid rgba(255,255,255,0.1)',
    borderTop: '3px solid #3b82f6',
    animation: 'spin 0.75s linear infinite',
  },
  opsBar: {
    display: 'flex', flexDirection: 'column', gap: 4,
    padding: '10px 18px',
    backgroundColor: 'rgba(16,185,129,0.06)',
    borderTop: '1px solid rgba(16,185,129,0.15)',
    flexShrink: 0,
  },
  opChip: { fontSize: 12, fontWeight: 500 },
  errorBar: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 18px',
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderTop: '1px solid rgba(239,68,68,0.2)',
    flexShrink: 0,
  },
  errorText: { fontSize: 12, color: '#fca5a5', flex: 1 },
  infoBar: {
    padding: '10px 18px',
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderTop: '1px solid rgba(59,130,246,0.15)',
    flexShrink: 0,
  },
  infoText: { fontSize: 12, color: '#93c5fd' },
  actions: {
    display: 'flex', gap: 10,
    padding: '16px 18px 32px',
    flexShrink: 0,
  },
  btnRetake: {
    flex: 1, padding: '13px 0',
    backgroundColor: 'rgba(255,255,255,0.07)',
    color: '#94a3b8',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  btnEnhance: {
    flex: 1, padding: '13px 0',
    backgroundColor: '#1e3a5f',
    color: '#7dd3fc',
    border: '1px solid #1d4ed8',
    borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(29,78,216,0.3)',
  },
  btnConfirm: {
    flex: 1, padding: '13px 0',
    backgroundColor: '#10b981', color: '#fff',
    border: 'none', borderRadius: 12,
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
  },
}
