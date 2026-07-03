# Sprint 20-A — Org Invite Deep-Link Sign-Off

**Date:** 2026-06-09
**Status:** COMPLETE

---

## Objective

Allow an invited user to tap the invitation email link on their phone and land
directly in a native Accept Invite screen — without going through a browser.

---

## Deliverables

### 1. `AcceptInviteScreen.tsx` (NEW)
`apps/user-mobile-v2/src/features/auth/components/AcceptInviteScreen.tsx`

Full native accept-invite UI. Handles all states:

| State | Trigger |
|---|---|
| Loading | Fetching invite details on mount |
| Confirm | Invite valid — shows org name, role, expiry, consent notice |
| Submitting | POST in progress after Confirm tap |
| Success | Membership created — "Welcome Aboard!" + Open Workspace |
| Error: Expired | `INVITE_EXPIRED` from validate endpoint |
| Error: Already used | `INVITE_ALREADY_USED` from validate endpoint |
| Error: Not found | `NOT_FOUND` — invalid or tampered link |
| Error: Email mismatch | `FORBIDDEN` — invite was sent to a different address |

Backend calls:
- `GET /api/invite/validate?invite_id=<uuid>` — no auth required
- `POST /api/invite/accept` — `Authorization: Bearer <access_token>`

PDPA: `consent_terms: true` is sent automatically; `consent_marketing: false` default.

### 2. `App.tsx` (modified)
`apps/user-mobile-v2/App.tsx`

- Added `import { AcceptInviteScreen }` alongside ResetPasswordScreen
- Extended `DeepLinkParsed` union: `DeepLinkResetPassword | DeepLinkInvite | null`
- Added `DeepLinkInvite = { type: "invite"; inviteId: string }` type
- Extended `parseDeepLinkUrl` to handle `myexpensio://invite?invite_id=<uuid>`
  - Refactored to extract `path` cleanly from URL (avoids false positives)
  - invite uses query params; reset-password uses hash fragment (Supabase standard)
- Added `deepLinkInvite` state + setter in `MobileV2Home`
- Both Linking handlers (`getInitialURL` + `addEventListener`) now dispatch both
  reset-password and invite deep-links
- `AcceptInviteScreen` rendered AFTER auth check — user must be signed in first;
  if not signed in when link is tapped, they see login screen, then invite on auth

### 3. `/api/invite/accept` (modified)
`apps/user/app/api/invite/accept/route.ts`

Added Bearer token auth fallback for mobile clients:

```
Authorization: Bearer <access_token>  →  admin.auth.getUser(token)
(no header)                           →  createServerClient with cookies (web)
```

Both paths resolve to the same `user` object; the rest of the handler is unchanged.
The duplicate `const admin = serviceClient()` declaration was removed.

---

## Deep-link URL format

```
myexpensio://invite?invite_id=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

The invite email should be configured to use this URL as the `redirectTo`
in whatever mechanism sends the invitation (admin panel or `/api/invite/send`).

---

## QA Scenarios

| # | Scenario | Expected |
|---|---|---|
| I1 | Tap invite link — already signed in | AcceptInviteScreen loads, shows org name and role |
| I2 | Tap invite link — NOT signed in | Login screen first, then AcceptInviteScreen after auth |
| I3 | Confirm tap | POST to accept, success screen "Welcome Aboard!" |
| I4 | Decline tap | Returns to normal app, invite dismissed |
| I5 | Expired invite | Error: "Invitation Expired" |
| I6 | Already-accepted invite | Error: "Already Accepted" |
| I7 | Invite sent to different email | Error after POST — `FORBIDDEN` |
| I8 | App cold-start via invite link | `getInitialURL` fires, deepLinkInvite set before render |
| I9 | App warm-start via invite link | `addEventListener` fires, deepLinkInvite set mid-session |

---

## Files Changed

| File | Change |
|---|---|
| `apps/user-mobile-v2/src/features/auth/components/AcceptInviteScreen.tsx` | NEW |
| `apps/user-mobile-v2/App.tsx` | Extended deep-link parser + state + render |
| `apps/user/app/api/invite/accept/route.ts` | Bearer token auth fallback |
| `apps/user-mobile-v2/docs/PWA_VS_MOBILEV2_PARITY_TRACKER.md` | Accept invite: 🚫 → ✅ |

---

## Parity count after Sprint 20-A

- Done: ~49
- Deferred: ~8 (Unified transactions, TNG PDF, First-time setup)
