# Sprint 2 Auth Bootstrap Checklist

Date: 2026-05-22

Parent roadmap:

```text
docs/USER_MOBILE_V2_FULL_DELIVERY_ROADMAP.md
```

## Sprint Goal

Make the mobile v2 app behave like an authenticated user app shell while
keeping backend integration behind API boundaries.

## Guardrails

- [x] Do not modify `apps/user`.
- [x] Do not call Supabase directly from mobile screens.
- [x] Do not store service role or secret keys in the mobile app.
- [x] Keep development sign-in clearly separate from production auth API.
- [x] Keep Free tier as the default zero-budget state.

## Auth Shell

- [x] Restore auth session on app start.
- [x] Show signed-out screen when no session exists.
- [x] Show signed-in app shell only after session restore.
- [x] Save session to secure native storage.
- [x] Use web local storage fallback for Expo web/PWA testing.
- [x] Add development sign-in path.
- [x] Add sign-out path.

## Bootstrap Cache

- [x] Cache profile after sign-in.
- [x] Cache Free subscription after sign-in.
- [x] Cache Work Claims space after sign-in.
- [x] Cache Personal Expense space after sign-in.
- [x] Cache Business Space after sign-in.
- [ ] Replace development bootstrap with `GET /sync/bootstrap`.

## Existing API Boundaries

- [x] Keep login API client boundary.
- [x] Keep logout API client boundary.
- [x] Keep invite validation API client boundary.
- [x] Keep complete-first-login API client boundary.
- [x] Keep sync bootstrap API client boundary.

## Verification

- [x] Run typecheck.
- [x] Run Expo bundle/export check.
- [x] Start app locally after auth shell.
- [ ] Sign in with development session.
- [ ] Confirm session restores after reload/restart.
- [ ] Confirm sign-out returns to login screen.

Runtime note:

```text
2026-05-23: Expo web server started on http://localhost:8082 and returned HTTP 200 after the auth shell changes.
```

## Commit Reminder

Stage only:

```text
git add apps/user-mobile-v2
```

Then:

```text
git commit -m "Start Sprint 2 auth bootstrap shell"
git pull --rebase --autostash
git push
```
