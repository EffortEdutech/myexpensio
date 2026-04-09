'use client'

import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function isStandaloneMode() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
}

function isIosSafari() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isIos = /iPad|iPhone|iPod/.test(ua)
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
  return isIos && isSafari
}

export function PwaInstallCard({ compact = false }: { compact?: boolean }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [prompting, setPrompting] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setInstalled(isStandaloneMode())

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setInstalled(isStandaloneMode())
    }

    const onInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const showIosHint = !installed && !deferredPrompt && isIosSafari()
  const hidden = dismissed && !installed && !showIosHint && !deferredPrompt
  const title = compact ? 'Install myexpensio' : 'Install myexpensio on this device'
  const subtitle = installed
    ? 'Already installed. Launch from your home screen for a more app-like experience.'
    : 'Add myexpensio to your home screen for faster access and a cleaner full-screen experience.'

  const canInstall = !!deferredPrompt && !installed

  async function handleInstall() {
    if (!deferredPrompt) return
    setPrompting(true)
    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setInstalled(true)
      }
      setDeferredPrompt(null)
    } finally {
      setPrompting(false)
    }
  }

  if (installed) {
    return (
      <div style={{ ...S.card, padding: compact ? 14 : 16, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
        <div style={S.head}>
          <span style={S.icon}>📲</span>
          <div>
            <div style={S.title}>myexpensio is installed</div>
            <div style={S.sub}>Open it from your home screen like an app.</div>
          </div>
        </div>
      </div>
    )
  }

  if (hidden) return null

  return (
    <div style={{ ...S.card, padding: compact ? 14 : 16 }}>
      <div style={S.head}>
        <span style={S.icon}>📱</span>
        <div>
          <div style={S.title}>{title}</div>
          <div style={S.sub}>{subtitle}</div>
        </div>
      </div>

      {canInstall && (
        <div style={S.actions}>
          <button onClick={handleInstall} style={S.btnPrimary} disabled={prompting}>
            {prompting ? 'Opening install prompt…' : 'Install App'}
          </button>
          <button onClick={() => setDismissed(true)} style={S.btnGhost}>
            Not now
          </button>
        </div>
      )}

      {showIosHint && (
        <div style={S.hintBox}>
          On iPhone/iPad Safari: tap <strong>Share</strong> then <strong>Add to Home Screen</strong>.
        </div>
      )}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  card: { display: 'flex', flexDirection: 'column', gap: 12, backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 14 },
  head: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  icon: { fontSize: 24 },
  title: { fontSize: 14, fontWeight: 700, color: '#0f172a' },
  sub: { fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 1.5 },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  btnPrimary: { padding: '10px 14px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnGhost: { padding: '10px 14px', backgroundColor: '#fff', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  hintBox: { padding: '10px 12px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, fontSize: 12, color: '#1d4ed8', lineHeight: 1.5 },
}
