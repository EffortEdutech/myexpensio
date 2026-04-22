# DB Object Audit Report Template

## 1. Context

Audit target:
- legacy monetization / referral tables no longer represented in locked admin runtime surface

Audit date:
- 

Reviewer:
- 

## 2. Table-by-table findings

| Table | Repo Runtime Refs | Type Residue | FK Deps | Views | Functions/RPC | Triggers | Policies | Decision | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| agents | low | TBD | TBD | TBD | TBD | TBD | TBD | TBD | |
| commission_plans | none/low | TBD | TBD | TBD | TBD | TBD | TBD | TBD | |
| commission_ledger | none/low | TBD | TBD | TBD | TBD | TBD | TBD | TBD | |
| referral_attributions | none/low | TBD | TBD | TBD | TBD | TBD | TBD | TBD | |
| referral_visits | none/low | TBD | TBD | TBD | TBD | TBD | TBD | TBD | |

## 3. Repo object scan summary

Paste summary from:
- `audit-output/db-object-audit/*.md`

## 4. Supabase SQL audit summary

Paste results from:
- `sql/db-object-dependency-audit.sql`

### Foreign keys
- 

### Views
- 

### Functions / RPCs
- 

### Triggers
- 

### Policies
- 

### Other notes
- 

## 5. Conclusion

Recommended next status:
- [ ] stay at audit-only
- [ ] prepare migration-only PR
- [ ] block migration due to dependencies

## 6. Required follow-up before drop

- 
