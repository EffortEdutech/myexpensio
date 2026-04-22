# Candidate Drop Order Template

This is a **tentative draft** until FK and object dependency audit is complete.

## Proposed drop sequence

### Stage A — clear dependent objects first
- views
- functions / RPCs
- triggers
- policies
- foreign keys
- generated types refresh after schema change

### Stage B — drop likely leaf tables first
Likely leaf candidates:
1. `referral_visits`
2. `referral_attributions`
3. `commission_ledger`

### Stage C — drop likely parent tables later
Likely parent candidates:
4. `agents`
5. `commission_plans`

## Why this order is tentative

Possible relationships inferred from names:
- `agents` may reference `commission_plans`
- `commission_ledger` may reference both `agents` and `commission_plans`
- `referral_attributions` may reference `agents` and user/org entities
- `referral_visits` may be standalone analytics/logging

So final drop order depends on the actual FK/object audit.

## Final approval condition

Do not finalize this order until:
- FK query results are known
- function/view/trigger dependency results are known
- rollback strategy is ready
