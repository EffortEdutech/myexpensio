# User Mobile V2 V1 Parity Lock

Date: 2026-05-24

## Purpose

This document resets the user mobile v2 delivery discipline.

The goal of `apps/user-mobile-v2` is not to invent a new product. It is to rebuild the existing `apps/user` experience in a clean local-first Expo/React Native app while preserving v1 feature behavior, flow, and user friendliness.

From this point onward, a sprint is not considered signed off because a screen exists. A sprint is signed off only when the feature works end to end, or when it is explicitly labelled as UI-only/foundation and not counted as parity.

## Product Concepts To Preserve

### Work Claims / Team / Internal Staff

V1 default space is Work Claims. Users create work claims for reimbursement, add claim items, attach receipts, link trips and TNG transactions, submit claims, and export claim reports. Work data belongs to the active organization/workspace.

Team and internal staff concepts exist around organization membership, roles, billing, entitlements, and bypass gates:

- `org_members` and active org membership scope work claims.
- Internal roles such as `SUPER_ADMIN` and `SUPPORT` can bypass certain gates, such as Business Space access.
- Team workspace billing can be organization-level, while agent/solo user billing can be user-level.

### Agent / Solo User

V1 billing comments identify the individual subscriber as an agent-style user. In practical user-app terms, this means a solo user may use the app for personal work claims, personal finance, and business/earning records without a team owner managing every action.

Agent/solo user behavior must not be flattened into only employee reimbursement. V2 must preserve both user-level subscription and workspace-level subscription concepts.

### Personal Expense

V1 Personal Expense is a separate financial space. It includes personal expenses, bills/commitments, tax-deductible evidence, yearly summaries, and personal tax reports. It is not the same as Work Claims.

### Business Space / My Income

V1 Business Space is a Premium/internal-staff gated space. It includes business dashboard, income, expenses, add income, add expense, reports, profit summaries, and LHDN business tax summaries.

V1 labels this space as `My Income` in the space switcher and `Business Space` in some routes. V2 must preserve the concept even if final naming is standardized later.

### Settings / Account / Billing / Legal

V1 settings includes profile, claimant profile, claim rates, billing, subscription, legal/privacy, and account actions. Header gear opens a profile dropdown first, not a direct settings route.

## Parity Status Legend

- `PARITY`: Works end to end like v1.
- `PARTIAL`: Some real behavior exists, but feature is incomplete.
- `FOUNDATION`: Schema/state/local groundwork exists, but user-facing behavior is not v1 parity.
- `UI ONLY`: Mostly visual shell; no real data/function parity.
- `DUMMY`: Uses sample/fake behavior that can mislead users if presented as real.
- `MISSING`: Not implemented in v2.

## Current V2 Status Matrix

