# Migration Draft — Legacy Monetization Tables

This is a migration draft only.
No destructive SQL is included yet.

## Current evidence

### From repo runtime audit
- table names are largely absent from active user/admin runtime code
- most hits were documentation noise
- the only notable code residue was a generated-type style hit for `agents` in `apps/admin/lib/types.ts`

### What remains to verify
- real DB object dependencies
- FK chain
- policies
- views
- functions / RPCs
- triggers

## Proposed migration PR structure

### PR 1 — audit + evidence
- repo audit reports
- SQL introspection results
- filled audit report template
- confirmed drop readiness status per table

### PR 2 — migration-only
- backup notes
- destructive SQL only
- post-migration type refresh
- removal of stale generated type residue
- validation checklist

## Post-migration work
After destructive migration:
- regenerate any DB-derived types
- verify `apps/admin/lib/types.ts`
- verify `apps/user` DB types if present
- run `pnpm validate`
- redeploy and smoke test

## Smoke test areas
- claims
- members / invitations
- orgs
- rates
- templates
- exports
- audit
- beta provisioning flow
