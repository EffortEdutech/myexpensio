# PWA Strategy: user-mobile-v2 → iPhone Install (No App Store)

**Date:** 2026-06-10  
**Goal:** Ship `user-mobile-v2` as an installable PWA on iPhone Safari — zero App Store, zero $99/year, instant delivery via URL.

---

## Why This Works

iOS Safari (16.4+) supports the full PWA install contract:

- **Add to Home Screen** → app icon, full-screen launch, no browser chrome
- **Web Push** (iOS 16.4+) → notifications without APNs
- **HTTPS mandatory** — already satisfied by Vercel deployment
- **Offline via Service Worker** — cache-first shell + Supabase sync on reconnect

The user visits a URL, taps "Share → Add to Home Screen," and gets a native-feeling app icon. No TestFlight, no review, no $99.

---

## Current State Assessment

### ✅ Already Web-Ready

| Item | Status |
|------|--------|
| Metro web build (`"output": "single"`) | Done — `app.json` |
| `react-native-web` | Installed |
| `database.web.ts` | Exists (in-memory fallback) |
| `sessionStorage.ts` | Uses `localStorage` on web |
| `supabase.ts` | `Platform.OS === "web"` skips SecureStore |
| `syncConfig.ts` | Same-origin API on web |
| `biometricAuth.ts` | Returns `available: false` on web (safe) |
| `expo-sharing` | Falls back to Web Share API on web |
| `expo-location` | Uses browser Geolocation API on web |

### ❌ Missing for PWA

| Gap | Impact | Priority |
|-----|--------|----------|
| No `manifest.json` / PWA web manifest | App can't be installed | **P0** |
| No service worker | No offline, no install prompt on some browsers | **P0** |
| `database.web.ts` is in-memory only | Data lost on refresh — unusable | **P0** |
| No iOS meta tags (`apple-mobile-web-app-capable`) | Bad UX on Safari install | **P0** |
| No install prompt / "Add to Home Screen" guide | Users won't know to install | **P1** |
| Receipt camera uses file picker, not camera | Worse UX than native | **P1** |
| Biometric on web = disabled | No Face ID on PWA | **P2** |
| Push notifications not wired | No reminders on iOS 16.4+ | **P2** |
| `expo-print` uses `window.print()` | Works but styled poorly | **P3** |

---

## Implementation Plan

### Phase 1 — Installable (P0, ~1 day)

#### 1.1 Add PWA manifest via Expo web config

In `app.json`, extend the `web` section:

```json
"web": {
  "bundler": "metro",
  "output": "single",
  "name": "MyExpensio",
  "shortName": "Expensio",
  "description": "Expense tracking & claims management",
  "themeColor": "#0f766e",
  "backgroundColor": "#ffffff",
  "display": "standalone",
  "orientation": "portrait",
  "lang": "en"
}
```

Then create `apps/user-mobile-v2/public/manifest.json` (Metro serves the `public/` folder as static assets):

```json
{
  "name": "MyExpensio",
  "short_name": "Expensio",
  "description": "Expense tracking & claims management",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#0f766e",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

Generate icons from `assets/icon.png` (192×192 and 512×512).

#### 1.2 Custom HTML template with iOS meta tags

Create `apps/user-mobile-v2/web/index.html` (Expo Metro picks this up automatically):

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

  <!-- PWA manifest -->
  <link rel="manifest" href="/manifest.json" />

  <!-- iOS PWA -->
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Expensio" />
  <link rel="apple-touch-icon" href="/icons/icon-192.png" />
  <link rel="apple-touch-startup-image" href="/icons/splash.png" />

  <!-- Theme -->
  <meta name="theme-color" content="#0f766e" />
  <meta name="msapplication-TileColor" content="#0f766e" />

  <title>MyExpensio</title>
</head>
<body>
  <!-- Expo injects app bundle here -->
</body>
</html>
```

#### 1.3 Register a minimal service worker