| Area | V1 Reference | V1 Behavior | V2 Status | Honest Status | Required For Parity Sign-Off |
| --- | --- | --- | --- | --- | --- |
| App shell / header | `components/SpaceSwitcher.tsx`, `components/ProfileDropdown.tsx`, `components/SmartNav.tsx` | Header space switcher, gear dropdown with profile/subscription/settings/sign out, per-space bottom nav | Implemented in `AppShell` | PARTIAL | Match v1 labels, locked Business behavior, dropdown behavior, and per-space nav actions |
| Work Claims list | `app/(app)/claims/page.tsx` | All/Draft/Submitted claim list, totals, create claim | Implemented locally | PARTIAL | Visual/flow parity, correct counts, persisted local state, sync behavior, status rules |
| Work Claim detail | `app/(app)/claims/[id]/page.tsx` | Claim item list, add item modals, delete, submit, TNG link, receipt attachment | Implemented locally with modals/items | PARTIAL | Modal UX must match v1, all claim item types must behave correctly, edit/delete rules must be explicit |
| Claim item APIs | `app/api/claims/[id]/items/route.ts`, `[item_id]/route.ts` | Validates rates, trips, TNG links, receipts, and claim status | Local repository exists | PARTIAL | Local validation must match v1; submitted/approved claims must lock editing correctly |
| Receipts / scan | `components/DocumentScanner.tsx`, `ReceiptUploader.tsx`, `api/scan/process`, `api/uploads/sign` | Camera/scan/gallery, signed upload, view URLs, upload status | Metadata and upload worker foundation exist | FOUNDATION | Real camera/gallery file capture, upload worker tested, failure/retry UX, view/download receipt |
| Trips list | `app/(app)/trips/page.tsx` | Trip list, active GPS banner, Start GPS, Odometer, Mileage Calculator FABs | Implemented locally | PARTIAL | Confirm list/detail/edit/delete rules, active trip behavior, claim linking |
| Mileage Calculator | `app/(app)/trips/plan/page.tsx`, `components/RouteMap.tsx`, `api/geocode`, `api/routes/alternatives` | Leaflet map, live search, origin/destination, current position, route alternatives, usage gate | Implemented locally with map/search/route | PARTIAL | Runtime QA against v1, no overlap bugs, reset behavior, saved trip opens detail, route usage limits |
| GPS trip | `app/(app)/trips/start/page.tsx`, `api/trips/[id]/points` | Start/resume/stop GPS trip and route points | Local placeholder/partial | FOUNDATION | Actual GPS tracking, point persistence, resume flow, stop flow |
| Odometer trip | `app/(app)/trips/odometer/page.tsx`, `api/uploads/sign` | Start/end readings, evidence photos, odometer override/evidence modes | Partial UI added | PARTIAL | Start/end photo capture/upload, validation, detail view, edit/delete rules |
| TNG statement import | `app/(app)/tng/page.tsx`, `api/tng/parse/route.ts` | Upload/drop PDF, backend parser returns rows/meta/source path, preview rows before save | V2 currently uses sample rows after file selection | DUMMY | Remove fake parsing from production path; wire backend parser or create honest manual/CSV import fallback |
| TNG transaction library | `api/tng/transactions`, `api/tng/statements/[batch_id]` | Save parsed rows, group by statement, delete unclaimed batch, track claimed rows | Local DB/repository exists | FOUNDATION | Real imported rows, duplicate detection, claimed deletion guard, statement source preservation |
| TNG claim linking | `app/(app)/claims/[id]/tng-link/page.tsx`, `api/claims/[id]/tng-link` | Suggest/link/unlink eligible TNG rows to claim items | Local linker exists | PARTIAL | Suggestions, link/unlink, claimed flags, amount/type validation, return-to-claim flow |
| Exports CSV | `app/(app)/exports/page.tsx`, `api/exports/route.ts` | Select claims, generate CSV blob, browser downloads file, usage counter increments | CSV local download added | PARTIAL | Manual Chrome/Edge file confirmation, v1 columns, history redownload, usage counters |
| Exports PDF | `api/exports/route.ts`, `lib/pdf-builder.ts` | Server builds PDF with layout, receipt/TNG appendices, declaration/signature | Not implemented in v2 | MISSING | Backend sync/export API or native PDF generator with v1 layout |
| Exports XLSX | `api/exports/route.ts`, `lib/export-builder.ts` | Server builds XLSX file | Not implemented in v2 | MISSING | Backend sync/export API or approved XLSX generator |
| Export history/download | `api/exports/history`, `api/exports/[id]/download` | Stored export jobs and downloadable history | Local CSV history only | PARTIAL | PDF/XLSX history, signed URLs/backend storage, expired link UX |
| Usage limits | `api/usage/current`, `lib/usage-limits.ts`, `lib/entitlements.ts` | Free/Pro/Premium limits for trips/routes/exports, org/user subscriptions, overrides | Local counters only | FOUNDATION | Entitlement sync, org/user billing resolution, trial messaging, backend enforcement |
| Auth/login | `app/(auth)/login`, `forgot-password`, `accept-invite`, `auth/callback` | Supabase login, reset, invite accept, first-login completion | Dev/local sign-in and session restore | FOUNDATION | Real Supabase auth, invite accept, password reset, session refresh |
| Biometric login | `components/auth/BiometricLoginButton.tsx`, `settings/BiometricLoginCard.tsx` | Device capability and biometric login settings | Local placeholder files only | MISSING | Native biometric capability, secure session binding, settings toggle |
| Spaces API | `api/spaces/route.ts` | Auto-create Personal for all, Business for Premium/internal staff, returns tier/trial | Static local spaces in shell | FOUNDATION | Local cached spaces from backend bootstrap, Business gate, internal staff bypass |
| Personal home | `app/(app)/personal/page.tsx` | Yearly summary cards: expenses, bills paid, tax deductible | Nav placeholder only | UI ONLY | Local ledger summary, year picker, cards, monthly strip |
| Personal expenses | `personal/expenses`, `personal/add`, `api/ledger`, `api/upload/expense-receipt` | Add/list personal expenses, receipt upload, tax deductible metadata | Not implemented | MISSING | Ledger schema/repository, add form, list/edit/delete, receipt upload |
| Personal bills | `personal/bills`, `personal/bills/add`, `api/commitments` | Commitments, payment marking, auto expense behavior | Not implemented | MISSING | Commitment schema/repository, bill schedule, payment states |
| Personal tax | `personal/tax`, `api/reports/tax-personal` | Tax-deductible summary and report | Not implemented | MISSING | Tax categorization, report endpoint/sync, UI parity |
| Business dashboard | `business/page.tsx`, `api/reports/profit-summary` | Monthly profit dashboard with 12-month chart | Nav placeholder only | UI ONLY | Business ledger summary and chart |
| Business income | `business/income`, `business/add-income`, `api/ledger` | Add/list income by source/category | Not implemented | MISSING | Income ledger schema/repository, forms, list/edit/delete |
| Business expenses | `business/expenses`, `business/add-expense` | Add/list business expenses | Not implemented | MISSING | Expense ledger schema/repository, receipt/tax metadata |
| Business reports | `business/reports`, `api/reports/tax-business`, `api/reports/pl-pdf` | P&L, business tax summary, PDF report | Not implemented | MISSING | Reports, PDF export, premium gate |
| Settings profile/rates | `settings/page.tsx`, `api/settings/profile`, `api/settings/rates` | Profile, claimant profile, mileage/per-diem/category rates | Local settings store/panel exists | PARTIAL | Field parity, persistence/sync, rate application in claims/trips |
| Billing/subscription | `settings/billing`, `upgrade`, billing APIs | Checkout, portal, plan summary, usage/billing display | Local FREE label only | MISSING | Real billing summary, checkout/portal links, tier sync |
| Legal/offline/PWA | `privacy`, `terms`, `offline`, manifest/PWA components | Legal pages, PWA install/offline behavior | Mostly not implemented in v2 | MISSING | Legal screens, offline screen, PWA/native equivalent decisions |
| Sync engine | V1 server APIs, v2 local-first docs | V1 online DB; v2 must queue local changes and sync | Queue and API contract foundation | FOUNDATION | Backend NestJS/Supabase sync API, conflict handling, retries, auth |

