'use client'
// apps/user/components/ReceiptUploader.tsx
//
// Reusable receipt upload component.
//
// State machine: IDLE → COMPRESSING → SIGNING → UPLOADING → DONE | FAILED
//
// Props:
//   storagePath  — existing path (from DB) for displaying already-uploaded receipt
//   onUploaded   — called with storagePath when upload completes
//   disabled     — lock after claim submission
//
// Usage:
//   <ReceiptUploader
//     storagePath={item.receipt_url}
//     onUploaded={(path) => setReceiptPath(path)}
//     disabled={locked}
//   />

import { useState, useRef, useCallback } from 'react'
import { DocumentScanner } from '@/components/DocumentScanner'

// ── Types ─────────────────────────────────────────────────────────────────────

type UploadState = 'IDLE' | 'COMPRESSING' | 'SIGNING' | 'UPLOADING' | 'DONE' | 'FAILED'

type Props = {
  storagePath?: string | null    // existing path already saved in DB
  onUploaded:  (path: string) => void
  disabled?:   boolean
  purpose?:    'RECEIPT' | 'ODOMETER'   // controls storage subfolder; default RECEIPT
  label?:      string                   // overrides button + done-state label text
  enableScan?:  boolean                 // show 📷 Scan button (DocumentScanner)
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_LONG_EDGE = 1600    // px — resize before upload
const JPEG_QUALITY  = 0.80    // 80% quality
const MAX_BYTES     = 5_242_880

// ── Image compression ─────────────────────────────────────────────────────────

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img
      if (width > MAX_LONG_EDGE || height > MAX_LONG_EDGE) {
        if (width >= height) { height = Math.round(height * MAX_LONG_EDGE / width);  width  = MAX_LONG_EDGE }
        else                 { width  = Math.round(width  * MAX_LONG_EDGE / height); height = MAX_LONG_EDGE }
      }

      const canvas      = document.createElement('canvas')
      canvas.width      = width
      canvas.height     = height
      const ctx         = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas unavailable')); return }
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('Compression failed')),
        'image/jpeg',
        JPEG_QUALITY,
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')) }
    img.src = url
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ReceiptUploader({
  storagePath,
  onUploaded,
  disabled    = false,
  purpose     = 'RECEIPT',
  label,
  enableScan  = false,
}: Props) {
  const [state,      setState]    = useState<UploadState>(storagePath ? 'DONE' : 'IDLE')
  const [progress,   setProgress] = useState(0)       // 0–100
  const [errMsg,     setErrMsg]   = useState<string | null>(null)
  const [viewUrl,    setViewUrl]  = useState<string | null>(null)
  const [currentPath, setCurrentPath] = useState<string | null>(storagePath ?? null)
  const inputRef    = useRef<HTMLInputElement>(null)
  const [scannerOpen, setScannerOpen] = useState(false)

  // ── Load view URL when we have a stored path ──────────────────────────────

  const loadViewUrl = useCallback(async (path: string) => {
    const res  = await fetch(`/api/uploads/view?path=${encodeURIComponent(path)}`)
    const json = await res.json()
    if (res.ok) setViewUrl(json.url)
  }, [])

  // Load on mount if path already exists
  useState(() => {
    if (storagePath) loadViewUrl(storagePath)
  })

  // ── Main upload flow ──────────────────────────────────────────────────────

  async function handleFile(file: File) {
    if (!file) return

    // Basic client-side validation
    if (!file.type.startsWith('image/')) {
      setErrMsg('Please select an image file (JPEG, PNG, or WebP).'); return
    }
    if (file.size > MAX_BYTES) {
      setErrMsg('File too large. Maximum size is 5 MB.'); return
    }

    setErrMsg(null); setProgress(0)

    // ── Step 1: Compress ────────────────────────────────────────────────────
    setState('COMPRESSING')
    let compressed: Blob
    try {
      compressed = await compressImage(file)
    } catch {
      setState('FAILED'); setErrMsg('Could not compress image. Try a different file.'); return
    }

    // ── Step 2: Get signed upload URL ───────────────────────────────────────
    setState('SIGNING')
    let uploadUrl: string, storagePath_: string
    try {
      const res  = await fetch('/api/uploads/sign', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          purpose:      purpose,
          content_type: 'image/jpeg',
          file_name:    file.name,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Could not get upload URL.')
      uploadUrl    = json.upload_url
      storagePath_ = json.storage_path
    } catch (e: unknown) {
      setState('FAILED'); setErrMsg((e as Error).message); return
    }

    // ── Step 3: PUT to signed URL with progress ─────────────────────────────
    setState('UPLOADING'); setProgress(0)
    try {
      await uploadWithProgress(compressed, uploadUrl, setProgress)
    } catch (e: unknown) {
      setState('FAILED'); setErrMsg((e as Error).message); return
    }

    // ── Step 4: Done — notify parent ────────────────────────────────────────
    setState('DONE')
    setCurrentPath(storagePath_)
    onUploaded(storagePath_)
    await loadViewUrl(storagePath_)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset input so same file can be re-selected after failure
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleRetry() {
    setState('IDLE'); setErrMsg(null); setProgress(0)
    inputRef.current?.click()
  }

  // Called by DocumentScanner when user confirms processed image.
  // Converts the blob to a synthetic File and runs through the normal
  // compress → sign → upload pipeline. Existing ReceiptUploader logic
  // is 100% untouched — scanner simply hands off a Blob.
  async function handleScanComplete(blob: Blob) {
    setScannerOpen(false)
    // Always force image/jpeg type regardless of what the camera returned
    const file = new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' })
    await handleFile(file)
  }

  function handleRemove() {
    setState('IDLE'); setCurrentPath(null); setViewUrl(null); setErrMsg(null)
    onUploaded('')   // signal parent: receipt removed
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const busy = state === 'COMPRESSING' || state === 'SIGNING' || state === 'UPLOADING'

  return (
    <div style={S.wrap}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleInputChange}
        disabled={disabled || busy}
      />

      {/* ── IDLE: gallery button + optional scan button ─────────────── */}
      {state === 'IDLE' && !scannerOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* 📷 Scan button — only shown when enableScan=true */}
          {enableScan && !disabled && (
            <button
              onClick={() => setScannerOpen(true)}
              style={S.scanBtn}
            >
              <span style={{ fontSize: 18 }}>📷</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Scan Document</span>
                <span style={{ fontSize: 10, color: '#64748b' }}>Camera · auto edge detect · perspective fix</span>
              </div>
              <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>›</span>
            </button>
          )}

          {/* 📎 Gallery / file upload — always present, unchanged */}
          <button
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            style={{ ...S.uploadBtn, opacity: disabled ? 0.45 : 1 }}
          >
            <span style={{ fontSize: 18 }}>{purpose === 'ODOMETER' ? '📷' : '📎'}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
              {label ?? (purpose === 'ODOMETER' ? 'Attach from Gallery' : 'Attach from Gallery')}
            </span>
            <span style={{ fontSize: 10, color: '#94a3b8' }}>JPEG · PNG · WebP · Max 5 MB</span>
          </button>

        </div>
      )}

      {/* ── DocumentScanner overlay — rendered as modal, isolated ────── */}
      {enableScan && scannerOpen && (
        <DocumentScanner
          purpose={purpose}
          onScanComplete={handleScanComplete}
          onClose={() => setScannerOpen(false)}
        />
      )}

      {/* ── BUSY: progress ────────────────────────────────────────────── */}
      {busy && (
        <div style={S.progressWrap}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>
              {state === 'COMPRESSING' ? '⚙ Compressing…'
               : state === 'SIGNING'   ? '🔐 Preparing…'
               :                         '⬆ Uploading…'}
            </span>
            {state === 'UPLOADING' && (
              <span style={{ fontSize: 12, color: '#64748b' }}>{progress}%</span>
            )}
          </div>
          <div style={S.barTrack}>
            <div style={{
              ...S.barFill,
              width: state === 'UPLOADING' ? `${progress}%` : '40%',
              transition: state === 'UPLOADING' ? 'width 0.2s' : 'width 0.8s ease-in-out',
              animation:  state !== 'UPLOADING' ? 'pulse 1.2s ease-in-out infinite' : 'none',
            }} />
          </div>
        </div>
      )}

      {/* ── DONE: thumbnail + change/remove ───────────────────────────── */}
      {state === 'DONE' && (
        <div style={S.doneWrap}>
          {viewUrl ? (
            <a href={viewUrl} target="_blank" rel="noreferrer" style={S.thumbLink}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={viewUrl} alt="Receipt" style={S.thumb} />
              <span style={{ fontSize: 11, color: '#3b82f6', marginTop: 4 }}>View full</span>
            </a>
          ) : (
            <div style={S.thumbPlaceholder}>
              <span style={{ fontSize: 22 }}>{purpose === 'ODOMETER' ? '📷' : '🧾'}</span>
              <span style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                {label
                  ? `${label} uploaded`
                  : purpose === 'ODOMETER'
                    ? 'Photo uploaded'
                    : currentPath?.split('/').pop()?.slice(14) ?? 'Receipt uploaded'}
              </span>
            </div>
          )}

          {!disabled && (
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button onClick={() => inputRef.current?.click()} style={S.linkBtn}>
                Replace
              </button>
              <span style={{ color: '#e2e8f0', fontSize: 12 }}>|</span>
              <button onClick={handleRemove} style={{ ...S.linkBtn, color: '#dc2626' }}>
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── FAILED: error + retry ─────────────────────────────────────── */}
      {state === 'FAILED' && (
        <div style={S.failWrap}>
          <span style={{ fontSize: 13 }}>⚠️</span>
          <span style={{ fontSize: 12, color: '#dc2626', flex: 1 }}>
            {errMsg ?? 'Upload failed.'}
          </span>
          <button onClick={handleRetry} style={S.retryBtn}>Retry</button>
        </div>
      )}

      {/* Inline error for validation (not FAILED state) */}
      {state === 'IDLE' && errMsg && (
        <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>{errMsg}</div>
      )}
    </div>
  )
}

// ── XMLHttpRequest upload with progress ───────────────────────────────────────

function uploadWithProgress(
  blob: Blob,
  url:  string,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', 'image/jpeg')

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100))
    }

    xhr.onload  = () => {
      if (xhr.status >= 200 && xhr.status < 300) { onProgress(100); resolve() }
      else reject(new Error(`Upload failed (HTTP ${xhr.status}). Please retry.`))
    }
    xhr.onerror = () => reject(new Error('Network error during upload. Please retry.'))
    xhr.ontimeout = () => reject(new Error('Upload timed out. Please retry.'))
    xhr.timeout = 60_000   // 60s timeout

    xhr.send(blob)
  })
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  wrap:         { display: 'flex', flexDirection: 'column' },
  uploadBtn:    {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 4, paddingTop: 16, paddingBottom: 16,
    borderWidth: 2, borderStyle: 'dashed', borderColor: '#cbd5e1',
    borderRadius: 10, cursor: 'pointer', backgroundColor: '#f8fafc',
    width: '100%',
  },
  progressWrap: {
    paddingTop: 12, paddingBottom: 12, paddingLeft: 14, paddingRight: 14,
    backgroundColor: '#f8fafc', borderRadius: 10,
    borderWidth: 1, borderStyle: 'solid', borderColor: '#e2e8f0',
  },
  barTrack:     {
    height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden',
  },
  barFill:      {
    height: '100%', backgroundColor: '#0f172a', borderRadius: 3,
  },
  doneWrap:     {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    paddingTop: 10, paddingBottom: 10,
    backgroundColor: '#f0fdf4',
    borderWidth: 1, borderStyle: 'solid', borderColor: '#bbf7d0',
    borderRadius: 10,
  },
  thumbLink:    {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    textDecoration: 'none',
  },
  thumb:        {
    width: 80, height: 80, objectFit: 'cover',
    borderRadius: 8,
    borderWidth: 1, borderStyle: 'solid', borderColor: '#d1fae5',
  },
  thumbPlaceholder: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    paddingTop: 8, paddingBottom: 8,
  },
  failWrap:     {
    display: 'flex', alignItems: 'center', gap: 8,
    paddingTop: 10, paddingBottom: 10, paddingLeft: 12, paddingRight: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1, borderStyle: 'solid', borderColor: '#fecaca',
    borderRadius: 10,
  },
  retryBtn:     {
    fontSize: 12, fontWeight: 700, color: '#dc2626',
    backgroundColor: 'transparent',
    borderWidth: 1, borderStyle: 'solid', borderColor: '#fca5a5',
    borderRadius: 6, paddingTop: 4, paddingBottom: 4,
    paddingLeft: 10, paddingRight: 10, cursor: 'pointer',
  },
  scanBtn: {
    display: 'flex', alignItems: 'center',
    gap: 10, padding: '12px 14px',
    borderWidth: 2, borderStyle: 'solid', borderColor: '#0f172a',
    borderRadius: 10, cursor: 'pointer',
    backgroundColor: '#0f172a',
    width: '100%',
    textAlign: 'left' as const,
  },
  linkBtn:      {
    fontSize: 12, fontWeight: 500, color: '#3b82f6',
    background: 'none', borderWidth: 0, borderStyle: 'none',
    borderColor: 'transparent',
    cursor: 'pointer', padding: 0,
  },
}
