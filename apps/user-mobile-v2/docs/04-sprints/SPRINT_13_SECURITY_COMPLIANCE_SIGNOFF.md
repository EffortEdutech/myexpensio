# Sprint 13 — Security, Privacy, Compliance & Data Retention — Sign-off

**Date:** 2026-05-30
**Status:** ✅ SIGNED OFF

---

## Scope

Make the mobile app safe for financial and receipt data before onboarding real users.
Covers: local data protection, token security, session management, RLS hardening,
receipt upload pipeline, and legal/privacy accessibility.

---

## Audit Findings & Fixes

### 1. Sign-out did NOT wipe local financial data ❌ → ✅ FIXED

**Risk:** On sign-out (or lost/stolen device), SQLite database remained on disk
containing claims, trips, expenses, TNG transactions, and receipts.

**Fix:** Added `wipeLocalDatabase()` to `src/local-db/database.ts`.
`useSignOut` now calls `wipeLocalDatabase()` before `clearAuthSession()`.
All 19 user data tables are `DELETE`'d in a single transaction on sign-out.
Schema migrations table is preserved so re-login does not re-run migrations.

**Files changed:**
- `src/local-db/database.ts` — added `wipeLocalDatabase()`
- `src/features/auth/hooks/useDevAuthActions.ts` — wired into `useSignOut`

---

### 2. Token storage ✅ ALREADY SECURE

Auth session stored in `expo-secure-store` (iOS Keychain / Android Keystore) on native.
Web dev uses `localStorage` — acceptable for development only.
No plaintext token storage in AsyncStorage or SQLite.

---

### 3. Device ID not persisted ❌ → ✅ FIXED

**Risk:** `deviceStore` regenerated a new `deviceId` on every app launch.
The sync engine uses device ID to attribute mutations — a changing ID could
cause duplicate or orphaned sync queue items.

**Fix:** `src/state/deviceStore.ts` now uses `zustand/persist` backed by
`AsyncStorage`. Device ID is generated once and reused across all app sessions.

---

### 4. Session expiry not checked on app resume ❌ → ✅ FIXED

**Risk:** An expired token could persist in SecureStore and be passed to sync
API calls, causing 401 errors or stale data access.

**Fix:** `src/features/auth/hooks/useSessionRestore.ts` now:
- Checks `expiresAt` on mount and on every app foreground (`AppState` listener)
- If expired: wipes local data, clears token, sets session to null (forces re-login)
- Dev auth sessions (`expiresAt: null`) are treated as non-expiring

---

### 5. RLS missing on 5 tables ❌ → ✅ FIXED (migration written)

**Risk:** `tng_statement_batches`, `tng_transactions`, `receipts`, `commitments`,
`commitment_payments` had no server-side tables or RLS policies. The sync push
route was writing to them but they were undefined — any data would be accessible
without ownership enforcement.

**Fix:** Migration `20260530_sprint13_missing_tables_and_rls.sql` creates all 5
tables with `ENABLE ROW LEVEL SECURITY` and `user_id = auth.uid()` policies on
SELECT / INSERT / UPDATE / DELETE. `commitment_payments` is scoped via join to
`commitments.user_id`.

**Apply before production launch:**
```bash
supabase db push
```

---

### 6. Receipt upload pipeline ❌ → ✅ BUILT

**What was missing:** Receipts were stored as local file URIs only — never
uploaded to Supabase Storage. This blocked server-side XLSX/PDF generation.

**Fix:**
- `apps/user/app/api/sync/upload-url/route.ts` — `POST /api/sync/upload-url`
  returns a 5-minute signed Supabase Storage upload URL for a given receipt ID.
  Validates MIME type (jpg/png/webp/heic/pdf) and enforces 10 MB file size limit.
- `src/sync/receiptUploadEngine.ts` — `uploadPendingReceipts()` finds all
  `upload_status = 'local'` receipts, requests a signed URL, uploads via
  `FileSystem.uploadAsync`, marks as `uploaded` with the `storage_path`.
- `src/sync/hooks/useSyncEngine.ts` — receipt upload runs before each push cycle.

Storage bucket: `receipts` (must be created in Supabase dashboard — private, no public access).
Storage path pattern: `{user_id}/{receipt_id}.{ext}`

---

### 7. No secret keys hardcoded ✅ CONFIRMED

Full scan of `src/` found no hardcoded API keys, service role keys, or passwords.
`SUPABASE_SERVICE_ROLE_KEY` used only in `apps/user/app/api/invite/` server routes
(correct — server-only, never client-facing).

---

### 8. Server error logging — no PII leakage ✅ CONFIRMED

All `console.error` in API routes log error messages and entity types only.
No email addresses, tokens, amounts, or user content is logged.

---

### 9. Privacy & Terms links now tappable ❌ → ✅ FIXED

About screen in settings showed "Terms of Service · Privacy Policy" as plain
non-interactive text. Fixed to use `Linking.openURL` to open:
- `https://myexpensio.com/terms`
- `https://myexpensio.com/privacy`

---

## Device Loss / Stolen Policy

Documented for user documentation and store review:

- **Sign-out:** wipes all local financial data immediately
- **Token expiry:** expired tokens auto-clear data and force re-login on next app open
- **No remote wipe:** not implemented — deferred to Sprint 17 (pilot)
- **Biometric lock:** UI toggle exists; backend wiring deferred to Sprint 10

---

## Known Deferred Items

| Item | Deferred to |
|---|---|
| Supabase Storage `receipts` bucket creation | Manual step before production |
| Real Supabase auth (vs dev auth) | Sprint 10 |
| Remote wipe / account deletion endpoint | Sprint 17 |
| Biometric app lock wiring | Sprint 10 |
| TNG PDF parsing server endpoint | Sprint 14 |
| XLSX / PDF export server generation | Sprint 14 |
| Error monitoring / Sentry integration | Sprint 14 |
