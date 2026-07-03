# Migration Plan Draft — Legacy Monetization Tables

This is a planning draft only.
No destructive SQL belongs in this PR.

## Phase 1 — Audit only
- run `db-runtime-audit.ps1`
- collect markdown + JSON report
- classify each candidate table
- identify direct runtime references
- identify indirect SQL dependencies

## Phase 2 — Dependency confirmation
For each candidate table:
1. confirm whether any app route still queries it
2. confirm whether any service/helper still writes to it
3. confirm whether any Supabase view/function/trigger depends on it
4. confirm whether any table still references it via FK

## Phase 3 — Migration design
For each `DROP_CANDIDATE` table:
- define backup/export approach
- define drop order
- define rollback plan
- define verification query list

Typical order:
1. dependent views/functions/triggers
2. foreign keys/indexes if needed
3. leaf tables
4. parent tables

## Phase 4 — Migration-only PR
This should contain:
- SQL migration(s) only
- optional schema notes
- no unrelated UI refactors
- post-migration validation checklist

## Phase 5 — Verification
After migration PR:
- `pnpm validate`
- Vercel deploy
- quick smoke test for:
  - claims
  - rates
  - templates
  - exports
  - audit
  - org/member onboarding
  - beta provisioning flow

## Rollback expectation
Before any destructive drop:
- take schema backup
- keep table definitions captured
- keep data export if needed
