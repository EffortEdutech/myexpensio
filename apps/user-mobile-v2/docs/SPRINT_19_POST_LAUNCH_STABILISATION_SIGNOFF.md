# Sprint 19 — Post-Launch Stabilisation — Sign-off

**Date:** 2026-06-09
**Status:** ✅ SIGNED OFF

---

## Scope

Sprint 19 closes the most impactful deferred gaps from the parity tracker:
password reset deep-link, in-app change password, and claim approval status
badges. All three were LOW/MEDIUM impact and deferred purely because they
required deep-link infrastructure not yet wired at launch.

---

## Deliverables

### 1. Deep-link handler — `App.tsx` ✅

Added `parseDeepLinkUrl()` helper and a `useEffect` in `MobileV2Home` that
listens for incoming `myexpensio://` URLs both on cold start
(`Linking.getInitialURL`) and while the app is running
(`Linking.addEventListener`).

Currently handles:

| URL pattern | Action |
|---|---|
| `myexpensio://reset-password#access_token=...&type=recovery` | Sets `deepLinkReset` state → renders `ResetPasswordScreen` |

The handler is designed to be extended — future invite deep-links follow the
same pattern. The `deepLinkReset` overlay renders in front of any auth state,
so it works whether the user is signed in or not.

---

### 2. ResetPasswordScreen — `src/features/auth/components/ResetPasswordScreen.tsx` ✅

New component (165 lines) shown when a password-reset deep-link arrives.

**Flow:**
1. On mount — `supabase.auth.setSession(accessToken, refreshToken)` activates
   the recovery session carried in the deep-link URL
2. If session activation fails (link expired / already used) → "Link Expired"
   screen with "Back to Sign In"
3. If session OK → new password + confirm password form
4. On submit — `supabase.auth.updateUser({ password })` — validated
   (min 8 chars, passwords must match)
5. On success → "Password Updated" screen → `onComplete()` clears the deep-link
   state and returns to normal app flow

---

### 3. `useForgotPassword` redirect — `src/features/auth/hooks/useAuthActions.ts` ✅

Changed `redirectTo` from `"https://myexpensio.com/reset-password"` to
`"myexpensio://reset-password"`.

Supabase appends `#access_token=...&refresh_token=...&type=recovery` to the
redirect URL, which the deep-link handler picks up and routes to
`ResetPasswordScreen`.

---

### 4. Change Password in Settings — `App.tsx` ✅

Replaced the stub "Password change modal is queued…" button with a real
`ChangePasswordForm` inline component inside the 🔑 Password settings card.

**Form:** New password + Confirm password → `supabase.auth.updateUser({ password })`

- Works only when the user is already authenticated (no current-password
  re-entry — consistent with Supabase's session-scoped `updateUser`)
- Shows inline error (validation + API errors) and inline success confirmation
- Clears fields after successful update

---

### 5. Claim status badges — `src/features/shell/components/WorkHomeScreen.tsx` ✅

Added `claimBadge()` helper and updated the Recent Claims list to display
all five claim states correctly:

| Status | Label | Colours |
|---|---|---|
| `draft` | Draft | Yellow bg / amber text |
| `submitted` | Awaiting Approval | Blue bg / blue text |
| `approved` | Approved | Green bg / green text |
| `rejected` | Rejected | Red bg / red text |
| `paid` | Paid | Teal bg / teal text |

Previously, any non-draft claim showed "Submitted" (green) — EMPLOYEE users
now see "Awaiting Approval" (blue) which correctly reflects the claim lifecycle.

---

## QA Scenarios

| # | Scenario | Expected |
|---|---|---|
| P1 | Tap "Forgot password?" → enter email → Send Reset Link | Success message; email sent |
| P2 | Tap reset link in email while app is installed | App opens `ResetPasswordScreen` |
| P3 | Cold-start open via reset link | App initialises → `ResetPasswordScreen` |
| P4 | Expired reset link | "Link Expired" screen |
| P5 | Mismatched passwords in reset form | Error: "Passwords do not match" |
| P6 | Password < 8 chars in reset form | Error: "at least 8 characters" |
| P7 | Successful reset | "Password Updated" screen → onComplete → normal app |
| P8 | Settings → Password card → enter valid new password | "✅ Password updated successfully." |
| P9 | Settings → Password card → mismatched confirm | Inline error |
| C1 | Claim with status `draft` | Yellow "Draft" badge |
| C2 | Claim with status `submitted` | Blue "Awaiting Approval" badge |
| C3 | Claim with status `approved` | Green "Approved" badge |
| C4 | Claim with status `rejected` | Red "Rejected" badge |
| C5 | Claim with status `paid` | Teal "Paid" badge |

---

## Files Changed

| File | Change |
|---|---|
| `apps/user-mobile-v2/App.tsx` | Deep-link handler in `MobileV2Home`; `ChangePasswordForm` component; replaced stub settings card; version string 1.0.0 |
| `apps/user-mobile-v2/src/features/auth/components/ResetPasswordScreen.tsx` | New component (created) |
| `apps/user-mobile-v2/src/features/auth/hooks/useAuthActions.ts` | `redirectTo: "myexpensio://reset-password"` |
| `apps/user-mobile-v2/src/features/shell/components/WorkHomeScreen.tsx` | `claimBadge()` helper + full-status badge render |

---

## Deferred gaps remaining (Sprint 20+)

| Gap | Reason |
|---|---|
| Accept org invite deep-link | Requires org onboarding flow + backend invite-validate endpoint |
| Dashboard home stats (Personal/Business) | Personalised stat cards for each space |
| Unified transactions tab (TNG + claims) | Non-critical UX — no user request yet |
| GPS real-point tracking | Complex native feature — planned for Sprint 20 |
| Profile backend save | Needs backend profile-update API endpoint |
| TNG backend PDF parsing | V2 uses CSV import; PDF parser is backend work |
