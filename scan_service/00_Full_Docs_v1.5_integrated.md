# Documentation Checklist

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 00-DOCS-CHECKLIST  
**Version:** v1.2  
**Date:** 02 Mar 2026  
**Owner:** Darya Malak  
**Status:** Updated (Phase 1 docs complete + admin/multi-tenant integrated)

---

## Purpose
This checklist defines the **complete documentation pack** required before development starts, so engineering, QA, and product are aligned.

## Locked decisions (baseline)
- **Currency (default):** MYR  
- **Distance unit (display):** KM (internally store meters)  
- **Tier limits (Phase 1 baseline):**
  - Free: **2 route-calculations/month**
  - Pro: **unlimited trips, exports, route-calculations**
- **Claims:** `SUBMITTED` claims are **locked** (no edits in Phase 1)
- **Architecture direction (locked)**
  - **Two Next.js apps**: User App + Internal Admin App
  - **Multi-tenant** (Organizations/Companies; data scoped by `org_id`)
  - **Invite-only onboarding** (no public sign-up)
  - Admin access: **DB role** (`profiles.role = ADMIN`) + server-side privilege checks

---

## Document Pack (Phase 1)

### Product & UX
- [x] 01 — PRD (Product Requirements Document) **LOCKED**
- [x] 02 — User Stories & Acceptance Criteria
- [x] 03 — UX Flows (text-first)
- [x] 14 — UI Copy & Microcopy
- [x] 19 — UI Screen Specification (User App + Admin App) **UPDATED**
- [x] 22 — UI State Machine Specification
- [x] 24 — Mock Data Pack (frontend build before backend)
- [x] 25 — Design System & UI Kit Specification — Phase 1

### System & Engineering
- [x] 04 — Architecture Blueprint (canonical)
- [x] 05 — API Specification (OpenAPI skeleton) **LOCKED**
- [x] 06 — Database Schema & Migrations Plan **UPDATED (org/invite additions reflected in integrated pack)**
- [x] 07 — Mobile Technical Spec
- [x] 08 — Route Engine & Cost Controls Spec
- [x] 09 — Distance Logic: Single Source of Truth **LOCKED**
- [x] 17 — Export Specification (CSV/XLSX)
- [x] 18 — Data Dictionary
- [x] 20 — Frontend Component Architecture
- [x] 21 — Frontend Scaffold Checklist
- [x] 23 — Frontend Data Types & Interfaces **UPDATED**
- [x] 26 — Navigation & Screen Scaffolding Plan — Phase 1
- [x] 28 — API Contracts for Frontend **UPDATED (org/invite/admin sections)**
- [x] 28B — API Error Code → UI Mapping

### Reliability (Offline + Uploads)
- [x] 29 — Offline Queue & Sync Specification
- [x] 29B — Upload Retry & Media Handling Specification

### Ops, Security, QA
- [x] 10 — Security & Privacy Spec
- [x] 11 — Monitoring & Incident Runbook
- [x] 12 — QA Test Plan (matrix + edge cases)
- [x] 15 — Release Checklist (pre-prod → prod)
- [x] 31 — CI/CD & Deployment Runbook (Dev/Staging/Prod)
- [x] 32 — UAT Checklist & Test Scripts
- [x] 33 — Support FAQ & In-app Help
- [x] 34 — Privacy Policy + Terms + Data Retention (template)

### Execution Planning
- [x] 13 — Sprint Roadmap (8-week plan)
- [x] 16 — Engineering Task Breakdown (Jira-ready epics/stories)
- [x] 27 — Mock-first Implementation Sprint Plan (Frontend)
- [x] 27B — Frontend Component Task List (Jira-ready)

### Backend Delivery
- [x] 30 — Backend Implementation Plan (build order + modules)

### Multi-tenant + Admin (added by latest architecture decisions)
- [x] 35 — Multi-tenant Data Model + RLS Policy Spec
- [x] 36 — Invite-only Onboarding Spec (Org creation → invite → acceptance → provisioning)
- [x] 37 — Internal Admin App Security Model (admin gating, audit logs, safe “view all” access)

### Reference
- [x] 99 — Project Chat Log Reference

---

## Notes
- The “source of truth” is now consolidated in the **integrated compiled pack (v1.4)** plus the **Admin-extended UI spec (v1.1)**.
- If you want the docs split into separate files again for repo use, we can export **Doc 35–37** as standalone MD files (they currently exist inside the compiled pack).

---

## Change log
- **v1.2 (02 Mar 2026):** Marked multi-tenant + invite-only + admin security docs as complete, and updated checklist to reflect the Admin-extended UI spec.

# 1 PRD — Phase 1

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 01-PRD-P1  
**Version:** v1.2  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Locked (Baseline for Development)

---
## Baseline lock
This document is **locked as the Phase 1 baseline**. Any change that affects behavior, data shape, or exports must be made via:
- A **version bump** to this PRD, and
- A matching update to **Doc 09 (Distance Logic)** and/or **Doc 05 (API Spec)** when applicable.

## Canonical decisions (locked)
- Phase 1 supports **Mileage + Meal + Lodging** claims with export to CSV/XLSX.
- Mileage capture supports **two calculation modes**:
  - `GPS_TRACKING` (manual Start/Stop), and
  - `SELECTED_ROUTE` (planned trip with route alternatives + user selection).
- Odometer supports **two modes**:
  - `EVIDENCE_ONLY` (store photos/readings; does **not** override official distance), and
  - `OVERRIDE` (odometer becomes the official distance).
- Claims become **locked after submission** (no edits in Phase 1).

## Deferred (explicitly not in Phase 1)
- OCR / automatic receipt parsing
- Automatic background trip detection
- Multi-approver / approval workflow
- Tax integrations and payroll integrations

---
## 1) Problem Statement
Professionals who travel for work (outstation, site visits, client meetings) waste time compiling:
- Mileage claims (distance + rate)
- Meal claims (receipt or company rate)
- Lodging claims (receipt or company rate)
…and then manually calculating totals and preparing exports for finance.

## 2) Goals
### Product goals (Phase 1)
- Enable **fast, accurate** mileage claims with **audit-friendly evidence**.
- Support both **GPS tracked trips** and **planned trips** (route selection) with cost controls.
- Support **meal & lodging claims** using receipt upload or fixed rates.
- Produce **finance-friendly export** (CSV/Excel) and basic summary views.
- Subscription-ready (Free vs Pro) with hard limits and upgrade flow.

### Business goals
- Subscription SaaS for individuals and small teams.
- Minimize 3rd-party API costs (Maps/Routes) using caching and limits.

## 3) Non-Goals (Phase 1)
- OCR/AI receipt scanning and auto-categorization
- Automatic trip detection (background always-on)
- Full enterprise multi-approver workflows (basic “submit” only)
- Tax filing integrations

## 4) Target Users & Personas
- **Solo professional**: consultant, auditor, engineer, project manager
- **Small team lead**: needs monthly exports for finance
- **Frequent traveler**: wants fast capture and strong proof (GPS/odometer photos)

## 5) Core Features (Phase 1)

### Scope summary (locked)

| Area | Included in Phase 1 | Notes |
|---|---|---|
| Auth & profile | ✅ | Email/password (or provider), basic profile |
| Trips | ✅ | GPS Start/Stop and Planned trips (Selected Route) |
| Odometer | ✅ | Evidence-only + Override modes |
| Claims | ✅ | Draft → Submit (lock), items: mileage/meal/lodging |
| Export | ✅ | CSV + XLSX, deterministic totals |
| Subscription gating | ✅ | Server-side enforced usage limits |
| Approvals workflow | ❌ | Deferred |
| OCR receipts | ❌ | Deferred |

### A) Mileage capture modes
1. **GPS Start/Stop Tracking**
- Manual start/stop trip tracking
- Generates GPS polyline (trip points) and computes GPS distance
2. **Selected Route (Planned Trip)**
- User enters origin + destination
- App fetches alternative routes
- User selects preferred route and distance is stored
- Routes are cached to reduce API cost
3. **Odometer (Dual Mode)**
- Evidence-only: photo stored, distance not overridden
- Distance override: odometer distance becomes official distance

### B) Claim engine
- Create claim (draft)
- Add items:
- Mileage (per km/mi rate)
- Meal (receipt or fixed rate)
- Lodging (receipt or fixed rate)
- Category tagging (client/project/category)
- Submit/lock claim (prevent editing after submission)

### C) Export engine
- Export by date range and filters
- CSV and Excel exports
- Export includes distances, computed amounts, and evidence indicators

### D) Subscription gating
- **Free:** 2 route-calculations/month
- **Pro:** unlimited trips, exports, route-calculations

> Phase 1 baseline only enforces route-calculation limits (server-side). Trips/exports may be tracked for analytics but are not hard-limited.

## 6) Functional Requirements
### Trips
- Each trip has a `calculation_mode`: `GPS_TRACKING` or `SELECTED_ROUTE`.
- Only the relevant distance for that mode is expected to be populated (plus optional odometer evidence).
- Start trip, stop trip
- Store timestamps, points (when using GPS), summary distance
- Attach optional odometer images and odometer reading
- Support offline capture where reasonable (queue events, sync later)

### Claims
- Draft claim editable
- Submitted claim locked (editable only by explicit “unlock” for admin / future phase)
- Totals computed deterministically and exportable

### Distances & amounts
- Distances stored in a single unit (recommended: meters internally, display km/mi)
- Final “official distance” stored per trip/claim item based on distance priority rules (see Doc 09)

## 7) Non-Functional Requirements

## 7A) Policy parameters (configurable, but required in Phase 1)
- **Currency (default):** MYR
- **Distance unit (display):** KM  
- Internally store meters (`*_distance_m`) and convert for UI/export.
- **Subscription limits (Phase 1 baseline):**
- **Free:** 2 route-calculations per month; trips/export are **not limited** in Phase 1 baseline
- **Pro:** unlimited trips, exports, and route-calculations

- Mileage rate (per km) is configured per user and versioned.
- Meal/Lodging policy supports receipt-based amount OR fixed-rate amount (per user/company).
## 7B) Data retention (Phase 1 baseline)
- Data is retained until the user deletes it or deletes their account.
- Location points are collected only during active trip tracking (Start/Stop).
- Receipts/odometer media are stored privately and accessed via short-lived signed URLs.

- **Security:** authentication, access control, audit logs
- **Privacy:** location captured only during active tracking; user controls permissions
- **Reliability:** idempotent APIs, retry-safe syncing
- **Performance:** fast list views, bounded API calls
- **Cost control:** caching and quotas for routes

## 8) Success Metrics
- Time to create and submit a claim
- Monthly active users and retention
- Export success rate (no manual correction)
- Average routes API cost per active user
- Support ticket volume for “distance mismatch” (should decrease over time)

## 9) Risks & Mitigations
- **GPS drift / noisy distance** → smoothing + sampling rules; show “GPS confidence”
- **Route API costs** → caching + hard limits by tier
- **User disputes distance** → odometer override mode + evidence storage

## 10) Release Plan (Phase 1)
- Alpha: internal test with GPS-only + manual meal/lodging
- Beta: add selected routes + subscription gating
- Launch: exports + monitoring + backups + cost alerts
---

## Change log
- **v1.1 (27 Feb 2026):** Locked baseline for Phase 1. Added canonical decisions, scope summary table, policy parameters, and clarified `calculation_mode` + claim locking.
- **v1.2 (27 Feb 2026):** Locked policy constants: MYR, KM display unit, Free=2 route-calcs/month, Pro=unlimited trips/exports/route-calcs.

# 2 User Stories & Acceptance Criteria

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 02-STORIES-P1  
**Version:** v1.0  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft

---
## 1) Authentication & Setup
### US-01: Accept invite / login
**As a user**, I want to accept my invite and log in securely, so that my trips and claims are private.

**Acceptance Criteria**
- Invite-only: user can create an account only via a valid invite (email/password), or sign in if already registered
- Password reset is available
- User sessions expire and require re-authentication

### US-02: Configure claim rates
**As a user**, I want to set my mileage rate and default meal/lodging rates, so claims calculate correctly.

**Acceptance Criteria**
- Mileage rate supports km or mi
- Meal and lodging support “receipt-based” and “fixed-rate default”
- Rates are versioned (changing rates does not rewrite past claims)

## 2) Trips & Mileage
### US-03: Start a GPS trip
**As a user**, I want to start a trip tracking session, so the app records my route.

**Acceptance Criteria**
- App requests location permission
- “Trip started” state is clearly visible
- Trip records timestamp and at least periodic GPS points

### US-04: Stop a GPS trip
**As a user**, I want to stop tracking, so the trip is finalized.

**Acceptance Criteria**
- Trip distance is computed and saved
- Trip shows start/end time, distance, and map preview
- Trip can be attached to a mileage claim item

### US-05: Plan trip using selected route
**As a user**, I want to calculate routes and select one, so my planned mileage is correct.

**Acceptance Criteria**
- User can enter origin + destination
- App shows at least 2 route alternatives when available
- Selected route is saved and cached for reuse
- Route usage respects subscription limits

### US-06: Attach odometer evidence
**As a user**, I want to upload odometer photos, so I can prove the distance.

**Acceptance Criteria**
- Can upload start and end odometer photos
- Can enter odometer readings (optional)
- Evidence is stored even if GPS/route distance is used

### US-07: Odometer override mode
**As a user**, I want my odometer reading to override computed distance, so the official distance matches my car’s meter.

**Acceptance Criteria**
- User can toggle “Use odometer as official distance”
- If enabled, final_distance uses odometer distance
- UI clearly indicates “ODOMETER OVERRIDE” on trip and export

## 3) Claims
### US-08: Create a claim draft
**As a user**, I want to create a claim draft, so I can collect trip and expenses before submission.

**Acceptance Criteria**
- Draft has status DRAFT
- Draft is editable
- Can add mileage, meal, lodging items

### US-09: Add meal claim
**As a user**, I want to claim meals using receipt or fixed rate, so reimbursement is correct.

**Acceptance Criteria**
- Item supports “with receipt” amount
- Item supports “no receipt” using configured rate
- Receipt image upload supported

### US-10: Add lodging claim
**As a user**, I want to claim lodging using receipt or fixed rate, so reimbursement is correct.

**Acceptance Criteria**
- Same as meals: receipt or fixed rate
- Optional notes/merchant fields

### US-11: Submit claim
**As a user**, I want to submit a claim, so it becomes ready for export.

**Acceptance Criteria**
- Status changes from DRAFT → SUBMITTED
- Submitted claim is locked from edits (except admin/unlock in future phase)
- Submission timestamp is stored

## 4) Export
### US-12: Export claims by date range
**As a user**, I want to export claims to CSV/Excel, so I can send them to finance.

**Acceptance Criteria**
- Filter by date range and status
- Exports include: trip distances, rates, totals, evidence indicators
- Export generates a downloadable file

## 5) Subscription gating
### US-13: Free tier limits
**As a user**, I want to see my usage limits, so I know when to upgrade.

**Acceptance Criteria**
- Usage is shown (trips/month, exports/month, route calculations)
- When limit exceeded, user sees upgrade screen
- Limits enforced server-side (not only UI)

# 3 UX Flows — Phase 1 (Text-First)

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 03-UX-FLOWS-P1  
**Version:** v1.0  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft

---
## Navigation map (recommended)
- Auth
- Login
- Accept Invite
- Forgot password
- Main Tabs
- Home (quick actions + summaries)
- Trips
- Claims
- Settings

## Flow A: GPS trip → mileage claim
1. Home → Tap **Start Trip**
2. Active Trip screen
- Shows elapsed time
- Shows GPS indicator + accuracy note
- Optional: “Pause” (future), not required in Phase 1
3. Tap **Stop Trip**
4. Trip Summary
- Map preview + distance
- Add notes (optional)
- Add odometer photos (optional)
- Button: **Add to Claim**
5. Choose Claim
- Select existing DRAFT claim, or **Create New Claim**
6. Mileage Item created
- Shows distance source (GPS/Route/Odometer Override)
- Shows amount calculated
7. Submit claim when ready

## Flow B: Planned trip (selected route) → claim
1. Trips → **Plan Trip**
2. Enter Origin + Destination
3. Choose from route alternatives
4. Save trip
5. Add to claim as mileage item

## Flow C: Meal/Lodging claim item
1. Claims → open Draft Claim → **Add Item**
2. Choose Meal or Lodging
3. Choose:
- Receipt-based (upload receipt, enter amount), or
- Fixed rate (auto-filled, optional override if policy allows)
4. Save item

## Flow D: Export
1. Claims → Export
2. Filters:
- Date range
- Status (Submitted/Approved future)
- Category/project/client
3. Choose format: CSV or Excel
4. Generate → Download/share file

## Flow E: Subscription upgrade (gating)
1. User hits a limit (routes/trips/exports)
2. Show “Limit reached” screen with:
- Current usage
- Pro benefits
- Upgrade CTA

# 4 Architecture Blueprint — Phase 1 (Canonical)

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 04-ARCH-P1  
**Version:** v1.1  
**Date:** 02 Mar 2026  
**Owner:** Darya Malak  
**Status:** Reformatted (single H1, normalized headings)

---

## Canonical source
This document includes the current canonical architecture blueprint used as an engineering reference.

---

## Target and platforms
- **Target:** Individual professionals, subscription-based SaaS
- **Primary platforms:** React Native (iOS + Android), optional PWA

---

## 1. Product overview
A Smart Travel Claim Assistant that enables users to:
- Track mileage via GPS (manual Start/Stop)
- Calculate planned mileage via selected route
- Use odometer as evidence or as official distance override
- Manually assign claim category
- Apply custom rates
- Export claims for tax/company reporting
- Subscribe via Stripe

The system must be:
- Cost controlled
- Environment isolated (Dev → Staging → Production)
- Audit-ready
- Privacy-compliant

---

## 2. Core feature set (Phase 1)

### Mileage calculation modes

#### GPS tracking mode
- Manual Start/Stop
- Collect GPS points
- Distance calculated via Haversine formula
- Polyline stored in DB

#### Selected route mode
- Input origin and destination
- Google Routes API (`alternatives=true`)
- User selects preferred route
- Distance cached and stored

#### Odometer mode (optional)
- Toggle “Use Odometer” → select Evidence Only or Distance Override
- Evidence Only: input End Odometer, GPS distance remains official
- Distance Override: input Start and End Odometer, overrides GPS/route distance

---

