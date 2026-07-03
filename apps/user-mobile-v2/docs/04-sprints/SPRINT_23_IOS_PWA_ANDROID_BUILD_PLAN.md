# Sprint 23 — Single Codebase: Android APK + PWA (Android & iOS)

**Created:** 2026-06-14
**Updated:** 2026-06-14
**Status:** 🟡 IN PROGRESS
**Owner:** EffortEdutech / myeffort.studio@gmail.com

---

## Strategy Summary

One codebase (`apps/user-mobile-v2`) delivers three targets:

| Platform | Delivery method | Status |
|---|---|---|
| **Android** | Native APK/AAB via EAS Build → Google Play | 🟡 Preview working |
| **Android PWA** | Expo web export → deployed URL → Add to Home Screen | ⬜ Not started |
| **iPhone / iOS PWA** | Expo web export → deployed URL → Safari Add to Home Screen | ⬜ Not started |

The PWA (Track B) serves **both** Android and iPhone users who cannot or prefer not to
install from an app store. It is the Expo web build of `apps/user-mobile-v2` using
`react-native-web` — the same mobile-first UI as the native app, served as a web bundle.

> **Not the Next.js app.** `apps/user` is the admin/web portal. This sprint is strictly
> about the `user-mobile-v2` Expo app exported as a PWA.

---

## What Is Already Done (as of 2026-06-14)

| Item | Detail |
|---|---|
| `react-native-web` installed | Already in `package.json` |
| Web bundler configured | `app.json`: `"web": { "bundler": "metro", "output": "single" }` |
| Platform split files exist | `RouteMap.native.tsx` / `RouteMap.web.tsx`, `SinglePinMap.native.tsx` / `SinglePinMap.web.tsx` |
| SQLite web adapter exists | `src/local-db/database.web.ts` already in place |
| Supabase web fallback | `supabase.ts` skips SecureStore on web (`Platform.OS === 'web' ? undefined : ExpoSecureStoreAdapter`) |
| EAS env vars fixed | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_SCAN_API_URL`, `EXPO_PUBLIC_SCAN_API_SECRET` added to `eas.json` base profile (2026-06-14) |
| Supabase client fixed | `supabase.ts` changed from bracket notation to dot notation so Metro can inline env vars at build time (2026-06-14) |
| Android preview APK | Build `0013073f` installed and running on emulator — Supabase connects, subscription fetches correctly |

---

## Track A — Android Native Build

### ✅ A-5 — Preview APK (DONE)

```bash
npx eas build --profile preview --platform android
```

Build `0013073f-887f-4684-a021-a899f9045a0f` — installed, login works, Supabase connects.

### Remaining Android steps

- [ ] **A-1** Google Play Console account — [play.google.com/console](https://play.google.com/console) (USD 25 one-time)
- [ ] **A-2** New app in Play Console: package `com.effortedutech.myexpensio`, name "MyExpensio"
- [ ] **A-3** Google Play service account with "Release Manager" role → download JSON →
  place at `apps/user-mobile-v2/google-service-account.json` (in `.gitignore` — never commit)
- [ ] **A-4** EAS CLI login: `npx eas-cli login`
- [ ] **A-6** Smoke test preview APK on physical Android device: login → claim → sync → export PDF
- [ ] **A-7** Production build (AAB):
  ```bash
  npx eas build --profile production --platform android
  ```
- [ ] **A-8** Submit to Play Store:
  ```bash
  npx eas submit --profile production --platform android
  ```

### Play Store listing

- [ ] **A-9** Listing copy — see `docs/PLAY_STORE_LISTING.md`
- [ ] **A-10** Minimum 2 phone screenshots (1080×1920 px)
- [ ] **A-11** Feature graphic 1024×500 px — teal `#0f766e` background
- [ ] **A-12** Content rating questionnaire
- [ ] **A-13** Privacy policy live at `https://myexpensio.com/privacy`
- [ ] **A-14** Data Safety form: financial data, location (local trip tracking only), no ad ID
- [ ] **A-15** Promote: internal → closed testing → production

---

## Track B — PWA (Android + iOS)

### B-1 — Web Build Audit

Current compatibility status:

| Feature | Native module | Web status | Fix needed |
|---|---|---|---|
| Local SQLite | `expo-sqlite` | ✅ `database.web.ts` exists | Verify it works end-to-end |
| Supabase auth | `expo-secure-store` | ✅ Web fallback in `supabase.ts` | Verify session persists on reload |
| Maps (route) | `react-native-webview` + Leaflet | ✅ `RouteMap.web.tsx` exists | Test on Safari |
| Maps (single pin) | `react-native-webview` + Leaflet | ✅ `SinglePinMap.web.tsx` exists | Test on Safari |
| GPS tracking | `expo-location` | ⚠️ Web Geolocation API | Test — needs HTTPS |
| Camera / photo picker | `expo-image-picker` | ⚠️ `<input type="file">` | Verify on Safari iOS |
| Document picker | `expo-document-picker` | ⚠️ Partial web support | Verify PDF import on Safari |
| Biometric auth | `expo-local-authentication` | ❌ No web API | Hide biometric toggle on web |
| PDF print/export | `expo-print` | ❌ Native only | Use `window.print()` / blob download |
| File sharing | `expo-sharing` | ❌ Native only | Use Web Share API / blob download |
| File system ops | `expo-file-system` | ❌ Native only | Use browser File API / IndexedDB |
| Push notifications | — | ❌ iOS PWA limitation | Deferred — out of scope v1 |
| Signature canvas | `react-native-signature-canvas` | ⚠️ Uses WebView internally | Test; may need web alternative |

