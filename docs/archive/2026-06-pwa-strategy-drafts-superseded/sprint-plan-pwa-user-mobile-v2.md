# Sprint Plan — PWA Upgrade: user-mobile-v2
**Date:** 2026-06-10  
**Track:** user-mobile-v2 only  
**Sprints:** 20 · 21 · 22  
**Goal:** Ship `user-mobile-v2` as an installable iPhone PWA — no App Store, no $99/year, delivered via URL.

---

## Pre-Sprint Audit Findings

| Finding | Impact |
|---------|--------|
| Metro web build already configured (`"output":"single"`) | No bundler change needed |
| `react-native-web` installed | All RN components render on web |
| `metro.config.js` already has `.wasm` in `assetExts` | OPFS sql.js WASM works without config changes |
| `database.web.ts` is **in-memory only** — data lost on refresh | Must fix before PWA is usable |
| `sessionStorage.ts` already uses `localStorage` on web | Auth sessions survive refresh ✓ |
| `supabase.ts` already skips SecureStore on web | ✓ |
| `syncConfig.ts` already uses same-origin on web | ✓ |
| `biometricAuth.ts` returns `available:false` on web (safe stub) | Upgrade to WebAuthn in Sprint 22 |
| `ReceiptPickerField.tsx` web branch exists but opens gallery only | Needs `capture="environment"` for camera |
| No `public/` folder | Must create for manifest + SW + icons |
| No `web/` folder | Must create for custom `index.html` |
| 15 repositories in `src/local-db/repositories/` | All use the `getDatabase()` abstraction — OPFS swap is transparent |

---

## Sprint 20 — PWA Foundation
**Duration:** 2–3 days  
**Goal:** App is installable on iPhone Safari. Data persists across refreshes. Service worker is registered.

---

### Task 20-1 — Add PWA web config to `app.json`

**File:** `apps/user-mobile-v2/app.json`

Replace the existing `"web"` block:

```json
"web": {
  "bundler": "metro",
  "output": "single",
  "name": "MyExpensio",
  "shortName": "Expensio",
  "description": "Expense tracking & claims — offline first",
  "themeColor": "#0f766e",
  "backgroundColor": "#ffffff",
  "display": "standalone",
  "orientation": "portrait",
  "lang": "en",
  "favicon": "./assets/icon.png"
}
```

**Acceptance:** `expo export --platform web` completes without error.

---

### Task 20-2 — Create `public/manifest.json`

**New file:** `apps/user-mobile-v2/public/manifest.json`

```json
{
  "name": "MyExpensio",
  "short_name": "Expensio",
  "description": "Expense tracking & claims — offline first",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#0f766e",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

**Also create:** `apps/user-mobile-v2/public/icons/` — resize `assets/icon.png` to 192×192 and 512×512 using sharp or squoosh. Both sizes must be square with teal background (`#0f766e`), icon centred with ~20% padding (maskable safe zone).

**Script to generate icons (run once):**
```bash
npx sharp-cli --input assets/icon.png --output public/icons/icon-192.png resize 192 192
npx sharp-cli --input assets/icon.png --output public/icons/icon-512.png resize 512 512
```

**Acceptance:** `manifest.json` accessible at `/manifest.json` after `expo export`. Both icon files load correctly in browser.

---

### Task 20-3 — Create `web/index.html` with iOS PWA meta tags

**New file:** `apps/user-mobile-v2/web/index.html`

Expo Metro picks up `web/index.html` automatically as the HTML shell for web builds.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

  <!-- PWA manifest -->
  <link rel="manifest" href="/manifest.json" />

  <!-- iOS PWA — must be present for Safari "Add to Home Screen" to work properly -->
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Expensio" />
  <link rel="apple-touch-icon" href="/icons/icon-192.png" />

  <!-- Splash screen for iPhone (iOS uses these when launching from Home Screen) -->
  <link rel="apple-touch-startup-image" href="/icons/icon-512.png" />

  <!-- Theme -->
  <meta name="theme-color" content="#0f766e" />
  <meta name="mobile-web-app-capable" content="yes" />

  <!-- Prevent phone-number auto-detection -->
  <meta name="format-detection" content="telephone=no" />

  <title>MyExpensio</title>