Create `apps/user-mobile-v2/public/sw.js` — shell caching strategy:

```js
const CACHE = "myexpensio-v1";
const PRECACHE = ["/", "/manifest.json", "/icons/icon-192.png"];

self.addEventListener("install", e =>
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)))
);

self.addEventListener("activate", e =>
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
);

self.addEventListener("fetch", e => {
  // Network-first for API, cache-first for static shell
  if (e.request.url.includes("/api/") || e.request.url.includes("supabase")) {
    return; // Let it fail naturally — sync handles retry
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
```

Register it in `App.tsx` inside a `useEffect`:

```ts
useEffect(() => {
  if (Platform.OS === "web" && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(console.warn);
  }
}, []);
```

---

### Phase 2 — Persistent Local Data (P0, ~1–2 days)

This is the most critical gap. `database.web.ts` currently wipes all data on every page refresh, making the app unusable as a standalone PWA.

#### Solution: OPFS-backed SQLite via `sql.js`

Replace the in-memory store in `database.web.ts` with **`@sqlite.org/sqlite-wasm`** (Origin Private File System). This gives real persistent SQLite in the browser, identical API to expo-sqlite.

```ts
// database.web.ts — OPFS persistent SQLite
import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

let dbInstance: any = null;

export async function getDatabase() {
  if (dbInstance) return dbInstance;

  const sqlite3 = await sqlite3InitModule({ print: () => {}, printErr: () => {} });

  // OPFS is supported on iOS 16+ Safari — persistent across reloads
  if (sqlite3.oo1.OpfsDb) {
    dbInstance = new sqlite3.oo1.OpfsDb("/myexpensio.db");
  } else {
    // Fallback: in-memory (iOS <16 or private browsing)
    dbInstance = new sqlite3.oo1.DB("/myexpensio.db", "c");
    console.warn("[db] OPFS unavailable — using in-memory SQLite");
  }

  return wrapForExpoCompat(dbInstance);
}
```

The `wrapForExpoCompat` adapter maps `execAsync / runAsync / getFirstAsync / getAllAsync` to sql.js calls — keeps all repository code unchanged.

**iOS compatibility note:** OPFS is available on iOS 17+ in Safari. iOS 16.x falls back to in-memory (data syncs from Supabase on login — acceptable for FREE tier).

---

### Phase 3 — Better Camera UX (P1, ~half day)

`expo-image-picker` on web renders a plain `<input type="file">`. On iPhone Safari this opens the photo library but doesn't trigger the camera directly.

Fix in `ReceiptPickerField.tsx` — add a web-only wrapper:

```tsx
// Web: inject a hidden <input capture="environment" accept="image/*">
// to trigger camera directly on iOS Safari
if (Platform.OS === "web") {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.capture = "environment"; // rear camera
  input.onchange = (e) => { /* read File → base64 → pass to existing handler */ };
  input.click();
  return;
}
// Native: existing expo-image-picker flow
```

This gives "take photo" UX identical to native on iPhone.

---

### Phase 4 — Install Prompt (P1, ~half day)

iOS Safari doesn't support the `beforeinstallprompt` event — you must teach the user manually.

Create `components/PwaInstallBanner.tsx`:

```tsx
// Show once, dismiss-able, only on iOS Safari when not already installed
const isIosSafari = /iPhone|iPad/.test(navigator.userAgent) && !window.matchMedia("(display-mode: standalone)").matches;

if (!isIosSafari) return null;

return (
  <View style={styles.banner}>
    <Text>Install MyExpensio: tap <Text style={styles.bold}>Share ↑</Text> → Add to Home Screen</Text>
    <Pressable onPress={dismiss}><Text>✕</Text></Pressable>
  </View>
);
```

Persist the dismissed state in `localStorage` so it doesn't reappear.

---

### Phase 5 — Push Notifications (P2, iOS 16.4+)

iOS 16.4+ supports Web Push for installed PWAs. Not available in Safari browser tab — only after install.

