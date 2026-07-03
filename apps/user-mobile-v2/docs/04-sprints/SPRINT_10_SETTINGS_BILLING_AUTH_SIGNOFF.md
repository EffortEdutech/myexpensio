# Sprint 10 — Settings, Billing, Account & Legal — Sign-off

**Date:** 2026-05-30
**Status:** ✅ SIGNED OFF

---

## Scope

Complete account and administrative user-facing settings: real Supabase auth,
profile save to server, subscription from cache, billing handoff to Stripe,
biometric login, and change password / forgot password flows.

---

## Deliverables

### 1. Real Supabase auth — replaced dev auth ✅

| File | Change |
|---|---|
| `package.json` | Added `@supabase/supabase-js ^2.49.4`, `expo-local-authentication ~15.1.4` |
| `src/lib/supabase.ts` | **NEW** — Supabase client with `expo-secure-store` auth storage adapter (Keychain / Keystore on native) |
| `src/features/auth/hooks/useAuthActions.ts` | **NEW** — `useSignIn` (signInWithPassword), `useSignOut` (wipe + signOut), `useForgotPassword` (resetPasswordForEmail), `refreshSupabaseSession` |
| `src/features/auth/hooks/useSessionRestore.ts` | Updated — attempts Supabase token refresh before wiping on expiry; 5-min pre-expiry buffer |
| `src/features/auth/components/LoginScreen.tsx` | Full rewrite — real email + password form, forgot password screen, "Sign up" link |
| `App.tsx` | Switched `useSignOut` import from `useDevAuthActions` → `useAuthActions` |
| `.env.local.example` | **NEW** — documents required env vars for new devs |

Sign-up is handled via `https://myexpensio.com/signup` (web, opens in browser).
Invite acceptance remains a deferred item (Sprint 15 QA).

---

### 2. Subscription tier from cache (not hardcoded FREE) ✅

| File | Change |
|---|---|
| `src/features/subscription/hooks/useSubscription.ts` | **NEW** — reads `subscriptions_cache` table, returns active tier or FREE fallback |
| `App.tsx` | `subscriptionTier` now from `useSubscription().tier` instead of `"FREE"` constant |

---

### 3. Profile save to server ✅

| File | Change |
|---|---|
| `apps/user/app/api/profile/route.ts` | **NEW** — `GET /api/profile` + `POST /api/profile`; updates `display_name`, `department`, `location`, `company_name`; email/role changes must go through Supabase Auth |
| `src/features/profile/hooks/useProfileSave.ts` | **NEW** — POSTs to `/api/profile`, updates `settingsStore` and `profiles_cache` on success |
| `App.tsx` | "Save Profile" button wired to `useProfileSave`, shows error if offline |

---

### 4. Billing checkout + portal handoff ✅

| Trigger | Action |
|---|---|
| "See pricing" (FREE tier) | `POST /api/billing/checkout { tier: "PRO" }` → `Linking.openURL(checkout_url)` |
| "Manage billing" (paid tier) | `POST /api/billing/portal { return_url }` → `Linking.openURL(url)` |

Both flows open Stripe-hosted pages in the device browser. No in-app payment UI.

---

### 5. Biometric login ✅

| File | Change |
|---|---|
| `src/features/auth/biometricAuth.ts` | Implemented `nativeBiometricAuthAdapter` using `expo-local-authentication` (was stub) |
| `App.tsx` | Toggle checks hardware availability on mount, persists preference to AsyncStorage, disables toggle if hardware unavailable |

Biometric prompt triggers on the app lock screen — wiring to session restore on launch is deferred to Sprint 14 (polish).

---

### 6. Change password / forgot password ✅

- **Forgot password** (login screen): calls `supabase.auth.resetPasswordForEmail` → Supabase sends email with link to `https://myexpensio.com/reset-password`
- **Change password** (settings): button opens `https://myexpensio.com/settings/security` in browser (server-side password change via the PWA)

---

## Setup required before running

1. Copy `.env.local.example` to `.env.local` in `apps/user-mobile-v2/`
2. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Run `npm install` in `apps/user-mobile-v2/`

---

## Known deferred items

| Item | Deferred to |
|---|---|
| Accept invite flow | Sprint 15 |
| Biometric lock on app launch (prompt on resume) | Sprint 14 |
| In-app subscription plan comparison UI | Sprint 14 |
| Account deletion endpoint | Sprint 17 |
| org-level billing (seat management) | Sprint 17 |