</head>
<body>
  <!-- Expo Metro injects the app bundle here -->
</body>
</html>
```

**Acceptance:** When opening the deployed URL on iPhone Safari, "Add to Home Screen" from the Share menu installs the app with the correct icon and name. Launch from Home Screen opens full-screen with no Safari chrome.

---

### Task 20-4 — Create service worker `public/sw.js`

**New file:** `apps/user-mobile-v2/public/sw.js`

Shell-caching strategy: cache the static app shell on install; serve from cache first; pass API/Supabase calls straight to network.

```js
const CACHE_NAME = "myexpensio-shell-v1";

// Files to precache on SW install — the app shell
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ── Install: cache the shell ─────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ── Activate: purge old caches ───────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first for API, cache-first for shell ──────────────────────
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Always go to network for: Supabase, sync API, auth
  const isApi =
    url.hostname.includes("supabase") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/");

  if (isApi || event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(
      (cached) => cached || fetch(event.request)
    )
  );
});

// ── Push notifications (Sprint 22) ──────────────────────────────────────────
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? "MyExpensio", {
      body: data.body ?? "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: data.url ? { url: data.url } : undefined,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(clients.openWindow(url));
});
```

**Acceptance:** SW registers in DevTools → Application → Service Workers. Manifest passes Lighthouse PWA audit (≥90 score).

---

### Task 20-5 — Register service worker in `App.tsx`

**File:** `apps/user-mobile-v2/App.tsx`  
**Change:** Add one `useEffect` near the top of the root component, after existing effects.

```ts
// Register PWA service worker on web
useEffect(() => {
  if (Platform.OS !== "web") return;
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker
    .register("/sw.js", { scope: "/" })
    .then((reg) => console.log("[sw] registered", reg.scope))
    .catch((err) => console.warn("[sw] registration failed", err));
}, []);
```

**Acceptance:** On first load, DevTools shows `sw.js` as active. On second load with network offline, the app shell still loads.

---

### Task 20-6 — Replace in-memory `database.web.ts` with OPFS-backed SQLite

This is the most important task in the sprint. Without it the PWA loses all local data on refresh.

**Install dependency:**
```bash
cd apps/user-mobile-v2
pnpm add @sqlite.org/sqlite-wasm
```

**File to rewrite:** `apps/user-mobile-v2/src/local-db/database.web.ts`

Strategy:
- Use `@sqlite.org/sqlite-wasm` with OPFS (`OpfsDb`) on iOS 17+ Safari
- Fall back to in-memory `DB` on iOS 16 or private browsing (acceptable — Supabase sync restores data on login)
- Wrap the sql.js DB to match the `expo-sqlite` interface that all 15 repositories use (`execAsync`, `runAsync`, `getFirstAsync`, `getAllAsync`, `withTransactionAsync`)

```ts
/**
 * database.web.ts — OPFS-backed SQLite for PWA.
 *
 * iOS 17+: data persists via Origin Private File System (real SQLite file).
 * iOS 16 / private browsing: in-memory fallback (data re-syncs from Supabase on login).
 *
 * Metro uses this file on web instead of database.ts (platform extension resolution).
 * All 15 repositories call getDatabase() — no changes needed there.
 */
import sqlite3InitModule, { type SAHPoolDatabase, type Database } from "@sqlite.org/sqlite-wasm";
import { localMigrations } from "@/local-db/migrations";
import { nowIso } from "@/utils/time";

type ExpoCompatDb = {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowId: number }>;
  getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
  getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>;
  withTransactionAsync(fn: () => Promise<void>): Promise<void>;
  closeAsync(): Promise<void>;
};