## 3. Distance priority logic
```text
if odometer_mode == "distance":
    final_distance = odometer_end - odometer_start
else if calculation_mode == "gps_tracking":
    final_distance = gps_distance
else if calculation_mode == "selected_route":
    final_distance = selected_route_distance
```

---

## 4. Claim types
- Mileage
- Meal (receipt / default rate)
- Lodging (receipt / capped default)

---

## 5. System architecture

### High-level flow
Mobile App (React Native)  
↓  
API Server (Node.js – Fastify/Express)  
↓  
Services:
- Auth
- Claim Engine
- GPS Engine
- Route Engine
- Odometer Logic
- Export Engine
- Subscription Service  
↓  
PostgreSQL DB  
Object Storage  
Google Maps API  
Stripe API

---

## 6. Environment strategy
Separate Dev, Staging, Production:
- Separate DB, API keys, storage
- Google Maps and Stripe keys per environment
- Budget alerts

---

## 7. Database schema (summary)

### users
- id, name, email, subscription_status, stripe_customer_id, created_at

### user_rate_settings
- user_id, mileage_rate, meal rates, lodging_cap

### claims
- claim_id, user_id, claim_type, calculation_mode
- gps_distance, selected_route_distance, odometer_enabled, odometer_mode
- odometer_start, odometer_end, odometer_distance
- final_distance, rate, amount, status, trip_polyline
- start_time, end_time, created_at, updated_at

### routes_cache
- route_id, origin_hash, destination_hash, distance_km, polyline, created_at

### trip_points (optional)
- point_id, trip_id, lat, lng, timestamp

---

## 8. Export requirements
- CSV/Excel: Date, Claim Type, From, To, GPS Distance, Selected Route Distance, Odometer Start/End, Odometer Distance, Final Distance, Rate, Amount
- Monthly/Yearly summary optional

---

## 9. Security and compliance
- Encrypt sensitive data
- Claim lock after submission
- Location tracking only during active trip
- Audit-ready storage of all distances
- Rate limiting, logging, monitoring

---

## 10. Cost protection
- Route caching
- API rate limiting
- Free tier limitations
- Monitor Google Maps usage

---

## 11. Developer checklist

### Frontend
- React Native project setup
- Auth flow and dashboard
- GPS tracking: Start/Stop, polyline, distance calc
- Selected Route: input, API call, selection, cache
- Odometer: toggle, evidence/distance mode, inputs, calculation
- Claim CRUD UI
- Export CSV/Excel
- Subscription UI and Stripe integration

### Backend
- Auth middleware
- Claim CRUD endpoints
- GPS Engine: receive points, calculate distance
- Route Engine: Google API + caching
- Odometer logic and distance priority
- Export endpoints
- Subscription and webhook handling
- API rate limiting and logging

### Database
- Migrations for claims, routes_cache, trip_points
- Indexing, backups

### QA
- GPS-only, selected route, odometer evidence, odometer distance override
- Negative and edge case testing
- Export validation
- Free tier enforcement
- Subscription flows

---

## Engineering handoff status
- Complete blueprint and dev checklist
- Enterprise-ready, audit compliant
- Cost-protected architecture
- Supports GPS, selected route, dual-mode odometer


# 5 API Specification — OpenAPI Skeleton (Phase 1)

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 05-API-P1  
**Version:** v1.3  
**Date:** 02 Mar 2026  
**Owner:** Darya Malak  
**Status:** Locked (Baseline for Development)

---

## Baseline lock
This API contract is **locked as the Phase 1 baseline**.  
This version adds a **non-breaking multi-tenant + invite-only extension**:
- Business resources are scoped to an organization (`org_id`).
- User-facing endpoints derive org context from membership; clients typically do **not** send `org_id`.
- Admin operations are exposed under `/admin/*` and require `profiles.role=ADMIN` (enforced server-side).

## Conventions (locked)
- **Auth:** `Authorization: Bearer <token>`
- **IDs:** opaque strings (UUID recommended)
- **Timestamps:** ISO-8601 UTC (`date-time`)
- **Distances:** stored and transmitted in **meters** (`*_distance_m`)
- **Default currency:** MYR
- **Default distance unit (display):** KM (convert from meters in UI)
- **Error format:** see Doc 28B

## OpenAPI (YAML) — skeleton
```yaml
openapi: 3.0.3
info:
  title: Mileage & Claim Automation API
  version: 1.3.0
servers:
  - url: /api/v1

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    Organization:
      type: object
      properties:
        id: { type: string }
        name: { type: string }
        created_at: { type: string, format: date-time }

    OrgMember:
      type: object
      properties:
        org_id: { type: string }
        user_id: { type: string }
        org_role: { type: string, enum: [OWNER, MANAGER, MEMBER] }
        created_at: { type: string, format: date-time }

    Invitation:
      type: object
      properties:
        id: { type: string }
        org_id: { type: string }
        email: { type: string }
        org_role: { type: string, enum: [OWNER, MANAGER, MEMBER] }
        status: { type: string, enum: [PENDING, ACCEPTED, EXPIRED, REVOKED] }
        expires_at: { type: string, format: date-time }
        created_at: { type: string, format: date-time }

    UsageSummary:
      type: object
      properties:
        tier: { type: string, enum: [FREE, PRO] }
        period_start: { type: string, format: date }
        period_end: { type: string, format: date }
        routes_used: { type: integer }
        routes_limit: { type: integer, nullable: true } # null = unlimited

    Trip:
      type: object
      properties:
        id: { type: string }
        org_id: { type: string }        # derived server-side for users
        user_id: { type: string }
        status: { type: string, enum: [DRAFT, FINAL] }
        calculation_mode: { type: string, enum: [GPS_TRACKING, SELECTED_ROUTE] }
        started_at: { type: string, format: date-time }
        ended_at: { type: string, format: date-time, nullable: true }
        origin_text: { type: string, nullable: true }
        destination_text: { type: string, nullable: true }

        gps_distance_m: { type: number, nullable: true }
        selected_route_distance_m: { type: number, nullable: true }
        odometer_distance_m: { type: number, nullable: true }
        odometer_mode: { type: string, enum: [NONE, EVIDENCE_ONLY, OVERRIDE], default: NONE }

        final_distance_m: { type: number, nullable: true }
        distance_source: { type: string, enum: [GPS, SELECTED_ROUTE, ODOMETER_OVERRIDE], nullable: true }

        notes: { type: string, nullable: true }
        created_at: { type: string, format: date-time }
        updated_at: { type: string, format: date-time }

    Claim:
      type: object
      properties:
        id: { type: string }
        org_id: { type: string }        # derived server-side for users
        user_id: { type: string }
        status: { type: string, enum: [DRAFT, SUBMITTED] }
        title: { type: string, nullable: true }
        period_start: { type: string, format: date }
        period_end: { type: string, format: date }
        submitted_at: { type: string, format: date-time, nullable: true }
        rate_version_id: { type: string, nullable: true }
        currency: { type: string, default: MYR }
        total_amount: { type: number }
        created_at: { type: string, format: date-time }
        updated_at: { type: string, format: date-time }

    ClaimItem:
      type: object
      properties:
        id: { type: string }
        org_id: { type: string }
        claim_id: { type: string }
        type: { type: string, enum: [MILEAGE, MEAL, LODGING] }
        trip_id: { type: string, nullable: true }
        qty: { type: number, nullable: true }
        unit: { type: string, nullable: true }
        rate: { type: number, nullable: true }
        amount: { type: number }
        currency: { type: string, default: MYR }
        receipt_url: { type: string, nullable: true }
        merchant: { type: string, nullable: true }
        notes: { type: string, nullable: true }
        created_at: { type: string, format: date-time }

security:
  - bearerAuth: []

paths:
  /usage/current:
    get:
      summary: Get current tier and monthly usage (routes limit)
      responses:
        "200": { description: OK }

  /trips:
    get:
      summary: List trips (scoped to user's org)
      responses:
        "200": { description: OK }
    post:
      summary: Create trip (GPS or planned)
      responses:
        "201": { description: Created }

  /trips/{id}/points:
    post:
      summary: Append GPS points batch (deduped by seq)
      responses:
        "200": { description: OK }

  /trips/{id}/stop:
    post:
      summary: Stop GPS tracking and finalize distance (GPS only)
      responses:
        "200": { description: OK }

  /routes/alternatives:
    post:
      summary: Get route alternatives (cached; enforces Free limit)
      responses:
        "200": { description: OK }
        "429": { description: LIMIT_REACHED }

  /routes/select:
    post:
      summary: Select a route alternative for a trip
      responses:
        "200": { description: OK }

  /claims:
    get:
      summary: List claims (scoped to user's org)
      responses:
        "200": { description: OK }
    post:
      summary: Create claim (draft)
      responses:
        "201": { description: Created }

  /claims/{id}/items:
    post:
      summary: Add claim item (draft only)
      responses:
        "201": { description: Created }

  /claims/{id}/submit:
    post:
      summary: Submit and lock claim
      responses:
        "200": { description: OK }

  /exports:
    post:
      summary: Create export job (async)
      responses:
        "202": { description: Accepted }

  /exports/{id}:
    get:
      summary: Get export job status + download link
      responses:
        "200": { description: OK }

  # Invite-only onboarding (user)
  /invites/accept:
    post:
      summary: Accept an invitation and create org membership (invite-only)
      responses:
        "200": { description: OK }

  # Internal admin endpoints (admin app)
  /admin/orgs:
    get:
      summary: List organizations (ADMIN only)
      responses:
        "200": { description: OK }
    post:
      summary: Create organization (ADMIN only)
      responses:
        "201": { description: Created }

  /admin/orgs/{org_id}/invites:
    post:
      summary: Create invitation (ADMIN only)
      responses:
        "201": { description: Created }
    get:
      summary: List invitations for org (ADMIN only)
      responses:
        "200": { description: OK }
```

## Notes (implementation rules)
- Subscription limit enforcement must be **server-side**:
  - Free: **2** route-calculations/month (429 `LIMIT_REACHED`)
  - Pro: unlimited
- Claim submission is atomic: status change + totals snapshot + lock.
- `final_distance_m` MUST follow Doc 09.
- Multi-tenant scoping: user endpoints are always restricted to the user's org membership.

---

## Change log
- **v1.3 (02 Mar 2026):** Added non-breaking multi-tenant + invite-only extension (`org_id`, organizations/memberships, invitations, and `/admin/*` endpoints).

# 6 Database Schema & Migrations Plan (Phase 1)

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 06-DB-P1  
**Version:** v1.2  
**Date:** 02 Mar 2026  
**Owner:** Darya Malak  
**Status:** Locked (Baseline for Development)

---

## Policy constants (locked)
- **Currency:** MYR
- **Distance unit (display):** KM (internally store meters)
- **Free tier limit:** 2 route-calculations/month
- **Pro tier:** unlimited trips, exports, route-calculations
- **Invite-only onboarding:** enabled
- **Multi-tenant:** all business data scoped to `org_id`

## 1) Design principles
- Store internal distances in **meters** and amounts in **minor units** if preferred (e.g., cents) to avoid float issues.
- Keep an explicit **final_distance_m** and **distance_source** as the single source of truth (Doc 09).
- **Multi-tenant invariant:** every business row belongs to exactly one organization via `org_id`.
- Version rates/policies so past claims remain auditable.
- Claims become immutable after submission (lock).

## 2) Core tables (Phase 1)

### 2.1 organizations
- `organizations`
  - `id (pk)`
  - `name`
  - `created_at`

### 2.2 profiles (user metadata + global role)
- `profiles`
  - `id (pk, fk auth.users.id)`
  - `email`
  - `display_name`
  - `role` (`USER` | `ADMIN`)  *(internal admin app uses ADMIN)*
  - `created_at`

### 2.3 org membership
- `org_members`
  - `org_id (fk organizations.id)`
  - `user_id (fk profiles.id)`
  - `org_role` (`OWNER` | `MANAGER` | `MEMBER`)
  - `created_at`
  - **unique** `(org_id, user_id)`
  - index: `(user_id)`, `(org_id)`

### 2.4 invitations (invite-only onboarding)
> Stores invite intent and ensures org membership is created on acceptance.

- `invitations`
  - `id (pk)`
  - `org_id (fk organizations.id)`
  - `email` *(invite target)*
  - `org_role` (`OWNER` | `MANAGER` | `MEMBER`)
  - `status` (`PENDING` | `ACCEPTED` | `EXPIRED` | `REVOKED`)
  - `invited_by_user_id (fk profiles.id)` *(internal admin)*
  - `accepted_by_user_id (fk profiles.id, nullable)`
  - `expires_at`
  - `created_at`
  - indexes: `(org_id, status)`, `(email, status)`

### 2.5 rates / policies (org-scoped; versioned)
- `rate_versions`
  - `id (pk)`
  - `org_id (fk organizations.id)`
  - `effective_from` (date)
  - `currency` (MYR)
  - `mileage_rate_per_km`
  - `meal_rate_default` (nullable)
  - `lodging_rate_default` (nullable)
  - `created_by_user_id (fk profiles.id)`
  - `created_at`
  - **unique** `(org_id, effective_from)`
  - index: `(org_id, effective_from desc)`

### 2.6 trips (multi-tenant)
- `trips`
  - `id (pk)`
  - `org_id (fk organizations.id)`
  - `user_id (fk profiles.id)` *(creator/driver)*
  - `status` (DRAFT/FINAL)
  - `calculation_mode` (GPS_TRACKING/SELECTED_ROUTE)
  - `started_at`, `ended_at`
  - `origin_text`, `destination_text`
  - `gps_distance_m`
  - `selected_route_distance_m`
  - `odometer_distance_m`
  - `odometer_mode` (NONE/EVIDENCE_ONLY/OVERRIDE)
  - `final_distance_m`
  - `distance_source` (GPS/SELECTED_ROUTE/ODOMETER_OVERRIDE)
  - `notes`
  - `created_at`, `updated_at`
  - indexes: `(org_id, started_at desc)`, `(user_id, started_at desc)`

- `trip_points`
  - `id (pk)`
  - `trip_id (fk trips.id)`
  - `seq` (int)
  - `lat`, `lng`
  - `accuracy_m` (optional)
  - `recorded_at` (timestamp)
  - **unique** `(trip_id, seq)`  *(supports dedupe)*
  - indexes: `(trip_id, seq)`, `(trip_id, recorded_at)`

### 2.7 route cache (cost control)
- `routes_cache`
  - `id (pk)`
  - `origin_hash`, `destination_hash`
  - `travel_mode`
  - `request_payload` (json)
  - `response_payload` (json)
  - `expires_at`
  - indexes: `(origin_hash, destination_hash, travel_mode)`, `(expires_at)`

> Cache can be global (not org-scoped) because it stores route alternatives, not private user data.  
> If you store place IDs or user-entered strings, sanitize/hash them before caching.

### 2.8 claims (multi-tenant)
- `claims`
  - `id (pk)`
  - `org_id (fk organizations.id)`
  - `user_id (fk profiles.id)` *(creator/submitted-by)*
  - `status` (DRAFT/SUBMITTED)
  - `title`
  - `period_start`, `period_end`
  - `submitted_at`
  - `rate_version_id (fk rate_versions.id)`
  - `total_amount` *(store in minor units or as numeric)*
  - `currency` (MYR)
  - `created_at`, `updated_at`
  - indexes: `(org_id, period_start, period_end)`, `(user_id, created_at desc)`

- `claim_items`
  - `id (pk)`
  - `org_id (fk organizations.id)`
  - `claim_id (fk claims.id)`
  - `type` (MILEAGE/MEAL/LODGING)
  - `trip_id (nullable, fk trips.id)`
  - `qty` (nullable)
  - `unit` (nullable)
  - `rate` (nullable)
  - `amount`
  - `currency` (MYR)
  - `receipt_url` (nullable)
  - `merchant` (nullable)
  - `notes` (nullable)
  - `created_at`
  - indexes: `(claim_id, type)`, `(org_id, created_at desc)`

### 2.9 exports (multi-tenant)
- `export_jobs`
  - `id (pk)`
  - `org_id (fk organizations.id)`
  - `user_id (fk profiles.id)` *(requester)*
  - `filters` (json)
  - `format` (CSV/XLSX)
  - `status` (PENDING/RUNNING/DONE/FAILED)
  - `file_url` (nullable)
  - `created_at`, `completed_at`
  - index: `(org_id, created_at desc)`

### 2.10 subscriptions & usage
- `subscription_status`
  - `org_id (pk, fk organizations.id)`
  - `tier` (FREE/PRO)
  - `period_start`, `period_end`
  - `provider_customer_id` (nullable)
  - `provider_subscription_id` (nullable)

- `usage_counters`
  - `org_id`
  - `period_start` *(month bucket)*
  - `routes_calls` *(enforced for Free tier: max 2/month)*
  - `trips_created` *(tracked; not enforced in Phase 1 baseline)*
  - `exports_created` *(tracked; not enforced in Phase 1 baseline)*
  - **unique** `(org_id, period_start)`

### 2.11 audit logs
- `audit_logs`
  - `id (pk)`
  - `org_id (fk organizations.id, nullable)` *(nullable for global admin actions)*
  - `actor_user_id (fk profiles.id)`
  - `entity_type`
  - `entity_id`
  - `action`
  - `metadata` (json)
  - `created_at`
  - index: `(org_id, created_at desc)`, `(actor_user_id, created_at desc)`

## 3) Migration order (recommended)
1. organizations
2. profiles
3. org_members
4. invitations
5. rate_versions
6. trips + trip_points
7. routes_cache
8. claims + claim_items
9. subscription_status + usage_counters
10. export_jobs
11. audit_logs

## 4) RLS / access rules (summary)
- Users can only read/write rows where `org_id` is an org they belong to (via `org_members`).
- Internal admins (`profiles.role=ADMIN`) can operate via the **internal admin app** using server-side privilege checks (Doc 37).  
  *(Optional policy: allow ADMIN to bypass RLS for reads; safest approach is to use service-role on admin server routes.)*

## 5) Indexing & constraints
- `trip_points`: unique `(trip_id, seq)` for dedupe
- Claims: prevent edits after submission at API layer; optionally enforce with DB constraints or triggers.
- Add FK constraints and indexes listed above.

---

## Change log
- **v1.2 (02 Mar 2026):** Integrated multi-tenant model (`organizations`, `org_members`, `invitations`) and scoped all business data to `org_id` while preserving Phase 1 baseline behavior.