- [ ] **B-1-1** Run `npx expo export --platform web` locally — check console for errors
- [ ] **B-1-2** Open `dist/index.html` in Chrome → check all major screens load
- [ ] **B-1-3** Test in Safari on iPhone (simulator or physical device)
- [ ] **B-1-4** Document which screens crash — create fix list

### B-2 — Native Module Web Stubs

For each native-only module that has no web equivalent, add a platform split:

- [ ] **B-2-1** `expo-local-authentication` — add `src/features/auth/biometricAuth.web.ts`
  that exports no-op stubs (biometric always unavailable on web)
- [ ] **B-2-2** `expo-print` — add `src/features/exports/printWeb.ts`:
  use `window.print()` for print, `URL.createObjectURL(blob)` for PDF download
- [ ] **B-2-3** `expo-sharing` — add web alternative using
  `navigator.share()` (Web Share API) with `URL.createObjectURL` fallback
- [ ] **B-2-4** `expo-file-system` usages — audit `src/features/exports/exportFiles.ts`
  and `buildLocalPdf.ts`; replace with browser download where used on web
- [ ] **B-2-5** `react-native-signature-canvas` — test on web first (B-1); if broken,
  replace with a plain `<canvas>` drawing component for web

### B-3 — Auth / Session Persistence on Web

`supabase.ts` already skips SecureStore on web but falls back to in-memory (no persistence).
Session will be lost on page reload.

- [ ] **B-3-1** Add `localStorage`-backed storage adapter for web in `supabase.ts`:
  ```ts
  const webStorageAdapter = {
    getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
    setItem: (key: string, value: string) => Promise.resolve(localStorage.setItem(key, value)),
    removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
  };

  storage: Platform.OS === 'web' ? webStorageAdapter : ExpoSecureStoreAdapter,
  ```
- [ ] **B-3-2** Verify session restores after page reload in Safari

### B-4 — PWA Manifest + iOS Meta Tags

- [ ] **B-4-1** Update `app.json` web section for PWA:
  ```json
  "web": {
    "bundler": "metro",
    "output": "static",
    "name": "MyExpensio",
    "shortName": "MyExpensio",
    "description": "Track expenses, claims, and trips — on Android and iPhone.",
    "themeColor": "#0f766e",
    "backgroundColor": "#0f766e",
    "lang": "en"
  }
  ```
  Note: change `"output"` from `"single"` to `"static"` to enable service worker support.
- [ ] **B-4-2** Create `apps/user-mobile-v2/web/index.html` with iOS meta tags:
  ```html
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="MyExpensio">
  <link rel="apple-touch-icon" href="/icon-192.png">
  <link rel="apple-touch-startup-image" href="/splash.png">
  ```
- [ ] **B-4-3** Generate PWA icons from `assets/icon.png`: 192×192 and 512×512 PNG
- [ ] **B-4-4** Generate iOS splash: 2048×2732 px from `assets/splash.png`
- [ ] **B-4-5** Test "Add to Home Screen" on iPhone Safari — confirm full-screen, no browser chrome

### B-5 — Service Worker (Offline Support)

- [ ] **B-5-1** Try `expo-service-worker` for SDK 56:
  ```bash
  npx expo install expo-service-worker
  ```
  If unavailable, use Workbox manually.
- [ ] **B-5-2** Cache strategy: cache-first for static assets, network-first for API calls
- [ ] **B-5-3** Offline test: load app → disable WiFi → verify cached screens still load

### B-6 — Deployment (Vercel)

- [ ] **B-6-1** Run `npx expo export --platform web` → outputs to `dist/`
- [ ] **B-6-2** Create Vercel project for `apps/user-mobile-v2`:
  - Root: `apps/user-mobile-v2`
  - Build command: `npx expo export --platform web`
  - Output directory: `dist`
- [ ] **B-6-3** Set Vercel env vars:
  ```
  EXPO_PUBLIC_API_BASE_URL=https://myexpensio-jade.vercel.app
  EXPO_PUBLIC_SUPABASE_URL=https://bzpmrcfxkawkuhyocemu.supabase.co
  EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
  EXPO_PUBLIC_SCAN_API_URL=https://myexpensio-scan.onrender.com
  EXPO_PUBLIC_SCAN_API_SECRET=<secret>
  APP_ENV=production
  ```
