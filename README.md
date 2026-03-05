# Docs README

**Project:** Mileage & Claim Automation SaaS  
**Phase:** Phase 1  
**Document ID:** 00-README  
**Version:** v1.1  
**Date:** 02 Mar 2026  
**Owner:** Darya Malak  
**Status:** Updated (aligned to integrated pack v1.5)

---

## What this folder contains
This folder is the **Phase 1 documentation pack** for **Mileage & Claim Automation SaaS**.

It reflects the current locked direction:
- **Currency:** MYR
- **Distance display unit:** KM (internally meters)
- **Free tier:** 2 route-calculations/month
- **Pro tier:** unlimited trips, exports, route-calculations
- **Claims:** `SUBMITTED` claims are locked
- **Architecture:** two Next.js apps (**User App + Internal Admin App**)
- **Tenant model:** multi-tenant (`org_id`)
- **Onboarding:** invite-only
- **Admin access:** `profiles.role = ADMIN` + server-side privilege checks

---

## Recommended reading order

### 1) Start with the locked business baseline
1. **01 — PRD (Phase 1)**
2. **09 — Distance Logic: Single Source of Truth**
3. **05 — API Specification (OpenAPI skeleton)**

These three define the most important locked rules.

### 2) Then move into the product and frontend build pack
4. **03 — UX Flows**
5. **19 — UI Screen Specification**
6. **22 — UI State Machine Specification**
7. **25 — Design System & UI Kit**
8. **26 — Navigation & Screen Scaffolding Plan**
9. **24 — Mock Data Pack**
10. **27 / 27B — Frontend mock-first sprint + task list**

### 3) Then move into engineering and backend
11. **06 — Database Schema & Migrations Plan**
12. **23 — Frontend Data Types & Interfaces**
13. **28 / 28B — API Contracts for Frontend + Error Mapping**
14. **29 / 29B — Offline Queue + Upload Retry**
15. **30 — Backend Implementation Plan**
16. **31 — CI/CD & Deployment Runbook**

### 4) Then use the QA / Ops / release pack
17. **12 — QA Test Plan**
18. **15 — Release Checklist**
19. **32 — UAT Checklist & Test Scripts**
20. **33 — Support FAQ & In-app Help**
21. **34 — Privacy Policy + Terms + Data Retention**

### 5) For the latest architecture decisions
22. **35 — Multi-tenant Data Model + RLS Policy Spec**
23. **36 — Invite-only Onboarding Spec**
24. **37 — Internal Admin App Security Model**

---

## Canonical references
Use these as the main source of truth when there is any conflict:

- **00_Full_Docs_v1.5_integrated.md** → consolidated integrated pack
- **00_Documentation_Checklist_v1.2.md** → current completion/status checklist
- **19_UI_Screen_Spec_Phase1_v1.1_Admin_Extended.md** → latest screen-level UI scope including Internal Admin App

---

## Document pack structure

### Product & UX
- 01 — PRD (Product Requirements Document) **LOCKED**
- 02 — User Stories & Acceptance Criteria
- 03 — UX Flows (text-first)
- 14 — UI Copy & Microcopy
- 19 — UI Screen Specification (User App + Admin App)
- 22 — UI State Machine Specification
- 24 — Mock Data Pack
- 25 — Design System & UI Kit

### System & Engineering
- 04 — Architecture Blueprint (canonical)
- 05 — API Specification (OpenAPI skeleton) **LOCKED**
- 06 — Database Schema & Migrations Plan
- 07 — Mobile Technical Spec
- 08 — Route Engine & Cost Controls Spec
- 09 — Distance Logic: Single Source of Truth **LOCKED**
- 17 — Export Specification (CSV/XLSX)
- 18 — Data Dictionary
- 20 — Frontend Component Architecture
- 21 — Frontend Scaffold Checklist
- 23 — Frontend Data Types & Interfaces
- 26 — Navigation & Screen Scaffolding Plan
- 28 — API Contracts for Frontend
- 28B — API Error Code → UI Mapping

### Reliability
- 29 — Offline Queue & Sync Specification
- 29B — Upload Retry & Media Handling Specification

### Ops, Security, QA
- 10 — Security & Privacy Spec
- 11 — Monitoring & Incident Runbook
- 12 — QA Test Plan
- 15 — Release Checklist
- 31 — CI/CD & Deployment Runbook
- 32 — UAT Checklist & Test Scripts
- 33 — Support FAQ & In-app Help
- 34 — Privacy Policy + Terms + Data Retention

### Execution Planning
- 13 — Sprint Roadmap
- 16 — Complete Development Checklist
- 27 — Mock-first Implementation Sprint Plan
- 27B — Frontend Component Task List

### Backend Delivery
- 30 — Backend Implementation Plan

### Multi-tenant + Admin
- 35 — Multi-tenant Data Model + RLS Policy Spec
- 36 — Invite-only Onboarding Spec
- 37 — Internal Admin App Security Model

### Reference
- 00 — Documentation Checklist
- 00 — README
- 99 — Project Chat Log Reference

---

## Important implementation notes
- **User App** and **Internal Admin App** are separate apps.
- Both apps may use the **same Supabase project** in Phase 1.
- All customer/business data must be scoped by **`org_id`**.
- Internal admin access must never rely only on hidden UI; it must be enforced server-side.
- Invite-only means there is **no public sign-up** flow.

---

## Suggested repo docs order
If you place docs in a `/docs` folder, a clean order is:
- `00_*`
- `01–09`
- `10–19`
- `20–29`
- `30–37`
- `99_*`

---

## Ownership
Karya oleh **Darya Malak**.