let dbPromise: Promise<ExpoCompatDb> | null = null;
let useOpfs = false;

function wrapDb(raw: SAHPoolDatabase | Database): ExpoCompatDb {
  return {
    async execAsync(sql) {
      raw.exec(sql);
    },
    async runAsync(sql, params = []) {
      raw.exec({ sql, bind: params as any });
      return { changes: raw.changes(), lastInsertRowId: Number(raw.lastInsertRowId) };
    },
    async getFirstAsync<T>(sql: string, params: unknown[] = []) {
      const rows: T[] = [];
      raw.exec({ sql, bind: params as any, rowMode: "object", resultRows: rows as any[] });
      return (rows[0] as T) ?? null;
    },
    async getAllAsync<T>(sql: string, params: unknown[] = []) {
      const rows: T[] = [];
      raw.exec({ sql, bind: params as any, rowMode: "object", resultRows: rows as any[] });
      return rows;
    },
    async withTransactionAsync(fn) {
      raw.exec("BEGIN;");
      try {
        await fn();
        raw.exec("COMMIT;");
      } catch (e) {
        raw.exec("ROLLBACK;");
        throw e;
      }
    },
    async closeAsync() {
      raw.close();
    },
  };
}

async function openDatabase(): Promise<ExpoCompatDb> {
  const sqlite3 = await sqlite3InitModule({ print: () => {}, printErr: console.error });

  let raw: SAHPoolDatabase | Database;

  if (sqlite3.oo1.OpfsDb) {
    try {
      // OPFS: persistent SQLite file in the browser's private file system
      raw = new sqlite3.oo1.OpfsDb("/myexpensio-v2.db");
      useOpfs = true;
      console.log("[db] OPFS SQLite ready — data persists across sessions");
    } catch {
      // OPFS unavailable (private browsing, iOS <17) — fall back to in-memory
      raw = new sqlite3.oo1.DB(":memory:", "c");
      console.warn("[db] OPFS unavailable — using in-memory SQLite (data syncs from Supabase on login)");
    }
  } else {
    raw = new sqlite3.oo1.DB(":memory:", "c");
    console.warn("[db] OPFS not supported in this browser — using in-memory SQLite");
  }

  const db = wrapDb(raw);
  await runMigrations(db);
  return db;
}

async function runMigrations(db: ExpoCompatDb): Promise<void> {
  // Ensure schema_migrations table exists first
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  for (const migration of localMigrations) {
    const existing = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM schema_migrations WHERE id = ?;",
      [migration.id]
    );
    if (existing) continue;

    for (const stmt of migration.statements) {
      await db.execAsync(stmt);
    }

    await db.runAsync(
      "INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?);",
      [migration.id, migration.name, nowIso()]
    );
  }
}

export function getDatabase(): Promise<ExpoCompatDb> {
  dbPromise ??= openDatabase();
  return dbPromise;
}

export async function wipeLocalDatabase(): Promise<void> {
  const db = await getDatabase();
  const tables = [
    "claims", "claim_items", "trips", "receipts",
    "tng_transactions", "tng_statement_batches",
    "ledger_entries", "commitments", "commitment_payments",
    "expenses", "export_jobs", "sync_queue", "sync_state",
    "spaces", "profiles_cache", "subscriptions_cache",
    "rate_versions_cache", "usage_counters_cache", "routes_cache",
  ];
  await db.withTransactionAsync(async () => {
    for (const t of tables) {
      await db.execAsync(`DELETE FROM ${t};`).catch(() => {});
    }
  });
  // If OPFS, close and reopen on next getDatabase() call
  dbPromise = null;
}

export async function initializeLocalDatabase(): Promise<void> {
  await getDatabase(); // migrations run inside openDatabase()
}

