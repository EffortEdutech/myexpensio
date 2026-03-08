'use client'
// apps/user/components/DocumentScanner.tsx
//
// Full document scanner powered by OpenCV.js (WASM).
// COMPLETELY ISOLATED from ReceiptUploader — zero changes to existing upload flow.
//
// Pipeline:
//   1. Load OpenCV.js lazily from CDN (only when scanner is first opened)
//   2. getUserMedia → live rear camera stream
//   3. Every 400ms: Gaussian blur → Canny edge detection → findContours →
//      approxPolyDP → find largest 4-corner polygon (receipt outline)
//   4. Draw semi-transparent quad overlay with draggable corner handles
//   5. User taps ◎ shutter → capture still → stop camera
//   6. User drags corners to refine if needed → tap ⚡ Process
//   7. OpenCV: perspective warp → auto contrast/brightness enhance
//   8. Preview processed result → confirm or retake
//   9. onScanComplete(blob) — caller handles sign + upload as normal
//
// Props:
//   onScanComplete  — called with processed JPEG Blob when user confirms
//   onClose         — called when user cancels at any step
//   purpose         — 'RECEIPT' | 'ODOMETER' (label only)

import { useEffect, useRef, useState, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type ScanState =
  | 'LOADING_CV'    // OpenCV.js loading from CDN
  | 'CAMERA'        // live preview + auto-detect edges
  | 'CAPTURED'      // still captured, corner-adjust mode
  | 'PROCESSING'    // OpenCV warp + enhance running
  | 'PREVIEW'       // processed result — user confirms
  | 'DENIED'        // camera permission denied
  | 'FAILED'        // any other error

type Pt  = { x: number; y: number }
type Quad = [Pt, Pt, Pt, Pt]   // TL, TR, BR, BL

// ── OpenCV lazy loader ────────────────────────────────────────────────────────
// Loads ~8 MB WASM once; cached in window.cv for the lifetime of the page.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _cvCache: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _cvPromise: Promise<any> | null = null

// ── OpenCV loader ─────────────────────────────────────────────────────────────
// MUST use <script> tag — never dynamic import() or require().
// Bundlers (Turbopack/webpack) cannot parse opencv.js (8MB WASM wrapper) and
// will throw "Maximum call stack size exceeded" trying to do so.
//
// Correct dist path inside @techstark/opencv-js npm package: dist/opencv.js
// jsDelivr serves this reliably from edge nodes globally.
//
// Loading sequence:
//   1. Inject <script> tag pointing to dist/opencv.js on jsDelivr
//   2. Script sets window.cv (a WASM module object)
//   3. window.cv.onRuntimeInitialized fires when WASM is compiled + ready
//   4. Confirm window.cv.Mat exists (the definitive "ready" signal)
//   5. Cache in _cvCache — subsequent opens are instant (no re-download)
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadOpenCV(): Promise<any> {
  if (_cvCache) return Promise.resolve(_cvCache)
  if (_cvPromise) return _cvPromise

  _cvPromise = new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any

    // Already loaded by a previous component instance this session
    if (w.cv?.Mat) { _cvCache = w.cv; resolve(_cvCache); return }

    let resolved = false
    function done() {
      if (resolved) return
      resolved = true
      _cvCache = w.cv
      resolve(_cvCache)
    }

    const script = document.createElement('script')
    script.async = true
    script.src   = '/opencv.js'   // self-hosted in apps/user/public/opencv.js

    script.onerror = () => {
      document.head.removeChild(script)
      reject(new Error('Could not load opencv.js — make sure apps/user/public/opencv.js exists.'))
    }

    script.onload = () => {
      // Poll for window.cv.Mat — the definitive signal that WASM is compiled and ready.
      // opencv.js sets window.cv synchronously but WASM compilation is async (~1-3s).
      let attempts = 0
      const poll = () => {
        if (resolved) return
        if (w.cv?.Mat) { done(); return }
        if (++attempts < 200) setTimeout(poll, 100)   // poll every 100ms, up to 20s
        else reject(new Error('Scanner engine loaded but did not initialise in 20s.'))
      }
      poll()
    }

    document.head.appendChild(script)
  })

  return _cvPromise
}

// ── Geometry helpers ──────────────────────────────────────────────────────────

function ptDist(a: Pt, b: Pt) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