## Sprints Reclassified

| Sprint | Previous Label | Correct Status Now | Reason |
| --- | --- | --- | --- |
| Sprint 0 | Project baseline and parity lock | PARTIAL | This parity lock was missing until now |
| Sprint 1 | Local-first core and Work Claims draft slice | PARTIAL | Local DB exists, but full parity gates were not enforced |
| Sprint 2 | Auth, session, bootstrap sync, and user shell | FOUNDATION | Dev/local auth only; real Supabase/invite/session bootstrap incomplete |
| Sprint 3 | Work Claims core parity | PARTIAL | Claims work locally but UI/function parity still has gaps |
| Sprint 4 | Trips, mileage, routes, GPS, odometer | PARTIAL | Mileage map exists; GPS/odometer evidence and runtime QA still incomplete |
| Sprint 5 | Receipt, scan, upload hardening | FOUNDATION | Metadata/upload worker exists, but real capture/upload parity incomplete |
| Sprint 6 | TNG import, transactions, linking, appendix | NOT SIGNED OFF | TNG import currently uses sample rows; real PDF parsing is not wired |
| Sprint 7 | Exports, reports, usage limits | NOT SIGNED OFF | CSV local download is partial; PDF/XLSX/report export missing |

## New Delivery Rule

Every future sprint must declare one of these pass types before implementation:

1. `UI/UX pass`: Screen and interaction design only. Must not be called functional parity.
2. `Local function pass`: Feature works locally/offline with real user-entered data.
3. `Backend integration pass`: Feature talks to real backend/API/storage.
4. `Parity sign-off pass`: Feature matches v1 behavior end to end and passes runtime QA.

No dummy/sample path may appear as a normal production action. If sample data is useful for development, it must be clearly marked `Dev Sample` and hidden or gated before sign-off.

## Immediate Recovery Backlog

Before Sprint 8, complete these recovery items:

1. Replace Sprint 6 TNG dummy import with an honest flow:
   - Option A: wire v2 to backend `/api/tng/parse` once backend/API base is ready.
   - Option B: implement a real local manual/CSV import fallback and label PDF parsing as backend-required.
   - Remove `Use Sample Preview` from normal user flow.

2. Finish Sprint 7 honestly:
   - Confirm CSV download in Chrome/Edge.
   - Match v1 export columns.
   - Keep PDF/XLSX disabled or backend-required until real generation exists.
   - Do not sign off PDF/XLSX until files are created and downloadable.

3. Improve Work Claims parity:
   - Audit every v1 add-item modal and mirror the user-friendly flow.
   - Confirm item view/edit/delete rules.
   - Confirm submitted claim lock rules.

4. Re-audit Trips:
   - Mileage calculator map/search/reset/detail must pass runtime QA.
   - Odometer evidence photos must be real, not decorative.
   - GPS trip start/resume/stop must be either real or explicitly deferred.

5. Only then proceed to Sprint 8 Personal Expense parity.

## Commit Discipline

Future commits should include the sprint/pass type in the message:

```text
feat(user-v2): Sprint 6 recovery real TNG import boundary
feat(user-v2): Sprint 7 CSV export parity pass
docs(user-v2): add v1 parity lock and sprint reclassification
```

Before asking the user to commit, Codex must state:

- what is real,
- what is UI-only,
- what is dummy/sample,
- what is still blocked,
- what was verified.
