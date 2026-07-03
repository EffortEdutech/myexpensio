# DB Object Dependency Checklist

Use this after the repo runtime audit.

## 1. What must be checked

For each candidate table, check:

- foreign keys referencing it
- views using it
- functions / RPCs mentioning it
- triggers on it
- RLS policies on it
- indexes on it
- generated type residue in app code
- seed/bootstrap SQL
- migration history mentioning it

## 2. Candidate tables

- `agents`
- `commission_plans`
- `commission_ledger`
- `referral_attributions`
- `referral_visits`

## 3. Decision states

- `KEEP_ACTIVE`
- `KEEP_TEMPORARILY`
- `DROP_CANDIDATE`
- `DROP_READY`

## 4. Minimum evidence required for DROP_READY

A table can be considered `DROP_READY` only if all are true:

- no app/runtime references remain
- no generated types still depend on it in practice
- no foreign keys depend on it
- no views depend on it
- no functions / triggers depend on it
- no RLS policies remain on it
- no seed/bootstrap/migration path still expects it
- rollback/backup path is documented

## 5. Likely interpretation based on current repo audit

- repo runtime references are already basically gone
- one remaining code residue is likely generated schema/types
- the remaining risk is now at the **database object** layer

## 6. Final gate before destructive migration

Only after this checklist is complete should a migration-only PR be prepared.
