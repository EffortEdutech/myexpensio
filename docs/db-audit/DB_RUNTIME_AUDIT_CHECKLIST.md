# Database Runtime Audit Checklist

Goal: confirm whether legacy monetization/referral tables are still referenced anywhere in the repo or Supabase SQL layer before any destructive migration.

## 1. Tables to audit

- `agents`
- `commission_plans`
- `commission_ledger`
- `referral_attributions`
- `referral_visits`

## 2. What counts as a meaningful runtime reference

### High confidence
- direct `.from('table_name')`
- SQL `SELECT / INSERT / UPDATE / DELETE` against the table
- view/function/trigger definitions referencing the table
- foreign keys pointing to the table
- typed interfaces clearly modeling the table
- API handlers reading/writing the table

### Medium confidence
- helper functions or services mentioning table-specific IDs
- domain types with table-specific business fields
- UI/API route names whose only purpose is this old monetization stack

### Low confidence
- old comments
- archived docs
- lock docs
- migration notes
- deleted file lists

## 3. Review order

1. `apps/`
2. `packages/`
3. `supabase/`
4. `scripts/`
5. only then review docs if still needed

## 4. Decision rule per table

Each table should be marked as one of:

- **KEEP_ACTIVE** — still used by runtime
- **KEEP_TEMPORARILY** — runtime not confirmed yet / dependency unclear
- **DROP_CANDIDATE** — no runtime refs found, but still needs migration design
- **DROP_READY** — no runtime refs + dependencies cleared + migration sequence ready

## 5. Before any drop PR

Confirm all of the following:
- no runtime references remain
- no views/functions/triggers depend on it
- no exports/reports read it indirectly
- no foreign keys depend on it
- no seed/bootstrap code expects it
- no auth/onboarding flow still writes to it
- backup/export plan is ready

## 6. Output files expected from the script

- `audit-output/db-runtime-audit/db-runtime-audit-report-*.md`
- `audit-output/db-runtime-audit/db-runtime-audit-report-*.json`

## 7. Next PR after audit

Only after the report is reviewed:
- prepare migration order
- prepare backup strategy
- prepare destructive SQL in a separate PR
