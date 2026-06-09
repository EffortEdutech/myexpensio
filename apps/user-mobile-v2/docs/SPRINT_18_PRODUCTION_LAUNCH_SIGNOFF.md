# Sprint 18 — Production Launch & Old App Transition — Sign-off

**Date:** 2026-06-09
**Status:** ✅ SIGNED OFF
**Version shipped:** 1.0.0 (versionCode 1 / buildNumber 1)

---

## Goal

Launch MyExpensio Mobile v2 publicly and define the fate of the V1 PWA.

---

## Part 1 — Release Build Configuration

### `app.json` updates ✅

| Field | Before | After |
|---|---|---|
| `name` | "MyExpensio Mobile v2" | "MyExpensio" |
| `version` | 0.1.0 | **1.0.0** |
| `icon` | not set | `./assets/icon.png` |
| `splash` | not set | `./assets/splash.png` (bg `#0f766e`) |
| Android `package` | `...mobile.v2` | `com.effortedutech.myexpensio` |
| Android `versionCode` | not set | **1** |
| Android `adaptiveIcon.foregroundImage` | not set | `./assets/adaptive-icon.png` |
| iOS `bundleIdentifier` | `...mobile.v2` | `com.effortedutech.myexpensio` |
| iOS `buildNumber` | not set | **1** |

> **Asset action required:** Place `icon.png` (1024×1024), `splash.png` (1284×2778),
> and `adaptive-icon.png` (1024×1024, safe-zone centred) in `apps/user-mobile-v2/assets/`
> before running `eas build`. Use the teal brand colour `#0f766e` as background.

### `eas.json` created ✅

Three build profiles:

| Profile | Distribution | Android output | Notes |
|---|---|---|---|
| `development` | internal | APK | `developmentClient: true` for Expo Go / dev client |
| `preview` | internal | APK | Internal QA build, not for store |
| `production` | store | AAB (App Bundle) | `autoIncrement: true` — EAS manages versionCode |

Submit config targets `internal` track on Google Play (promote manually to production).

### Build commands

```bash
# From apps/user-mobile-v2 (or monorepo root with --filter)
npx eas build --profile development --platform android
npx eas build --profile preview --platform android
npx eas build --profile production --platform android

# Submit to Play Store internal track
npx eas submit --platform android --profile production
```

---

## Part 2 — Old App Transition Policy

### Decision: **V1 PWA remains available — parallel run**

The V1 PWA (`apps/user`, hosted at the existing domain) will continue operating
during the v2 launch period. No forced migration.

**Rationale:**
- V2 has ~12 documented deferred gaps (see parity tracker)
- Users mid-workflow in V1 should not be disrupted
- Parallel run allows organic migration with zero support pressure

**Timeline:**
- Launch day: v2 available for download, V1 unchanged
- 30 days post-launch: review deferred gaps completed in Sprint 19
- 60 days post-launch: evaluate V1 retirement based on v2 adoption metrics

**Migration path for users:**
1. Install v2 from the store
2. Log in with existing credentials (same Supabase auth)
3. Bootstrap sync pulls all server-side data on first login
4. Local-only data (personal expenses, bills not yet synced) must be reviewed manually

---

## Part 3 — Feature Gap Disclosure

The following gaps exist in v2 at launch. All are documented in
`docs/PWA_VS_MOBILEV2_PARITY_TRACKER.md`.

| Gap | Impact | Workaround |
|---|---|---|
| Forgot / change password | LOW — user can use PWA or web | Visit myexpensio.com in browser |
| Accept org invite | MEDIUM — new TEAM members only | Accept via PWA or email link |
| Dashboard home stats | LOW — UX only | Claims/trips lists still accessible |
| Unified transactions tab | LOW | TNG library tab available separately |
| GPS real point tracking | LOW — draft mode works for routes | Use odometer or route mode |
| TNG backend PDF parsing | LOW | CSV import works |
| Profile backend save | LOW — local display only | Profile visible, not editable in v2 yet |
| Claim approval badge (EMPLOYEE) | LOW — functional, no badge | Claim status text still shown |

---

## Part 4 — Support FAQ

### For users

**Q: Is my data safe when I switch to the new app?**
A: Yes. All data is stored in your account on the server. When you log in to v2
for the first time, it downloads everything automatically.

**Q: Do I have to delete the old app?**
A: No. Both apps work independently. You can use both until you're comfortable
with v2.

**Q: I can't find "Forgot Password" in the new app.**
A: Use the web app at myexpensio.com to reset your password. The reset link
will also work for logging in to the mobile app.

**Q: My trip receipts and claim attachments — are they in v2?**
A: Claim item receipts are stored on the server (PRO users) or locally. Personal/Business
expense receipts in v2 are stored locally on your device — they will not appear
if you reinstall the app. Back up important receipts by viewing and saving them.

**Q: I'm a team member — why can't I edit rates?**
A: In v2, only team OWNER and ADMIN roles can edit rates. This matches the
existing web app behaviour. Contact your org admin to make rate changes.

### For support staff

