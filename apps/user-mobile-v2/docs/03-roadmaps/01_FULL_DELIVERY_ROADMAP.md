# Full Delivery Roadmap

The complete finish-line roadmap for MyExpensio user mobile v2 lives at:

```text
docs/USER_MOBILE_V2_FULL_DELIVERY_ROADMAP.md
```

Sprint 1 remains the detailed execution checklist for the first local-first foundation sprint:

```text
apps/user-mobile-v2/docs/SPRINT_1_COMPREHENSIVE_CHECKLIST.md
```

## Sprint Sequence

```text
Sprint 0  - Project baseline and parity lock                         ✅
Sprint 1  - Local-first core and Work Claims draft slice             ✅
Sprint 2  - Auth, session, bootstrap sync, and user shell            ✅
Sprint 3  - Work Claims core parity                                  ✅
Sprint 4  - Trips, mileage, routes, GPS, and odometer                ✅
Sprint 5  - Receipt, scan, and file upload hardening                 ✅
Sprint 6  - TNG import, transactions, linking, and appendix support  ✅
Sprint 7  - Exports, reports, and usage limits                       ✅
Sprint 8  - Personal Expense space parity                            ✅
Sprint 9  - Business Space / My Income parity                        ✅
Sprint 11 - Sync engine production hardening                         ✅  (pulled forward)
Sprint 12 - Backend/NestJS sync API and Supabase integration         ✅  (pulled forward)
Sprint 13 - Security, privacy, compliance, and data retention        ✅
Sprint 10 - Settings, billing, account, and legal                    ✅
Sprint 14 - Performance, accessibility, and UX polish                ✅
Sprint 15 - End-to-end QA and feature parity sign-off               ← ACTIVE
Sprint 16 - Release build and store preparation
Sprint 17 - Pilot rollout
Sprint 18 - Production launch and old app transition
Sprint 19 - Post-launch stabilization
```

## Locked execution order (from 2026-05-30)

Remaining sprint order locked: **13 → 10 → 14 → 15 → 16 → 17 → 18 → 19**

Rationale: With backend sync live (Sprints 11 & 12), real user data now flows to
Supabase. Sprint 13 (security/compliance) must precede Sprint 10 (billing/settings)
to harden data safety before onboarding real users. Sprint 13 also unblocks the
receipt upload pipeline and XLSX/PDF server-side export generation.

