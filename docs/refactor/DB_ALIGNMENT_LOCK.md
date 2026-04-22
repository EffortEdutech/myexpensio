# Database Alignment Lock Notes

This is a **documentation PR only** for database alignment.
No destructive SQL is included here.

## 1. Principle

The application surface is now green.
That does **not** automatically mean the database snapshot is already minimal.

So the lock rule is:

- freeze the working app surface first
- document current DB alignment
- perform destructive DB cleanup later in a dedicated migration PR

## 2. App-core tables that clearly remain in active scope

These are part of the current working surface and should be treated as active:
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

These align with the current user/admin routes for claims, audit, exports, members, orgs, rates, templates, and settings.

## 3. Legacy / cleanup-candidate tables still visible in the schema snapshot

These appear to belong to older monetization/referral work and should be treated as **review-first cleanup candidates**:
- `agents`
- `commission_plans`
- `commission_ledger`
- `referral_attributions`
- `referral_visits`

Important:
- this document does **not** say they are safe to drop immediately
- it says they are no longer represented in the locked admin route surface
- they need one separate SQL/runtime audit before removal

## 4. Separation rule for future DB cleanup PR

A future DB cleanup PR should:
1. grep the entire repo for runtime references to each candidate table
2. confirm no remaining Supabase RPC/view/function depends on them
3. confirm no dashboard/report/export still queries them indirectly
4. ship as a migration-only PR
5. be validated again with `pnpm validate` after migration planning

## 5. Current conclusion

Current state is acceptable as:

- **app layer** = locked and green
- **database layer** = functional, but may still contain legacy tables that are now outside the locked app scope

That is a valid interim state.