**Key differences from V1 to be aware of:**
- v2 is local-first — offline changes queue and sync when online
- Subscription tier is resolved from the ORG (not just the user's own subscription)
- Claims/trips created in v2 sync to the same backend as V1 — they will appear in both
- Receipt photos in v2 Personal/Business spaces are device-local URIs (not uploaded)
- Export PDFs and XLSX files are generated on-device, not by the backend

---

## Part 5 — Rollback Plan

### Trigger criteria

Roll back to V1-only if any of the following occur within 7 days of launch:

- Auth failures affecting > 5% of login attempts
- Data loss reports (entries created in v2 not appearing after sync)
- Crash rate > 2% of sessions (monitor via EAS Insights or Sentry)
- Blocking issue with Play Store / App Store review

### Rollback steps

1. **Do not unpublish v2** from the store — leave it available, just stop promoting it
2. Post in-app notice: "Please use the web app at myexpensio.com while we fix an issue"
3. V1 PWA at existing domain remains fully operational — zero action needed
4. Fix issue in a hotfix branch (see Hotfix Workflow)
5. Re-promote v2 after hotfix build passes internal QA

### Data safety guarantee

All data written by v2 syncs to Supabase. If a user rolls back to V1, their
synced data is already there. Local-only data (pending sync queue) is the only
risk — users with `sync_status = 'pending'` entries should be told to open v2
once more after a fix ships to flush the queue.

---

## Part 6 — Production Monitoring

### Chosen tools

| Concern | Tool | Setup |
|---|---|---|
| Crash reporting | **Sentry** (recommended) | `npx expo install @sentry/react-native` — configure DSN in `.env.local` |
| Build / OTA updates | **EAS Insights** | Available free via Expo dashboard |
| API errors | **Supabase logs** | `supabase.com/dashboard → Logs → API` |
| Auth issues | **Supabase Auth logs** | `supabase.com/dashboard → Authentication` |
| Slow queries | **Supabase Advisors** | Run `get_advisors` monthly |

> **Action required:** Add Sentry DSN to `.env.local` and `.env.production` before
> shipping the production build. Sentry setup is a Sprint 19 task if not done now.

### Key metrics to watch (first 30 days)

- Daily active users (EAS Insights)
- Bootstrap success rate (Supabase API logs — `GET /api/sync/bootstrap`)
- Push sync error rate (Supabase API logs — `POST /api/sync/push`)
- Crash-free session rate (Sentry)
- Subscription tier resolution accuracy (spot-check: TEAM users show correct tier)

---

## Part 7 — Hotfix Workflow

### Branch strategy

```
main          — always releasable; version bot auto-bumps on every commit
hotfix/xxx    — branched from the production tag (e.g. v1.0.0)
```

### Hotfix steps

1. `git checkout -b hotfix/describe-the-fix v1.0.0`
2. Make the targeted fix — minimal scope only
3. Run typecheck: `corepack pnpm typecheck --filter user-mobile-v2`
4. Commit with message: `fix(hotfix): describe the fix`
5. `git checkout main && git merge hotfix/describe-the-fix`
6. Tag: `git tag v1.0.1` (patch increment)
7. `git push && git push --tags`
8. Trigger EAS build: `npx eas build --profile production --platform android --auto-submit`
9. Promote from internal → production in Google Play Console after 1-hour soak

### What qualifies as a hotfix (not a sprint feature)

- Auth broken / users cannot log in
- Data corruption or loss on sync
- Crash affecting > 1% of sessions
- Store rejection requiring config-only change

Everything else waits for Sprint 19.

---

## Part 8 — Launch Checklist

### Pre-launch (before store submission)

- [ ] Place `icon.png`, `splash.png`, `adaptive-icon.png` in `assets/`
- [ ] Set production Supabase URL + anon key in `.env.production`
- [ ] Add Sentry DSN to `.env.production`
- [ ] Run `npx expo doctor` — no critical warnings
- [ ] Run `corepack pnpm typecheck --filter user-mobile-v2` — zero errors
- [ ] Run internal QA pass against `SPRINT_15_E2E_QA_SCRIPT.md`
- [ ] `npx eas build --profile production --platform android`
- [ ] Install AAB on physical Android device via internal track
- [ ] Smoke test: login → bootstrap → create claim → sync → export PDF

### Store submission

- [ ] Google Play: upload AAB to internal track
- [ ] Fill store listing: description, screenshots (5 required), short description
- [ ] Complete Data Safety form (local storage, no ad ID, no location shared externally)
- [ ] Submit for review

### Launch day

- [ ] Promote from internal → production in Play Console
- [ ] Update `VERSION_NOTES.md` / release notes
- [ ] Notify users via email / support channel
- [ ] Enable production monitoring (EAS Insights dashboard bookmarked)

---

## Files Changed / Created

| File | Change |
|---|---|
| `apps/user-mobile-v2/app.json` | Version 1.0.0, icon/splash refs, production bundle IDs |
| `apps/user-mobile-v2/eas.json` | New — development / preview / production build profiles |
| `apps/user-mobile-v2/docs/PWA_VS_MOBILEV2_PARITY_TRACKER.md` | Updated Sprints 14–18, deferred gaps documented |
| `apps/user-mobile-v2/docs/SPRINT_16_ORG_CONTEXT_SIGNOFF.md` | New sign-off doc |
| `apps/user-mobile-v2/docs/SPRINT_17_RECEIPT_ATTACHMENT_SIGNOFF.md` | New sign-off doc |
| `apps/user-mobile-v2/docs/SPRINT_18_PRODUCTION_LAUNCH_SIGNOFF.md` | This document |
