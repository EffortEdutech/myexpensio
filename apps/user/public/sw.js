const CACHE_VERSION = 'myexpensio-pwa-v1'
const SHELL_CACHE = `${CACHE_VERSION}-shell`
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`
const OFFLINE_URL = '/offline'

const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-512.png',
  '/icons/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  // ── IMPORTANT: Do NOT call self.skipWaiting() here. ─────────────────────
  // The new SW must enter the "waiting" state so the update banner can detect
  // it via registration.waiting. skipWaiting is triggered only when the user
  // confirms the update (see the message handler at the bottom of this file).
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![SHELL_CACHE, RUNTIME_CACHE].includes(key))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

function isSameOrigin(url) {
  return url.origin === self.location.origin
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  if (request.method !== 'GET') return
  if (!isSameOrigin(url)) return
  if (url.pathname.startsWith('/api/')) return
  if (url.pathname.startsWith('/auth/')) return

  // ── Never cache version.json — always fetch fresh from network. ──────────
  // The PWA update hook fetches this file to compare versions.
  // Caching it would prevent users from ever seeing the update banner.
  if (url.pathname === '/version.json') {
    event.respondWith(fetch(request))
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(async () => {
          const cached = await caches.match(OFFLINE_URL)
          return cached || Response.error()
        })
    )
    return
  }

  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/favicon.ico'

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then(async (cached) => {
        const networkPromise = fetch(request)
          .then(async (response) => {
            const cache = await caches.open(RUNTIME_CACHE)
            cache.put(request, response.clone())
            return response
          })
          .catch(() => cached)

        return cached || networkPromise
      })
    )
  }
})

// ── PWA Auto-Update: activate waiting SW when user confirms update ─────────
// The usePWAUpdate hook calls registration.waiting.postMessage({ type: 'SKIP_WAITING' })
// when the user taps "Update Now". This handler receives that message and
// activates the new SW, which then triggers a page reload via controllerchange.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