# 7 Mobile Technical Spec — React Native / Expo (Phase 1)

    **Project:** Mileage & Claim Automation SaaS  
    **Phase:** Phase 1  
    **Document ID:** 07-MOBILE-P1  
    **Version:** v1.0  
    **Date:** 27 Feb 2026  
    **Owner:** Darya Malak  
    **Status:** Draft

    ---
    ## 1) Platforms
    - iOS + Android via React Native / Expo

    ## 2) Permissions
    - Foreground location permission required for GPS trips
    - Explain permission purpose clearly (privacy-first)

    ## 3) Location sampling (Phase 1 recommended defaults)
    - Sample every **N seconds** or when moved **> X meters**
    - Store each point with: lat, lng, accuracy, recorded_at, seq

    ## 4) Battery & reliability
    - Tracking is **manual** (Start/Stop) to avoid always-on drain
    - If app crashes mid-trip:
    - Trip remains in “active” state
    - On reopen, user can stop and finalize

    ## 5) Offline behavior
    - Queue trip points locally when offline
    - Sync points when connectivity returns
    - Ensure idempotent upload (server dedupe by seq or recorded_at)

    ## 6) Media uploads (receipts/odometer)
    - Compress images before upload
    - Store in private bucket with signed URLs

    ## 7) Export sharing
    - Allow user to download/share CSV/XLSX using native share sheet

    ## 8) Error handling
    - Show actionable messages (permission denied, GPS unavailable, export failed)

# 8 Route Engine & Cost Controls (Phase 1)

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 08-ROUTES-P1  
**Version:** v1.1  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Locked (Baseline for Development)

---
## 1) Goals
- Provide route alternatives for planned trips
- Control third-party API cost (Routes/Maps)
- Keep routes auditable (store selected route info)

## 2) Request strategy
- Normalize origin/destination (place IDs if available)
- Hash (origin, destination, travel_mode) as cache key

## 3) Caching
- Store full API response in `routes_cache`
- Use TTL (e.g., 7–30 days) configurable
- Prefer cache hit before calling external API

## 4) Subscription gating
- Enforce routes calls per month by tier (**Free: 2/month**, **Pro: unlimited**) (**Free: 2/month**, **Pro: unlimited**)
- Show “remaining route calculations” in UI

## 5) Logging & budgets
- Log every external routes call with user_id and cost attribution
- Set provider budget alerts and internal thresholds:
- Warning at 70%
- Critical at 90%
- Hard stop (optional) at 100% for Free tier

## 6) Edge cases
- No route available → fallback to GPS tracking or manual entry (future)
- Multiple waypoints (Phase 2)

## Policy constants (locked)
- **Currency (default):** MYR
- **Distance unit (display):** KM  
- Internally store meters (`*_distance_m`) and convert for UI/export.
- **Subscription limits (Phase 1 baseline):**
- **Free:** 2 route-calculations per month; trips/export are **not limited** in Phase 1 baseline
- **Pro:** unlimited trips, exports, and route-calculations
## Change log
- **v1.1 (27 Feb 2026):** Locked tier policy for routes (Free=2/month; Pro unlimited) and default MYR/KM assumptions.

# 9 Distance Logic — Single Source of Truth (Phase 1)

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 09-DIST-P1  
**Version:** v1.2  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Locked (Baseline for Development)

---
## Baseline lock
This document is **locked as the Phase 1 baseline** for how distance is computed, stored, displayed, and exported.

## Key invariants (must hold)
- Distances are stored internally in **meters** (`*_distance_m`).
- A trip must have exactly one `calculation_mode`:
  - `GPS_TRACKING` or `SELECTED_ROUTE`.
- `final_distance_m` is the **only** distance used for reimbursement calculations.
- After **claim submission**, distance values used by that claim must **not** change.

---
## 1) Why this document exists
Distance disputes are the #1 risk in mileage systems. Phase 1 requires deterministic rules:
- Distance sources are stored separately (GPS / Selected Route / Odometer)
- The system derives and stores a single **official distance**: `final_distance_m`

## 2) Distance sources

## 2A) Trip calculation mode (locked)
- `GPS_TRACKING`: Trip has GPS points; `gps_distance_m` is computed from points.
- `SELECTED_ROUTE`: Trip is planned; `selected_route_distance_m` is taken from the selected route alternative.
- A trip should not mix both modes (but odometer evidence may be attached to either).

### A) GPS distance (gps_distance_m)
- Derived from trip points (Haversine + smoothing rules)
- Stored as meters

### B) Selected route distance (selected_route_distance_m)
- Derived from the chosen route alternative
- Stored as meters

### C) Odometer distance (odometer_distance_m)
- Derived from:
- end_reading - start_reading (if numeric readings provided), OR
- user-entered odometer distance
- Stored as meters (convert km/mi input)

## 3) Odometer modes
- `NONE`: odometer not used
- `EVIDENCE_ONLY`: photos/readings stored, but do not override official distance
- `OVERRIDE`: odometer distance becomes official distance

## 4) Official distance derivation (final_distance_m)
The system MUST set `final_distance_m` and `distance_source` using this deterministic logic:

### Inputs
- `calculation_mode`: `GPS_TRACKING` or `SELECTED_ROUTE`
  - `gps_distance_m` (if GPS tracking)
  - `selected_route_distance_m` (if selected route)
- `odometer_mode`: `NONE` | `EVIDENCE_ONLY` | `OVERRIDE`
  - `odometer_distance_m` (optional, required if override)

### Pseudocode
```text
if odometer_mode == OVERRIDE:
    require odometer_distance_m
    final_distance_m = odometer_distance_m
    distance_source  = ODOMETER_OVERRIDE

else if calculation_mode == SELECTED_ROUTE:
    require selected_route_distance_m
    final_distance_m = selected_route_distance_m
    distance_source  = SELECTED_ROUTE

else if calculation_mode == GPS_TRACKING:
    require gps_distance_m
    final_distance_m = gps_distance_m
    distance_source  = GPS

else:
    error (invalid calculation_mode)
```

### Validation rules
- `OVERRIDE` is invalid unless `odometer_distance_m` is present.
- `SELECTED_ROUTE` mode is invalid unless `selected_route_distance_m` is present.
- `GPS_TRACKING` mode is invalid unless `gps_distance_m` is present.
## 5) Rounding & display
- Store meters as raw number
- Display (Phase 1 default):
- **KM** to 2 decimals (e.g., 12.34 km)
- Amount calculation uses the displayed unit conversion but remains based on stored meters.

## 6) Audit requirements
- Store:
- all source distances
- official distance + source
- odometer photos metadata (when provided)
- selected route metadata (route name, duration, provider response id if available)

## 7) Validation
- Reject OVERRIDE mode unless odometer distance is provided
- Warn user if OVERRIDE differs from GPS/Route by more than configured threshold (e.g., >15%)
- Never silently replace the official distance after claim submission (claims are locked)

## 8) Example scenarios
### Scenario 1: GPS only
- gps_distance_m=10500
- final_distance_m=10500 (GPS)

### Scenario 2: Selected route chosen
- selected_route_distance_m=11200
- final_distance_m=11200 (Selected Route)

### Scenario 3: Odometer evidence only + selected route
- odometer_mode=EVIDENCE_ONLY, odometer_distance_m=12000
- final_distance_m=selected_route_distance_m (Selected Route)

### Scenario 4: Odometer override
- odometer_mode=OVERRIDE, odometer_distance_m=12000
- final_distance_m=12000 (Odometer Override)
---

## Change log
- **v1.1 (27 Feb 2026):** Locked baseline. Aligned official distance logic to `calculation_mode` + odometer override, added invariants and validation rules.
- **v1.2 (27 Feb 2026):** Locked default display unit to KM (internals remain meters).

# 10 Security & Privacy Spec (Phase 1)

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 10-SEC-P1  
**Version:** v1.0  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft

---
## 1) Security goals
- Protect user data (location, receipts, claims)
- Prevent unauthorized access
- Maintain auditability for reimbursements

## 2) Authentication & authorization
- Auth via secure provider (JWT or managed auth)
- All endpoints require user identity
- User can only access their own resources (row-level enforcement)

## 3) Storage security
- TLS enforced for all traffic
- Encrypt data at rest (DB + object storage)
- Signed URLs for media access (short expiry)
- Private buckets for receipts and odometer images

## 4) Privacy principles (location)
- Location is collected **only** during active trip tracking (manual Start/Stop)
- Display clear UI indicators when tracking is active
- User can delete trips/claims according to retention policy (Phase 2: admin retention rules)

## 5) Audit logs
Log sensitive events:
- Trip start/stop
- Odometer override toggled
- Claim submission
- Export generated
- Subscription tier changes

## 6) Abuse protection
- Rate limit APIs
- Protect routes API calls via quotas
- Detect unusual export volumes and throttle on Free tier

## 7) Compliance notes (Malaysia/global)
- Provide a privacy policy describing what data is collected and why
- Provide a data retention statement (how long location points and receipts are kept)

# 11 Monitoring & Incident Runbook (Phase 1)

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 11-OPS-P1  
**Version:** v1.0  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft

---
## 1) What to monitor
### App health
- API error rate (4xx/5xx)
- Latency (p50/p95)
- Crash-free sessions (mobile)

### Core feature health
- Trip start/stop success rate
- Trip point upload failure rate
- Claim submission failure rate
- Export job failure rate

### Cost monitoring
- Routes API calls per day
- Cost per active user
- Cache hit ratio

## 2) Alerts (recommended)
- 5xx error rate > threshold (e.g., 2% over 5 minutes)
- Export failures spike
- Routes API usage > 70% of budget
- DB storage growth abnormal
- Auth failures spike

## 3) Incident handling
1. Identify incident severity (SEV1–SEV3)
2. Check dashboards/logs
3. Mitigate:
- Disable route calls (feature toggle) if cost spike
- Switch exports to async queue if overloaded
4. Communicate status
5. Postmortem:
- Root cause
- Prevention action items

## 4) Backups & recovery
- Nightly DB backup
- Periodic restore drill (monthly)
- Object storage lifecycle rules + backup (if required)

# 12 QA Test Plan (Phase 1)

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 12-QA-P1  
**Version:** v1.0  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft

---
## 1) Test matrix
### Mileage modes
- GPS only
- Selected route only
- GPS + Selected route (selected route should become official)
- Odometer evidence only (should not override)
- Odometer override (must override official distance)

### Claims
- Draft claim edits
- Submit locks claim
- Totals computed correctly
- Receipt uploads for meal/lodging

### Exports
- CSV export formatting and totals
- Excel export formatting and totals
- Correct columns: distance source, evidence flags

### Subscription gating
- Free tier limits enforced server-side
- Upgrade flow works
- Route calls blocked when limit reached

## 2) Edge cases
- GPS permission denied
- GPS drift / low accuracy
- App killed mid-trip then reopened
- Offline trip points then sync
- Route API unavailable → graceful fallback

## 3) Regression checklist
- Trip list loads fast
- Claim list filters work
- Export download link works

# 13 Sprint Roadmap (Phase 1)

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 13-SPRINT-P1  
**Version:** v1.1  
**Date:** 02 Mar 2026  
**Owner:** Darya Malak  
**Status:** Reformatted (single H1, normalized headings)

---

## Canonical source
This document includes the current canonical Phase 1 sprint roadmap.

---

## Objective
Deliver the first production-ready version of the Mileage & Claim Automation SaaS, covering:
- GPS tracking
- Selected routes
- Dual-mode odometer
- Claims
- Export
- Subscription management
- Invite-only onboarding + multi-tenant readiness (org/company)

## Timeline and team
- **Timeline:** 8-week sprint (adjustable)
- **Team:** 2–3 React Native devs, 1 backend dev, 1 QA, 1 DevOps/Infra

---

## Sprint 0 — Project setup and environment (Week 0–1)
- [ ] Initialize Git repo (mono-repo or separate frontend/backend)
- [ ] Configure environment variables per Dev/Staging/Production
- [ ] Setup CI/CD pipeline (GitHub Actions, GitLab CI, etc.)
- [ ] Provision PostgreSQL databases for each environment
- [ ] Setup Google Maps API project, Stripe sandbox
- [ ] Setup storage bucket for receipts and polylines
- [ ] Establish linting, formatting, and code standards
- [ ] Create base project skeleton (React Native + Node.js server)

---

## Sprint 1 — Authentication and core app framework (Week 1–2)
- [ ] Implement invite-only auth flow (invite acceptance + login)
- [ ] Auth middleware on backend
- [ ] Dashboard skeleton UI
- [ ] Environment config switching for API endpoints
- [ ] Stripe integration for subscription (test keys)

### Deliverables
- Authenticated dashboard accessible
- Subscription state retrievable

---

## Sprint 2 — GPS tracking and trip management (Week 2–3)
- [ ] Start/Stop Trip buttons
- [ ] Background and foreground location permissions
- [ ] Collect GPS points, store polyline
- [ ] Calculate `gps_distance` via Haversine formula
- [ ] Store trip data in database

### Deliverables
- GPS-only claims can be created and saved as draft
- GPS distance stored in database

---

## Sprint 3 — Selected route engine (Week 3–4)
- [ ] Implement origin/destination input
- [ ] Call Google Routes API with alternative routes
- [ ] Display route options, allow user selection
- [ ] Cache selected route distances for cost control
- [ ] Store selected route data in database

### Deliverables
- Selected-route claims can be created and finalized
- Route distances locked and auditable

---

## Sprint 4 — Odometer logic and dual mode (Week 4–5)
- [ ] Add “Use Odometer” toggle in claim creation
- [ ] Implement radio selection: Evidence Only / Distance Override
- [ ] Evidence Only: accept End Odometer input, store as evidence
- [ ] Distance Override: accept Start & End Odometer, calculate `odometer_distance`
- [ ] Apply distance priority logic to finalize claim distance

### Deliverables
- All mileage modes functional
- Odometer stored and/or used as official distance

---

## Sprint 5 — Claim management and rates (Week 5–6)
- [ ] Manual claim category assignment (Mileage / Meal / Lodging)
- [ ] Apply user rate settings
- [ ] Draft / Submitted claim status management
- [ ] Claim validation (negative distance, invalid odometer inputs)
- [ ] Backend API endpoints for claim create/update/lock

### Deliverables
- Full claim CRUD with distance calculation
- Rate application per user settings

---

## Sprint 6 — Export engine and reports (Week 6–7)
- [ ] CSV/Excel export of claims
- [ ] Include all distances, `final_distance`, odometer readings, rates, amount
- [ ] Optional monthly/yearly summary sheet
- [ ] Export trigger via UI button

### Deliverables
- Accurate claim exports ready for tax or company reporting

---

## Sprint 7 — QA, security, and monitoring (Week 7–8)
- [ ] QA testing: GPS-only, selected route, odometer evidence, odometer distance
- [ ] Negative and edge case testing
- [ ] API rate limiting, logging, and error monitoring
- [ ] Security audit: encrypt sensitive fields, ensure claim lock after submission
- [ ] Google Maps usage alerts, Stripe event handling

### Deliverables
- QA signoff
- Production-ready, secure, and monitored app

---

## Post-sprint — Deployment and launch
- [ ] Deploy to Production environment
- [ ] Verify Google Maps and Stripe live keys
- [ ] Test subscription flows
- [ ] Monitor initial user activity
- [ ] Adjust API limits and budgets if required

---

## Notes
- Each sprint assumes 1-week duration; can be adjusted based on team size
- Sprint reviews recommended at the end of each sprint with product owner
- Feature toggles can be used for optional features
- Future Phase 2 ideas:
  - AI receipt scanning
  - auto-suggest routes
  - monthly reminders
  - tax summaries


# 14 UI Copy & Microcopy — Phase 1

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 14-MICROCOPY-P1  
**Version:** v1.0  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft

---
## Policy constants (locked)
- **Currency (default):** MYR
- **Distance unit (display):** KM (internally store meters)
- **Subscription limits (Phase 1 baseline):**
- **Free:** 2 route-calculations/month
- **Pro:** unlimited trips, exports, route-calculations

## 1) Purpose
Ready-to-use UI text to keep wording consistent across screens.

## 2) Core copy blocks

### 2.1 Location permission (first time)
**Title:** Allow Location Access  
**Body:** We only use your location when you press **Start Trip**. This creates route evidence for your mileage claim.  
**Buttons:** Continue / Not now

### 2.2 Permission denied
**Title:** Location Permission Needed  
**Body:** Please enable location access in your phone settings to record GPS trips.  
**Buttons:** Open Settings / Cancel

### 2.3 Tracking active banner
**Text:** Tracking ON — tap **Stop Trip** to finish.

### 2.4 GPS weak signal
**Text:** GPS signal is weak. Try moving to an open area for better accuracy.

### 2.5 Odometer override warning
**Title:** Use Odometer as Official Distance?  
**Body:** If enabled, the odometer distance will be used for reimbursement instead of GPS/Route distance.  
**Buttons:** Use Odometer / Keep Current

### 2.6 Claim submission confirmation
**Title:** Submit Claim  
**Body:** Submitting will lock this claim. You won’t be able to edit items after submission.  
**Buttons:** Submit / Cancel

### 2.7 Claim locked message
**Text:** This claim is submitted and locked.

### 2.8 Route limit reached (Free)
**Title:** Route Limit Reached  
**Body:** You’ve used your **2 route calculations** for this month. Upgrade to Pro for unlimited route calculations.  
**Buttons:** Upgrade to Pro / Use GPS Tracking

### 2.9 Export success
**Title:** Export Ready  
**Body:** Your export file is ready to download.  
**Buttons:** Download / Close

### 2.10 Export failure
**Title:** Export Failed  
**Body:** Something went wrong while generating your export. Please try again.  
**Buttons:** Try Again / Close

## 3) Tone guidelines
- Clear, short, professional
- Avoid technical jargon
- Always offer a recovery action when possible

# 15 Release Checklist — Phase 1 (Pre-prod → Prod)

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 15-RELEASE-P1  
**Version:** v1.0  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft

---
## Policy constants (locked)
- **Currency (default):** MYR
- **Distance unit (display):** KM (internally store meters)
- **Subscription limits (Phase 1 baseline):**
- **Free:** 2 route-calculations/month
- **Pro:** unlimited trips, exports, route-calculations

## 1) Purpose
A practical checklist to ship Phase 1 safely:
- Pre-prod validation (staging)
- Production readiness
- Store release steps (if applicable)
- Rollback and incident readiness

