# Initial Findings — Legacy DB Candidates

These are **pre-audit starting findings**, not final decisions.

## Why these tables are candidates

The current locked admin route surface no longer includes:
- billing pages
- referral pages
- billing APIs
- referral APIs
- billing webhooks
- partner monetization APIs

At the same time, the newer schema snapshot still includes the following older monetization/referral tables:
- `agents`
- `commission_plans`
- `commission_ledger`
- `referral_attributions`
- `referral_visits`

That makes them valid **runtime audit candidates**.

## Current interpretation

### Likely active app-core tables
These are aligned with the locked route surface and should be treated as active:
- `profiles`
- `organizations`
- `claims`
- `claim_items`
- `audit_logs`
- `invitations`
- `export_jobs`
- `rate_versions`
- `user_rate_versions`
- `report_templates`
- `platform_config`

### Likely legacy tables needing audit
- `agents`
- `commission_plans`
- `commission_ledger`
- `referral_attributions`
- `referral_visits`

## Important caution

“Not in the locked route surface” does **not** automatically mean “safe to drop”.

Possible hidden dependencies still need to be checked:
- Supabase views
- SQL functions / triggers
- beta provisioning flow
- old seed/bootstrap paths
- background scripts
- unlinked reports/exports
