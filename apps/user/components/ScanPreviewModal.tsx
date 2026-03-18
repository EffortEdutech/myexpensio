'use client'
// apps/user/components/ScanPreviewModal.tsx
//
// Shows captured photo with 4 draggable corner handles (RECEIPT mode).
// User drags corners to align with receipt edges.
// Tap ⚡ Enhance → sends image + user corners to Python API.
// Shows before/after toggle after processing.
//
// Corner order: [TL, TR, BR, BL] in original image pixel coordinates.
// Python receives these and uses them directly for warpPerspective.

import { useEffect, useRef, useState, useCallback } from 'react'

type Corner    = [number, number]   // [x, y] in original image px
type EnhState  = 'IDLE' | 'PROCESSING' | 'DONE' | 'FAILED'
type ViewMode  = 'ORIGINAL' | 'ENHANCED'

type Props = {
  blob:      Blob
  purpose?:  'RECEIPT' | 'ODOMETER'
  onConfirm: (blob: Blob) => void
  onRetake:  () => void
  onClose:   () => void
}

const HANDLE_R     = 24            // handle touch radius on canvas (px)
const CORNER_LABEL = ['TL','TR','BR','BL']

export function ScanPreviewModal({
  blob,
  purpose = 'RECEIPT',
  onConfirm,
  onRetake,
  onClose,
}: Props) {
  // ── Refs ──────────────────────────────────────────────────────────────────
  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const containerRef   = useRef<HTMLDivElement>(null)
  const imgElRef       = useRef<HTMLImageElement | null>(null)
  const origUrlRef     = useRef<string | null>(null)
  const enhUrlRef      = useRef<string | null>(null)
  const draggingRef    = useRef<number>(-1)         // index of corner being dragged
  const origSizeRef    = useRef({ w: 1, h: 1 })    // original image pixel size
  const cornersRef     = useRef<Corner[]>([         // kept in sync with state
    [0, 0], [0, 0], [0, 0], [0, 0]
  ])

  // ── State ─────────────────────────────────────────────────────────────────
  const [imageLoaded,  setImageLoaded]  = useState(false)
  const [corners,      setCorners]      = useState<Corner[]>([
    [0, 0], [0, 0], [0, 0], [0, 0]
  ])
  const [enhState,     setEnhState]     = useState<EnhState>('IDLE')
  const [enhError,     setEnhError]     = useState<string | null>(null)
  const [viewMode,     setViewMode]     = useState<ViewMode>('ORIGINAL')
  const [enhancedBlob, setEnhancedBlob] = useState<Blob | null>(null)
  const [enhancedUrl,  setEnhancedUrl]  = useState<string | null>(null)
  const [appliedOps,   setAppliedOps]   = useState<string[]>([])

  const isReceipt = purpose === 'RECEIPT'
  const mode      = isReceipt ? 'RECEIPT' : 'ODOMETER'
  const label     = isReceipt ? 'Receipt Photo' : 'Odometer Photo'

  // Keep cornersRef in sync so draw callbacks always have latest
  useEffect(() => { cornersRef.current = corners }, [corners])

  // ── Load blob → HTMLImageElement ──────────────────────────────────────────
  useEffect(() => {
    const url = URL.createObjectURL(blob)
    origUrlRef.current = url

    const img = new Image()
    img.onload = () => {
      imgElRef.current       = img
      origSizeRef.current    = { w: img.naturalWidth, h: img.naturalHeight }

      // Default corners = full image rectangle
      const initCorners: Corner[] = [
        [0,                  0                 ],   // TL
        [img.naturalWidth,   0                 ],   // TR
        [img.naturalWidth,   img.naturalHeight ],   // BR
        [0,                  img.naturalHeight ],   // BL
      ]
      cornersRef.current = initCorners
      setCorners(initCorners)
      setImageLoaded(true)
    }
    img.src = url

    return () => {
      URL.revokeObjectURL(url)
      if (enhUrlRef.current) URL.revokeObjectURL(enhUrlRef.current)
    }
  }, [blob])

  // ── Canvas geometry helpers ───────────────────────────────────────────────

  function getDrawRect(canvas: HTMLCanvasElement) {
    const { w: origW, h: origH } = origSizeRef.current
    const scale = Math.min(canvas.width / origW, canvas.height / origH)
    const drawW = origW * scale
    const drawH = origH * scale
    const drawX = (canvas.width  - drawW) / 2
    const drawY = (canvas.height - drawH) / 2
    return { drawX, drawY, drawW, drawH, scale }
  }

  // Original image coord → canvas coord
  function toCanvas(ox: number, oy: number,
                    drawX: number, drawY: number, scale: number): [number, number] {
    return [drawX + ox * scale, drawY + oy * scale]
  }

  // Canvas coord → original image coord (clamped to image bounds)
  function toOrig(cx: number, cy: number,
                  drawX: number, drawY: number, scale: number): Corner {
    const { w: origW, h: origH } = origSizeRef.current
    return [
      Math.max(0, Math.min(origW, (cx - drawX) / scale)),
      Math.max(0, Math.min(origH, (cy - drawY) / scale)),
    ]
  }

  // ── Draw canvas ───────────────────────────────────────────────────────────
  const drawCanvas = useCallback((sourceImg: HTMLImageElement | null,
                                  activCorners: Corner[]) => {
    const canvas = canvasRef.current
    if (!canvas || !sourceImg) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { drawX, drawY, drawW, drawH, scale } = getDrawRect(canvas)

    // Background
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Image
    ctx.drawImage(sourceImg, drawX, drawY, drawW, drawH)

    // Corner handles and overlay — RECEIPT only
    if (!isReceipt) return

    // Convert corners to canvas coordinates
    const cPts = activCorners.map(([ox, oy]) =>
      toCanvas(ox, oy, drawX, drawY, scale)
    )

    // Dark overlay OUTSIDE the quad using even-odd rule
    // This lets the image show through the quad selection area
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
    ctx.beginPath()
    ctx.rect(drawX, drawY, drawW, drawH)     // outer rect
    ctx.moveTo(cPts[0][0], cPts[0][1])       // inner quad (hole)
    cPts.forEach(([x, y]) => ctx.lineTo(x, y))
    ctx.closePath()
    ctx.fill('evenodd')

    // Quad border — dashed green line
    ctx.strokeStyle = '#10b981'
    ctx.lineWidth   = 2.5
    ctx.setLineDash([10, 5])
    ctx.beginPath()
    ctx.moveTo(cPts[0][0], cPts[0][1])
    cPts.forEach(([x, y]) => ctx.lineTo(x, y))
    ctx.closePath()
    ctx.stroke()
    ctx.setLineDash([])

    // Corner handles
    cPts.forEach(([cx, cy], i) => {
      // Outer glow ring
      ctx.beginPath()
      ctx.arc(cx, cy, HANDLE_R, 0, Math.PI * 2)
      ctx.fillStyle   = 'rgba(16,185,129,0.20)'
      ctx.fill()
      ctx.strokeStyle = '#10b981'
      ctx.lineWidth   = 2.5
      ctx.stroke()

      // Inner solid dot
      ctx.beginPath()
      ctx.arc(cx, cy, 7, 0, Math.PI * 2)
      ctx.fillStyle = '#10b981'
      ctx.fill()

      // Corner label above handle
      const labelX = cx
      const labelY = cy - HANDLE_R - 8
      ctx.fillStyle    = 'rgba(0,0,0,0.65)'
      ctx.beginPath()
      ctx.roundRect(labelX - 14, labelY - 11, 28, 18, 4)
      ctx.fill()
      ctx.fillStyle    = '#d1fae5'
      ctx.font         = 'bold 11px system-ui, sans-serif'
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(CORNER_LABEL[i], labelX, labelY)
    })

    // Bottom hint text
    ctx.fillStyle    = 'rgba(255,255,255,0.55)'
    ctx.font         = '12px system-ui, sans-serif'
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'bottom'
    ctx.fillText('Drag corner handles to align with receipt edges',
                  canvas.width / 2, canvas.height - 6)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReceipt])

  // ── Resize observer — keep canvas filling its container ──────────────────
  useEffect(() => {
    const canvas    = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    function resize() {
      const r      = container!.getBoundingClientRect()
      canvas!.width  = r.width
      canvas!.height = r.height
      // Redraw after resize
      const src = (viewMode === 'ENHANCED' && enhancedUrl)
        ? (() => { const i = new Image(); i.src = enhancedUrl; return i })()
        : imgElRef.current
      drawCanvas(src, cornersRef.current)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)
    return () => ro.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageLoaded])

  // ── Redraw when corners or viewMode changes ───────────────────────────────
  useEffect(() => {
    if (!imageLoaded) return
    if (viewMode === 'ENHANCED' && enhancedUrl) {
      const eImg  = new Image()
      eImg.onload = () => drawCanvas(eImg, corners)
      eImg.src    = enhancedUrl
    } else {
      drawCanvas(imgElRef.current, corners)
    }
  }, [corners, viewMode, enhancedUrl, imageLoaded, drawCanvas])

  // ── Pointer events for corner dragging ───────────────────────────────────

  function getCanvasPos(e: React.PointerEvent<HTMLCanvasElement>): [number, number] {
    const rect = canvasRef.current!.getBoundingClientRect()
    return [e.clientX - rect.left, e.clientY - rect.top]
  }

  function findClosestCorner(cx: number, cy: number): number {
    const canvas              = canvasRef.current!
    const { drawX, drawY, scale } = getDrawRect(canvas)
    let closest = -1
    let minDist = HANDLE_R * 2.5   // generous touch target

    cornersRef.current.forEach(([ox, oy], i) => {
      const [hx, hy] = toCanvas(ox, oy, drawX, drawY, scale)
      const dist     = Math.hypot(cx - hx, cy - hy)
      if (dist < minDist) { minDist = dist; closest = i }
    })
    return closest
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isReceipt || enhState === 'PROCESSING') return
    const [cx, cy] = getCanvasPos(e)
    const idx      = findClosestCorner(cx, cy)
    if (idx >= 0) {
      draggingRef.current = idx
      canvasRef.current!.setPointerCapture(e.pointerId)
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (draggingRef.current < 0) return
    const canvas              = canvasRef.current!
    const [cx, cy]            = getCanvasPos(e)
    const { drawX, drawY, scale } = getDrawRect(canvas)
    const newOrig             = toOrig(cx, cy, drawX, drawY, scale)

    setCorners(prev => {
      const next             = [...prev] as Corner[]
      next[draggingRef.current] = newOrig
      return next
    })
  }

  function handlePointerUp() { draggingRef.current = -1 }

  // ── Enhance — send image + corners to Python API ──────────────────────────
  const handleEnhance = useCallback(async () => {
    setEnhState('PROCESSING')
    setEnhError(null)

    try {
      // Read blob as base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader   = new FileReader()
        reader.onload  = () => resolve((reader.result as string).split(',')[1] ?? '')
        reader.onerror = () => reject(new Error('Could not read image.'))
        reader.readAsDataURL(blob)
      })

      const payload: Record<string, unknown> = { image: base64, mode }

      // Send user-defined corners for RECEIPT
      // Python will use these directly — no auto-detection needed
      if (isReceipt) {
        payload.corners = cornersRef.current.map(([x, y]) =>
          [Math.round(x), Math.round(y)]
        )
      }


      const res  = await fetch('/api/scan/process', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
 
      // Always read as text first — if any layer (Next.js, Render.com, nginx)
      // returns a non-JSON response (e.g. "Request Entity Too Large", cold-start
      // HTML page, 502 Bad Gateway), res.json() would throw the raw JS parse
      // error ("unexpected token 'R'") which is unintelligible to the user.
      const rawText = await res.text()
      let json: Record<string, unknown>
      try {
        json = JSON.parse(rawText) as Record<string, unknown>
      } catch {
        if (res.status === 413) {
          throw new Error('Image is too large. Try a smaller photo and tap Retry.')
        }
        if (res.status === 503 || res.status === 502) {
          throw new Error('Scan service is starting up. Please wait a moment and tap Retry.')
        }
        if (res.status === 504) {
          throw new Error('Scan service timed out. Please tap Retry in a moment.')
        }
        throw new Error(`Scan service error (HTTP ${res.status}). Please tap Retry.`)
      }
      if (!res.ok) {
        throw new Error(
          (json?.error as { message?: string } | undefined)?.message
          ?? (json?.detail as string | undefined)
          ?? `Scan service error (HTTP ${res.status}).`
        )
      }


      // Decode result base64 → Blob
      const binary  = atob(json.result as string)
      const bytes   = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const rBlob   = new Blob([bytes], { type: 'image/jpeg' })

      if (enhUrlRef.current) URL.revokeObjectURL(enhUrlRef.current)
      const url = URL.createObjectURL(rBlob)
      enhUrlRef.current = url
      setEnhancedUrl(url)
      setEnhancedBlob(rBlob)
      setAppliedOps((json.applied as string[]) ?? [])
      setEnhState('DONE')
      setViewMode('ENHANCED')
    } catch (e: unknown) {
      setEnhError((e as Error).message ?? 'Enhancement failed.')
      setEnhState('FAILED')
    }
  }, [blob, mode, isReceipt])

  // ── Confirm ───────────────────────────────────────────────────────────────
  function handleConfirm() {
    onConfirm((viewMode === 'ENHANCED' && enhancedBlob) ? enhancedBlob : blob)
  }

  // ── Ops label map ─────────────────────────────────────────────────────────
  function opLabel(op: string): string {
    const map: Record<string, string> = {
      denoise:                         '✓ Noise removed',
      perspective_warp_user:           '✓ Perspective corrected (your corners)',
      perspective_warp_hough:          '✓ Perspective corrected (auto)',
      perspective_warp_bright_region:  '✓ Perspective corrected (brightness)',
      no_warp_corners_not_found:       '⚠ Angle correction skipped',
      clahe_enhancement:               '✓ Local contrast enhanced',
      sharpen:                         '✓ Sharpened',
    }
    return map[op] ?? op
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={S.backdrop}>
      <div style={S.sheet}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={S.header}>
          <div style={S.headerLeft}>
            <span style={{ fontSize: 18 }}>🖼</span>
            <span style={S.headerTitle}>Review {label}</span>
          </div>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        {/* ── Before/After toggle ────────────────────────────────────── */}
        {enhState === 'DONE' && (
          <div style={S.toggleBar}>
            <button
              style={{ ...S.toggleBtn, ...(viewMode === 'ORIGINAL' ? S.toggleActive : {}) }}
              onClick={() => setViewMode('ORIGINAL')}
            >
              Original
            </button>
            <button
              style={{ ...S.toggleBtn, ...(viewMode === 'ENHANCED' ? S.toggleActive : {}) }}
              onClick={() => setViewMode('ENHANCED')}
            >
              Enhanced
            </button>
          </div>
        )}

        {/* ── Canvas — image + corner handles ────────────────────────── */}
        <div ref={containerRef} style={S.canvasArea}>
          {!imageLoaded && (
            <div style={S.center}>
              <div style={S.spinner} />
            </div>
          )}
          <canvas
            ref={canvasRef}
            style={{
              display:    imageLoaded ? 'block' : 'none',
              width:      '100%',
              height:     '100%',
              touchAction: 'none',    // prevent scroll while dragging
              cursor:     isReceipt ? 'crosshair' : 'default',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />

          {/* Processing overlay */}
          {enhState === 'PROCESSING' && (
            <div style={S.processingOverlay}>
              <div style={S.spinner} />
              <p style={S.processingText}>
                {isReceipt
                  ? 'Applying perspective correction + enhancement…'
                  : 'Enhancing sharpness and contrast…'}
              </p>
            </div>
          )}
        </div>

        {/* ── Ops list after enhance ──────────────────────────────────── */}
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

        {/* ── Error bar ───────────────────────────────────────────────── */}
        {enhState === 'FAILED' && enhError && (
          <div style={S.errorBar}>
            <span>⚠️</span>
            <span style={S.errorText}>{enhError}</span>
          </div>
        )}

        {/* ── Info bar ────────────────────────────────────────────────── */}
        {enhState === 'IDLE' && isReceipt && (
          <div style={S.infoBar}>
            <span style={S.infoText}>
              ↖ Drag the 4 green handles to align with receipt edges, then tap ⚡ Enhance
            </span>
          </div>
        )}
        {enhState === 'IDLE' && !isReceipt && (
          <div style={S.infoBar}>
            <span style={S.infoText}>
              📷 Tap ⚡ Enhance to sharpen the odometer reading
            </span>
          </div>
        )}

        {/* ── Actions ─────────────────────────────────────────────────── */}
        <div style={S.actions}>
          <button
            onClick={onRetake}
            style={S.btnRetake}
            disabled={enhState === 'PROCESSING'}
          >
            ↩ Retake
          </button>

          {enhState !== 'DONE' && (
            <button
              onClick={handleEnhance}
              style={{
                ...S.btnEnhance,
                opacity: enhState === 'PROCESSING' ? 0.7 : 1,
              }}
              disabled={enhState === 'PROCESSING'}
            >
              {enhState === 'PROCESSING' ? '⚙ Processing…'
                : enhState === 'FAILED'  ? '↺ Retry'
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
    display: 'flex',
    padding: '8px 18px', gap: 0,
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
  canvasArea: {
    flex: 1, position: 'relative',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  center: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  spinner: {
    width: 44, height: 44, borderRadius: '50%',
    border: '3px solid rgba(255,255,255,0.1)',
    borderTop: '3px solid #3b82f6',
    animation: 'spin 0.75s linear infinite',
  },
  processingOverlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(2,6,23,0.82)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  processingText: {
    fontSize: 14, color: '#93c5fd', margin: 0,
    textAlign: 'center', maxWidth: 280, lineHeight: 1.6,
  },
  opsBar: {
    display: 'flex', flexDirection: 'column', gap: 4,
    padding: '10px 18px',
    backgroundColor: 'rgba(16,185,129,0.06)',
    borderTop: '1px solid rgba(16,185,129,0.15)',
    flexShrink: 0,
  },
  opChip:   { fontSize: 12, fontWeight: 500 },
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
    backgroundColor: 'rgba(59,130,246,0.07)',
    borderTop: '1px solid rgba(59,130,246,0.12)',
    flexShrink: 0,
  },
  infoText: { fontSize: 12, color: '#93c5fd', lineHeight: 1.5 },
  actions: {
    display: 'flex', gap: 10,
    padding: '14px 18px 32px',
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
    backgroundColor: '#1e3a5f', color: '#7dd3fc',
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