## 2) Environments
- **Dev:** local + dev backend
- **Staging:** production-like environment for UAT
- **Prod:** live environment

## 3) Pre-release prerequisites
### 3.1 Documentation locked
- [ ] PRD locked (01)
- [ ] Distance logic locked (09)
- [ ] API contracts ready for frontend (28)
- [ ] Export spec locked (17)

### 3.2 Security & access
- [ ] Secrets stored in secret manager (not in repo)
- [ ] Production keys rotated and stored
- [ ] Admin access list documented
- [ ] Rate limits enabled

### 3.3 Cost controls
- [ ] Routes API budget alerts configured
- [ ] Cache enabled for routes
- [ ] Free tier limit enforced server-side (2 route-calcs/month)

### 3.4 Backups
- [ ] DB backups configured (nightly)
- [ ] Restore drill documented

## 4) Staging readiness checklist
### 4.1 Smoke tests (must pass)
- [ ] Login / logout
- [ ] Start GPS trip → stop → Trip Summary shows final distance
- [ ] Plan trip → get alternatives → select route → Trip Summary
- [ ] Free tier route limit: third call blocked with LIMIT_REACHED
- [ ] Create claim draft → add meal/lodging → submit → locked
- [ ] Export submitted claims → job done → download file

### 4.2 Mobile permissions & behavior
- [ ] Location permission prompt shows correct microcopy
- [ ] Permission denied flow works (“Open Settings”)
- [ ] Offline banner works
- [ ] Trip points queue + sync works (Doc 29)

### 4.3 Uploads
- [ ] Receipts upload via signed URL
- [ ] Odometer photos upload
- [ ] Upload retry/progress works

### 4.4 Performance
- [ ] Trips list loads within acceptable time
- [ ] Claims list loads within acceptable time
- [ ] Export job completes within acceptable time window

## 5) Production readiness checklist
### 5.1 Observability
- [ ] Error tracking enabled (mobile + backend)
- [ ] API metrics dashboard (error rate, latency)
- [ ] Routes API usage dashboard (calls, cache hit ratio)
- [ ] Alerts configured (5xx spikes, budget thresholds)

### 5.2 Data integrity
- [ ] DB migrations applied and verified
- [ ] Row-level security / access rules verified
- [ ] Claim submission locking enforced server-side

### 5.3 Compliance / user-facing
- [ ] Privacy policy published (tracking only during active trip)
- [ ] Terms of service published
- [ ] Data retention statement published

## 6) Rollout plan
### 6.1 Release strategy
- Option A: soft launch (invite list)
- Option B: phased rollout (percentage)
- Option C: full release

### 6.2 Rollback plan
- [ ] Feature flags for routes and exports
- [ ] Ability to disable route calls if budget spike
- [ ] Database rollback plan (if migration fails)
- [ ] Mobile hotfix plan (store release cadence)

## 7) Go/No-Go meeting checklist
- [ ] All smoke tests passed on staging
- [ ] No open P0/P1 bugs
- [ ] Cost controls configured
- [ ] Monitoring & alerts active
- [ ] Support contact and incident escalation path ready

## 8) Post-release checklist (Day 0–7)
- [ ] Monitor crash-free sessions
- [ ] Monitor Routes API cost per user
- [ ] Verify export correctness with real data
- [ ] Collect feedback and prioritize fixes
- [ ] Run first backup restore drill (optional)

---

## Change log
- **v1.0 (27 Feb 2026):** Created Phase 1 release checklist baseline.

# 16 Complete Development Checklist (Canonical)

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 16-DEV-CHECKLIST  
**Version:** v1.1  
**Date:** 02 Mar 2026  
**Owner:** Darya Malak  
**Status:** Reformatted (single H1, normalized headings)

---

## Canonical source
This document includes the current canonical complete development checklist.

---

## Overview
This checklist consolidates all Phase 1 requirements:

- GPS tracking
- Selected route calculation
- Dual-mode odometer (Evidence / Distance Override)
- Claim engine
- Export engine
- Subscription billing
- Cost-protected architecture
- Dev → Staging → Production isolation

---

## 1. Project foundation

### Repository and architecture
- [ ] Decide mono-repo vs separate frontend/backend repos
- [ ] Setup branch strategy (main / staging / dev)
- [ ] Setup code review workflow
- [ ] Configure linting & formatting rules
- [ ] Setup TypeScript (recommended for both frontend & backend)

### Environment configuration
- [ ] Create `.env.development`
- [ ] Create `.env.staging`
- [ ] Create `.env.production`
- [ ] Separate Google Maps API keys per environment
- [ ] Separate Stripe keys per environment
- [ ] Separate DB per environment
- [ ] Separate storage bucket per environment

### DevOps and CI/CD
- [ ] Setup CI pipeline (lint, build, test)
- [ ] Setup CD pipeline (staging + production)
- [ ] Setup environment-based deployment
- [ ] Configure secrets management

---

## 2. Database setup (PostgreSQL)

### Schema creation
- [ ] `users` table
- [ ] `user_rate_settings` table
- [ ] `claims` table
- [ ] `routes_cache` table
- [ ] `trip_points` table (optional debug)

### Claims table must include
- [ ] `gps_distance`
- [ ] `selected_route_distance`
- [ ] `odometer_enabled`
- [ ] `odometer_mode` (`evidence_only` / `distance`)
- [ ] `odometer_start`
- [ ] `odometer_end`
- [ ] `odometer_distance`
- [ ] `final_distance`
- [ ] `rate`
- [ ] `amount`
- [ ] `status` (`draft` / `submitted`)

### DB optimization
- [ ] Add indexes (`user_id`, `created_at`, `status`)
- [ ] Setup DB backup policy
- [ ] Setup migration scripts

---

## 3. Backend development (Node.js – Fastify/Express)

### Core setup
- [ ] Initialize API server
- [ ] Setup middleware (auth, logging, rate limit)
- [ ] Error handling middleware

### Authentication
- [ ] User registration endpoint *(note: if invite-only, registration is via invite acceptance)*
- [ ] Login endpoint
- [ ] JWT/session handling
- [ ] Subscription status validation middleware

### GPS engine
- [ ] Endpoint to start trip
- [ ] Endpoint to receive GPS points
- [ ] Haversine distance calculation
- [ ] Encode polyline
- [ ] Store `gps_distance`

### Selected route engine
- [ ] Integrate Google Routes API
- [ ] Check cache before API call
- [ ] Store route in `routes_cache`
- [ ] Return alternative routes
- [ ] Store `selected_route_distance`

### Odometer logic
- [ ] Validate inputs (End ≥ Start)
- [ ] Compute `odometer_distance`
- [ ] Apply distance priority logic
- [ ] Store all distance types
- [ ] Audit log if override occurs

### Claim engine
- [ ] Create claim endpoint
- [ ] Update claim endpoint
- [ ] Lock claim endpoint (submitted)
- [ ] Apply rate calculation logic
- [ ] Prevent editing after submission

### Export engine
- [ ] Generate CSV export
- [ ] Generate Excel export
- [ ] Include all distance variants
- [ ] Include summary sheet

### Subscription service
- [ ] Stripe webhook endpoint
- [ ] Update `subscription_status`
- [ ] Enforce free tier limits

### Security
- [ ] Encrypt sensitive fields
- [ ] Implement rate limiting per user
- [ ] Validate all request inputs
- [ ] Log all API calls

---

## 4. Frontend development (React Native / Expo)

### Core setup
- [ ] Setup Expo project
- [ ] Environment config switching
- [ ] API client setup (Axios/Fetch)
- [ ] Global state management

### Authentication UI
- [ ] Login screen
- [ ] Accept-invite screen *(replace register if invite-only)*
- [ ] Session persistence

### Dashboard
- [ ] Display total km (monthly)
- [ ] Display total claims
- [ ] Display total amount
- [ ] Quick Start Trip button

### GPS tracking
- [ ] Request foreground permission
- [ ] Request background permission *(optional, Phase 1 can be foreground-only)*
- [ ] Start Trip button
- [ ] Collect GPS points (interval or distance-based)
- [ ] Stop Trip button
- [ ] Display `gps_distance` live

### Selected route
- [ ] Origin input
- [ ] Destination input
- [ ] Display route alternatives
- [ ] Select route
- [ ] Confirm and create draft claim

### Odometer feature
- [ ] Toggle “Use Odometer”
- [ ] Radio selection: Evidence / Distance
- [ ] Evidence mode → End odometer input
- [ ] Distance mode → Start and End input
- [ ] Live calculate `odometer_distance`
- [ ] Override displayed `final_distance` if needed

### Claim management
- [ ] Manual claim category assignment
- [ ] Draft claim list
- [ ] Edit draft
- [ ] Submit claim
- [ ] Lock after submission

### Export UI
- [ ] Export button
- [ ] Download/share file

### Subscription UI
- [ ] Plan selection screen
- [ ] Upgrade flow
- [ ] Handle expired subscription

---

## 5. Cost control implementation
- [ ] Route caching logic
- [ ] Google API rate limit per user
- [ ] Budget alerts on Google Cloud
- [ ] Log API usage metrics
- [ ] Prefer GPS mode (no API cost)

---

## 6. QA and testing

### Functional tests
- [ ] GPS-only claim
- [ ] Selected route claim
- [ ] Odometer evidence-only
- [ ] Odometer distance override
- [ ] Meal and lodging claims
- [ ] Draft → Submitted flow

### Validation tests
- [ ] Negative distance prevention
- [ ] Invalid odometer input
- [ ] Editing locked claim blocked

### Export tests
- [ ] Verify all columns included
- [ ] Verify summary sheet
- [ ] Verify calculations match database

### Subscription tests
- [ ] Free tier limits enforced
- [ ] Pro unlock features
- [ ] Webhook events processed correctly

---

## 7. Security and compliance
- [ ] Location tracked only during active trip
- [ ] Secure storage for receipts
- [ ] HTTPS enforced
- [ ] GDPR/local compliance review
- [ ] Data retention policy

---

## 8. Production readiness
- [ ] Production API keys configured
- [ ] Stripe live keys tested
- [ ] Monitoring enabled (errors and API usage)
- [ ] Backup and recovery tested
- [ ] Smoke test in production

---

## Final status
When all boxes above are completed, the system is:

- Production-ready
- Cost-protected
- Audit-compliant
- Subscription-enabled
- Enterprise-structured
- Scalable for Phase 2 features

# 17 Export Specification — CSV & Excel (Phase 1)

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 17-EXPORT-P1  
**Version:** v1.1  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Locked (Baseline for Development)

---
## 1) Export types
- Claim export by date range (Submitted only by default)
- Optional: include Draft (admin/debug)

## 2) File formats
- CSV (UTF-8)
- XLSX (single sheet “Claims”)

## 3) Column spec (proposed)
### Claim-level
- claim_id
- claim_title
- claim_status
- period_start
- period_end
- submitted_at
- currency
- total_amount

### Item-level
- item_id
- item_type (MILEAGE/MEAL/LODGING)
- item_amount
- item_rate
- item_qty
- item_unit
- item_notes
- receipt_present (Y/N)
- receipt_url (optional, or omit for privacy)

### Mileage item extras
- trip_id
- trip_started_at
- trip_ended_at
- gps_distance_km (KM) (KM)
- selected_route_distance_km (KM) (KM)
- odometer_distance_km (KM) (KM)
- odometer_mode
- final_distance_km (KM) (KM)
- distance_source

## 4) Export rules
- Values must be deterministic (no recalculation after submission)
- Use the claim’s linked `rate_version_id` for calculations

## 2A) Units & currency (locked)
- **Currency:** MYR
- **Distance columns:** export in **KM** (converted from stored meters)
- Store and compute internally in meters; export conversions must be deterministic.
## Change log
- **v1.1 (27 Feb 2026):** Locked export units/currency (MYR, KM).

# 18 Data Dictionary (Phase 1)

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 18-DATA-DICT-P1  
**Version:** v1.0  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft

---
## Key fields
### trips.final_distance_m
**Meaning:** Official distance used for reimbursement calculation (meters).  
**Source:** Derived from Doc 09 priority rules.

### trips.distance_source
**Meaning:** Which source produced the official distance.  
**Values:** GPS, SELECTED_ROUTE, ODOMETER_OVERRIDE.

### trips.odometer_mode
**Meaning:** Whether odometer is used as evidence only or official override.  
**Values:** NONE, EVIDENCE_ONLY, OVERRIDE.

### claims.rate_version_id
**Meaning:** Snapshot reference to user rate configuration used for this claim.

### claim_items.type
**Meaning:** Line item category for reimbursement.  
**Values:** MILEAGE, MEAL, LODGING.

# 19 UI Screen Specification — Phase 1

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 19-UI-SCREENS-P1  
**Version:** v1.0  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Locked (Frontend Baseline)

---
## Policy constants (locked)
- **Currency (default):** MYR
- **Distance unit (display):** KM (internally store meters)
- **Subscription limits (Phase 1 baseline):**
- **Free:** 2 route-calculations/month
- **Pro:** unlimited trips, exports, route-calculations

## 1) Purpose
This document turns the PRD + UX flows into a **screen-by-screen frontend build spec**, including:
- Navigation map
- Screen list and entry points
- Components, fields, and states (loading/empty/error/offline)
- Validation rules and gating rules

## 2) Navigation map (recommended)
### A) Auth Stack
- Login
- Accept Invite
- Forgot Password

### B) Main App Tabs
- **Home**
- **Trips**
- **Claims**
- **Settings**

### C) Modal / Sub-flows
- Active Trip (GPS Start/Stop)
- Trip Summary
- Plan Trip (Origin/Destination)
- Route Alternatives (Select Route)
- Claim Detail
- Add Item (Meal/Lodging)
- Export (Filters + Generate)
- Subscription / Upgrade (Limit Reached)

## 3) Global UI rules (locked)
### 3.1 Units, formatting, and display
- Distances shown in **KM** with **2 decimals**.
- Currency shown as **MYR** with **2 decimals**.
- Internally, keep meters and convert for display.

### 3.2 Status badges
- Trip status: `DRAFT` (in-progress) / `FINAL` (stopped & saved)
- Claim status: `DRAFT` / `SUBMITTED` (locked)
- Distance source badge:
- `GPS`
- `SELECTED_ROUTE`
- `ODOMETER OVERRIDE`

### 3.3 Offline banner
- Show a global banner when offline:
- “Offline — some features are limited”
- Allow:
- Viewing cached data
- Starting/stopping GPS trips (queue point uploads)
- Disallow/limit:
- Route calculations
- Exports (unless server-side caching exists)

### 3.4 Limit gating (Phase 1 baseline)
- Route calculations are limited for Free: **2 per month**.
- When Free exceeds limit:
- Block route alternatives request
- Show **Limit Reached** screen with Pro upsell
- Pro: no limits

### 3.5 Claim locking rule (hard)
- Once claim is `SUBMITTED`, the UI must:
- Disable all edit controls
- Hide “Add Item” and “Delete Item”
- Show “Submitted on <date>” and “Locked”

## 4) Screen specs

---

## Screen: Login
**Route:** `/auth/login`  
**Purpose:** Authenticate user

**UI components**
- Email field
- Password field
- Login button
- “Forgot password” link
- “Accept invite” link (if you received an invitation)
- Error banner area

**Validation**
- Email format required
- Password required

**States**
- Loading: disable button, show spinner
- Error: show friendly message + retry

---

## Screen: Accept Invite
**Route:** `/auth/invite?token=...`  
**Purpose:** Join an organization using an invitation link/token (**invite-only** onboarding).

**UI components**
- Token input (hidden if opened from invite link)
- Email field (prefilled if invite contains email; locked)
- Password + Confirm Password (only if user account does not exist yet)
- “Accept Invite” button
- Link to Login (for existing users)
- Error banner area

**Validation**
- Token required and must be valid (not expired / revoked)
- If setting password: minimum length policy, passwords must match

**States**
- Loading: verify token / accepting invite (disable button)
- Error: show friendly message + next action:
  - “Invite expired — request a new invite”
  - “Invite already used — please log in”
  - “Invalid invite — contact your admin”

---

## Screen: Forgot Password
**Route:** `/auth/forgot`  
**Purpose:** Reset password flow

**UI components**
- Email field
- “Send reset link” button

---

## Screen: Home
**Tab:** Home  
**Purpose:** Quick actions + summaries

**UI components**
- Quick actions:
- **Start Trip**
- **Plan Trip**
- **New Claim**
- **Export**
- Summary cards:
- This month: trips count
- This month: route-calcs used (Free only)
- Draft claims count
- Submitted claims count

**Empty states**
- New user: show “Start your first trip” onboarding card

---

## Screen: Trips List
**Tab:** Trips  
**Purpose:** View, search, and open trips

**UI components**
- List of trips (cards)
- Filter: date range (optional)
- Search (optional)
- Floating action: **Start Trip** and **Plan Trip**

**Trip card fields**
- Start date/time
- End date/time (or “In progress”)
- Distance (final distance if available)
- Distance source badge
- Odometer indicator:
- “Evidence attached” or “Override”

**States**
- Empty: “No trips yet”
- Loading skeleton list
- Offline: allow viewing cached list; disable Plan Trip if route calls needed

---

## Screen: Active Trip (GPS Start/Stop)
**Purpose:** Record GPS points during manual tracking

**UI components**
- Big status: “Tracking ON”
- Elapsed time
- GPS accuracy indicator (Good/Weak)
- Buttons:
- **Stop Trip** (primary)
- “Cancel” (optional; discard draft trip)

**Rules**
- Request location permission when starting.
- Show indicator while tracking.

**States**
- Permission denied: explanation + “Open Settings”
- GPS unavailable: retry + tips
- Offline: allow tracking; queue points

---

## Screen: Trip Summary
**Purpose:** Confirm and enrich trip before attaching to claim

**UI components**
- Map preview
- Summary fields:
- Start/End time
- Distance breakdown (if available)
- Official distance (final) + badge
- Odometer section:
- Upload start/end photo
- Enter readings or distance
- Toggle: “Use odometer as official distance (Override)”
- Notes
- Actions:
- **Save Trip**
- **Add to Claim** (shortcut)

**Validation**
- If Override enabled → require odometer distance/readings.
- If SELECTED_ROUTE mode → require selected route distance.

---

## Screen: Plan Trip (Origin/Destination)
**Purpose:** Create planned trip and fetch route alternatives

