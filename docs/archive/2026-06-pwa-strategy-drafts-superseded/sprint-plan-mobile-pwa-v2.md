# Sprint Plan — Mobile (Android Fix + PWA Upgrade)
**Date:** 2026-06-10  
**Track:** `apps/user-mobile-v2`  
**Sprints:** 20 · 21 · 22 · 23  
**Goal:** Fix broken Android EAS build → ship Android APK → add iPhone PWA from the same codebase (Option B)

---

## Android Build Failure — Root Cause Analysis

The EAS build fails at the "Run gradlew" phase with an "unknown error." Based on the codebase audit, there are **three compounding causes**:

### Cause 1 — Gradle 8.13 is too new (primary cause)
`android/gradle/wrapper/gradle-wrapper.properties` specifies:
```
distributionUrl=https\://services.gradle.org/distributions/gradle-8.13-bin.zip
```
Expo 56 / React Native 0.85.3 was built and tested against **Gradle 8.6–8.8**. Gradle 8.13 (released 2025) introduced breaking changes in configuration cache and plugin resolution. The `expo-root-project` and `com.facebook.react.rootproject` plugins fail silently under 8.13, which means `rootProject.ext.ndkVersion`, `rootProject.ext.compileSdkVersion`, etc. are never set — causing a cascade of `NullPointerException` errors that Gradle reports as "unknown error."

### Cause 2 — pnpm monorepo not configured for EAS Cloud
The `eas.json` sits inside `apps/user-mobile-v2/` but has zero monorepo configuration. EAS Cloud uses `npm install` by default. For a `pnpm` workspace monorepo:
- EAS needs to install from the **workspace root** (`/`) not from `apps/user-mobile-v2/`
- Without this, `node --print require.resolve('react-native/package.json')` calls in `settings.gradle` fail because packages aren't found in the expected paths
- No `PNPM_HOME`, no custom install command, no `"packageManager"` declaration sent to EAS

### Cause 3 — No production signing credentials
The `production` profile uses `"distribution": "store"` + `"buildType": "app-bundle"` but `app/build.gradle` signs with `signingConfigs.debug` (debug.keystore). EAS will either fail the build or produce an unsigned bundle that Google Play rejects. Managed EAS credentials (auto-generated keystore) need to be explicitly enabled.

---

## Sprint 20 — Fix Android EAS Build
**Duration:** 1 day  
**Goal:** Green EAS build for `preview` profile (APK). Production AAB in Sprint 21 after credentials are set up.

---

### Task 20-1 — Downgrade Gradle to 8.8

**File:** `apps/user-mobile-v2/android/gradle/wrapper/gradle-wrapper.properties`

Change:
```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.13-bin.zip
```
To:
```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.8-bin.zip
```

This is the Gradle version Expo 56 / RN 0.85 is validated against. No other file changes needed — the `build.gradle` files are version-agnostic.

**Acceptance:** Local `./gradlew --version` from `android/` returns `8.8`.

---

### Task 20-2 — Configure pnpm monorepo for EAS

This is the most impactful fix. EAS needs to know: (a) use pnpm, (b) install from workspace root, (c) the app lives in a subdirectory.

**File:** `apps/user-mobile-v2/eas.json` — add monorepo and pnpm config:

```json
{
  "cli": {
    "version": ">= 14.0.0",
    "appVersionSource": "local"
  },
  "build": {
    "base": {
      "node": "22.0.0",
      "env": {
        "APP_ENV": "production",
        "EXPO_PUBLIC_SUPABASE_URL": "",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "",
        "EXPO_PUBLIC_API_BASE_URL": "https://myexpensio-jade.vercel.app"
      }
    },
    "development": {
      "extends": "base",
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "APP_ENV": "development"
      },
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleDebug"
      }
    },
    "preview": {
      "extends": "base",
      "distribution": "internal",
      "env": {
        "APP_ENV": "preview"
      },
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    },
    "production": {
      "extends": "base",
      "distribution": "store",
      "env": {
        "APP_ENV": "production"
      },
      "android": {
        "buildType": "app-bundle",
        "gradleCommand": ":app:bundleRelease"
      },
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

**New file:** `apps/user-mobile-v2/.npmrc`
```
node-linker=hoisted
shamefully-hoist=true
```

This ensures pnpm flattens `node_modules` in a way that makes `require.resolve()` calls in `settings.gradle` work correctly — same behaviour as npm/yarn hoisting that EAS expects.

**Also required — set pnpm version in `package.json`** at workspace root. Confirm it's already set (it is: `"packageManager": "pnpm@10.30.3"`). EAS detects `packageManager` field and switches to pnpm automatically when `corepack` is available.

**Set secret env vars in EAS dashboard** for production:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**Acceptance:** `eas build --profile preview --platform android` completes with green build. APK installs on a test device.

---

### Task 20-3 — Set up EAS managed credentials (Android keystore)

EAS can auto-generate and manage the release keystore. Run once locally:

```bash
cd apps/user-mobile-v2
eas credentials
# Select: Android → production → Set up a new keystore → Let EAS generate
```

This uploads a managed keystore to Expo's servers and links it to your EAS project. Future builds automatically sign with it. You never handle the `.jks` file manually.

**Then update `app/build.gradle` release signing** to use EAS-provided credentials — EAS injects the keystore automatically when `credentialsSource` is remote. No `build.gradle` change needed; EAS handles it via environment injection.

**Acceptance:** `eas build --profile production --platform android` produces a signed `.aab` file. Verify via `apksigner verify`.

---

### Task 20-4 — Reduce build architectures for faster CI

**File:** `apps/user-mobile-v2/android/gradle.properties`

For `preview` (APK for testing), build arm64 only — removes 3 architectures and cuts build time ~60%:

```properties
# For production app-bundle, EAS overrides this automatically for all archs
# For preview APK builds, arm64-v8a covers all modern Android devices
reactNativeArchitectures=arm64-v8a
```

**Note:** For `production` app-bundle, Google Play rebuilds per-architecture anyway — the full `armeabi-v7a,arm64-v8a,x86,x86_64` setting is correct for AAB and can be kept for that profile via an env override in `eas.json`.

**Acceptance:** Preview APK build time drops from ~15 min to ~6 min.

---

### Task 20-5 — Verify patches apply correctly in EAS

The repo has two patches:
- `expo-location@18.0.7.patch`
- `react-native-safe-area-context@4.14.1.patch`

pnpm applies patches automatically via `pnpm.patchedDependencies` in `package.json`. Confirm this is present:

```bash
cat /path/to/myexpensio/package.json | grep -A10 '"patchedDependencies"'
```

If missing, add:
```json
"pnpm": {
  "patchedDependencies": {
    "expo-location@18.0.7": "patches/expo-location@18.0.7.patch",
    "react-native-safe-area-context@4.14.1": "patches/react-native-safe-area-context@4.14.1.patch"
  }
}
```

EAS runs `pnpm install` which applies patches. Without this, the patched packages install unpatched on cloud builds, potentially causing runtime errors.

**Acceptance:** `pnpm install` output shows "Applying patch..." for both packages. No patch errors in EAS build log.

---

### Sprint 20 Exit Criteria

- [ ] `eas build --profile preview --platform android` → green, APK installs
- [ ] `eas build --profile production --platform android` → signed AAB produced
- [ ] Gradle 8.8 confirmed in build logs
- [ ] Both patches applied in EAS build logs
- [ ] APK tested on physical Android device (login, create expense, sync)

---

## Sprint 21 — PWA Foundation (iPhone installable)
**Duration:** 2 days  
**Goal:** `expo export --platform web` produces a fully installable PWA. Deployed to Vercel. iPhone Safari "Add to Home Screen" works.

---

### Task 21-1 — Update `app.json` web section

**File:** `apps/user-mobile-v2/app.json`

Replace the existing minimal `"web"` block:
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
  "lang": "en",
  "favicon": "./assets/icon.png"
}
```

---

### Task 21-2 — Create `public/manifest.json` and icons

**New folder:** `apps/user-mobile-v2/public/`  
**New file:** `apps/user-mobile-v2/public/manifest.json`

```json
{
  "name": "MyExpensio",
  "short_name": "Expensio",
  "description": "Expense tracking & claims management",
  "start_url": "/",
  "scope": "/",
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

**Generate icons** from `assets/icon.png` (run once):
```bash
npx sharp-cli --input assets/icon.png --output public/icons/icon-192.png resize 192 192
npx sharp-cli --input assets/icon.png --output public/icons/icon-512.png resize 512 512
```

---

### Task 21-3 — Create `web/index.html` with iOS meta tags

**New file:** `apps/user-mobile-v2/web/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <link rel="manifest" href="/manifest.json" />

  <!-- iOS PWA: required for proper "Add to Home Screen" behaviour -->
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Expensio" />
  <link rel="apple-touch-icon" href="/icons/icon-192.png" />
  <link rel="apple-touch-startup-image" href="/icons/icon-512.png" />

  <meta name="theme-color" content="#0f766e" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="format-detection" content="telephone=no" />
  <title>MyExpensio</title>
