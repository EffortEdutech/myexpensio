'use client'
// apps/user/components/ScanPreviewModal.tsx
//
// Shows the captured photo from DocumentScanner.
// Allows user to confirm or retake before upload.
// OpenCV image processing will be added here in the next phase.
//
// Props:
//   blob        — raw JPEG blob from camera
//   purpose     — 'RECEIPT' | 'ODOMETER' (label)
//   onConfirm   — called with final blob (processed or raw) to proceed to upload
//   onRetake    — called when user wants to retake (reopens camera)
//   onClose     — called when user cancels entirely

import { useEffect, useRef, useState } from 'react'

type Props = {
  blob:      Blob
  purpose?:  'RECEIPT' | 'ODOMETER'
  onConfirm: (blob: Blob) => void
  onRetake:  () => void
  onClose:   () => void
}

export function ScanPreviewModal({ blob, purpose = 'RECEIPT', onConfirm, onRetake, onClose }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Create object URL from blob for display
  useEffect(() => {
    const url = URL.createObjectURL(blob)
    setObjectUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [blob])

  const label = purpose === 'ODOMETER' ? 'Odometer Photo' : 'Receipt Photo'

  // ── Confirm — send blob to upload pipeline ──────────────────────────────
  function handleConfirm() {
    onConfirm(blob)
  }

  // ── Process placeholder — OpenCV will go here ───────────────────────────
  async function handleProcess() {
    setProcessing(true)
    // TODO: OpenCV perspective correction + enhancement
    // For now: pass through unchanged
    // Future: call Python API route with blob → receive processed blob
    await new Promise(r => setTimeout(r, 500))   // simulate async
    setProcessing(false)
    onConfirm(blob)
  }

  return (
    <div style={S.backdrop}>
      <div style={S.sheet}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={S.header}>
          <div style={S.headerLeft}>
            <span style={{ fontSize: 18 }}>🖼</span>
            <span style={S.headerTitle}>Review {label}</span>
          </div>
          <button onClick={onClose} style={S.closeBtn} aria-label="Close">✕</button>
        </div>

        {/* ── Image preview ───────────────────────────────────────────────── */}
        <div style={S.imageArea}>
          {objectUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src={objectUrl}
              alt="Captured photo"
              style={S.image}
            />
          ) : (
            <div style={S.imagePlaceholder}>
              <div style={S.spinner} />
            </div>
          )}
        </div>

        {/* ── Info bar ────────────────────────────────────────────────────── */}
        <div style={S.infoBar}>
          <span style={S.infoText}>
            {purpose === 'ODOMETER'
              ? '📷 Check reading is clearly visible before saving'
              : '🧾 Check receipt text is clear and fully in frame'}
          </span>
        </div>

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <div style={S.actions}>

          {/* Retake */}
          <button onClick={onRetake} style={S.btnRetake} disabled={processing}>
            ↩ Retake
          </button>

          {/* Process (OpenCV — coming soon) */}
          <button
            onClick={handleProcess}
            style={S.btnProcess}
            disabled={processing}
            title="Perspective correction + enhancement (coming soon)"
          >
            {processing ? '⚙ Processing…' : '⚡ Enhance'}
          </button>

          {/* Use as-is */}
          <button onClick={handleConfirm} style={S.btnConfirm} disabled={processing}>
            ✓ Use Photo
          </button>

        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(2,6,23,0.96)',
    zIndex: 3100,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  },
  sheet: {
    backgroundColor: '#0f172a',
    borderRadius: '18px 18px 0 0',
    width: '100%', maxWidth: 640,
    height: '95vh',
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
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 15, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em' },
  closeBtn: {
    background: 'none', border: 'none',
    color: '#475569', fontSize: 18,
    cursor: 'pointer', padding: '4px 8px', borderRadius: 8,
  },
  imageArea: {
    flex: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#020617',
    overflow: 'hidden',
    padding: 16,
  },
  image: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    borderRadius: 10,
    boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
  },
  imagePlaceholder: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  spinner: {
    width: 40, height: 40, borderRadius: '50%',
    border: '3px solid rgba(255,255,255,0.1)',
    borderTop: '3px solid #3b82f6',
    animation: 'spin 0.75s linear infinite',
  },
  infoBar: {
    padding: '10px 18px',
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderTop: '1px solid rgba(59,130,246,0.15)',
    borderBottom: '1px solid rgba(59,130,246,0.15)',
    flexShrink: 0,
  },
  infoText: { fontSize: 12, color: '#93c5fd' },
  actions: {
    display: 'flex', gap: 10,
    padding: '16px 18px 28px',
    flexShrink: 0,
  },
  btnRetake: {
    flex: 1,
    padding: '13px 0',
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#cbd5e1',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  btnProcess: {
    flex: 1,
    padding: '13px 0',
    backgroundColor: '#1e293b',
    color: '#7dd3fc',
    border: '1px solid #334155',
    borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  btnConfirm: {
    flex: 1,
    padding: '13px 0',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
  },
}