Setup:
1. Generate VAPID keys: `npx web-push generate-vapid-keys`
2. Store public key in env: `EXPO_PUBLIC_VAPID_PUBLIC_KEY`
3. Subscribe in app after install:

```ts
if (Platform.OS === "web" && "PushManager" in window) {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: VAPID_PUBLIC_KEY,
  });
  // Send sub to Supabase Edge Function for storage
}
```

4. Send push from a Supabase Edge Function (claim approved, report ready, etc.)

**Note:** Users on iOS <16.4 get no push — degrade gracefully (no error, no prompt).

---

### Phase 6 — Face ID / WebAuthn (P2, ~1 day)

Replace the `unsupportedBiometricAuthAdapter` on web with a WebAuthn adapter:

```ts
// biometricAuth.web.ts
export const webAuthnBiometricAdapter: BiometricAuthAdapter = {
  async getAvailability() {
    if (!window.PublicKeyCredential) return { available: false, reason: "WebAuthn not supported" };
    const ok = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return ok ? { available: true } : { available: false, reason: "No platform authenticator" };
  },
  async authenticate() {
    // Use navigator.credentials.get() with platform authenticator
    // Triggers Face ID on iPhone running iOS Safari PWA
    // ...
  }
};
```

Metro's `.web.ts` resolution will automatically use this file on web instead of `biometricAuth.ts`.

---

## Deployment Target

The PWA needs to be served from the same origin as the sync API for cookie-based auth and same-origin `fetch`. Options:

| Option | Notes |
|--------|-------|
| Vercel (recommended) | Single deploy, HTTPS automatic, `expo export --platform web` → Vercel output |
| Netlify | Same approach |
| Supabase Storage + CDN | Static hosting only — no SSR, fine for SPA |

Build command: `expo export --platform web`  
Output dir: `dist/`

---

## iOS Version Support Matrix

| iOS | Install | Offline (OPFS) | Push | Face ID (WebAuthn) |
|-----|---------|----------------|------|--------------------|
| 16.0–16.3 | ✅ | ❌ (in-memory) | ❌ | ✅ |
| 16.4–16.x | ✅ | ❌ (in-memory) | ✅ | ✅ |
| 17.0+ | ✅ | ✅ OPFS | ✅ | ✅ |

**Minimum viable:** iOS 16.0 — install + auth + Supabase sync (data not cached offline)  
**Full feature:** iOS 17+ — install + OPFS offline + push + Face ID

---

## Sprint Sizing Estimate

| Phase | Work | Estimate |
|-------|------|----------|
| P1 — Installable (manifest + SW + iOS tags) | New files only, no existing code changes | 0.5 day |
| P2 — OPFS persistent DB | Replace `database.web.ts` | 1 day |
| P3 — Camera UX | `ReceiptPickerField.tsx` web branch | 0.5 day |
| P4 — Install banner | New component | 0.5 day |
| P5 — Push | Supabase Edge Function + SW handler | 1 day |
| P6 — WebAuthn | New `biometricAuth.web.ts` | 1 day |
| **Total (P1–P4)** | Usable PWA | **~2.5 days** |
| **Total (P1–P6)** | Full feature parity | **~4.5 days** |

---

## What You Don't Get vs. Native App Store Build

| Feature | PWA | Native (App Store) |
|---------|-----|--------------------|
| Distribution | URL | App Store |
| Install friction | Medium (manual Add to Home Screen) | Low (one tap) |
| Push notifications | iOS 16.4+ only, installed PWA only | All iOS versions |
| Camera / NFC | Camera ✅, NFC ❌ | Both ✅ |
| Background sync | Limited (service worker) | Full |
| App Store discoverability | ❌ | ✅ |
| Cost | Free | $99/year |
| Review required | No | Yes |

**Recommendation:** Ship PWA first for early adopters and cost-sensitive users. Add App Store build later once revenue justifies the $99/year.
