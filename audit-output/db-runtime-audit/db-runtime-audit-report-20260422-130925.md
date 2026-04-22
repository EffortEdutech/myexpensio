# Database Runtime Audit Report

- Generated at: 2026-04-22 13:09:40
- Repo root: C:\Users\user\Documents\00 Reimbursement Assistant\myexpensio
- Scanned files: 233

## Summary

| Table | Matching Files | Matching Lines |
|---|---:|---:|
| agents | 2 | 2 |
| commission_plans | 1 | 1 |
| commission_ledger | 1 | 1 |
| referral_attributions | 1 | 1 |
| referral_visits | 3 | 7 |

## agents

- Matching files: 2
- Matching lines: 2

### APPLY_THIS_PR.md

- line 20 - keyword [agents] - - `agents`

### apps/admin/lib/types.ts

- line 203 - keyword [agents] - agents: {


## commission_plans

- Matching files: 1
- Matching lines: 1

### APPLY_THIS_PR.md

- line 21 - keyword [commission_plans] - - `commission_plans`


## commission_ledger

- Matching files: 1
- Matching lines: 1

### APPLY_THIS_PR.md

- line 22 - keyword [commission_ledger] - - `commission_ledger`


## referral_attributions

- Matching files: 1
- Matching lines: 1

### APPLY_THIS_PR.md

- line 23 - keyword [referral_attributions] - - `referral_attributions`


## referral_visits

- Matching files: 3
- Matching lines: 7

### APPLY_THIS_PR.md

- line 24 - keyword [referral_visits] - - `referral_visits`

### apps/admin/README.md

- line 34 - keyword [utm_campaign] - The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.
- line 34 - keyword [utm_medium] - The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.
- line 34 - keyword [utm_source] - The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### apps/user/README.md

- line 34 - keyword [utm_campaign] - The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.
- line 34 - keyword [utm_medium] - The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.
- line 34 - keyword [utm_source] - The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

## Reviewer next steps

1. Separate true runtime refs from comments/docs/history noise.
2. Check Supabase SQL objects for hidden dependencies.
3. Mark each table as KEEP_ACTIVE / KEEP_TEMPORARILY / DROP_CANDIDATE / DROP_READY.
4. Only then draft a migration-only PR.