</head>
<body></body>
</html>
```

---

### Task 21-4 — Create service worker `public/sw.js`

**New file:** `apps/user-mobile-v2/public/sw.js`

```js
const CACHE = "myexpensio-shell-v1";
const PRECACHE = ["/", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", e =>
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)))
);
self.skipWaiting();

self.addEventListener("activate", e =>
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
);
self.clients.claim();

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  const isApi = url.hostname.includes("supabase") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/");
  if (isApi || e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// Push handler — wired up in Sprint 23
self.addEventListener("push", e => {
  const data = e.data?.json() ?? {};
  e.waitUntil(
    self.registration.showNotification(data.title ?? "MyExpensio", {
      body: data.body ?? "",
      icon: "/icons/icon-192.png",
      data: data.url ? { url: data.url } : undefined,
    })
  );
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data?.url ?? "/"));
});
```

**Register in `App.tsx`** — add inside the root component (after existing `useEffect` calls):
```ts
useEffect(() => {
  if (Platform.OS !== "web" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js", { scope: "/" })
    .catch(err => console.warn("[sw] registration failed", err));
}, []);
```

---

### Task 21-5 — Replace in-memory `database.web.ts` with OPFS-backed SQLite

**Install:**
```bash
cd apps/user-mobile-v2
pnpm add @sqlite.org/sqlite-wasm
```

**Rewrite `apps/user-mobile-v2/src/local-db/database.web.ts`:**

```ts
/**
 * database.web.ts — OPFS-backed SQLite for web/PWA builds.
 * Metro resolves this file instead of database.ts on web (platform extension).
 *
 * iOS 17+ / Chrome 119+: data persists via OPFS (real SQLite file in browser).
 * iOS 16 / private browsing: in-memory fallback (Supabase sync restores data on login).
 *
 * All 15 repositories use getDatabase() — no changes required there.
 */
import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import { localMigrations } from "@/local-db/migrations";
import { nowIso } from "@/utils/time";

type Row = Record<string, unknown>;

type ExpoCompatDb = {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowId: number }>;
  getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
  getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>;
  withTransactionAsync(fn: () => Promise<void>): Promise<void>;
  closeAsync(): Promise<void>;
};

function wrapSqlJs(raw: any): ExpoCompatDb {
  return {
    async execAsync(sql) { raw.exec(sql); },
    async runAsync(sql, params = []) {
      raw.exec({ sql, bind: params });
      return { changes: raw.changes(), lastInsertRowId: Number(raw.lastInsertRowId) };
    },
    async getFirstAsync<T>(sql: string, params: unknown[] = []) {
      const rows: T[] = [];
      raw.exec({ sql, bind: params, rowMode: "object", resultRows: rows });
      return (rows[0] as T) ?? null;
    },
    async getAllAsync<T>(sql: string, params: unknown[] = []) {
      const rows: T[] = [];
      raw.exec({ sql, bind: params, rowMode: "object", resultRows: rows });
      return rows;
    },
    async withTransactionAsync(fn) {
      raw.exec("BEGIN;");
      try { await fn(); raw.exec("COMMIT;"); }
      catch (e) { raw.exec("ROLLBACK;"); throw e; }
    },
    async closeAsync() { raw.close(); },
  };
}