export { useOpfs };
```

**Note on WASM loading:** `@sqlite.org/sqlite-wasm` ships its `.wasm` file as a JS module asset. Metro already has `assetExts: ["wasm"]` configured — no further changes needed.

**Acceptance:**
- On iOS 17 Safari: open app, add an expense, close tab, reopen URL → expense is still there
- On iOS 16 Safari: app loads without crash; data syncs from Supabase after login
- All 15 repository files compile without changes

---

### Sprint 20 Exit Criteria

- [ ] App installs from Safari "Share → Add to Home Screen" with correct icon and name
- [ ] Installed PWA launches full-screen (no Safari URL bar)
- [ ] Lighthouse PWA score ≥ 90 on desktop Chrome
- [ ] iOS 17 Safari: data survives tab close + reopen
- [ ] iOS 16 Safari: app loads, no crash, Supabase sync restores data after login
- [ ] Service worker shown as active in DevTools

---

## Sprint 21 — PWA Polish
**Duration:** 1–2 days  
**Goal:** iPhone camera works correctly. Users are guided to install. Deployed to production URL.

---

### Task 21-1 — Fix receipt camera on web (iPhone Safari)

**File:** `apps/user-mobile-v2/src/components/ReceiptPickerField.tsx`

The existing web branch uses `pickFromGallery()` which calls `ImagePicker.launchImageLibraryAsync` — on iOS Safari this opens the Photo Library but doesn't directly trigger the camera. Replace with a direct `<input capture>` approach for the "Camera" action on web.

Add a web-only camera picker function above the existing functions:

```ts
async function pickFromCameraWeb(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment"; // rear camera on iOS Safari
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) ?? null);
      reader.readAsDataURL(file);
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}
```

Update the `handlePress` web branch in the component:

```ts
if (Platform.OS === "web") {
  // On web: show camera vs library choice using native browser inputs
  Alert.alert("Attach Receipt", "Choose a source", [
    {
      text: canScan ? "📷 Camera" : "📷 Camera (PRO)",
      onPress: () => {
        if (!canScan) {
          Alert.alert("PRO Feature", "Camera scanning requires a PRO subscription.");
          return;
        }
        pickFromCameraWeb().then((uri) => { if (uri) onChange(uri); });
      },
    },
    {
      text: "🖼  Photo Library",
      onPress: () => pickFromGallery().then((uri) => { if (uri) onChange(uri); }),
    },
    { text: "Cancel", style: "cancel" },
  ]);
  return;
}
```

**Acceptance:** On installed PWA on iPhone Safari, tapping "Attach Receipt → Camera" opens the device camera directly. "Photo Library" opens the photo picker.

---

### Task 21-2 — Add "Add to Home Screen" install banner

iOS Safari does not fire `beforeinstallprompt` — there is no automatic install prompt. Users must be explicitly guided.

**New file:** `apps/user-mobile-v2/src/components/PwaInstallBanner.tsx`

```tsx
import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

const STORAGE_KEY = "pwa_install_banner_dismissed";

function isIosSafariNotInstalled(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/.test(ua);
  const isSafari = /WebKit/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    || (navigator as any).standalone === true;
  return isIos && isSafari && !isStandalone;
}