**UI components**
- Origin input (autocomplete)
- Destination input (autocomplete)
- Button: **Get Routes**

**Gating**
- Free: block if used ≥ 2/month → Limit Reached

**States**
- Offline: disable Get Routes; show message

---

## Screen: Route Alternatives (Select Route)
**Purpose:** Show routes and allow user selection

**UI components**
- Alternatives list:
- Distance (KM)
- Duration
- Route summary
- Map preview for selected
- Button: **Select This Route**

**Rules**
- On selection:
- Save trip with `calculation_mode=SELECTED_ROUTE`
- Store `selected_route_distance_m`
- Derive `final_distance_m` per Doc 09

---

## Screen: Claims List
**Tab:** Claims  
**Purpose:** List and manage claims

**UI components**
- Filter: Draft / Submitted / All
- Claim cards show:
- Title or period label
- Period start/end
- Total amount (MYR)
- Status badge
- Action: **New Claim**

---

## Screen: Claim Detail (Draft)
**Purpose:** Build claim items and submit

**UI components**
- Header: title, period start/end, status badge
- Items list (Mileage/Meal/Lodging)
- Button: **Add Item**
- Totals footer (MYR)
- Button: **Submit Claim**

**Validation**
- Period start <= period end
- Must have at least 1 item before submit

---

## Screen: Add Meal Item (Modal)
**Purpose:** Add meal expense

**UI components**
- Toggle: Receipt / Fixed Rate
- Receipt mode:
- Amount (MYR)
- Receipt upload
- Merchant (optional)
- Fixed rate mode:
- Amount auto-filled from meal default
- Save

---

## Screen: Add Lodging Item (Modal)
Same as Meal, plus optional:
- Nights qty

---

## Screen: Claim Detail (Submitted / Locked)
**Purpose:** View-only

**UI changes**
- Disable fields, hide add/delete
- Show “Submitted on <timestamp>” and “Locked”

---

## Screen: Export
**Purpose:** Export claims to CSV or XLSX

**UI components**
- Date range picker
- Status filter (default: Submitted)
- Format selector: CSV / XLSX
- Button: **Generate Export**
- Export history list (recommended): Pending / Done / Failed + Download

**States**
- Offline: disable generation
- Failure: show retry

---

## Screen: Limit Reached (Subscription Upsell)
**Purpose:** Handle Free route-calcs limit

**UI components**
- Message: “You’ve used your 2 route calculations for this month.”
- CTA: Upgrade to Pro
- Secondary: Use GPS tracking instead

---

## Screen: Settings
**Purpose:** Profile, rates, privacy, account

**UI components**
- Profile: display name, company (optional)
- Rates:
- Mileage rate (per KM) + MYR
- Meal default rate (optional)
- Lodging default rate (optional)
- Privacy:
- Location permission status
- “Tracking only during active trip” statement
- Account: Sign out

## 5) Required UI strings (high priority)
See **Doc 14 — UI Copy & Microcopy**.

---

## Change log
- **v1.0 (27 Feb 2026):** Created frontend-first screen specification baseline.

# 20 Frontend Component Architecture — React Native/Expo (Phase 1)

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 20-FE-ARCH-P1  
**Version:** v1.1  
**Date:** 02 Mar 2026  
**Owner:** Darya Malak  
**Status:** Draft (invite-only aligned)

---
## 1) Purpose
Define the **frontend architecture** for Phase 1:
- Folder structure
- Component inventory
- State model
- Navigation structure
- Data fetching patterns
- Offline and upload patterns
- Error handling conventions

## 2) Tech baseline (assumptions)
- React Native with Expo
- React Navigation (stack + tabs)
- Data fetching: TanStack Query (recommended) or RTK Query
- Global state: minimal (auth/session + config); most state via query cache
- Storage:
- AsyncStorage for small config/token
- Optional local queue store for offline trip point uploads

## 3) Recommended repo structure
```text
src/
app/
    AppProviders.tsx
    navigation/
    RootNavigator.tsx
    AuthStack.tsx
    MainTabs.tsx
    TripsStack.tsx
    ClaimsStack.tsx
    SettingsStack.tsx
api/
    client.ts
    endpoints/
    auth.ts
    trips.ts
    routes.ts
    claims.ts
    exports.ts
    usage.ts
domain/
    types.ts
    validators.ts
    mappers.ts
store/
    authStore.ts
    appStore.ts
features/
    auth/
    screens/
    components/
    hooks/
    trips/
    screens/
    components/
    hooks/
    claims/
    screens/
    components/
    hooks/
    exports/
    screens/
    components/
    hooks/
    settings/
    screens/
    components/
components/
    Badge.tsx
    Button.tsx
    Card.tsx
    OfflineBanner.tsx
    EmptyState.tsx
    LoadingSkeleton.tsx
    MoneyText.tsx
    DistanceText.tsx
    Toast.tsx
utils/
    format.ts
    date.ts
    distance.ts
    money.ts
    permissions.ts
    upload.ts
    errors.ts
```

## 4) Navigation architecture
### RootNavigator
- If unauthenticated → `AuthStack`
- If authenticated → `MainTabs`

### AuthStack
- Login
- AcceptInvite
- ForgotPassword

### MainTabs
- Home
- TripsStack
- ClaimsStack
- Settings

### TripsStack
- TripsList
- ActiveTrip
- PlanTrip
- RouteAlternatives
- TripSummary

### ClaimsStack
- ClaimsList
- ClaimDetail
- AddMealItem (modal)
- AddLodgingItem (modal)
- SelectTripForMileage (optional)

### Export
- Export screen can be:
- Under ClaimsStack (recommended), or
- Launched from Home as modal

## 5) State model (frontend)
### 5.1 Auth/session (global)
- `token`
- `profile`
- `tier` (FREE/PRO)
- `usage` summary
- `routes_used_this_month`
- `routes_limit_this_month` (Free=2, Pro=∞)

### 5.2 Trips (query cache + minimal UI state)
- Trips list: `items`, `isLoading`, `error`
- Trip detail: `trip`, `points` (optional for map)
- Active tracking UI:
- `activeTripId`
- `trackingStatus` (idle/tracking/stopping)
- `queuedPointsCount`

### 5.3 Claims (query cache)
- Claims list: `items`, `filter`, `isLoading`
- Claim detail:
- `items`
- `total`
- `locked = (status === SUBMITTED)`

### 5.4 Exports
- Export jobs list
- Job polling and download

## 6) Data fetching patterns
### 6.1 TanStack Query (recommended)
- Query keys:
- `['trips', filters]`
- `['trip', tripId]`
- `['claims', filters]`
- `['claim', claimId]`
- `['exports', filters]`
- `['usage', month]`
- Mutations should invalidate or update cache.

### 6.2 Error handling (UI standard)
- Non-blocking: toast/snackbar
- Blocking: full-screen error with Retry
- Parse standard error shape into:
- `code`, `message`, `details`

### 6.3 Form validation
- Use schema-based validation (zod/yup) for:
- Odometer override requirement
- Claim submission rules
- Plan trip route gating

## 7) Offline strategy (Phase 1)
### 7.1 Allowed offline
- View cached lists from last sync
- GPS tracking:
- queue trip points locally
- sync when online

### 7.2 Blocked offline
- Route calculations
- Export generation

### 7.3 Queue mechanism (minimal)
- Queue item:
- `{ trip_id, seq, lat, lng, accuracy_m, recorded_at }`
- Upload:
- batch to `/trips/{id}/points`
- dedupe by `(trip_id, seq)`

## 8) Upload strategy (receipts + odometer)
- Image compression before upload
- Progress indicator + retry
- Mark failed uploads as “Needs retry”

## 9) Shared components (minimum inventory)
### Shared UI
- `OfflineBanner`
- `EmptyState`
- `LoadingSkeleton`
- `DistanceBadge`
- `TripCard`
- `ClaimCard`
- `ClaimItemRow`
- `ReceiptUploader`
- `OdometerSection`
- `ExportJobRow`

### Trips
- `TripMapPreview`
- `GpsAccuracyIndicator`

### Claims
- `TotalsFooter`
- `SubmitClaimButton`

## 10) Definition of Done (frontend)
A screen is done when:
- Loading/empty/error/offline states exist
- Validations enforce locked rules (claim locking, route limit, odometer override)
- Navigation flow is complete end-to-end
- Basic accessibility checks pass

---

## Change log
- **v1.0 (27 Feb 2026):** Created frontend architecture baseline.

# 21 Frontend Scaffold Checklist & Folder Setup (Phase 1)

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 21-FE-SCAFFOLD-P1  
**Version:** v1.0  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft

---
## 1) Purpose
A step-by-step scaffold plan to start frontend development **without blocking on backend**.

## 2) Scaffold sequence (recommended)
### Step A — Project init
- Create Expo RN project
- Add TypeScript (recommended)
- Add navigation dependencies
- Add basic shared UI components (Button/Card/Badge)
- Add environment configuration (dev/staging/prod)

### Step B — Navigation skeleton
- Create AuthStack + MainTabs
- Add placeholder screens:
- Home
- Trips: TripsList, ActiveTrip, PlanTrip, RouteAlternatives, TripSummary
- Claims: ClaimsList, ClaimDetail, AddMealItem, AddLodgingItem
- Exports: ExportScreen
- Settings

### Step C — Mock data layer
- Create a mock API module that returns sample trips/claims/export jobs
- Wire screens to render lists/detail with mock data
- Implement and verify loading/empty/error states

### Step D — Locked UI rules
- Implement:
- Claim locking behavior (SUBMITTED)
- Route gating (Free=2/month)
- Odometer override validation (require odometer distance)

### Step E — Swap mock → real API
Replace endpoints in this order:
1. Auth
2. Trips
3. Claims
4. Routes
5. Exports
6. Usage counters

### Step F — Offline queue (minimum)
- Store trip points in a local queue when offline
- Batch upload on reconnect with retry + dedupe

## 3) Folder checklist
- [ ] `src/app/navigation/*`
- [ ] `src/components/*` shared UI
- [ ] `src/features/*` per domain
- [ ] `src/api/client.ts` + endpoints
- [ ] `src/utils/*` formatting + permissions + errors

## 4) Test checklist (frontend)
- [ ] Login flow
- [ ] Start/stop trip happy path
- [ ] Plan trip blocked when offline
- [ ] Free tier route limit reached screen
- [ ] Draft claim → add items → submit locks
- [ ] Export generation flow (can be stubbed)

---

## Change log
- **v1.0 (27 Feb 2026):** Created scaffold checklist baseline.

# 22 UI State Machine Specification — Phase 1

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 22-UI-STATE-P1  
**Version:** v1.0  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft

---
## Policy constants (locked)
- **Currency (default):** MYR
- **Distance unit (display):** KM (internally store meters)
- **Subscription limits (Phase 1 baseline):**
- **Free:** 2 route-calculations/month
- **Pro:** unlimited trips, exports, route-calculations

## 1) Purpose
Define a **deterministic state machine** for each key UI flow to prevent inconsistent behavior:
- Auth
- GPS tracking (start/stop + point sync)
- Planned trip route selection (with limit gating)
- Claim draft & submission locking
- Exports (job creation + polling + download)

## 2) Global app states
### 2.1 Network state
- `ONLINE`
- `OFFLINE`

### 2.2 Session state
- `UNAUTHENTICATED`
- `AUTHENTICATING`
- `AUTHENTICATED`

### 2.3 Tier/usage state
- `TIER_LOADING`
- `TIER_READY` (includes `tier` + `routes_used` + `routes_limit`)
- `TIER_ERROR`

## 3) Auth flow state machine
**States**
- `idle`
- `submitting`
- `success`
- `error`

**Events**
- `LOGIN_SUBMIT(email, password)`
- `LOGIN_SUCCESS(token)`
- `LOGIN_FAIL(error)`
- `LOGOUT()`

**Transitions**
- idle → submitting on LOGIN_SUBMIT
- submitting → success on LOGIN_SUCCESS
- submitting → error on LOGIN_FAIL
- error → submitting on LOGIN_SUBMIT
- success → idle on LOGOUT (and clear caches)

**UI rules**
- During `submitting`: disable submit buttons, show spinner
- In `error`: show inline error message, keep input values

## 4) GPS trip tracking flow
### 4.1 Trip lifecycle
**States**
- `idle`
- `starting`
- `tracking`
- `stopping`
- `finalizing`
- `finalized`
- `error`

**Events**
- `START_TRIP_REQUEST`
- `START_TRIP_GRANTED(trip_id)`
- `START_TRIP_DENIED(permission_denied)`
- `LOCATION_POINT(lat,lng,accuracy,ts)`
- `STOP_TRIP_REQUEST`
- `STOP_TRIP_CONFIRMED`
- `FINALIZE_SUCCESS(trip_id)`
- `FINALIZE_FAIL(error)`

**Transitions**
- idle → starting on START_TRIP_REQUEST
- starting → tracking on START_TRIP_GRANTED
- starting → error on START_TRIP_DENIED
- tracking → stopping on STOP_TRIP_REQUEST
- stopping → finalizing on STOP_TRIP_CONFIRMED
- finalizing → finalized on FINALIZE_SUCCESS
- finalizing → error on FINALIZE_FAIL

### 4.2 Point upload sub-state (parallel)
**States**
- `queueing` (offline or buffering)
- `uploading`
- `synced`
- `upload_error`

**Rules**
- When OFFLINE: force `queueing`
- When ONLINE and queue>0: `uploading` in batches
- Dedupe by `(trip_id, seq)` on server

## 5) Planned trip (Selected Route) flow
### 5.1 Route request
**States**
- `idle`
- `checking_limit`
- `blocked_limit_reached`
- `requesting_routes`
- `routes_ready`
- `error`

**Events**
- `GET_ROUTES_REQUEST(origin, destination)`
- `LIMIT_OK`
- `LIMIT_BLOCKED`
- `ROUTES_SUCCESS(alternatives[])`
- `ROUTES_FAIL(error)`
- `SELECT_ROUTE(route_id)`
- `SELECT_SUCCESS(trip_id)`
- `SELECT_FAIL(error)`

**Transitions**
- idle → checking_limit on GET_ROUTES_REQUEST
- checking_limit → blocked_limit_reached on LIMIT_BLOCKED
- checking_limit → requesting_routes on LIMIT_OK
- requesting_routes → routes_ready on ROUTES_SUCCESS
- requesting_routes → error on ROUTES_FAIL

**Gating rules (locked)**
- Free: if routes_used >= 2/month → LIMIT_BLOCKED
- Pro: always LIMIT_OK

**Offline rule**
- If OFFLINE: block with message “Route calculation requires internet”.

## 6) Claim draft & submission locking flow
### 6.1 Claim editing
**States**
- `loading`
- `draft_editable`
- `submitting`
- `submitted_locked`
- `error`

**Events**
- `LOAD_CLAIM(claim_id)`
- `LOAD_SUCCESS(claim)`
- `LOAD_FAIL(error)`
- `ADD_ITEM(type)`
- `UPDATE_FIELD(path,value)`
- `SUBMIT_REQUEST`
- `SUBMIT_SUCCESS(timestamp)`
- `SUBMIT_FAIL(error)`

**Transitions**
- loading → draft_editable on LOAD_SUCCESS(status=DRAFT)
- loading → submitted_locked on LOAD_SUCCESS(status=SUBMITTED)
- draft_editable → submitting on SUBMIT_REQUEST
- submitting → submitted_locked on SUBMIT_SUCCESS
- submitting → error on SUBMIT_FAIL

**Locking rules (hard)**
- In `submitted_locked`: disable edits, hide add/delete
- Server is the source of truth; if server says SUBMITTED, UI must lock

## 7) Export flow (job-based)
**States**
- `idle`
- `creating_job`
- `polling`
- `ready`
- `failed`

**Events**
- `EXPORT_REQUEST(filters, format)`
- `JOB_CREATED(job_id)`
- `JOB_STATUS(status)`
- `JOB_READY(download_url)`
- `JOB_FAILED(error)`

**Transitions**
- idle → creating_job on EXPORT_REQUEST
- creating_job → polling on JOB_CREATED
- polling → ready on JOB_READY
- polling → failed on JOB_FAILED

**Offline rules**
- If OFFLINE: disable export request

## 8) Standard screen states (apply everywhere)
- `loading`
- `empty`
- `ready`
- `error`
- `offline` (banner + disabled actions)

## 9) Error handling mapping (recommended)
- `UNAUTHENTICATED`: force logout + return to Login
- `LIMIT_REACHED`: show Limit Reached screen
- `VALIDATION_ERROR`: show inline form errors
- `NETWORK_ERROR`: show offline banner + retry UI

---

## Change log
- **v1.0 (27 Feb 2026):** Created UI state machine specification for Phase 1.

# 23 Frontend Data Types & Interfaces — Phase 1

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 23-FE-TYPES-P1  
**Version:** v1.1  
**Date:** 02 Mar 2026  
**Owner:** Darya Malak  
**Status:** Draft (multi-tenant + invite-only integrated)

---

## Policy constants (locked)
- Currency: MYR
- Distance display unit: KM (internally meters)
- Free: 2 route-calcs/month; Pro: unlimited

## 1) Purpose
TypeScript interfaces aligned to:
- Multi-tenant (orgs + memberships)
- Invite-only onboarding
- Locked distance + claim rules

> Distances are stored/transmitted in meters. UI shows KM.

## 2) Core enums
```ts
export type Tier = 'FREE' | 'PRO';

export type GlobalRole = 'USER' | 'ADMIN'; // profiles.role

export type OrgRole = 'OWNER' | 'MANAGER' | 'MEMBER';

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export type TripStatus = 'DRAFT' | 'FINAL';
export type ClaimStatus = 'DRAFT' | 'SUBMITTED';

export type CalculationMode = 'GPS_TRACKING' | 'SELECTED_ROUTE';

export type OdometerMode = 'NONE' | 'EVIDENCE_ONLY' | 'OVERRIDE';

export type DistanceSource = 'GPS' | 'SELECTED_ROUTE' | 'ODOMETER_OVERRIDE';

export type ClaimItemType = 'MILEAGE' | 'MEAL' | 'LODGING';

export type ExportFormat = 'CSV' | 'XLSX';
export type ExportJobStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';
```

## 3) Common primitives
```ts
export type ISODate = string;      // 'YYYY-MM-DD'
export type ISODateTime = string;  // ISO-8601

export type Money = {
  currency: 'MYR' | string;
  amount: number;
};
```