/** Order 4 arbitrary points as [TL, TR, BR, BL] */
function orderQuad(pts: Pt[]): Quad {
  const byY  = [...pts].sort((a, b) => a.y - b.y)
  const top  = byY.slice(0, 2).sort((a, b) => a.x - b.x)
  const bot  = byY.slice(2, 4).sort((a, b) => a.x - b.x)
  return [top[0], top[1], bot[1], bot[0]]
}

/** Default quad: slight inset from frame edges */
function defaultQuad(w: number, h: number): Quad {
  const p = 0.08
  return [
    { x: w * p,       y: h * p },
    { x: w * (1 - p), y: h * p },
    { x: w * (1 - p), y: h * (1 - p) },
    { x: w * p,       y: h * (1 - p) },
  ]
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DocumentScanner({
  onScanComplete,
  onClose,
  purpose = 'RECEIPT',
}: {
  onScanComplete: (blob: Blob) => void
  onClose: () => void
  purpose?: 'RECEIPT' | 'ODOMETER'
}) {
  const [state,   setState]   = useState<ScanState>('LOADING_CV')
  const [msg,     setMsg]     = useState('Loading scanner engine…')
  const [quad,    setQuad]    = useState<Quad | null>(null)

  const videoRef   = useRef<HTMLVideoElement>(null)
  const liveCanvas = useRef<HTMLCanvasElement>(null)   // overlay during CAMERA
  const capCanvas  = useRef<HTMLCanvasElement>(null)   // captured still
  const adjCanvas  = useRef<HTMLCanvasElement>(null)   // adjust overlay
  const outCanvas  = useRef<HTMLCanvasElement>(null)   // processed result

  const streamRef  = useRef<MediaStream | null>(null)
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cvRef      = useRef<any>(null)
  const quadRef    = useRef<Quad | null>(null)
  const dragIdx    = useRef<number | null>(null)

  // ── Cleanup ───────────────────────────────────────────────────────────────

  const stopCamera = useCallback(() => {
    if (timerRef.current)  { clearInterval(timerRef.current);  timerRef.current  = null }
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  // ── Draw quad overlay ─────────────────────────────────────────────────────

  const drawQuad = useCallback((
    ctx: CanvasRenderingContext2D,
    w: number, h: number,
    q: Quad | null,
    adjustMode = false,
  ) => {
    ctx.clearRect(0, 0, w, h)
    if (!q) return

    // Semi-transparent fill
    ctx.beginPath()
    ctx.moveTo(q[0].x, q[0].y)
    ctx.lineTo(q[1].x, q[1].y)
    ctx.lineTo(q[2].x, q[2].y)
    ctx.lineTo(q[3].x, q[3].y)
    ctx.closePath()
    ctx.fillStyle = adjustMode ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.15)'
    ctx.fill()
    ctx.strokeStyle = adjustMode ? '#10b981' : '#3b82f6'
    ctx.lineWidth   = 2.5
    ctx.stroke()

    // Corner handles
    const HANDLE = 16
    q.forEach((pt, i) => {
      const active = dragIdx.current === i
      ctx.beginPath()
      ctx.arc(pt.x, pt.y, HANDLE, 0, Math.PI * 2)
      ctx.fillStyle   = active ? (adjustMode ? '#059669' : '#2563eb') : (adjustMode ? '#10b981' : '#3b82f6')
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth   = 2.5
      ctx.stroke()

      // Small plus icon
      ctx.strokeStyle = '#fff'
      ctx.lineWidth   = 2
      ctx.beginPath()
      ctx.moveTo(pt.x - 6, pt.y); ctx.lineTo(pt.x + 6, pt.y)
      ctx.moveTo(pt.x, pt.y - 6); ctx.lineTo(pt.x, pt.y + 6)
      ctx.stroke()
    })
  }, [])

  // ── Detect document corners in one frame ──────────────────────────────────

  const detectCorners = useCallback((
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cv: any,
    imageData: ImageData,
  ): Quad | null => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let src: any, gray: any, blur: any, edges: any, contours: any, hier: any
    try {
      src      = cv.matFromImageData(imageData)
      gray     = new cv.Mat()
      blur     = new cv.Mat()
      edges    = new cv.Mat()
      contours = new cv.MatVector()
      hier     = new cv.Mat()

      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
      cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0)
      cv.Canny(blur, edges, 75, 200)
      cv.findContours(edges, contours, hier, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

      const minArea = imageData.width * imageData.height * 0.04
      let bestQuad: Quad | null = null
      let bestArea = 0

      for (let i = 0; i < contours.size(); i++) {
        const c    = contours.get(i)
        const area = cv.contourArea(c)
        if (area < minArea) continue
        const peri   = cv.arcLength(c, true)
        const approx = new cv.Mat()
        cv.approxPolyDP(c, approx, 0.02 * peri, true)
        if (approx.rows === 4 && area > bestArea) {
          bestArea = area
          const pts: Pt[] = []
          for (let j = 0; j < 4; j++) {
            // approxPolyDP gives int32 points in data32S
            pts.push({ x: approx.data32S[j * 2], y: approx.data32S[j * 2 + 1] })
          }
          bestQuad = orderQuad(pts)
        }
        approx.delete()
      }
      return bestQuad
    } catch { return null }
    finally {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;[src, gray, blur, edges, contours, hier].forEach(m => (m as any)?.delete?.())
    }
  }, [])

  // ── Perspective warp + auto-enhance ──────────────────────────────────────

  const processCapture = useCallback(async (q: Quad) => {
    const cv  = cvRef.current
    const cap = capCanvas.current
    const out = outCanvas.current
    if (!cv || !cap || !out) return false

    const ctx = cap.getContext('2d')
    if (!ctx) return false
    const imageData = ctx.getImageData(0, 0, cap.width, cap.height)

    // Output dimensions from longest edges
    const W = Math.round(Math.max(ptDist(q[0], q[1]), ptDist(q[3], q[2])))
    const H = Math.round(Math.max(ptDist(q[0], q[3]), ptDist(q[1], q[2])))
    if (W < 60 || H < 60) return false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let src: any, dst: any, srcPts: any, dstPts: any, M: any, enhanced: any
    try {
      src = cv.matFromImageData(imageData)

      // Build Float32 point arrays for getPerspectiveTransform
      srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
        q[0].x, q[0].y,
        q[1].x, q[1].y,
        q[2].x, q[2].y,
        q[3].x, q[3].y,
      ])
      dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0, 0,
        W, 0,
        W, H,
        0, H,
      ])

      M       = cv.getPerspectiveTransform(srcPts, dstPts)
      dst     = new cv.Mat()
      cv.warpPerspective(src, dst, M, new cv.Size(W, H))

      // Auto brightness + contrast enhancement
      enhanced = new cv.Mat()
      cv.convertScaleAbs(dst, enhanced, 1.25, 15)

      out.width  = W
      out.height = H
      cv.imshow(out, enhanced)
      return true
    } catch (e) {
      console.error('[DocumentScanner] processCapture:', e)
      return false
    } finally {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;[src, dst, srcPts, dstPts, M, enhanced].forEach(m => (m as any)?.delete?.())
    }
  }, [])

  // ── Start camera + detection loop ─────────────────────────────────────────

  const startCamera = useCallback(async () => {
    setState('LOADING_CV')
    setMsg('Requesting camera…')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current!
      video.srcObject = stream
      await video.play()

      setState('CAMERA')
      setMsg(purpose === 'ODOMETER' ? 'Point at odometer reading' : 'Point at receipt or document')
      quadRef.current = null

      timerRef.current = setInterval(() => {
        const vid  = videoRef.current
        const cvs  = liveCanvas.current
        const cv   = cvRef.current
        if (!vid || !cvs || !cv || vid.readyState < 2) return
        const W = vid.videoWidth, H = vid.videoHeight
        if (!W || !H) return

        // Capture frame into offscreen canvas for detection
        const off = document.createElement('canvas')
        off.width = W; off.height = H
        off.getContext('2d')!.drawImage(vid, 0, 0)
        const imgData = off.getContext('2d')!.getImageData(0, 0, W, H)

        const q = detectCorners(cv, imgData)
        quadRef.current = q
        cvs.width = W; cvs.height = H
        const oc = cvs.getContext('2d')!
        drawQuad(oc, W, H, q)
      }, 400)
    } catch (e: unknown) {
      const msg = (e as Error).message ?? ''
      if (/denied|permission|not allowed/i.test(msg)) setState('DENIED')
      else { setState('FAILED'); setMsg('Camera error: ' + msg) }
    }
  }, [detectCorners, drawQuad, purpose])

  // ── Capture still frame ───────────────────────────────────────────────────

  const capture = useCallback(() => {
    const video = videoRef.current
    const cap   = capCanvas.current
    if (!video || !cap) return

    cap.width  = video.videoWidth
    cap.height = video.videoHeight
    cap.getContext('2d')!.drawImage(video, 0, 0)

    stopCamera()

    const q = quadRef.current ?? defaultQuad(cap.width, cap.height)
    setQuad(q)
    quadRef.current = q
    setState('CAPTURED')
    setMsg('Drag corners to align edges, then tap Process')

    // Draw initial adjust overlay
    const adj = adjCanvas.current!
    adj.width  = cap.width
    adj.height = cap.height
    drawQuad(adj.getContext('2d')!, cap.width, cap.height, q, true)
  }, [stopCamera, drawQuad])

  // ── Process ────────────────────────────────────────────────────────────────

  const process = useCallback(async () => {
    const q = quadRef.current
    if (!q) return
    setState('PROCESSING')
    setMsg('Correcting perspective and enhancing…')
    await new Promise(r => setTimeout(r, 30))   // flush render
    const ok = await processCapture(q)
    if (ok) { setState('PREVIEW'); setMsg('Looking good? Tap ✓ Use to continue.') }
    else    { setState('FAILED');  setMsg('Processing failed. Please retake.') }
  }, [processCapture])

  // ── Confirm ────────────────────────────────────────────────────────────────

  const confirm = useCallback(() => {
    outCanvas.current?.toBlob(blob => {
      if (blob) { stopCamera(); onScanComplete(blob) }
    }, 'image/jpeg', 0.93)
  }, [stopCamera, onScanComplete])

  // ── Retake ─────────────────────────────────────────────────────────────────

  const retake = useCallback(() => {
    setQuad(null); quadRef.current = null
    startCamera()
  }, [startCamera])

  // ── Cancel ─────────────────────────────────────────────────────────────────

  const cancel = useCallback(() => { stopCamera(); onClose() }, [stopCamera, onClose])

  // ── Init ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true
    setMsg('Loading scanner engine… (first use ~8 MB, cached after)')
    loadOpenCV()
      .then(cv => {
        if (!mounted) return
        cvRef.current = cv
        startCamera()
      })
      .catch(() => {
        if (!mounted) return
        setState('FAILED')
        setMsg('Could not load scanner engine. Check your internet connection and try again.')
      })
    return () => { mounted = false; stopCamera() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Pointer handling for corner drag (CAPTURED state) ─────────────────────

  function resolvePos(e: React.TouchEvent | React.MouseEvent, canvas: HTMLCanvasElement): Pt {
    const rect   = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : (e as React.MouseEvent).clientY
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }
  }

  function onPointerDown(e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) {
    if (!quad || state !== 'CAPTURED') return
    const canvas = adjCanvas.current!
    const pos    = resolvePos(e, canvas)
    const rect   = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const TOUCH_R = 44 * scaleX   // 44px touch target scaled

    let bestIdx = -1, bestDist = Infinity
    quad.forEach((pt, i) => {
      const d = ptDist(pt, pos)
      if (d < TOUCH_R && d < bestDist) { bestDist = d; bestIdx = i }
    })
    if (bestIdx >= 0) dragIdx.current = bestIdx
  }

  function onPointerMove(e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) {
    if (dragIdx.current === null || !quad) return
    e.preventDefault()
    const canvas = adjCanvas.current!
    const pos    = resolvePos(e, canvas)
    const newQ   = [...quad] as Quad
    newQ[dragIdx.current] = pos
    setQuad(newQ)
    quadRef.current = newQ
    drawQuad(canvas.getContext('2d')!, canvas.width, canvas.height, newQ, true)
  }

  function onPointerUp() { dragIdx.current = null }

  // ── Render ─────────────────────────────────────────────────────────────────

  const label = purpose === 'ODOMETER' ? 'Scan Odometer' : 'Scan Receipt'

  return (
    <div style={R.backdrop}>
      {/* Self-contained keyframes — no globals.css dependency */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={R.sheet}>

        {/* ── Header ───────────────────────────────────────────── */}
        <div style={R.header}>
          <div style={R.headerLeft}>
            <span style={R.camIcon}>📷</span>
            <span style={R.headerTitle}>{label}</span>
          </div>
          <button onClick={cancel} style={R.closeBtn} aria-label="Close">✕</button>
        </div>

        {/* ── Status bar ───────────────────────────────────────── */}
        <div style={{
          ...R.statusBar,
          backgroundColor: state === 'CAPTURED' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
          borderBottomColor: state === 'CAPTURED' ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.3)',
        }}>
          <span style={{
            ...R.statusText,
            color: state === 'CAPTURED' ? '#6ee7b7' : '#93c5fd',
          }}>
            {state === 'CAMERA'    && '● '}
            {state === 'CAPTURED'  && '◈ '}
            {msg}
          </span>
        </div>

        {/* ── Main area ────────────────────────────────────────── */}
        <div style={R.body}>

          {/* LOADING / PROCESSING / DENIED / FAILED — center state */}
          {(state === 'LOADING_CV' || state === 'PROCESSING' || state === 'DENIED' || state === 'FAILED') && (
            <div style={R.center}>
              {(state === 'LOADING_CV' || state === 'PROCESSING') && (
                <>
                  <div style={R.spinner} />
                  <p style={R.centerMsg}>{msg}</p>
                  {state === 'LOADING_CV' && (
                    <p style={R.centerSub}>
                      First use downloads ~8 MB (OpenCV engine).{'\n'}Subsequent scans are instant.
                    </p>
                  )}
                </>
              )}
              {state === 'DENIED' && (
                <>
                  <span style={{ fontSize: 48 }}>🚫</span>
                  <p style={R.centerMsg}>Camera access denied</p>
                  <p style={R.centerSub}>
                    Allow camera permission in your browser settings, then tap Try Again.
                  </p>
                  <button onClick={retake} style={R.btnPrimary}>Try Again</button>
                  <button onClick={cancel} style={{ ...R.btnSecondary, marginTop: 8 }}>Cancel</button>
                </>
              )}
              {state === 'FAILED' && (
                <>
                  <span style={{ fontSize: 48 }}>⚠️</span>
                  <p style={R.centerMsg}>Scanner Error</p>
                  <p style={R.centerSub}>{msg}</p>
                  <button onClick={retake} style={R.btnPrimary}>Try Again</button>
                  <button onClick={cancel} style={{ ...R.btnSecondary, marginTop: 8 }}>Cancel</button>
                </>
              )}
            </div>
          )}

          {/* CAMERA — live viewfinder */}
          {state === 'CAMERA' && (
            <div style={R.viewfinder}>
              {/* Corner guide marks */}
              <div style={{ ...R.corner, top: 20, left: 20, borderTop: '3px solid #3b82f6', borderLeft: '3px solid #3b82f6' }} />
              <div style={{ ...R.corner, top: 20, right: 20, borderTop: '3px solid #3b82f6', borderRight: '3px solid #3b82f6' }} />
              <div style={{ ...R.corner, bottom: 80, left: 20, borderBottom: '3px solid #3b82f6', borderLeft: '3px solid #3b82f6' }} />
              <div style={{ ...R.corner, bottom: 80, right: 20, borderBottom: '3px solid #3b82f6', borderRight: '3px solid #3b82f6' }} />

              <video ref={videoRef} style={R.video} playsInline muted />
              <canvas ref={liveCanvas} style={R.overlayCanvas} />

              {/* Shutter button */}
              <button onClick={capture} style={R.shutterWrap} aria-label="Capture">
                <div style={R.shutterRing}>
                  <div style={R.shutterInner} />
                </div>
              </button>
            </div>
          )}

          {/* CAPTURED — still image + draggable corner overlay */}
          {state === 'CAPTURED' && (
            <div style={R.viewfinder}>
              {/* Still image */}
              <canvas ref={capCanvas} style={R.video} />
              {/* Interactive overlay */}
              <canvas
                ref={adjCanvas}
                style={{ ...R.overlayCanvas, touchAction: 'none', cursor: 'crosshair' }}
                onMouseDown={onPointerDown}
                onMouseMove={onPointerMove}
                onMouseUp={onPointerUp}
                onMouseLeave={onPointerUp}
                onTouchStart={onPointerDown}
                onTouchMove={onPointerMove}
                onTouchEnd={onPointerUp}
              />
              {/* Action bar */}
              <div style={R.actionBar}>
                <button onClick={retake}  style={R.btnRetake}>↩ Retake</button>
                <button onClick={process} style={R.btnProcess}>⚡ Process</button>
              </div>
            </div>
          )}

          {/* PREVIEW — processed result */}
          {state === 'PREVIEW' && (
            <div style={R.previewArea}>
              <div style={R.previewFrame}>
                <canvas ref={outCanvas} style={R.previewCanvas} />
                <div style={R.previewBadge}>✓ Enhanced</div>
              </div>
              <div style={R.previewActions}>
                <button onClick={retake}  style={R.btnRetake}>↩ Retake</button>
                <button onClick={confirm} style={R.btnConfirm}>✓ Use Photo</button>
              </div>
            </div>
          )}

          {/* Hidden output canvas always mounted so OpenCV imshow works */}
          {state !== 'PREVIEW' && (
            <canvas ref={outCanvas} style={{ display: 'none' }} />
          )}
        </div>

      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const R: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(2,6,23,0.96)',
    zIndex: 3000,
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
  camIcon:    { fontSize: 18 },
  headerTitle:{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em' },
  closeBtn: {
    background: 'none', border: 'none',
    color: '#475569', fontSize: 17,
    cursor: 'pointer', padding: '6px 8px',
    borderRadius: 8,
    lineHeight: 1,
  },
  statusBar: {
    padding: '8px 16px',
    borderBottom: '1px solid',
    flexShrink: 0,
    transition: 'background-color 0.3s, border-color 0.3s',
  },
  statusText: {
    fontSize: 12, fontWeight: 500, letterSpacing: '0.01em',
    transition: 'color 0.3s',
  },
  body: {
    flex: 1, overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    position: 'relative',
  },
  center: {
    flex: 1,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 12, padding: '32px 28px', textAlign: 'center',
  },
  spinner: {
    width: 48, height: 48, borderRadius: '50%',
    border: '3px solid rgba(255,255,255,0.1)',
    borderTop: '3px solid #3b82f6',
    animation: 'spin 0.75s linear infinite',
  },
  centerMsg: { fontSize: 17, fontWeight: 700, color: '#f1f5f9', margin: 0, lineHeight: 1.3 },
  centerSub: {
    fontSize: 13, color: '#475569', margin: 0,
    lineHeight: 1.65, maxWidth: 300, whiteSpace: 'pre-line',
  },
  viewfinder: {
    flex: 1, position: 'relative', overflow: 'hidden',
    backgroundColor: '#000',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  video: {
    width: '100%', height: '100%',
    objectFit: 'contain',
    display: 'block',
  },
  overlayCanvas: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    pointerEvents: 'none',
  },
  corner: {
    position: 'absolute', width: 22, height: 22, zIndex: 10,
  },
  shutterWrap: {
    position: 'absolute', bottom: 22,
    left: '50%', transform: 'translateX(-50%)',
    background: 'none', border: 'none',
    cursor: 'pointer', padding: 0, zIndex: 20,
  },
  shutterRing: {
    width: 72, height: 72, borderRadius: '50%',
    border: '3.5px solid rgba(255,255,255,0.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    boxShadow: '0 0 0 2px rgba(255,255,255,0.2)',
  },
  shutterInner: {
    width: 54, height: 54, borderRadius: '50%',
    backgroundColor: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
  },
  actionBar: {
    position: 'absolute', bottom: 20,
    left: '50%', transform: 'translateX(-50%)',
    display: 'flex', gap: 12, zIndex: 20,
  },
  previewArea: {
    flex: 1,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 20, padding: '16px 16px 24px',
    backgroundColor: '#020617',
  },
  previewFrame: {
    position: 'relative',
    borderRadius: 10, overflow: 'hidden',
    boxShadow: '0 0 0 2px rgba(16,185,129,0.5), 0 8px 32px rgba(0,0,0,0.6)',
    maxWidth: '100%',
    flex: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  previewCanvas: {
    maxWidth: '100%',
    maxHeight: 'calc(95vh - 220px)',
    display: 'block', borderRadius: 10,
  },
  previewBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(16,185,129,0.9)',
    color: '#fff', fontSize: 11, fontWeight: 700,
    padding: '3px 10px', borderRadius: 20,
    backdropFilter: 'blur(4px)',
  },
  previewActions: { display: 'flex', gap: 12 },
  btnPrimary: {
    padding: '12px 28px',
    backgroundColor: '#3b82f6', color: '#fff',
    border: 'none', borderRadius: 10,
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
  btnSecondary: {
    padding: '11px 24px',
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#94a3b8',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, fontSize: 14, cursor: 'pointer',
  },
  btnRetake: {
    padding: '12px 22px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#e2e8f0',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  btnProcess: {
    padding: '12px 26px',
    backgroundColor: '#3b82f6', color: '#fff',
    border: 'none', borderRadius: 10,
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(59,130,246,0.4)',
  },
  btnConfirm: {
    padding: '12px 28px',
    backgroundColor: '#10b981', color: '#fff',
    border: 'none', borderRadius: 10,
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(16,185,129,0.4)',
  },
}
