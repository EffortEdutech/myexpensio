# Sprint 20-B — Subscription Feature Gating Sign-Off

**Date:** 2026-06-10
**Status:** COMPLETE (pending git push)

---

## Problem

`didekhena@gmail.com` (FREE tier, Employee role) could access all features that should be
gated. Root cause: three distinct bugs in the subscription enforcement layer.

---

## Fixes

### Bug 1 — `business_space` unlocked for testing, never restored

**File:** `apps/user-mobile-v2/src/features/subscription/featureGates.ts`

```diff
- business_space: "FREE",   // unlocked for testing — will restore to PREMIUM post-pilot
+ business_space: "PREMIUM",
```

**Impact:** Business Space (income, expenses, reports) now correctly requires PREMIUM.
FREE and PRO users see the `FeatureGate` locked screen.

---

### Bug 2 — `FeatureGate` showed internal dev copy

**File:** `apps/user-mobile-v2/src/features/subscription/components/FeatureGate.tsx`

Previous locked-state message was a placeholder dev note:
> "This area is already reserved in mobile v2. The server will remain the source of truth for subscription access."

Replaced with proper user-facing upgrade prompt:
- 🔒 icon
- "**{TIER} Feature**"
- "This feature requires a **{tier}** subscription. To upgrade, go to **Settings → Billing**."

---

### Bug 3 — `receipt_scan` defined as PRO but never enforced in UI

Camera scanning was gated in `featureGates.ts` (`receipt_scan: "PRO"`) but zero UI
components checked it. Added enforcement to all three scan entry points:

#### `ClaimDetail.tsx` — `ReceiptCaptureField` local component
- Added `useSubscription` + `canUseFeature` imports
- Added `const { tier } = useSubscription()` + `const canScan = canUseFeature(tier, "receipt_scan")` inside `ReceiptCaptureField`
- Camera button shows 🔒 icon and "PRO feature — upgrade to unlock" subtitle when locked
- On press when locked: `Alert("PRO Feature", "Camera scanning requires a PRO subscription...")`
- Gallery ("Attach from Gallery") remains available for all tiers ✅

#### `ReceiptPickerField.tsx` — shared component used by Personal + Business screens
- Added `useSubscription` + `canUseFeature` imports
- Camera Alert option shows "📷 Camera (PRO)" label when locked
- On press when locked: nested Alert explains the upgrade path
- Gallery option always available ✅

#### `TripsScreen.tsx` — `EvidenceCapture` component (odometer receipt)
- Added `useSubscription` + `canUseFeature` imports
- Same pattern: 🔒 icon + locked subtitle + Alert on press

---

## Supabase org subscription check (manual step required)

The Supabase MCP is connected to the pageCast project, not myexpensio.
Run the following in the **myexpensio Supabase Dashboard → SQL Editor**
(`https://supabase.com/dashboard/project/bzpmrcfxkawkuhyocemu`):

```sql
-- Check the Agent org subscription tier
SELECT
  u.email,
  om.role,
  o.id  AS org_id,
  o.name AS org_name,
  s.tier,
  s.status,
  s.trial_ends_at
FROM auth.users u
JOIN public.org_members om ON om.user_id = u.id
JOIN public.organizations o ON o.id = om.org_id
LEFT JOIN public.subscriptions s
  ON s.entity_id = o.id AND s.entity_type = 'ORG'
WHERE u.email IN ('rahenajessmin@gmail.com', 'didekhena@gmail.com')
ORDER BY u.email, om.role;
```

Expected: org `tier = 'FREE'` and `status = 'TRIALING'` (or EXPIRED).
If `tier = 'PRO'` or `'PREMIUM'`, correct it:

```sql
UPDATE public.subscriptions
SET tier = 'FREE', status = 'TRIALING'
WHERE entity_type = 'ORG'
  AND entity_id = (
    SELECT o.id FROM public.organizations o
    JOIN public.org_members om ON om.org_id = o.id
    JOIN auth.users u ON u.id = om.user_id
    WHERE u.email = 'rahenajessmin@gmail.com' AND om.role = 'OWNER'
    LIMIT 1
  );
```

---

## Files Changed

| File | Change |
|---|---|
| `apps/user-mobile-v2/src/features/subscription/featureGates.ts` | `business_space: "FREE"` → `"PREMIUM"` |
| `apps/user-mobile-v2/src/features/subscription/components/FeatureGate.tsx` | User-facing locked copy + lock icon |
| `apps/user-mobile-v2/src/features/claims/components/ClaimDetail.tsx` | `receipt_scan` PRO gate on camera in `ReceiptCaptureField` |
| `apps/user-mobile-v2/src/components/ReceiptPickerField.tsx` | `receipt_scan` PRO gate on camera option |
| `apps/user-mobile-v2/src/features/trips/components/TripsScreen.tsx` | `receipt_scan` PRO gate on `EvidenceCapture` camera |

---

## QA Scenarios

| # | User | Action | Expected |
|---|---|---|---|
| S1 | FREE / Employee (`didekhena`) | Open Business Space tab | 🔒 PREMIUM Feature gate screen |
| S2 | FREE / Employee | Open Claims → receipt → Scan Document | 🔒 icon + PRO alert on tap |
| S3 | FREE / Employee | Personal/Business expense → Attach Receipt → Camera | "📷 Camera (PRO)" → PRO alert |
| S4 | FREE / Employee | Trips → odometer → Scan Document | 🔒 icon + PRO alert on tap |
| S5 | FREE / Employee | Any of the above → Gallery / Photo Library | ✅ Works normally (not gated) |
| S6 | PRO user | Scan Document | ✅ Opens camera normally |
| S7 | PREMIUM user | Business Space | ✅ Full access |

---

## Tier reference

| Feature | Minimum Tier |
|---|---|
| `business_space` | PREMIUM |
| `exports` | FREE |
| `exports_pdf` | PRO |
| `personal_tax` | FREE |
| `receipt_scan` | PRO |