## 4) Multi-tenant models
```ts
export type Organization = {
  id: string;
  name: string;
  created_at: ISODateTime;
};

export type OrgMember = {
  org_id: string;
  user_id: string;
  org_role: OrgRole;
  created_at: ISODateTime;
};

export type Invitation = {
  id: string;
  org_id: string;
  email: string;
  org_role: OrgRole;
  status: InviteStatus;
  expires_at: ISODateTime;
  created_at: ISODateTime;
};
```

## 5) Profile
```ts
export type Profile = {
  id: string;
  email: string;
  display_name?: string | null;
  role: GlobalRole; // USER or ADMIN
  created_at: ISODateTime;
};
```

## 6) Trip models
```ts
export type TripPoint = {
  id: string;
  trip_id: string;
  seq: number;
  lat: number;
  lng: number;
  accuracy_m?: number;
  recorded_at: ISODateTime;
};

export type Trip = {
  id: string;
  org_id: string;
  user_id: string;

  status: TripStatus;
  calculation_mode: CalculationMode;

  started_at: ISODateTime;
  ended_at?: ISODateTime | null;

  origin_text?: string | null;
  destination_text?: string | null;

  // Distances in meters
  gps_distance_m?: number | null;
  selected_route_distance_m?: number | null;
  odometer_distance_m?: number | null;

  odometer_mode: OdometerMode;

  final_distance_m?: number | null;
  distance_source?: DistanceSource | null;

  notes?: string | null;

  created_at: ISODateTime;
  updated_at: ISODateTime;
};
```

## 7) Claim models
```ts
export type Claim = {
  id: string;
  org_id: string;
  user_id: string;

  status: ClaimStatus;

  title?: string | null;
  period_start: ISODate;
  period_end: ISODate;

  submitted_at?: ISODateTime | null;

  rate_version_id?: string | null;

  currency: 'MYR' | string;
  total_amount: number;

  created_at: ISODateTime;
  updated_at: ISODateTime;
};

export type ClaimItem = {
  id: string;
  org_id: string;
  claim_id: string;
  type: ClaimItemType;

  trip_id?: string | null;

  qty?: number | null;
  unit?: 'KM' | 'NIGHT' | string | null;

  rate?: number | null;
  amount: number;

  currency: 'MYR' | string;

  receipt_url?: string | null;
  merchant?: string | null;
  notes?: string | null;

  created_at: ISODateTime;
};
```

## 8) Usage & subscription
```ts
export type UsageSummary = {
  tier: Tier;
  period_start: ISODate;
  period_end: ISODate;

  routes_used: number;
  routes_limit: number | null; // null = unlimited
};
```

## 9) Export jobs
```ts
export type ExportFilters = {
  date_from: ISODate;
  date_to: ISODate;
  status?: ClaimStatus; // default SUBMITTED
};

export type ExportJob = {
  id: string;
  org_id: string;
  user_id: string;
  filters: ExportFilters;
  format: ExportFormat;
  status: ExportJobStatus;

  file_url?: string | null;

  created_at: ISODateTime;
  completed_at?: ISODateTime | null;
};
```

## 10) API error shape (locked)
```ts
export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
};
```

## 11) Helpers (recommended)
```ts
export function metersToKm(m?: number | null): number | null {
  if (m == null) return null;
  return Math.round((m / 1000) * 100) / 100;
}
```

---

## Change log
- **v1.1 (02 Mar 2026):** Added multi-tenant + invite-only types (Organization, OrgMember, Invitation) and added `org_id` to all business models.

# 24 Mock Data Pack — Phase 1

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 24-MOCK-DATA-P1  
**Version:** v1.0  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft

---
## Policy constants (locked)
- **Currency (default):** MYR
- **Distance unit (display):** KM (internally store meters)
- **Subscription limits (Phase 1 baseline):**
- **Free:** 2 route-calculations/month
- **Pro:** unlimited trips, exports, route-calculations

## 1) Purpose
Provide ready mock objects so frontend can build screens before backend is complete.

## 2) How to use
- Copy these objects into a local `mockData.ts` file.
- Use them with list screens (Trips, Claims, Exports) and detail screens.
- Use the `usage` object to simulate **route limit gating**.

## 3) Mock objects (JSON)
```json
{
"usage": {
    "tier": "FREE",
    "period_start": "2026-02-01",
    "period_end": "2026-02-28",
    "routes_used": 1,
    "routes_limit": 2
},
"trips": [
    {
    "id": "trip_001",
    "user_id": "user_001",
    "status": "FINAL",
    "calculation_mode": "GPS_TRACKING",
    "started_at": "2026-02-26T08:10:00Z",
    "ended_at": "2026-02-26T09:05:00Z",
    "gps_distance_m": 15420,
    "selected_route_distance_m": null,
    "odometer_mode": "EVIDENCE_ONLY",
    "odometer_distance_m": 16000,
    "final_distance_m": 15420,
    "distance_source": "GPS",
    "notes": "Site visit - Shah Alam",
    "created_at": "2026-02-26T08:10:00Z",
    "updated_at": "2026-02-26T09:05:10Z"
    },
    {
    "id": "trip_002",
    "user_id": "user_001",
    "status": "FINAL",
    "calculation_mode": "SELECTED_ROUTE",
    "started_at": "2026-02-25T02:00:00Z",
    "ended_at": "2026-02-25T02:00:00Z",
    "gps_distance_m": null,
    "selected_route_distance_m": 48500,
    "odometer_mode": "OVERRIDE",
    "odometer_distance_m": 50000,
    "final_distance_m": 50000,
    "distance_source": "ODOMETER_OVERRIDE",
    "notes": "Client meeting - planned",
    "created_at": "2026-02-25T02:00:00Z",
    "updated_at": "2026-02-25T02:02:00Z"
    }
],
"claims": [
    {
    "id": "claim_001",
    "user_id": "user_001",
    "status": "DRAFT",
    "title": "February 2026",
    "period_start": "2026-02-01",
    "period_end": "2026-02-28",
    "submitted_at": null,
    "rate_version_id": "rate_001",
    "total_amount": {
        "currency": "MYR",
        "amount": 0.0
    },
    "created_at": "2026-02-26T10:00:00Z",
    "updated_at": "2026-02-26T10:00:00Z"
    },
    {
    "id": "claim_002",
    "user_id": "user_001",
    "status": "SUBMITTED",
    "title": "January 2026",
    "period_start": "2026-01-01",
    "period_end": "2026-01-31",
    "submitted_at": "2026-02-02T05:00:00Z",
    "rate_version_id": "rate_001",
    "total_amount": {
        "currency": "MYR",
        "amount": 321.5
    },
    "created_at": "2026-02-01T10:00:00Z",
    "updated_at": "2026-02-02T05:00:00Z"
    }
],
"claim_items": [
    {
    "id": "item_001",
    "claim_id": "claim_002",
    "type": "MILEAGE",
    "trip_id": "trip_001",
    "qty": 15.42,
    "unit": "KM",
    "rate": 0.8,
    "amount": {
        "currency": "MYR",
        "amount": 12.34
    },
    "receipt_url": null,
    "merchant": null,
    "notes": "Mileage for site visit",
    "created_at": "2026-02-02T04:30:00Z"
    },
    {
    "id": "item_002",
    "claim_id": "claim_002",
    "type": "MEAL",
    "trip_id": null,
    "qty": null,
    "unit": null,
    "rate": null,
    "amount": {
        "currency": "MYR",
        "amount": 25.0
    },
    "receipt_url": "https://example.com/receipt_001.jpg",
    "merchant": "Restoran ABC",
    "notes": "Lunch with client",
    "created_at": "2026-02-02T04:32:00Z"
    }
],
"exports": [
    {
    "id": "export_001",
    "user_id": "user_001",
    "filters": {
        "date_from": "2026-01-01",
        "date_to": "2026-01-31",
        "status": "SUBMITTED"
    },
    "format": "XLSX",
    "status": "DONE",
    "file_url": "https://example.com/export_001.xlsx",
    "created_at": "2026-02-02T05:10:00Z",
    "completed_at": "2026-02-02T05:10:30Z"
    }
]
}
```

## 4) Scenarios included
- GPS trip (final distance from GPS) + odometer evidence-only
- Planned trip (selected route) + odometer override
- Draft claim + Submitted claim (locked)
- Mileage + Meal claim items
- Export job Done

---

## Change log
- **v1.0 (27 Feb 2026):** Created mock data pack baseline.

# 25 Design System & UI Kit Specification — Phase 1

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 25-UI-KIT-P1  
**Version:** v1.0  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft

---
## Policy constants (locked)
- **Currency (default):** MYR
- **Distance unit (display):** KM (internally store meters)
- **Subscription limits (Phase 1 baseline):**
- **Free:** 2 route-calculations/month
- **Pro:** unlimited trips, exports, route-calculations

## 1) Purpose
Define a minimal, consistent **design system** for Phase 1 so screens look cohesive and development is faster.

## 2) Visual style (recommendation)
- Clean, modern, finance-friendly
- High contrast for readability
- Clear status badges (Draft/Submitted, GPS/Route/Odometer)

## 3) Global tokens
### 3.1 Spacing
- Base unit: 4
- Common paddings: 8, 12, 16, 20
- Common gaps: 8, 12, 16

### 3.2 Typography
- Title: 20–24
- Section title: 16–18
- Body: 14–16
- Caption: 12–13

### 3.3 Radii & elevation
- Card radius: 12
- Button radius: 10
- Elevation: subtle (1–3)

### 3.4 Colors (semantic)
- Primary (CTA)
- Success (Submitted/Done)
- Warning (GPS weak / limit warning)
- Danger (Errors)
- Neutral (text, backgrounds)
> Keep these in a theme file, avoid hardcoding across screens.

## 4) Component inventory (minimum)
### 4.1 Atoms
- `Button` (primary/secondary/ghost/danger; loading/disabled; icons)
- `TextInput` (default/focused/error/disabled)
- `Badge` (neutral/success/warning/danger)
- `Divider`, `Icon`, `Spinner`, `Switch`, `Chip`

### 4.2 Molecules
- `Card`, `ListRow`, `SectionHeader`
- `Toast` / `Snackbar`
- `EmptyState`, `LoadingSkeleton`
- `OfflineBanner`
- `BottomSheet` / `Modal`

### 4.3 Domain components
- `TripCard` (time, distance, source badge, odometer indicator)
- `ClaimCard` (period, status, total)
- `ClaimItemRow` (type, amount, receipt indicator)
- `DistanceSourceBadge` (GPS/SELECTED_ROUTE/ODOMETER OVERRIDE)
- `ReceiptUploader` (progress, retry, remove)
- `OdometerSection` (photos, readings, override toggle)

## 5) Standard states & patterns
- Loading: skeleton for lists, spinner for buttons
- Empty: show primary CTA
- Errors: inline for fields, full-screen for blocking, toast for transient
- Accessibility: tap targets ≥ 44px; don’t rely only on color

## 6) Formatting utilities (locked)
- Money: MYR, 2 decimals
- Distance: KM, 2 decimals (from meters)
- Always show distance source badge when final distance exists

## 7) Deliverables for engineering
- `theme.ts` with tokens
- `components/` base UI library
- `components/domain/` trip/claim components
- `utils/format.ts` (money/distance/date)

---

## Change log
- **v1.0 (27 Feb 2026):** Created Phase 1 design system & UI kit spec.

# 26 Navigation & Screen Scaffolding Plan — Phase 1

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 26-NAV-SCAFFOLD-P1  
**Version:** v1.1  
**Date:** 02 Mar 2026  
**Owner:** Darya Malak  
**Status:** Draft (invite-only aligned)

---
## Policy constants (locked)
- **Currency (default):** MYR
- **Distance unit (display):** KM (internally store meters)
- **Subscription limits (Phase 1 baseline):**
- **Free:** 2 route-calculations/month
- **Pro:** unlimited trips, exports, route-calculations

## 1) Purpose
Exact steps to scaffold navigation and screens so the app is clickable end-to-end quickly.

## 2) Navigation graph (implementation-ready)
### RootNavigator
- If `token` absent → `AuthStack`
- Else → `MainTabs`

### AuthStack (Stack)
1. Login
2. AcceptInvite
3. ForgotPassword

### MainTabs (Tabs)
1. HomeStack
2. TripsStack
3. ClaimsStack
4. SettingsStack

### TripsStack (Stack)
1. TripsList
2. ActiveTrip
3. PlanTrip
4. RouteAlternatives
5. TripSummary

### ClaimsStack (Stack)
1. ClaimsList
2. ClaimDetail
3. AddMealItem (Modal)
4. AddLodgingItem (Modal)
5. Export (optional: can live in ClaimsStack)

## 3) Screen scaffolding checklist
### Step A — Create placeholder screens
- [ ] LoginScreen
- [ ] AcceptInviteScreen
- [ ] ForgotPasswordScreen
- [ ] HomeScreen
- [ ] TripsListScreen
- [ ] ActiveTripScreen
- [ ] PlanTripScreen
- [ ] RouteAlternativesScreen
- [ ] TripSummaryScreen
- [ ] ClaimsListScreen
- [ ] ClaimDetailScreen
- [ ] AddMealItemModal
- [ ] AddLodgingItemModal
- [ ] ExportScreen
- [ ] SettingsScreen
- [ ] LimitReachedScreen

### Step B — Shared wrapper
- SafeArea + consistent padding
- OfflineBanner
- Toast container

### Step C — Wire navigation entry points
- Home:
- Start Trip → ActiveTrip
- Plan Trip → PlanTrip
- New Claim → ClaimDetail (create draft then navigate)
- Export → ExportScreen
- Trips:
- TripCard → TripSummary
- PlanTrip → RouteAlternatives → TripSummary
- Claims:
- ClaimCard → ClaimDetail
- Add Item → Meal/Lodging modals
- Submit → lock view state
- LimitReached:
- Upgrade CTA (stub)
- Use GPS Tracking → ActiveTrip

## 4) Mandatory screen states (minimum)
Every screen must include:
- Loading placeholder
- Empty placeholder (if list/detail missing)
- Error placeholder (Retry)
- Offline handling (disable actions if required)

## 5) Integration points (locked)
### Route gating
- PlanTrip → Get Routes:
- If Free and routes_used >= 2 → navigate LimitReached

### Claim locking
- ClaimDetail:
- If status == SUBMITTED:
    - disable fields
    - hide add/delete
    - show “Locked” banner

## 6) Deliverables
- Navigation files: RootNavigator/AuthStack/MainTabs + stacks
- Screen placeholders (all routes exist)
- One end-to-end demo path with mock data:
- Login → Home → Trips → TripSummary → Claims → Submit → Export

---

## Change log
- **v1.0 (27 Feb 2026):** Created navigation & scaffolding plan baseline.

# 27 Mock-first Implementation Sprint Plan — Frontend (Phase 1)

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 27-MOCK-SPRINT-P1  
**Version:** v1.0  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft

---
## Policy constants (locked)
- **Currency (default):** MYR
- **Distance unit (display):** KM (internally store meters)
- **Subscription limits (Phase 1 baseline):**
- **Free:** 2 route-calculations/month
- **Pro:** unlimited trips, exports, route-calculations

## 1) Purpose
Build the frontend **end-to-end UI** using mock data before backend integration to reduce churn and ensure locked rules are enforced:
- Route limit gating (Free=2/month)
- Claim submission locking
- Odometer override validation

**Inputs**
- Doc 19 (UI Screen Spec)
- Doc 22 (UI State Machine)
- Doc 24 (Mock Data Pack)
- Doc 25–26 (UI Kit + Navigation scaffold)

## 2) Sprint goal (definition)
At the end of this sprint, a tester can:
1. Log in (mock auth)
2. Start a GPS trip (UI + state only) and stop it into Trip Summary
3. Plan a trip (mock alternatives) and select route (with Free limit gating)
4. Create claim, add items, submit (locks UI)
5. Generate export job (mock) and see download link (stub)

## 3) Sprint duration
Recommended: **5–7 working days** for one frontend developer.

## 4) Implementation approach
- Use a `mockApi` module (async simulated)
- Keep interface shapes aligned to Doc 23 (TypeScript types)
- Store mock state in memory (simple) and reset via dev action (optional)

## 5) Work breakdown (day-by-day)
### Day 1 — Base plumbing
- Navigation complete (AuthStack + MainTabs + stacks)
- Shared components: OfflineBanner, EmptyState, LoadingSkeleton, Toast
- Mock auth: Login sets token, Logout clears token

### Day 2 — Trips list + Trip summary (read-only first)
- TripsList renders TripCard:
- time, final distance (KM), distance source badge
- odometer indicator
- TripSummary renders:
- distance breakdown
- odometer section UI (uploads can be stubbed)
- validation for odometer override

### Day 3 — GPS flow UI state machine
- ActiveTrip screen:
- tracking on/off UI
- timer + accuracy placeholders
- stop flow navigates to TripSummary
- Offline: allow tracking with banner

### Day 4 — Planned route flow + limit gating
- PlanTrip:
- origin/destination inputs (simple text ok)
- Get Routes triggers mock alternatives
- RouteAlternatives:
- list alternatives + select
- selection navigates to TripSummary
- Limit gating:
- Free: when routes_used >= 2 → LimitReached screen
- Provide “Use GPS tracking instead”

### Day 5 — Claims flow (draft → submit lock)
- ClaimsList with filters
- ClaimDetail (draft):
- items list
- Add Meal / Add Lodging modals
- Submit confirmation → status SUBMITTED
- ClaimDetail (submitted):
- view-only lock state

### Day 6 — Export flow (job-based)
- Export screen:
- date range + format selector
- generate export → create mock job
- poll state to DONE/FAILED
- show download button (stub link)

### Day 7 — Polish + QA pass
- Verify mandatory states
- Align microcopy with Doc 14
- Fix navigation edge cases

## 6) Acceptance checklist (must pass)
- [ ] Can click through all screens without crash
- [ ] Every screen has loading/empty/error/offline states
- [ ] Claim locking works after submit (UI disables edits)
- [ ] Route limit gating works (Free capped at 2/month)
- [ ] Odometer override requires distance or shows validation error
- [ ] Export job transitions: pending → done/failed
- [ ] UI consistency via shared UI kit components

## 7) Deliverables
- All screens functional with mock data
- `mockApi/` + `mockData.ts`
- Demo walkthrough script