async function runMigrations(db: ExpoCompatDb) {
  await db.execAsync(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL
  );`);
  for (const m of localMigrations) {
    const exists = await db.getFirstAsync<Row>(
      "SELECT id FROM schema_migrations WHERE id = ?;", [m.id]
    );
    if (exists) continue;
    for (const stmt of m.statements) await db.execAsync(stmt);
    await db.runAsync(
      "INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?);",
      [m.id, m.name, nowIso()]
    );
  }
}

let dbPromise: Promise<ExpoCompatDb> | null = null;

async function openDatabase(): Promise<ExpoCompatDb> {
  const sqlite3 = await sqlite3InitModule({ print: () => {}, printErr: console.error });
  let raw: any;

  if (sqlite3.oo1.OpfsDb) {
    try {
      raw = new sqlite3.oo1.OpfsDb("/myexpensio-v2.db");
      console.log("[db] OPFS SQLite — persistent across sessions");
    } catch {
      raw = new sqlite3.oo1.DB(":memory:", "c");
      console.warn("[db] OPFS unavailable — in-memory fallback (data syncs from Supabase on login)");
    }
  } else {
    raw = new sqlite3.oo1.DB(":memory:", "c");
    console.warn("[db] OPFS not supported — in-memory fallback");
  }

  const db = wrapSqlJs(raw);
  await runMigrations(db);
  return db;
}

export function getDatabase(): Promise<ExpoCompatDb> {
  dbPromise ??= openDatabase();
  return dbPromise;
}

export async function wipeLocalDatabase(): Promise<void> {
  const db = await getDatabase();
  const tables = [
    "claims","claim_items","trips","receipts","tng_transactions",
    "tng_statement_batches","ledger_entries","commitments","commitment_payments",
    "expenses","export_jobs","sync_queue","sync_state","spaces",
    "profiles_cache","subscriptions_cache","rate_versions_cache",
    "usage_counters_cache","routes_cache",
  ];
  await db.withTransactionAsync(async () => {
    for (const t of tables) await db.execAsync(`DELETE FROM ${t};`).catch(() => {});
  });
  dbPromise = null;
}

export async function initializeLocalDatabase(): Promise<void> {
  await getDatabase();
}
```

**Why no other files change:** All 15 repositories import `getDatabase` from `@/local-db/database`. Metro resolves `database.web.ts` on web automatically. The returned object has the same `execAsync / runAsync / getFirstAsync / getAllAsync / withTransactionAsync` interface.

---

### Task 21-6 — Add Vercel deployment config

**New file:** `apps/user-mobile-v2/vercel.json`

```json
{
  "buildCommand": "expo export --platform web",
  "outputDirectory": "dist",
  "routes": [
    { "src": "/sw.js", "headers": { "Service-Worker-Allowed": "/" }, "dest": "/sw.js" },
    { "src": "/manifest.json", "headers": { "Content-Type": "application/manifest+json" }, "dest": "/manifest.json" },
    { "src": "/icons/(.*)", "dest": "/icons/$1" },
    { "src": "/(.*)", "dest": "/index.html" }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" },
        { "key": "Service-Worker-Allowed", "value": "/" }
      ]
    }
  ]
}
```

**Add to `package.json` scripts:**
```json
"export:web": "expo export --platform web",
"preview:web": "npx serve dist"
```

---

### Sprint 21 Exit Criteria

- [ ] `pnpm export:web` completes without error
- [ ] Deployed to Vercel — URL accessible over HTTPS
- [ ] iPhone Safari "Share → Add to Home Screen" installs app with correct icon + name
- [ ] Installed PWA launches full-screen (no Safari chrome)
- [ ] iOS 17: data persists after closing and reopening the PWA
- [ ] iOS 16: app loads, no crash, data syncs from Supabase after login
- [ ] Lighthouse PWA score ≥ 90

---

## Sprint 22 — PWA Polish
**Duration:** 1 day  
**Goal:** Receipt camera works on iPhone PWA. Android Chrome install prompt works. Users guided to install.

---

### Task 22-1 — Fix receipt camera for web (iPhone + Android)

**File:** `apps/user-mobile-v2/src/components/ReceiptPickerField.tsx`

The current web branch calls `pickFromGallery()` which on iOS Safari opens the Photo Library without offering the camera. Replace with a direct `<input capture>` trigger:

Add above existing picker functions:
```ts
async function pickFromCameraWeb(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment"; // triggers rear camera on iOS/Android
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = e => resolve((e.target?.result as string) ?? null);
      reader.readAsDataURL(file);
    };
    input.click();
  });
}
```

Replace the web branch of `handlePress`:
```ts
if (Platform.OS === "web") {
  Alert.alert("Attach Receipt", "Choose a source", [
    {
      text: canScan ? "📷 Camera" : "📷 Camera (PRO)",
      onPress: () => {
        if (!canScan) {
          Alert.alert("PRO Feature", "Camera scanning requires a PRO subscription.");
          return;
        }
        pickFromCameraWeb().then(uri => { if (uri) onChange(uri); });
      },
    },
    {
      text: "🖼  Photo Library",
      onPress: () => pickFromGallery().then(uri => { if (uri) onChange(uri); }),
    },
    { text: "Cancel", style: "cancel" },
  ]);
  return;
}
```

---

### Task 22-2 — Add install banner (iOS + Android)

**New file:** `apps/user-mobile-v2/src/components/PwaInstallBanner.tsx`

Handles two cases:
- **iOS Safari**: no auto-prompt exists — show manual "Share → Add to Home Screen" guide
- **Android Chrome**: intercept `beforeinstallprompt` and show a native-style button

```tsx
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

const DISMISSED_KEY = "pwa_banner_dismissed_v1";

function isAlreadyInstalled() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(display-mode: standalone)").matches
    || (navigator as any).standalone === true;
}

export function PwaInstallBanner() {
  const [show, setShow] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const deferredPrompt = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (isAlreadyInstalled()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua) && /WebKit/.test(ua) && !/CriOS|FxiOS/.test(ua);
    setIsIos(ios);

    if (ios) {
      setShow(true);
      return;
    }

    // Android Chrome: capture the install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!show) return null;

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
  }

  async function install() {
    if (deferredPrompt.current) {
      deferredPrompt.current.prompt();
      await deferredPrompt.current.userChoice;
      deferredPrompt.current = null;
    }
    dismiss();
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>📲</Text>
      <View style={styles.textBlock}>
        <Text style={styles.title}>Install MyExpensio</Text>
        {isIos
          ? <Text style={styles.body}>Tap <Text style={styles.bold}>Share ↑</Text> → <Text style={styles.bold}>Add to Home Screen</Text></Text>
          : <Text style={styles.body}>Get the full app experience — works offline</Text>
        }
      </View>
      {!isIos && (
        <Pressable onPress={install} style={styles.installBtn}>
          <Text style={styles.installBtnText}>Install</Text>
        </Pressable>
      )}
      <Pressable onPress={dismiss} style={styles.close} hitSlop={12}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute", bottom: 24, left: 16, right: 16,
    backgroundColor: "#0f766e", borderRadius: 14,
    flexDirection: "row", alignItems: "center",
    padding: 14, gap: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6, zIndex: 9999,
  },
  icon: { fontSize: 22 },
  textBlock: { flex: 1 },
  title: { color: "#fff", fontWeight: "700", fontSize: 14 },
  body: { color: "#ccfbf1", fontSize: 12, marginTop: 2 },
  bold: { fontWeight: "700", color: "#fff" },
  installBtn: { backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  installBtnText: { color: "#0f766e", fontWeight: "700", fontSize: 13 },
  close: { paddingLeft: 4 },
  closeText: { color: "#a7f3d0", fontSize: 16 },
});
```

**Mount in `App.tsx`** — add `<PwaInstallBanner />` just before `</SafeAreaProvider>`.

---

### Sprint 22 Exit Criteria

- [ ] On installed iPhone PWA: "Camera" taps open rear camera directly
- [ ] On Android Chrome (not installed): install banner appears and "Install" button triggers native Chrome install prompt
- [ ] On iOS Safari (not installed): banner shows "Share → Add to Home Screen" instruction
- [ ] Banner does not appear after install (standalone mode detected)
- [ ] Dismissed banner stays dismissed (localStorage flag)

---

## Sprint 23 — PWA Advanced (Optional, post-UAT)
**Duration:** 2 days  
**Goal:** Face ID login on iPhone PWA. Push notifications for claim approval events.  
**Dependency:** Sprints 21–22 stable in UAT first.

---

### Task 23-1 — WebAuthn Face ID for web

**New file:** `apps/user-mobile-v2/src/features/auth/biometricAuth.web.ts`

Metro automatically resolves `.web.ts` over `.ts` — no imports need to change.

```ts
import type { BiometricAuthAdapter, BiometricAvailability } from "./biometricAuth";

const RP_ID = typeof window !== "undefined" ? window.location.hostname : "localhost";
const CRED_KEY = "myexpensio_webauthn_cred_id";

function b64ToUint8(b64: string) {
  return new Uint8Array(atob(b64).split("").map(c => c.charCodeAt(0)));
}
function uint8ToB64(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

export const nativeBiometricAuthAdapter: BiometricAuthAdapter = {
  async getAvailability(): Promise<BiometricAvailability> {
    if (!window.PublicKeyCredential) return { available: false, reason: "WebAuthn not supported" };
    const ok = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return ok ? { available: true } : { available: false, reason: "No platform authenticator" };
  },

  async authenticate(): Promise<boolean> {
    try {
      const storedId = localStorage.getItem(CRED_KEY);

      if (!storedId) {
        const cred = await navigator.credentials.create({
          publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            rp: { id: RP_ID, name: "MyExpensio" },
            user: { id: crypto.getRandomValues(new Uint8Array(16)), name: "user", displayName: "User" },
            pubKeyCredParams: [{ alg: -7, type: "public-key" }],
            authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
            timeout: 60000,
          },
        }) as PublicKeyCredential | null;

        if (!cred) return false;
        localStorage.setItem(CRED_KEY, uint8ToB64(cred.rawId));
        return true;
      }

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rpId: RP_ID,
          allowCredentials: [{ id: b64ToUint8(storedId), type: "public-key" }],
          userVerification: "required",
          timeout: 60000,
        },
      });
      return assertion !== null;
    } catch { return false; }
  },
};

export const unsupportedBiometricAuthAdapter = nativeBiometricAuthAdapter;
```

---

### Task 23-2 — Web Push notifications

Full stack: VAPID key generation → subscription hook → API storage route → Supabase Edge Function trigger on claim approval.

Key files:
- `apps/user-mobile-v2/src/features/notifications/usePushSubscription.ts` — subscribe after login, POST to API
- `apps/user/src/app/api/push/subscribe/route.ts` — store subscription in `push_subscriptions` table
- `supabase/migrations/YYYYMMDDHHMMSS_add_push_subscriptions.sql` — new table
- `supabase/functions/notify-claim-approved/index.ts` — Edge Function that fires on claim status change

Refer to `docs/pwa-strategy-user-mobile-v2.md` for full code for each of these files.

**iOS 16.4+ only.** Silent fail on older iOS.

---

### Sprint 23 Exit Criteria

- [ ] On iOS 17+ installed PWA: biometric prompt triggers Face ID on login screen
- [ ] On iOS 16.4+ installed PWA: push notification received on lock screen when claim approved
- [ ] No error or crash on iOS <16.4

---

## Full Task & Effort Summary

| Sprint | Task | File(s) Changed | Est. |
|--------|------|-----------------|------|
| **20** | Downgrade Gradle 8.13 → 8.8 | `gradle-wrapper.properties` | 15m |
| **20** | pnpm monorepo EAS config | `eas.json`, `.npmrc` | 1h |
| **20** | EAS managed credentials (keystore) | CLI only | 30m |
| **20** | Reduce build architectures | `gradle.properties` | 15m |
| **20** | Verify patches in EAS | `package.json` | 30m |
| **21** | Update app.json web section | `app.json` | 15m |
| **21** | manifest.json + icons | `public/` (new) | 1h |
| **21** | iOS meta tags index.html | `web/index.html` (new) | 30m |
| **21** | Service worker | `public/sw.js` (new) | 1h |
| **21** | **OPFS database.web.ts** | `src/local-db/database.web.ts` | **4h** |
| **21** | Vercel deploy config | `vercel.json` (new) | 30m |
| **22** | Camera capture on web | `ReceiptPickerField.tsx` | 1h |
| **22** | PWA install banner | `PwaInstallBanner.tsx` (new) | 1.5h |
| **23** | WebAuthn biometric | `biometricAuth.web.ts` (new) | 3h |
| **23** | Web Push (full stack) | Hook + API route + migration + Edge Fn | 5h |
| **Total S20** | Android fix | | **~2.5h** |
| **Total S21** | PWA installable | | **~7h** |
| **Total S22** | PWA polish | | **~2.5h** |
| **Total S23** | PWA advanced | | **~8h** |

---

## Platform Support After All Sprints

| Platform | How to install | Local DB | Push | Face ID |
|----------|---------------|----------|------|---------|
| Android (APK) | Direct APK or Play Store | SQLite native | Native FCM (future) | Fingerprint native |
| Android Chrome (PWA) | Chrome install prompt | OPFS SQLite | ✅ Web Push | ✅ WebAuthn |
| iPhone Safari (PWA) iOS 17+ | Share → Add to Home Screen | OPFS SQLite | ✅ (installed only) | ✅ Face ID |
| iPhone Safari (PWA) iOS 16.4 | Share → Add to Home Screen | In-memory (sync) | ✅ (installed only) | ✅ Face ID |
| iPhone Safari (PWA) iOS 16.0 | Share → Add to Home Screen | In-memory (sync) | ❌ | ✅ Face ID |

---

## Recommended Build Order

```
Sprint 20 → fix Android → verify APK on device
Sprint 21 → PWA deploy → verify on iPhone
Sprint 22 → polish → UAT both platforms in parallel
Sprint 23 → advanced features → post-UAT
```
