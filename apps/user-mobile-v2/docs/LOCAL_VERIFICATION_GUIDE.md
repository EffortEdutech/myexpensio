# Local Verification Guide

Date: 2026-05-22

This guide documents the Sprint 1 local verification flow for the clean
`apps/user-mobile-v2` rewrite.

## Scope

The verification flow must prove that the app can:

- Write a claim draft locally first.
- Read the claim draft back from SQLite.
- Create sync queue rows for local mutations.
- Survive a failed network sync attempt without losing the local claim.

## In-App Smoke Test

Open the Work Claims space and press:

```text
Run local-first smoke test
```

The smoke test creates its own claim and item, then simulates an offline sync
failure for only those smoke-test queue rows.

Expected result:

```text
SQLite read-back: pass
Failed sync kept claim: pass
Smoke queue pushed/failed: 2/2
```

## Manual Runtime Check

Run from the monorepo root:

```text
corepack pnpm -C apps/user-mobile-v2 start
```

Then choose one runtime:

```text
w
```

for web, or scan the Expo QR code with a development-capable mobile runtime.

Manual checks:

- Create a claim with `Create claim + item`.
- Refresh or restart the runtime.
- Confirm the claim remains visible.
- Run the smoke test.
- Confirm failed sync does not remove the smoke-test claim.

## Boundary

This verification belongs only to:

```text
apps/user-mobile-v2
```

Do not modify or stage:

```text
apps/user
```
