# Type Sync Execution Checklist

## Audit
- [ ] Residue audit script executed
- [ ] Markdown report reviewed
- [ ] JSON report reviewed
- [ ] Likely DB type files identified
- [ ] Runtime code hits identified

## Type sync
- [ ] Supabase type generation command chosen
- [ ] Committed DB type file(s) regenerated or patched
- [ ] Removed DB objects gone from committed type file(s)

## Residue cleanup
- [ ] Runtime/API hits reduced to zero
- [ ] Any remaining hits are docs/history only
- [ ] `.next` folders cleared if needed

## Validation
- [ ] `pnpm validate` passes
- [ ] Vercel user green
- [ ] Vercel admin green