- [ ] **B-6-4** Assign custom subdomain: `app.myexpensio.com`
- [ ] **B-6-5** Verify HTTPS (required for PWA install + Geolocation API)

### B-7 — QA Checklist (Android + iOS)

**Android PWA (Chrome)**
- [ ] **B-7-1** Navigate to URL → Chrome install banner appears → install
- [ ] **B-7-2** Launch from home screen — full screen, no address bar
- [ ] **B-7-3** Login and session restore after close/reopen

**iOS PWA (Safari)**
- [ ] **B-7-4** Navigate → Share → Add to Home Screen → confirm icon + name
- [ ] **B-7-5** Launch from home screen — full screen, no Safari chrome
- [ ] **B-7-6** Login and session restore after close/reopen
- [ ] **B-7-7** Create a claim end-to-end
- [ ] **B-7-8** Attach a receipt (camera or photo library)
- [ ] **B-7-9** Export PDF — confirm download works on iOS Safari
- [ ] **B-7-10** Offline: go offline → create claim → go online → verify sync
- [ ] **B-7-11** Splash screen and icon look correct on home screen

### B-8 — Install Prompt

- [ ] **B-8-1** Detect if running in browser (not standalone) and show install banner:
  ```ts
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  if (!isStandalone && Platform.OS === 'web') {
    // show "Add to Home Screen" instructions
  }
  ```
- [ ] **B-8-2** Add install guide at `myexpensio.com/install` for iPhone users

---

## Known PWA Limitations

| Limitation | Platform | Impact | Workaround |
|---|---|---|---|
| No push notifications | iOS | LOW | In-app notifications only |
| Storage cleared if unused 7 days | iOS | MEDIUM | Cloud sync protects data |
| Background GPS unavailable | iOS | LOW | GPS requires screen on |
| No `myexpensio://` deep links | iOS | MEDIUM | Use HTTPS deep links (`app.myexpensio.com/reset-password?...`) |
| Camera API on older iOS | iOS | LOW | File picker fallback |

---

## Dependency Map

```
A-1 → A-2 → A-3 → A-4
                        ↓
✅ A-5 (preview done) → A-6 → A-7 → A-8 → A-9..A-15

B-1 (audit)
  ↓
B-2 (stubs) + B-3 (auth) → B-4 (manifest) → B-5 (SW) → B-6 (deploy) → B-7 (QA) → B-8 (prompt)
```

Track A and Track B are parallel.

---

## Success Criteria

| Criterion | Track |
|---|---|
| Preview APK installs and runs on emulator ✅ | A |
| Production AAB submitted to Play Store internal track | A |
| Play Store listing complete | A |
| `app.myexpensio.com` loads full MyExpensio UI | B |
| Android Chrome: install to home screen works | B |
| iPhone Safari: Add to Home Screen → full-screen app | B |
| Login, claim creation, export work in PWA | B |
| Offline load works (cached assets) | B |

---

## Files To Create / Modify

| File | Change | Track | Status |
|---|---|---|---|
| `apps/user-mobile-v2/eas.json` | Added all env vars to base profile | A | ✅ Done |
| `apps/user-mobile-v2/src/lib/supabase.ts` | Dot notation + localStorage web storage adapter | A+B | ✅ Done |
| `apps/user-mobile-v2/src/features/auth/biometricAuth.web.ts` | Web no-op stub (no expo-local-authentication import) | B | ✅ Done |
| `apps/user-mobile-v2/src/features/exports/buildLocalPdf.web.ts` | Web: fetch PDF → blob → browser download | B | ✅ Done |
| `apps/user-mobile-v2/src/features/exports/buildLocalXlsx.web.ts` | Web: fetch XLSX → blob → browser download | B | ✅ Done |
| `apps/user-mobile-v2/src/features/exports/components/SignatureModal.web.tsx` | HTML5 canvas replace of react-native-signature-canvas | B | ✅ Done |
| `apps/user-mobile-v2/src/features/exports/components/ExportScreen.tsx` | Web download message + Platform guard | B | ✅ Done |
| `apps/user-mobile-v2/src/features/exports/buildLocalPdf.ts` | Fixed bracket→dot notation for env var | A+B | ✅ Done |
| `apps/user-mobile-v2/src/features/exports/buildLocalXlsx.ts` | Fixed bracket→dot notation for env var | A+B | ✅ Done |
| `apps/user-mobile-v2/app.json` | output→static, PWA manifest fields | B | ✅ Done |
| `apps/user-mobile-v2/web/index.html` | iOS PWA meta tags, apple-touch-icon | B | ✅ Done |
| `apps/user-mobile-v2/vercel.json` | Build command, SPA rewrites, cache headers | B | ✅ Done |
| `apps/user-mobile-v2/google-service-account.json` | Created by human, not committed | A | ⬜ |
| `apps/user-mobile-v2/public/icon-192.png` | PWA icon (generate from assets/icon.png) | B | ⬜ |
| `apps/user-mobile-v2/public/icon-512.png` | PWA icon (generate from assets/icon.png) | B | ⬜ |
