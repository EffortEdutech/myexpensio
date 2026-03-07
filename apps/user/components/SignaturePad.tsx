'use client'
// apps/user/components/SignaturePad.tsx
//
// Canvas-based signature capture.
// Works with mouse (desktop) and touch (mobile).
//
// Usage:
//   <SignaturePad onCapture={dataUrl => setSignature(dataUrl)} />
//
// onCapture is called with:
//   - null  → pad was cleared
//   - string (data:image/png;base64,...) → user has drawn something

import { useRef, useState, useEffect, useCallback } from 'react'

type Props = {
  onCapture:    (dataUrl: string | null) => void
  disabled?:    boolean
  width?:       number   // canvas width in px (default 440)
  height?:      number   // canvas height in px (default 140)
}

export function SignaturePad({
  onCapture,
  disabled  = false,
  width     = 440,
  height    = 140,
}: Props) {
  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const drawing        = useRef(false)
  const lastPos        = useRef<{ x: number; y: number } | null>(null)
  // Store onCapture in a ref so it never needs to be a useEffect dependency.
  // Without this: every parent re-render creates a new inline arrow function →
  // useEffect re-fires → canvas.width is reassigned → canvas clears itself.
  const onCaptureRef   = useRef(onCapture)
  const disabledRef    = useRef(disabled)

  // Keep refs in sync with props without triggering re-renders
  useEffect(() => { onCaptureRef.current = onCapture }, [onCapture])
  useEffect(() => { disabledRef.current  = disabled  }, [disabled])

  const [isEmpty,  setIsEmpty]  = useState(true)
  const [touched,  setTouched]  = useState(false)

  // ── Effect 1: Canvas init — ONLY runs when dimensions change ──────────────
  // Must be isolated from onCapture/disabled so a parent re-render caused by
  // setSignature() does NOT re-run this block (which would wipe the canvas).

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr  = window.devicePixelRatio ?? 1
    canvas.width  = width  * dpr
    canvas.height = height * dpr
    canvas.style.width  = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth   = 2
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
  }, [width, height])   // ← dimensions only — never onCapture

  // ── Effect 2: Touch listeners — { passive: false } ────────────────────────
  // Re-attaches only when dimensions change (listeners need a fresh ctx ref).
  // Reads disabled/onCapture via refs so those props never appear in deps.

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function getCtx() {
      return canvas!.getContext('2d')!
    }

    function getTouch(e: TouchEvent) {
      const rect  = canvas!.getBoundingClientRect()
      const touch = e.touches[0] ?? e.changedTouches[0]
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }

    function onTouchStart(e: TouchEvent) {
      if (disabledRef.current) return
      e.preventDefault()
      drawing.current = true
      lastPos.current = getTouch(e)
      setTouched(true)
      const ctx = getCtx()
      const p   = lastPos.current
      ctx.beginPath()
      ctx.arc(p.x, p.y, 1, 0, Math.PI * 2)
      ctx.fillStyle = '#0f172a'
      ctx.fill()
    }

    function onTouchMove(e: TouchEvent) {
      if (!drawing.current || disabledRef.current) return
      e.preventDefault()
      const ctx = getCtx()
      const pos = getTouch(e)
      ctx.beginPath()
      ctx.moveTo(lastPos.current!.x, lastPos.current!.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      lastPos.current = pos
    }

    function onTouchEnd(e: TouchEvent) {
      if (!drawing.current) return
      e.preventDefault()
      drawing.current = false
      setIsEmpty(false)
      onCaptureRef.current(canvas!.toDataURL('image/png'))
    }

    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false })
    canvas.addEventListener('touchend',   onTouchEnd,   { passive: false })

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove',  onTouchMove)
      canvas.removeEventListener('touchend',   onTouchEnd)
    }
  }, [width, height])   // ← dimensions only

  // ── Mouse coordinate helper ───────────────────────────────────────────────
  // Touch coordinates are handled in the native listeners above.

  function getMousePos(e: React.MouseEvent) {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  // ── Mouse drawing handlers (touch is handled natively above) ─────────────

  function onMouseDown(e: React.MouseEvent) {
    if (disabled) return
    drawing.current = true
    lastPos.current = getMousePos(e)
    setTouched(true)
    const canvas = canvasRef.current!
    const ctx    = canvas.getContext('2d')!
    const pos    = lastPos.current
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, 1, 0, Math.PI * 2)
    ctx.fillStyle = '#0f172a'
    ctx.fill()
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!drawing.current || disabled) return
    const canvas = canvasRef.current!
    const ctx    = canvas.getContext('2d')!
    const pos    = getMousePos(e)
    ctx.beginPath()
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
  }

  function onMouseUp() {
    if (!drawing.current) return
    drawing.current = false
    setIsEmpty(false)
    onCaptureRef.current(canvasRef.current!.toDataURL('image/png'))
  }

  // ── Clear ─────────────────────────────────────────────────────────────────

  const clear = useCallback(() => {
    const canvas = canvasRef.current!
    const ctx    = canvas.getContext('2d')!
    const dpr    = window.devicePixelRatio ?? 1
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    setIsEmpty(true)
    onCaptureRef.current(null)
  }, [])   // stable — reads onCapture via ref

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={S.wrap}>
      {/* Header row */}
      <div style={S.header}>
        <span style={S.label}>
          {isEmpty && touched ? '✏ Keep drawing…' : isEmpty ? '✏ Draw your signature' : '✓ Signature captured'}
        </span>
        {!isEmpty && !disabled && (
          <button onClick={clear} style={S.clearBtn} type="button">
            Clear
          </button>
        )}
      </div>

      {/* Canvas */}
      <div style={{ ...S.canvasWrap, opacity: disabled ? 0.5 : 1 }}>
        <canvas
          ref={canvasRef}
          style={S.canvas}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        />
        {/* Baseline guide */}
        <div style={S.baseline} />
        {/* Placeholder hint */}
        {isEmpty && (
          <div style={S.hint}>
            <span style={{ fontSize: 22, opacity: 0.15 }}>✍</span>
          </div>
        )}
      </div>

      {/* Footer note */}
      <p style={S.note}>
        {disabled
          ? 'Signature locked after submission.'
          : 'Your signature will be embedded in the PDF. Draw on the canvas above.'}
      </p>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  wrap: {
    display:       'flex',
    flexDirection: 'column',
    gap:           6,
  },
  header: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  label: {
    fontSize:   12,
    fontWeight: 600,
    color:      '#374151',
  },
  clearBtn: {
    fontSize:        11,
    fontWeight:      600,
    color:           '#dc2626',
    background:      'none',
    borderWidth:     1,
    borderStyle:     'solid',
    borderColor:     '#fca5a5',
    borderRadius:    6,
    paddingTop:      3,
    paddingBottom:   3,
    paddingLeft:     10,
    paddingRight:    10,
    cursor:          'pointer',
  },
  canvasWrap: {
    position:     'relative',
    borderWidth:  2,
    borderStyle:  'dashed',
    borderColor:  '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    overflow:     'hidden',
    touchAction:  'none',   // prevents scroll while signing on mobile
    cursor:       'crosshair',
  },
  canvas: {
    display: 'block',
    touchAction: 'none',
  },
  baseline: {
    position:        'absolute',
    bottom:          28,
    left:            16,
    right:           16,
    height:          1,
    backgroundColor: '#e2e8f0',
    pointerEvents:   'none',
  },
  hint: {
    position:       'absolute',
    inset:          0,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    pointerEvents:  'none',
  },
  note: {
    margin:     0,
    fontSize:   11,
    color:      '#94a3b8',
    fontStyle:  'italic',
  },
}
