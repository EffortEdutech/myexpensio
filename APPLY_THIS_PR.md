# APPLY THIS PR — DB Type Sync + Schema Residue Cleanup

This PR is the safe code-side follow-up after the DB cleanup migration.

## Goal

1. Identify stale references to removed DB objects in code and committed type files.
2. Regenerate or patch committed DB types.
3. Confirm residue is limited to docs/history only.
4. Re-run full app validation.

## Included files

- `scripts/type-sync-schema-residue-audit.ps1`
- `scripts/print-type-gen-commands.ps1`
- `docs/db-audit/TYPE_SYNC_EXECUTION_CHECKLIST.md`
- `docs/db-audit/TYPE_SYNC_MANUAL_REPLACEMENT_GUIDE.md`
- `docs/db-audit/RESIDUE_SEARCH_TERMS.md`

## Apply order

1. Run:
   `powershell -ExecutionPolicy Bypass -File .\scripts\type-sync-schema-residue-audit.ps1`
2. Review the report.
3. Use the suggested Supabase type generation commands.
4. Re-run the audit until runtime/type hits are clean.
5. Run `pnpm validate`.

## Expected finish state

Removed object names should not remain in:
- runtime code
- committed DB types
- app-facing schemas

They may still remain in:
- old audit reports
- historical docs
- locked migration notes