---

## Change log
- **v1.0 (27 Feb 2026):** Created mock-first sprint plan baseline.

# 27B Frontend Component Task List — Mock-first Sprint (Phase 1)

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 27B-FE-TASKS-P1  
**Version:** v1.0  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft

---
## Policy constants (locked)
- **Currency (default):** MYR
- **Distance unit (display):** KM (internally store meters)
- **Subscription limits (Phase 1 baseline):**
- **Free:** 2 route-calculations/month
- **Pro:** unlimited trips, exports, route-calculations

## 1) Purpose
A Jira-ready task list for the frontend mock-first sprint.

## 2) Epics & tasks

### Epic FE-01: Project setup & navigation
- FE-01.1 Initialize Expo RN + TS project
- FE-01.2 Install and configure React Navigation
- FE-01.3 Implement RootNavigator (AuthStack vs MainTabs)
- FE-01.4 Implement stacks: TripsStack, ClaimsStack, SettingsStack
- FE-01.5 Create placeholder screens (all routes)

### Epic FE-02: UI Kit (shared components)
- FE-02.1 Theme tokens (spacing, typography, colors)
- FE-02.2 Button / Card / Badge / Input
- FE-02.3 EmptyState, LoadingSkeleton
- FE-02.4 Toast/Snackbar
- FE-02.5 OfflineBanner

### Epic FE-03: Mock layer
- FE-03.1 Create `mockData.ts` from Doc 24
- FE-03.2 Create `mockApi.ts` (async simulation)
- FE-03.3 Usage counter mutator (routes_used increments)
- FE-03.4 Claim submit mutator (status -> SUBMITTED)
- FE-03.5 Export job mutator (PENDING->DONE/FAILED)

### Epic FE-04: Trips UI
- FE-04.1 TripsList screen with TripCard
- FE-04.2 TripSummary screen with distance breakdown
- FE-04.3 OdometerSection UI + override validation
- FE-04.4 ActiveTrip UI state machine (start/stop)
- FE-04.5 Offline banner behavior during ActiveTrip

### Epic FE-05: Planned routes UI + gating
- FE-05.1 PlanTrip screen (origin/destination)
- FE-05.2 RouteAlternatives list + selection
- FE-05.3 LimitReached screen
- FE-05.4 Enforce Free limit = 2 route-calcs/month

### Epic FE-06: Claims UI
- FE-06.1 ClaimsList screen with filters
- FE-06.2 ClaimDetail (draft editable)
- FE-06.3 AddMeal modal
- FE-06.4 AddLodging modal
- FE-06.5 Submit confirmation + lock view-only
- FE-06.6 Ensure SUBMITTED disables edits

### Epic FE-07: Exports UI
- FE-07.1 Export screen (filters + format)
- FE-07.2 Export job list + polling simulation
- FE-07.3 Download button stub + success/failure states

### Epic FE-08: QA & polish
- FE-08.1 Verify all screen states (loading/empty/error/offline)
- FE-08.2 Align microcopy with Doc 14
- FE-08.3 Navigation edge case fixes
- FE-08.4 Final demo walkthrough script

## 3) Definition of Done (per task)
- Code compiles
- UI states included
- Error handling done
- Uses shared UI kit components (no random inline styles)

---

## Change log
- **v1.0 (27 Feb 2026):** Created frontend task list for mock-first sprint.

# 28 API Contracts for Frontend — Phase 1

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 28-API-CONTRACTS-P1  
**Version:** v1.1  
**Date:** 02 Mar 2026  
**Owner:** Darya Malak  
**Status:** Draft (multi-tenant + invite-only integrated)

---
## Policy constants (locked)
- **Currency (default):** MYR
- **Distance unit (display):** KM (internally store meters)
- **Subscription limits (Phase 1 baseline):**
- **Free:** 2 route-calculations/month
- **Pro:** unlimited trips, exports, route-calculations

\
## 1) Purpose
This document upgrades the API from “skeleton” to **frontend-buildable contracts**, including:
- Request/response shapes with examples
- Status codes and rules
- Pagination/filter conventions
- Idempotency and offline sync notes

**Base URL:** `/api/v1`  
**Auth:** `Authorization: Bearer <token>`  
**Default currency:** MYR  
**Distances:** meters in API (`*_distance_m`), UI converts to KM

## 2) Common conventions (locked)
### 2.1 Envelope and timestamps
- Timestamps are ISO-8601 UTC.
- IDs are opaque strings (UUID recommended).

### 2.2 Money
Money is transmitted as an object:
```json
{ "currency": "MYR", "amount": 12.34 }
```

### 2.3 Standard error format (locked)
All non-2xx responses return:
```json
{
"error": {
    "code": "STRING_CODE",
    "message": "Human readable message",
    "details": { "any": "optional" }
}
```

### 2.4 Pagination (lists)
Use either:
- Cursor pagination (preferred):
- Request: `?cursor=<string>&limit=20`
- Response: `{ "items": [...], "next_cursor": "<string|null>" }`
- Or offset pagination (acceptable in Phase 1):
- Request: `?page=1&page_size=20`
- Response: `{ "items": [...], "page": 1, "page_size": 20, "total": 123 }`

### 2.5 Idempotency (recommended for create endpoints)
Client may send:
- `Idempotency-Key: <uuid>`
Server should dedupe repeated POSTs with same key for the same user.

### 2.6 Multi-tenant (organizations) — Phase 1
- Every business object includes `org_id`.
- User-facing endpoints derive the effective org from the authenticated user's membership.
  - The client usually does **not** send `org_id` for normal operations.
- Internal admin endpoints are namespaced under `/admin/*` and require `profiles.role=ADMIN`.


---

## 3) Auth endpoints
### POST /auth/login
**Request**
```json
{ "email": "user@example.com", "password": "secret" }
```

**Response (200)**
```json
{
"token": "jwt_or_session_token",
"profile": { "id": "user_001", "display_name": "Darya Malak" },
"tier": "FREE"
}
```

**Errors**
- 401 `UNAUTHENTICATED` (wrong credentials)

### POST /auth/logout
**Response (204)**

---

## 4) Profile & rates (Settings)
### GET /profile
**Response (200)**
```json
{
"id": "user_001",
"display_name": "Darya Malak",
"company_name": "Effort Studio",
"created_at": "2026-02-01T00:00:00Z"
}
```

### PATCH /profile
**Request**
```json
{ "display_name": "Darya Malak", "company_name": "Effort Studio" }
```

**Response (200)** profile object

### GET /rates/current
Returns the effective rates used for new claims.
**Response (200)**
```json
{
"id": "rate_001",
"effective_from": "2026-02-01",
"currency": "MYR",
"mileage_rate_per_km": 0.80,
"meal_rate_default": 25.00,
"lodging_rate_default": 120.00
}
```

### POST /rates
Creates a new rate version.
**Request**
```json
{
"effective_from": "2026-03-01",
"currency": "MYR",
"mileage_rate_per_km": 0.80,
"meal_rate_default": 25.00,
"lodging_rate_default": 120.00
}
```
**Response (201)** rate object

---

## 5) Usage & subscription
### GET /usage/current
**Response (200)**
```json
{
"tier": "FREE",
"period_start": "2026-02-01",
"period_end": "2026-02-28",
"routes_used": 1,
"routes_limit": 2
}
```
For Pro, `routes_limit` should be `null`.

---

## 6) Uploads (receipts, odometer photos)
Phase 1 recommended approach: **signed URL uploads**.

### POST /uploads/sign
**Request**
```json
{
"purpose": "RECEIPT",
"content_type": "image/jpeg",
"file_name": "receipt_001.jpg"
}
```

**Response (200)**
```json
{
"upload_url": "https://storage-provider/...signed-put-url...",
"file_url": "https://storage-provider/...private-object-url...",
"expires_at": "2026-02-27T12:00:00Z"
}
```

**Client behavior**
1) `PUT upload_url` with binary  
2) Store `file_url` into claim item / trip odometer field.

---

## 7) Trips (GPS tracking + planned routes)
### Trip object shape
```json
{
"id": "trip_001",
"org_id": "org_001",
"user_id": "user_001",
"status": "FINAL",
"calculation_mode": "GPS_TRACKING",
"started_at": "2026-02-26T08:10:00Z",
"ended_at": "2026-02-26T09:05:00Z",

"origin_text": null,
"destination_text": null,

"gps_distance_m": 15420,
"selected_route_distance_m": null,
"odometer_distance_m": 16000,
"odometer_mode": "EVIDENCE_ONLY",

"final_distance_m": 15420,
"distance_source": "GPS",

"notes": "Site visit - Shah Alam",
"created_at": "2026-02-26T08:10:00Z",
"updated_at": "2026-02-26T09:05:10Z"
}
```

### GET /trips?from=YYYY-MM-DD&to=YYYY-MM-DD
**Response (200)**
```json
{ "items": [/* Trip[] */], "next_cursor": null }
```

### GET /trips/{id}
**Response (200)** Trip

### POST /trips
Creates a trip draft.
**Request**
```json
{ "calculation_mode": "GPS_TRACKING" }
```
or
```json
{
"calculation_mode": "SELECTED_ROUTE",
"origin_text": "Kuala Lumpur",
"destination_text": "Shah Alam"
}
```

**Response (201)** Trip

### POST /trips/{id}/start   (GPS only)
**Response (200)** Trip (status becomes DRAFT but “active” on device)

**Errors**
- 409 `CONFLICT` if calculation_mode is not GPS_TRACKING

### POST /trips/{id}/points
Append GPS points in batches.
**Request**
```json
{
"points": [
    { "seq": 1, "lat": 3.1390, "lng": 101.6869, "accuracy_m": 8, "recorded_at": "2026-02-26T08:10:05Z" }
]
}
```
**Response (200)**
```json
{ "accepted": 1, "deduped": 0 }
```

**Notes**
- Server dedupes by `(trip_id, seq)`.

### POST /trips/{id}/stop   (GPS only)
Stops tracking and finalizes GPS distance.
**Response (200)** Trip (status FINAL and `gps_distance_m` filled)

**Errors**
- 409 `CONFLICT` if calculation_mode is not GPS_TRACKING

### PATCH /trips/{id}
Used to attach odometer evidence and notes.
**Request (example)**
```json
{
"odometer_mode": "OVERRIDE",
"odometer_distance_m": 50000,
"odometer_start_photo_url": "https://.../start.jpg",
"odometer_end_photo_url": "https://.../end.jpg",
"notes": "Client meeting"
}
```

**Response (200)** Trip  
**Validation errors**
- 400 `VALIDATION_ERROR` if `odometer_mode=OVERRIDE` without `odometer_distance_m`.

**Important**
- `final_distance_m` and `distance_source` must follow Doc 09.
- If a claim linked to this trip is already SUBMITTED, backend must prevent changes that would alter submitted totals (409 `CONFLICT`).

---

## 8) Routes (planned trip alternatives)
### POST /routes/alternatives
Returns alternative routes and enforces Free tier limit.
**Request**
```json
{
"origin_text": "Kuala Lumpur",
"destination_text": "Shah Alam",
"travel_mode": "DRIVING"
}
```

**Response (200)**
```json
{
"cached": false,
"alternatives": [
    {
    "route_id": "route_a",
    "distance_m": 48500,
    "duration_s": 2800,
    "summary": "Via ELITE Highway",
    "polyline": "encoded_polyline_optional"
    }
],
"usage": { "routes_used": 2, "routes_limit": 2 }
}
```

**Errors**
- 429 `LIMIT_REACHED` if Free tier exceeded  
`details`: `{ "limit": 2, "used": 2, "period_end": "2026-02-28" }`
- 400 `VALIDATION_ERROR` for missing origin/destination

### POST /routes/select
Selects one alternative and finalizes trip.
**Request**
```json
{ "trip_id": "trip_002", "route_id": "route_a" }
```

**Response (200)** Trip (with `selected_route_distance_m` set and derived `final_distance_m`)

---

## 9) Claims
### Claim object (summary)
```json
{
"id": "claim_001",
"user_id": "user_001",
"status": "DRAFT",
"title": "February 2026",
"period_start": "2026-02-01",
"period_end": "2026-02-28",
"submitted_at": null,
"rate_version_id": "rate_001",
"total_amount": { "currency": "MYR", "amount": 0.00 }
}
```

### Claim item object
```json
{
"id": "item_001",
"claim_id": "claim_001",
"type": "MILEAGE",
"trip_id": "trip_001",
"qty": 15.42,
"unit": "KM",
"rate": 0.80,
"amount": { "currency": "MYR", "amount": 12.34 },
"receipt_url": null,
"merchant": null,
"notes": "Mileage for site visit"
}
```

### GET /claims?status=DRAFT|SUBMITTED&from=YYYY-MM-DD&to=YYYY-MM-DD
**Response (200)**
```json
{ "items": [/* Claim[] */], "next_cursor": null }
```

### GET /claims/{id}
**Response (200)**
```json
{
"claim": { /* Claim */ },
"items": [ /* ClaimItem[] */ ]
}
```

### POST /claims
**Request**
```json
{ "title": "February 2026", "period_start": "2026-02-01", "period_end": "2026-02-28" }
```

**Response (201)** Claim

### PATCH /claims/{id}   (draft only)
**Request**
```json
{ "title": "Feb 2026", "period_start": "2026-02-01", "period_end": "2026-02-28" }
```

**Response (200)** Claim  
**Errors**
- 409 `CONFLICT` if claim is SUBMITTED

### POST /claims/{id}/items
Adds a claim item and returns updated totals.
**Request (Mileage)**
```json
{ "type": "MILEAGE", "trip_id": "trip_001" }
```

**Request (Meal — receipt)**
```json
{
"type": "MEAL",
"mode": "RECEIPT",
"amount": { "currency": "MYR", "amount": 25.00 },
"receipt_url": "https://.../receipt.jpg",
"merchant": "Restoran ABC",
"notes": "Lunch with client"
}
```

**Request (Meal — fixed rate)**
```json
{
"type": "MEAL",
"mode": "FIXED_RATE",
"notes": "Meal allowance"
}
```

**Request (Lodging — receipt)**
```json
{
"type": "LODGING",
"mode": "RECEIPT",
"amount": { "currency": "MYR", "amount": 120.00 },
"receipt_url": "https://.../hotel.jpg",
"nights": 1,
"notes": "Hotel"
}
```

**Response (201)**
```json
{
"item": { /* ClaimItem */ },
"claim_total": { "currency": "MYR", "amount": 37.34 }
}
```

**Errors**
- 400 `VALIDATION_ERROR` (missing required fields)
- 409 `CONFLICT` if claim is SUBMITTED
- 409 `CONFLICT` if trip has no `final_distance_m`

### DELETE /claims/{claim_id}/items/{item_id}   (draft only)
**Response (204)**  
**Errors** 409 `CONFLICT` if claim is SUBMITTED

### POST /claims/{id}/submit
Submits and locks the claim.
**Response (200)**
```json
{
"claim": { "id": "claim_001", "status": "SUBMITTED", "submitted_at": "2026-02-27T10:00:00Z", "total_amount": { "currency": "MYR", "amount": 37.34 } }
}
```

**Errors**
- 400 `VALIDATION_ERROR` if no items
- 409 `CONFLICT` if already SUBMITTED

---

## 10) Exports
### POST /exports
Creates an export job (async).
**Request**
```json
{
"filters": { "date_from": "2026-02-01", "date_to": "2026-02-28", "status": "SUBMITTED" },
"format": "XLSX"
}
```

**Response (202)**
```json
{ "job": { "id": "export_001", "status": "PENDING" } }
```

### GET /exports/{id}
**Response (200)**
```json
{
"job": {
    "id": "export_001",
    "status": "DONE",
    "file_url": "https://.../export.xlsx",
    "created_at": "2026-02-27T10:01:00Z",
    "completed_at": "2026-02-27T10:01:30Z"
}
```

### GET /exports
**Response (200)**
```json
{ "items": [ /* ExportJob[] */ ], "next_cursor": null }
```

---


---

## 12) Organizations & Invitations (Invite-only, Multi-tenant)

### POST /admin/orgs  (ADMIN)
Create an organization (company/tenant).
**Request**
```json
{ "name": "Acme Sdn Bhd" }
```

**Response (201)**
```json
{ "org": { "id": "org_001", "name": "Acme Sdn Bhd", "created_at": "2026-03-02T00:00:00Z" } }
```

### POST /admin/orgs/{org_id}/invites  (ADMIN)
Create an invitation for a user to join an org.
**Request**
```json
{ "email": "user@acme.com", "org_role": "MEMBER" }
```

**Response (201)**
```json
{
  "invite": {
    "id": "inv_001",
    "org_id": "org_001",
    "email": "user@acme.com",
    "org_role": "MEMBER",
    "status": "PENDING",
    "expires_at": "2026-03-09T00:00:00Z"
  }
}
```

**Notes**
- Implementation may use Supabase Auth “invite user” capability and also create an `invitations` row for tracking.

### POST /invites/accept  (User)
Finalize provisioning after the user logs in from an invite link.
**Request**
```json
{ "invite_id": "inv_001" }
```

**Response (200)**
```json
{
  "org_member": { "org_id": "org_001", "user_id": "user_001", "org_role": "MEMBER" }
}
```

**Errors**
- 400 `VALIDATION_ERROR` if invite is invalid/expired
- 403 `FORBIDDEN` if invite email does not match authenticated user

## 11) Minimal endpoint checklist (frontend dependency)
Frontend can ship with these endpoints available:
- Auth: `/auth/login`
- Usage: `/usage/current`
- Trips: `/trips`, `/trips/{id}`, `/trips/{id}/start`, `/trips/{id}/points`, `/trips/{id}/stop`, `/trips/{id}` (PATCH)
- Routes: `/routes/alternatives`, `/routes/select`
- Claims: `/claims`, `/claims/{id}`, `/claims/{id}/items`, `/claims/{id}/submit`
- Exports: `/exports`, `/exports/{id}`, `/exports`
- Uploads: `/uploads/sign`

---

## Change log
- **v1.1 (02 Mar 2026):** Added multi-tenant `org_id` fields, admin org/invite endpoints, and invite acceptance contract.
- **v1.0 (27 Feb 2026):** Created frontend-ready API contracts (requests/responses, limits, locking, uploads).

# 28B API Error Code Map to UI — Phase 1

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 28B-ERROR-MAP-P1  
**Version:** v1.0  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft

