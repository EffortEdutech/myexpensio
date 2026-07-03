# Route Surface Lock

Snapshot source: successful `pnpm validate` after cleanup and post-deletion fixes.

Framework baseline:
- User app: Next.js 16.2.4
- Admin app: Next.js 16.2.4

---

## User app locked route surface

### App routes
```text
/
 /_not-found
 /accept-invite
 /auth-test
 /auth/callback
 /change-password
 /claims
 /claims/[id]
 /claims/[id]/tng-link
 /claims/new
 /dev/gps-sim
 /exports
 /forgot-password
 /home
 /login
 /manifest.webmanifest
 /offline
 /settings
 /settings/billing
 /setup
 /tng
 /tng/transactions
 /transactions
 /trips
 /trips/[id]
 /trips/odometer
 /trips/plan
 /trips/start
```

### API routes
```text
/api/auth/complete-first-login
/api/claims
/api/claims/[id]
/api/claims/[id]/items
/api/claims/[id]/items/[item_id]
/api/claims/[id]/submit
/api/claims/[id]/tng-link
/api/claims/[id]/tng-suggestions
/api/export/tng-preview
/api/exports
/api/exports/[id]/download
/api/exports/debug
/api/exports/history
/api/geocode
/api/invite/accept
/api/invite/validate
/api/report-templates
/api/reverse-geocode
/api/routes/alternatives
/api/routes/select
/api/scan/process
/api/settings/profile
/api/settings/rates
/api/tng/parse
/api/tng/statements/[batch_id]
/api/tng/transactions
/api/transactions
/api/transactions/[tng_id]/link
/api/trips
/api/trips/[id]
/api/trips/[id]/points
/api/trips/[id]/stop
/api/uploads/sign
/api/uploads/view
/api/usage
/api/usage/current
```

### Proxy
```text
apps/user/proxy.ts
```

---

## Admin app locked route surface

### App routes
```text
/
 /_not-found
 /audit
 /auth/callback
 /claims
 /claims/[id]
 /dashboard
 /exports
 /login
 /members
 /orgs
 /orgs/[id]/invites
 /orgs/new
 /rates
 /settings
 /templates
```

### API routes
```text
/api/admin/assignments
/api/admin/audit
/api/admin/audit-logs
/api/admin/claims
/api/admin/claims/[id]
/api/admin/export-jobs
/api/admin/exports
/api/admin/invitations
/api/admin/invitations/[inviteId]
/api/admin/members
/api/admin/members/[userId]
/api/admin/orgs
/api/admin/platform-config
/api/admin/rates
/api/admin/settings
/api/admin/stats
/api/admin/templates
/api/admin/templates/[templateId]
/api/beta/provision-user
```

### Proxy
```text
apps/admin/proxy.ts
```

---

## Explicitly not in the locked admin surface

These were removed from the active admin surface and are treated as legacy:
```text
/(protected)/billing
/(protected)/referrals
/api/admin/billing/*
/api/admin/referrals/*
/api/admin/webhooks/billing/*
/api/admin/partners/*
components/billing/*
components/referrals/*
lib/billing/*
lib/referrals/*
```

If any of the above reappears, it should be treated as deliberate scope expansion and reviewed as such.
