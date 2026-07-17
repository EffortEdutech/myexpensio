# PWA Device QA Checklist (Track B — B-7)

**Date:** 2026-07-04
**Deployed build:** `dd1c830` (Vercel `myexpensio-apps`, production, READY)
**Test URL:** `https://myexpensio-apps-git-main-eff-edus-projects.vercel.app`
(If that URL asks for a Vercel login, use the production domain from Vercel Dashboard → myexpensio-apps → Domains, or disable Deployment Protection: Project → Settings → Deployment Protection → Off for production.)

---

## Part 0 — Renormalize commit (PC, 2 minutes, do first)

Terminal at repo root:

```
git status          # expect ~134 modified files (line-ending noise only)
git add --renormalize .
git commit -m "chore: renormalize line endings to LF per .gitattributes"
git pull --no-rebase origin main
git push origin main
```

- [ ] Push succeeds, CI (Validate) green
- [ ] Fresh `git status` afterwards is clean

**Note:** this triggers one more Vercel deploy. Wait for it to go READY before device testing so you're testing the latest build.

---

## Part 1 — Android / Chrome

1. Open the test URL in Chrome.
- [ ] App shell loads (no blank screen, no endless spinner)
2. Log in with your test account.
- [ ] Login works; session survives closing + reopening the tab
3. Wait for first sync.
- [ ] Claims/trips data appears (bootstrap + pull from Supabase)
- [ ] Staleness/"last synced" indicator shows a fresh time
4. Install prompt.
- [ ] Banner appears with an **Install** button (Chrome supports `beforeinstallprompt`)
- [ ] Tap Install → app appears on home screen with correct icon
- [ ] Launch from home screen → opens standalone (no browser chrome), splash OK
5. Billing path (test mode only — do NOT use a real card).
- [ ] Settings → Plan & Billing visible; "See pricing" opens checkout (will 500 until Stripe env vars are set — that's expected, note the exact error shown)
6. Offline smoke test.
- [ ] Airplane mode → app still opens (service worker shell cache)
- [ ] Create/edit a claim item offline → shows as pending
- [ ] Back online → item syncs; pending state clears

## Part 2 — iPhone / Safari

1. Open the test URL in Safari.
- [ ] App shell loads
2. Log in.
- [ ] Login works; reload the page → still logged in (localStorage session)
3. Install prompt.
- [ ] Banner shows **"Share → Add to Home Screen" instructions** (iOS has no install API — this is correct behavior, not a bug)
- [ ] Add to Home Screen manually → icon + name correct
- [ ] Launch from home screen → full-screen, no Safari chrome, splash OK
4. Data + sync.
- [ ] Data loads after login; staleness indicator fresh
5. Billing.
- [ ] NO purchase button anywhere in the iOS PWA path is required — PWA is web, so checkout SHOULD be available here (this is the iOS checkout path). Confirm the checkout button exists on web/PWA.
6. Offline smoke test (same as Android steps).
- [ ] Shell opens offline, edits queue, sync on reconnect

## Part 3 — Cross-device consistency (the sync concern)

Needs both devices logged into the SAME account:

1. On phone (native app or PWA): create a trip/claim item → wait for sync.
- [ ] Appears on the other device after reload
2. On PWA: edit a claim item → on phone, foreground the app.
- [ ] Phone shows the web edit
3. Dead-letter visibility:
- [ ] If any items show "need attention", the recovery UI lets you view/retry/discard

---

## Recording results

Mark each box, and for any failure note: device, OS version, browser, exact screen, and what happened. Paste failures back into the Cowork session — fixes get prioritized into Workstream 3.
