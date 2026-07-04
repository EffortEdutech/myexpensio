// Hand-rolled service worker for the MyExpensio PWA.
//
// No precache manifest here on purpose: Metro's static web export produces
// content-hashed bundle filenames that aren't known ahead of time, so there
// is nothing fixed to precache at install time. Instead this worker caches
// opportunistically as the app is used ("runtime caching").
//
// Strategy:
//   - Navigation requests (HTML page loads): network-first, so users always
//     get the latest deployed build when online, falling back to the cached
//     shell (or last-cached page) when offline.
//   - Same-origin static assets (JS/CSS/images/fonts): cache-first for
//     speed, refreshed in the background on every fetch.
//   - /api/* and any cross-origin request (Supabase, etc.): network-only,
//     never cached — these carry auth state and must always be fresh.
//
// Claim-lock and tier gating are enforced server-side regardless of what
// this worker caches — caching here is purely a performance/offline-shell
// concern, never a source of truth for data.

const CACHE_NAME = "myexpensio-static-v1";
const APP_SHELL_URL = "/";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // Never cache API calls or cross-origin requests — always hit the network
  // so responses reflect the authenticated, current-tier state of the account.
  if (!isSameOrigin || url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || (await caches.match(APP_SHELL_URL));
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
