# Type Residue Cleanup + Audit Tooling Archive

## Objective

Close the last known runtime residue from the legacy admin monetization refactor, then stabilize the audit tooling so future scans focus on runtime code instead of historical notes or one-off fixer scripts.

## Scope in this PR

1. Replace `apps/admin/lib/types.ts` with a clean version that removes the unused `BillingStats` type.
2. Replace the canonical audit scripts so they scan runtime paths by default:
   - `scripts/db-runtime-audit.ps1`
   - `scripts/type-sync-schema-residue-audit.ps1`
3. Archive one-off fixer scripts into `scripts/archive/2026-04-refactor-audit-fixes/` using:
   - `scripts/archive-audit-tooling.ps1`

## Why this PR is safe

- `BillingStats` is no longer used by the current admin route surface.
- The replacement audit scripts are read-only. They only scan files and write reports into `audit-output/`.
- The archive script only moves known one-off fixer files and does not touch runtime app code.

## Manual apply order

1. Copy the replacement files from this pack into the repo.
2. Run:
   - `powershell -ExecutionPolicy Bypass -File .\scripts\archive-audit-tooling.ps1`
3. Verify:
   - `pnpm validate`
   - `powershell -ExecutionPolicy Bypass -File .\scripts\db-runtime-audit.ps1 -FailOnHits`
   - `powershell -ExecutionPolicy Bypass -File .\scripts\type-sync-schema-residue-audit.ps1 -FailOnHits`

## Expected result

- Builds stay green.
- Runtime residue report should return zero runtime hits after the `BillingStats` cleanup.
- Historical audit notes can remain in docs, but default runtime audits will stop counting them.
