# DB Object Dependency Audit + Migration Draft Cleanup / Finalization

## Purpose

This PR finalizes the DB object dependency audit phase by doing three things:

1. keeping one canonical dependency-audit SQL file
2. keeping one canonical verification SQL file
3. archiving old draft SQL files that were used during investigation

## Files in this pack

- `scripts/finalize-db-object-audit-drafts.ps1`
- `supabase/sql/db-object-dependency-audit-final.sql`
- `supabase/sql/verify-legacy-monetization-objects-absent.sql`
- `docs/db-audit/DB_OBJECT_DEPENDENCY_FINALIZATION.md`

## What to do

### 1. Copy files into repo

Place the files in the exact paths above.

### 2. Run the final audit SQL in Supabase

Run:

- `supabase/sql/db-object-dependency-audit-final.sql`

Expected intent:

- BLOCK 1 should show no legacy objects if cleanup migration has already been applied.
- BLOCK 2 to BLOCK 5 should also ideally return no rows.

### 3. Run the verification SQL in Supabase

Run:

- `supabase/sql/verify-legacy-monetization-objects-absent.sql`

Expected result:

- `Success. No rows returned`

### 4. Archive the old draft SQL files from repo root

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\finalize-db-object-audit-drafts.ps1
```

This moves these files into:

- `supabase/archive/2026-04-db-object-audit-drafts/`

Target draft files:

- `db-object-dependency-audit.sql`
- `db-object-dependency-audit-fixed.sql`
- `db-object-dependency-audit-minimal.sql`
- `block7-fixed.sql`

### 5. Re-run runtime verification locally

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\db-runtime-audit.ps1
pnpm validate
```

## Why this PR matters

Without this cleanup/finalization step:

- the repo keeps multiple confusing draft SQL files
- the audit trail is harder to follow
- runtime audit reports keep surfacing non-runtime investigation residue

With this PR:

- one final SQL audit file remains
- one final verification query remains
- investigation drafts are preserved, but moved out of the active root

## Suggested commit message

```text
chore: finalize db object dependency audit and archive draft sql
```