---
## Policy constants (locked)
- **Currency (default):** MYR
- **Distance unit (display):** KM (internally store meters)
- **Subscription limits (Phase 1 baseline):**
- **Free:** 2 route-calculations/month
- **Pro:** unlimited trips, exports, route-calculations

## 1) Purpose
Map backend error codes and HTTP statuses to **frontend UI behavior** and **state machine transitions** (Doc 22).

## 2) Standard error shape (locked)
```json
{
"error": {
    "code": "STRING_CODE",
    "message": "Human readable message",
    "details": {}
}
```

## 3) Error codes (recommended set)
### UNAUTHENTICATED (401)
**When**
- Missing/expired token
- Invalid credentials (login)

**Frontend behavior**
- If during app usage: clear token, redirect to Login
- Show toast: “Session expired. Please log in again.”

**State machine**
- Session: AUTHENTICATED → UNAUTHENTICATED

---

### FORBIDDEN (403)
**When**
- Attempt to access another user’s resource
- Policy denies action

**Frontend behavior**
- Show full-screen error or toast (depending on context)
- Do not retry automatically

---

### NOT_FOUND (404)
**When**
- Resource missing (trip/claim/export)

**Frontend behavior**
- Show “Not found” empty state
- Offer navigation back

---

### VALIDATION_ERROR (400)
**When**
- Missing fields (origin/destination)
- Odometer override without odometer distance
- Claim submit with no items
- Invalid date range

**Frontend behavior**
- Show inline field errors (preferred)
- If multiple: show summary at top

**State machine**
- Form state: submitting → error

**Recommended details**
- `details.fields`: `{ "fieldName": "message" }`

---

### LIMIT_REACHED (429)  — locked for route calculations
**When**
- Free tier route calculations >= 2/month and user calls `/routes/alternatives`

**Frontend behavior**
- Navigate to LimitReached screen
- Show remaining info from details (limit, used, period_end)
- Provide alternative CTA: “Use GPS tracking instead”

**State machine**
- Planned route flow: checking_limit → blocked_limit_reached

---

### CONFLICT (409)
**When**
- Editing SUBMITTED claim
- Calling GPS start/stop on non-GPS trip
- Trying to add mileage item for trip with no final_distance_m
- Updating a trip that would alter an already SUBMITTED claim

**Frontend behavior**
- Show toast with clear message
- Refresh the affected resource (refetch claim/trip)

**State machine**
- Draft editing: submitting → error (then reload)

---

### NETWORK_ERROR (client-side)
(Not from API, but a common frontend mapping.)

**Frontend behavior**
- Show OfflineBanner
- Disable route calculations and export creation
- Queue GPS points for later upload

**State machine**
- Network: ONLINE → OFFLINE
- Upload substate: uploading → queueing

---

## 4) UI message guidelines
- Always show a recovery action:
- Retry, Go back, Open Settings, Use GPS instead
- Avoid technical language (“meters”, “JWT”, “HTTP”)

## 5) Examples (copy/paste)
### 429 LIMIT_REACHED example
```json
{
"error": {
    "code": "LIMIT_REACHED",
    "message": "Route calculation limit reached for this month.",
    "details": { "limit": 2, "used": 2, "period_end": "2026-02-28" }
}
```

### 400 VALIDATION_ERROR example
```json
{
"error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "details": { "fields": { "origin_text": "Origin is required" } }
}
```

---

## Change log
- **v1.0 (27 Feb 2026):** Defined error code mapping from API to UI behaviors and state transitions.

# 29 Offline Queue & Sync Specification — Phase 1

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 29-OFFLINE-SYNC-P1  
**Version:** v1.0  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft

---
## Policy constants (locked)
- **Currency (default):** MYR
- **Distance unit (display):** KM (internally store meters)
- **Subscription limits (Phase 1 baseline):**
- **Free:** 2 route-calculations/month
- **Pro:** unlimited trips, exports, route-calculations

## 1) Purpose
Define how the mobile app behaves when offline and how it syncs reliably when back online, specifically for:
- GPS trip point uploads
- Trip finalization (stop)
- Basic data caching (read-only)

This spec supports the UI state machine (Doc 22) and API contracts (Doc 28).

## 2) Offline goals (Phase 1)
- GPS tracking must still work when offline (manual Start/Stop).
- Trip points must be queued locally and uploaded when online.
- UI must clearly show offline status and block actions that require network:
- Planned route calculation
- Export generation
- Upload signing (/uploads/sign)

## 3) Data classes & rules
### 3.1 Works offline (allowed)
- Start GPS trip
- Collect points locally
- Stop GPS trip (mark locally as stopped)
- View last-synced lists (cached)

### 3.2 Blocked offline (disallowed)
- Route alternatives `/routes/alternatives`
- Export creation `/exports`
- Signed upload URL creation `/uploads/sign`

## 4) Local queue model
### 4.1 Queue items (Trip points)
Append-only local queue.

**Schema (recommended)**
- `queue_id` (uuid, pk)
- `trip_id` (string)
- `seq` (int) — monotonic per trip
- `lat` (float)
- `lng` (float)
- `accuracy_m` (float nullable)
- `recorded_at` (ISO string)
- `status` = `PENDING` | `SENT` | `FAILED`
- `attempts` (int)
- `last_error` (string nullable)

**Storage options**
- Minimum: AsyncStorage (small volume)
- Recommended: SQLite/MMKV (more reliable for many points)

## 5) Sync algorithm (points)
### 5.1 Triggers
- Connectivity changes to online
- App resumes (foreground)
- User taps “Sync now” (optional)
- After stop trip event (if online)

### 5.2 Batch upload
- Group points by `trip_id`
- Upload in batches (50–200 points)
- Endpoint: `POST /trips/{id}/points`
- Payload includes `seq` so backend can dedupe.

**Response (200)**
```json
{ "accepted": 50, "deduped": 0 }
```

### 5.3 Retry/backoff
- Network error: keep pending, retry when online
- 5xx: exponential backoff (2s, 5s, 10s, 30s)
- 400 validation: mark FAILED and stop auto-retry

### 5.4 Dedup invariant (locked)
- Backend dedupes by `(trip_id, seq)`
- Client never reuses seq numbers for a trip

## 6) Trip stop & finalization (offline-safe)
When user taps **Stop Trip**:
1. Stop collecting points immediately
2. Mark trip locally as “stopped”
3. If online:
- call `POST /trips/{id}/stop`
4. If offline:
- enqueue a finalize job

### 6.1 Finalize job queue (recommended)
**Schema**
- `job_id` (uuid)
- `type` = `FINALIZE_TRIP`
- `trip_id`
- `status` = PENDING | DONE | FAILED
- `attempts`, `last_error`

**Execution rule**
- On reconnect: run finalize jobs first, then upload remaining points.

## 7) Caching (read-only)
### 7.1 Cache scope
- Trips list, Claims list, Claim detail, Export jobs list (optional)

### 7.2 Cache rules
- If offline, show cached data + “Last updated at …”
- Never pretend cached data is live/fresh

## 8) UI rules (must follow)
- Show OfflineBanner whenever offline
- Disable route calculation + export creation when offline
- Show subtle sync indicator during uploading
- If a trip has FAILED items/jobs:
- show “Sync issue” chip and allow retry

## 9) Security notes
- Avoid logging tokens
- Keep queue in app sandbox
- Do not store receipt binaries inside the queue (store files separately)

## 10) Test checklist
- Start trip → offline → stop → online → points upload + finalize
- Kill app mid-trip → reopen → stop + sync
- Duplicate points upload → dedupe works
- 5xx → retry backoff works
- 400 → mark FAILED + UI shows issue

---

## Change log
- **v1.0 (27 Feb 2026):** Created offline queue and sync baseline.

# 29B Upload Retry & Media Handling Specification — Phase 1

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 29B-UPLOADS-P1  
**Version:** v1.0  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft

---
## Policy constants (locked)
- **Currency (default):** MYR
- **Distance unit (display):** KM (internally store meters)
- **Subscription limits (Phase 1 baseline):**
- **Free:** 2 route-calculations/month
- **Pro:** unlimited trips, exports, route-calculations

## 1) Purpose
Define how the app uploads media reliably:
- Receipts (meal/lodging)
- Odometer photos (start/end)

Includes compression, signed URLs, retries, concurrency, and UI behavior.

## 2) Upload architecture (recommended)
Signed URL uploads (Doc 28):
1) `POST /uploads/sign`
2) `PUT upload_url` with binary
3) Save `file_url` into Trip or ClaimItem

**Signing response**
```json
{
"upload_url": "https://...signed-put...",
"file_url": "https://...private-object...",
"expires_at": "2026-02-27T12:00:00Z"
}
```

## 3) Compression & preprocessing
- Resize long edge <= 1600px (configurable)
- JPEG quality ~0.75–0.85
- Strip heavy metadata where possible

## 4) Upload state machine (per file)
- `IDLE`
- `SIGNING`
- `UPLOADING`
- `DONE`
- `FAILED`

## 5) Retry rules
### 5.1 Auto-retry
Retry on:
- network errors
- timeouts
- 5xx from signing endpoint

Do NOT auto-retry on:
- 4xx validation (bad file type, too large)

Backoff: 2s, 5s, 10s then require manual retry.

### 5.2 Concurrency limits
- Max 2 concurrent uploads
- Queue additional uploads FIFO

## 6) UI rules
- Show progress bar while uploading
- On failure show:
- “Upload failed — Retry”
- “Remove” option
- When offline:
- block signing/upload and show OfflineBanner

## 7) Entity validation (locked interactions)
### 7.1 Meal/Lodging
- If item mode is `RECEIPT`: receipt_url should exist before claim submission (recommended).
- If item mode is `FIXED_RATE`: receipt_url optional.

### 7.2 Odometer override
- If `odometer_mode=OVERRIDE`: require `odometer_distance_m`.
- Photos optional but recommended.

## 8) Security & privacy
- Store media in private buckets
- Use short-lived signed GET URLs for viewing
- Do not include raw private URLs in exports by default

## 9) Test checklist
- Upload success path (receipt + odometer)
- Upload fail then retry succeeds
- Offline blocks signing/upload
- Large image compress then upload
- Multiple uploads respect concurrency limit
- Receipt required logic behaves as expected

---

## Change log
- **v1.0 (27 Feb 2026):** Created media upload & retry baseline.

# Docs 30–37 (Standalone Pack)

# 30 Backend Implementation Plan

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 30  
**Version:** v1.0  
**Date:** 02 Mar 2026  
**Owner:** Darya Malak  
**Status:** Draft (Placeholder)

---

> Placeholder: regenerate from compiled pack if needed.

---

# 31 CICD Deployment Runbook

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 31  
**Version:** v1.0  
**Date:** 02 Mar 2026  
**Owner:** Darya Malak  
**Status:** Draft (Placeholder)

---

> Placeholder: regenerate from compiled pack if needed.

---

# 32 UAT Checklist Test Scripts

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 32  
**Version:** v1.0  
**Date:** 02 Mar 2026  
**Owner:** Darya Malak  
**Status:** Draft (Placeholder)

---

> Placeholder: regenerate from compiled pack if needed.

---

# 33 Support FAQ InApp Help

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 33  
**Version:** v1.0  
**Date:** 02 Mar 2026  
**Owner:** Darya Malak  
**Status:** Draft (Placeholder)

---

> Placeholder: regenerate from compiled pack if needed.

---

# 34 Privacy Terms Data Retention Template

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 34  
**Version:** v1.0  
**Date:** 02 Mar 2026  
**Owner:** Darya Malak  
**Status:** Draft (Placeholder)

---

> Placeholder: regenerate from compiled pack if needed.

---

# 35 Multi-tenant Data Model + RLS Policy Spec — Phase 1

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 35-MULTI-TENANT-P1  
**Version:** v1.0  
**Date:** 02 Mar 2026  
**Owner:** Darya Malak  
**Status:** Draft

---
## Policy constants (locked)
- **Currency (default):** MYR
- **Distance unit (display):** KM (internally store meters)
- **Tier limits (Phase 1 baseline):**
  - **Free:** 2 route-calculations/month
  - **Pro:** unlimited trips, exports, route-calculations
- **Multi-tenant:** all business data is scoped by `org_id`
- **Onboarding:** invite-only (no public sign-up)
- **Claims:** `SUBMITTED` claims are locked (no edits in Phase 1)

## 1) Purpose
Define the multi-tenant (organizations/companies) data model and Row Level Security (RLS) policies so:
- Users can only access data inside their organization (`org_id`)
- Internal admins can manage across orgs safely via server-side admin APIs

## 2) Core rules (locked)
- Every business table includes `org_id`
- Access for normal users is based on membership in `org_members`
- Public sign-up is disabled; users join only via invite acceptance

## 3) Tables

### 3.1 organizations
- `id` (uuid, pk)
- `name` (text)
- `status` (ACTIVE/SUSPENDED) (optional)
- `created_at`

### 3.2 profiles
- `id` (uuid, pk, = auth.users.id)
- `email`
- `role` (USER/ADMIN)  ← internal admin gate
- `created_at`

### 3.3 org_members
- `org_id` (fk organizations)
- `user_id` (fk profiles)
- `org_role` (OWNER/MANAGER/MEMBER)
- `status` (ACTIVE/REMOVED) (optional)
- `created_at`
- unique `(org_id, user_id)`

### 3.4 invitations
- `id` (uuid, pk)
- `org_id`
- `email`
- `org_role`
- `status` (PENDING/ACCEPTED/EXPIRED/CANCELLED)
- `invited_by`
- `token_hash` (if using custom tokens)
- `expires_at`, `accepted_at`, `created_at`

## 4) Business tables requirement
Must include `org_id`:
- trips, claims, claim_items, export_jobs, rate_versions (recommended)

## 5) RLS policy approach

### 5.1 Membership predicate
A user is authorized for an org if:
- exists `org_members` where user_id = auth.uid() and org_id = row.org_id and status is ACTIVE

### 5.2 Policies per table (for USER role)
- SELECT: allow if membership predicate is true
- INSERT: allow only if membership predicate is true for inserted org_id
- UPDATE/DELETE: allow only if membership predicate is true for row.org_id (and business rules allow)

### 5.3 Internal admin access (recommended)
Prefer server-side service role for admin app instead of broad “admin can read all” RLS.
- Admin app calls `/api/admin/*`
- Server checks `profiles.role == ADMIN`
- Server uses service role key for cross-org queries

## 6) Integrity safeguards
- Prevent cross-org linking:
  - claim_items.trip_id must reference a trip in the same org as the claim
- Prevent removing last OWNER in an org (recommended)

## 7) Test checklist
- User A (Org A) cannot read Org B trips/claims
- User cannot insert rows with org_id they don’t belong to
- Admin endpoints can list all orgs/users (server-side)

---

## Change log
- **v1.0 (02 Mar 2026):** Multi-tenant model + RLS baseline for invite-only SaaS.

---

# 36 Invite-only Onboarding Spec — Phase 1

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 36-INVITE-ONLY-P1  
**Version:** v1.0  
**Date:** 02 Mar 2026  
**Owner:** Darya Malak  
**Status:** Draft

---
## Policy constants (locked)
- **Currency (default):** MYR
- **Distance unit (display):** KM (internally store meters)
- **Tier limits (Phase 1 baseline):**
  - **Free:** 2 route-calculations/month
  - **Pro:** unlimited trips, exports, route-calculations
- **Multi-tenant:** all business data is scoped by `org_id`
- **Onboarding:** invite-only (no public sign-up)
- **Claims:** `SUBMITTED` claims are locked (no edits in Phase 1)

## 1) Purpose
Define invite-only onboarding for multi-tenant orgs:
- Admin creates org
- Admin invites user to org with org_role
- User accepts invite and becomes a member

## 2) Happy path
1) Admin creates org
2) Admin sends invite (email)
3) User opens Accept Invite screen
4) User sets password / confirms account
5) System creates org_members entry and marks invite accepted

## 3) Admin invite creation (server-side recommended)
- Verify caller is ADMIN
- Create invitation row (PENDING, expires_at)
- Trigger invite email (Supabase invite or custom)
- Return invite id + status

## 4) Accept invite
- Validate invite token, not expired, status=PENDING
- Create auth user if needed
- Create profile if needed
- Create org_members row with org_role
- Mark invite ACCEPTED

## 5) Expire/resend/cancel
- Expiry: default 7 days
- Resend: allowed for PENDING/EXPIRED; invalidates old token
- Cancel: sets CANCELLED; token invalid

## 6) User-facing errors
- Invalid/expired link → show “Invite invalid/expired” + request new invite CTA
- Already member → prompt login

## 7) Audit logs (recommended)
- ORG_CREATED, INVITE_SENT, INVITE_RESENT, INVITE_CANCELLED, INVITE_ACCEPTED

---

## Change log
- **v1.0 (02 Mar 2026):** Invite-only onboarding baseline.

---

# 37 Internal Admin App Security Model — Phase 1

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 37-ADMIN-SECURITY-P1  
**Version:** v1.0  
**Date:** 02 Mar 2026  
**Owner:** Darya Malak  
**Status:** Draft

---
## Policy constants (locked)
- **Currency (default):** MYR
- **Distance unit (display):** KM (internally store meters)
- **Tier limits (Phase 1 baseline):**
  - **Free:** 2 route-calculations/month
  - **Pro:** unlimited trips, exports, route-calculations
- **Multi-tenant:** all business data is scoped by `org_id`
- **Onboarding:** invite-only (no public sign-up)
- **Claims:** `SUBMITTED` claims are locked (no edits in Phase 1)

## 1) Purpose
Secure the internal admin app that can operate across orgs.

## 2) Hard rules
- Admin access requires `profiles.role == ADMIN`
- Privileged reads/writes happen server-side via service role key
- Never expose service role key to browser

## 3) Authorization checks (every request)
- Validate session
- Load profile
- If role != ADMIN → Access Denied

## 4) Defense-in-depth (recommended)
- Optional admin email allowlist
- Vercel deployment protection for preview
- Rate-limit admin endpoints

## 5) Audit logging
Log critical actions:
- org created, invite sent/accepted, member removed/role changed, user role changed
- export retries, routes kill switch (if implemented)

## 6) UI safety patterns
- Confirmation modal for destructive actions
- Optional “reason” field, stored in audit metadata
- Read-only claim view by default

---

## Change log
- **v1.0 (02 Mar 2026):** Admin security model baseline.