export function PwaInstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (!isIosSafariNotInstalled()) return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>📲</Text>
      <View style={styles.textBlock}>
        <Text style={styles.title}>Install MyExpensio</Text>
        <Text style={styles.body}>
          Tap <Text style={styles.bold}>Share</Text> ↑ then{" "}
          <Text style={styles.bold}>Add to Home Screen</Text>
        </Text>
      </View>
      <Pressable onPress={dismiss} style={styles.close} hitSlop={12}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: "#0f766e",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 9999,
  },
  icon: { fontSize: 24 },
  textBlock: { flex: 1 },
  title: { color: "#fff", fontWeight: "700", fontSize: 14 },
  body: { color: "#ccfbf1", fontSize: 12, marginTop: 2 },
  bold: { fontWeight: "700", color: "#fff" },
  close: { paddingLeft: 8 },
  closeText: { color: "#a7f3d0", fontSize: 16 },
});
```

**Mount in `App.tsx`** — add `<PwaInstallBanner />` just before the closing `</SafeAreaProvider>` tag.

**Acceptance:** On iPhone Safari (not installed), banner appears at bottom of screen. Tapping ✕ dismisses it permanently (localStorage flag set). Banner does not appear after install.

---

### Task 21-3 — Vercel deployment config

**New file:** `apps/user-mobile-v2/vercel.json`

```json
{
  "buildCommand": "expo export --platform web",
  "outputDirectory": "dist",
  "routes": [
    {
      "src": "/sw.js",
      "headers": { "Service-Worker-Allowed": "/" },
      "dest": "/sw.js"
    },
    {
      "src": "/manifest.json",
      "headers": { "Content-Type": "application/manifest+json" },
      "dest": "/manifest.json"
    },
    {
      "src": "/icons/(.*)",
      "dest": "/icons/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" },
        { "key": "Service-Worker-Allowed", "value": "/" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

**Required Vercel env vars for the PWA project:**
```
EXPO_PUBLIC_SUPABASE_URL=<production supabase URL>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<production anon key>
EXPO_PUBLIC_API_BASE_URL=https://myexpensio-jade.vercel.app
```

**Acceptance:** `vercel --prod` from `apps/user-mobile-v2` deploys successfully. `/sw.js` returns with `Service-Worker-Allowed: /` header. SPA routing (`/`) works on refresh.

---

### Task 21-4 — Add `export:web` script to `package.json`

**File:** `apps/user-mobile-v2/package.json`

Add to `scripts`:
```json
"export:web": "expo export --platform web",
"preview:web": "serve dist"
```

Add to devDependencies:
```json
"serve": "^14.0.0"
```

**Acceptance:** `pnpm export:web && pnpm preview:web` serves the built PWA locally for pre-deploy testing.

---

### Sprint 21 Exit Criteria

- [ ] iPhone camera opens directly when "Camera" is selected in receipt picker (installed PWA)
- [ ] Install banner appears on first visit from iPhone Safari, dismissed permanently after tap
- [ ] `vercel.json` deploys with correct headers; SPA routing works on hard refresh
- [ ] Lighthouse PWA audit passes on deployed URL (installable + service worker + HTTPS)

---

## Sprint 22 — PWA Advanced
**Duration:** 2 days  
**Goal:** Push notifications for claim status. Face ID login via WebAuthn. Optional — only if Sprint 20+21 are stable in UAT.

---

### Task 22-1 — WebAuthn biometric login (Face ID on PWA)

Metro resolves `.web.ts` over `.ts` — so a new `biometricAuth.web.ts` file will be used automatically on web without touching the native adapter.

**New file:** `apps/user-mobile-v2/src/features/auth/biometricAuth.web.ts`

```ts
/**
 * Web biometric adapter using WebAuthn (Platform Authenticator).
 * On iPhone PWA: triggers Face ID via the browser's credential API.
 * Requires HTTPS. Falls back gracefully if unavailable.
 *
 * Metro picks this file on web instead of biometricAuth.ts.
 */
import type { BiometricAuthAdapter, BiometricAvailability } from "./biometricAuth";

const CREDENTIAL_ID_KEY = "myexpensio_webauthn_credential_id";
const RP_ID = typeof window !== "undefined" ? window.location.hostname : "localhost";
const RP_NAME = "MyExpensio";

async function isAvailable(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false;
  return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
}

async function getStoredCredentialId(): Promise<Uint8Array | null> {
  const stored = localStorage.getItem(CREDENTIAL_ID_KEY);
  if (!stored) return null;
  const bytes = atob(stored).split("").map((c) => c.charCodeAt(0));
  return new Uint8Array(bytes);
}

async function storeCredentialId(id: ArrayBuffer): Promise<void> {
  const bytes = Array.from(new Uint8Array(id));
  localStorage.setItem(CREDENTIAL_ID_KEY, btoa(String.fromCharCode(...bytes)));
}

export const nativeBiometricAuthAdapter: BiometricAuthAdapter = {
  async getAvailability(): Promise<BiometricAvailability> {
    const available = await isAvailable();
    if (!available) return { available: false, reason: "WebAuthn platform authenticator not available." };
    return { available: true };
  },

  async authenticate(): Promise<boolean> {
    try {
      const credentialId = await getStoredCredentialId();

      if (!credentialId) {
        // First time: register a new credential (creates Face ID entry)
        const credential = await navigator.credentials.create({
          publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            rp: { id: RP_ID, name: RP_NAME },
            user: {
              id: crypto.getRandomValues(new Uint8Array(16)),
              name: "user@myexpensio",
              displayName: "MyExpensio User",
            },
            pubKeyCredParams: [{ alg: -7, type: "public-key" }], // ES256
            authenticatorSelection: {
              authenticatorAttachment: "platform", // device biometric only
              userVerification: "required",
            },
            timeout: 60000,
          },
        }) as PublicKeyCredential | null;

        if (!credential) return false;
        await storeCredentialId(credential.rawId);
        return true;
      }

      // Subsequent: verify with existing credential
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rpId: RP_ID,
          allowCredentials: [{ id: credentialId, type: "public-key" }],
          userVerification: "required",
          timeout: 60000,
        },
      });

      return assertion !== null;
    } catch {
      return false;
    }
  },
};

export const unsupportedBiometricAuthAdapter: BiometricAuthAdapter = {
  async authenticate() { return false; },
  async getAvailability() {
    return { available: false, reason: "Biometrics not supported on this platform." };
  },
};
```

**Acceptance:** On installed PWA on iPhone iOS 17+, biometric auth prompt shows Face ID dialog. Returns `true` on successful scan. Returns `false` on cancel without crashing.

---

### Task 22-2 — Web Push notifications (claim approved / report ready)

**Substep A — Generate VAPID keys (one-time setup):**
```bash
npx web-push generate-vapid-keys
```
Store in Vercel env vars:
```
EXPO_PUBLIC_VAPID_PUBLIC_KEY=<public key>
VAPID_PRIVATE_KEY=<private key>      # server-side only, never in EXPO_PUBLIC_
VAPID_SUBJECT=mailto:myeffort.studio@gmail.com
```

**Substep B — Push subscription hook**

**New file:** `apps/user-mobile-v2/src/features/notifications/usePushSubscription.ts`

```ts
import { useEffect } from "react";
import { Platform } from "react-native";

const VAPID_PUBLIC_KEY = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushSubscription(userId: string | null) {
  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (!userId) return;
    if (!("PushManager" in window)) return; // not supported (iOS <16.4 or non-PWA Safari)
    if (!("serviceWorker" in navigator)) return;

    async function subscribe() {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) return; // already subscribed

      try {
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        // Send subscription to your API for storage against userId
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, subscription: sub.toJSON() }),
        });
      } catch (err) {
        // User denied permission or browser doesn't support — silent fail
        console.log("[push] subscription skipped:", err);
      }
    }

    subscribe();
  }, [userId]);
}
```

**Substep C — API route to store subscription**

**New file:** `apps/user/src/app/api/push/subscribe/route.ts` (in the User Next.js app, not user-mobile-v2)

```ts
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { userId, subscription } = await req.json();
  if (!userId || !subscription) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const supabase = createServiceClient();
  await supabase.from("push_subscriptions").upsert({
    user_id: userId,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    updated_at: new Date().toISOString(),
  }, { onConflict: "endpoint" });

  return NextResponse.json({ ok: true });
}
```

**Substep D — DB migration for push subscriptions**

**New migration:** `supabase/migrations/YYYYMMDDHHMMSS_add_push_subscriptions.sql`

```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
-- Only server-side service role can read/write
```

**Substep E — Send push from Supabase Edge Function (claim approved)**

Trigger: when a claim transitions to `approved` status, send a push notification to the claimant.

**New file:** `supabase/functions/notify-claim-approved/index.ts`

```ts
import webPush from "npm:web-push";

webPush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT")!,
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!
);

Deno.serve(async (req) => {
  const { claim_id, user_id, claim_title } = await req.json();

  const { data: subs } = await supabaseAdmin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", user_id);

  if (!subs?.length) return new Response("no subscribers", { status: 200 });

  const payload = JSON.stringify({
    title: "Claim Approved ✓",
    body: `Your claim "${claim_title}" has been approved.`,
    url: `/claims`,
  });

  await Promise.allSettled(
    subs.map((sub) =>
      webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  );

  return new Response("sent", { status: 200 });
});
```

**Mount hook in `App.tsx`:** `usePushSubscription(currentUser?.id ?? null)` near the top of the authenticated shell.

**Acceptance:**
- On iOS 16.4+ PWA (installed): permission dialog appears after login
- When a claim is approved in Admin app, push notification appears on iPhone lock screen
- Tapping notification opens the app to `/claims`
- On iOS <16.4: no prompt, no error

---

### Sprint 22 Exit Criteria

- [ ] Face ID triggers on PWA login screen on iOS 17+ Safari
- [ ] Push notification received on iPhone lock screen when claim is approved
- [ ] No crash or console error on iOS <16.4 (graceful degradation)
- [ ] `push_subscriptions` migration applied to production Supabase

---

## Full Task Summary

| Sprint | Task | File(s) | Effort |
|--------|------|---------|--------|
| 20 | 20-1 PWA config in app.json | `app.json` | 0.5h |
| 20 | 20-2 manifest.json + icons | `public/manifest.json`, `public/icons/` | 1h |
| 20 | 20-3 iOS meta tags in index.html | `web/index.html` (new) | 0.5h |
| 20 | 20-4 Service worker | `public/sw.js` (new) | 1h |
| 20 | 20-5 Register SW in App.tsx | `App.tsx` | 0.25h |
| 20 | **20-6 OPFS database.web.ts** | `src/local-db/database.web.ts` | **4h** |
| 21 | 21-1 Camera `capture` on web | `src/components/ReceiptPickerField.tsx` | 1h |
| 21 | 21-2 Install banner | `src/components/PwaInstallBanner.tsx` (new) + `App.tsx` | 1.5h |
| 21 | 21-3 Vercel config | `vercel.json` (new) | 0.5h |
| 21 | 21-4 Export scripts | `package.json` | 0.25h |
| 22 | 22-1 WebAuthn biometric | `src/features/auth/biometricAuth.web.ts` (new) | 3h |
| 22 | 22-2 Web Push (full stack) | Hook + API route + DB migration + Edge Function | **5h** |
| **Total** | | | **~18h** |

Sprint 20+21 = ~10h (~2 days) → usable PWA  
Sprint 22 = ~8h (~1.5–2 days) → full-featured PWA

---

## iOS Compatibility Matrix

| Feature | iOS 16.0–16.3 | iOS 16.4–16.x | iOS 17+ |
|---------|--------------|--------------|---------|
| Install to Home Screen | ✅ | ✅ | ✅ |
| Full-screen standalone | ✅ | ✅ | ✅ |
| OPFS persistent SQLite | ❌ in-memory | ❌ in-memory | ✅ |
| Web Push notifications | ❌ | ✅ (installed PWA only) | ✅ |
| Face ID (WebAuthn) | ✅ | ✅ | ✅ |
| Camera capture input | ✅ | ✅ | ✅ |

**Minimum viable install:** iOS 16.0  
**Recommended for best UX:** iOS 17+
