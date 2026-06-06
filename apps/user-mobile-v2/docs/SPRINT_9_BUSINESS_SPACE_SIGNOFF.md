# Sprint 9 — Business Space Sign-Off

Date: 2026-05-30

## Goal

Port the Business Space from PWA (`apps/user`) into the local-first mobile v2 app.

## Implemented

### Shared Foundation (reuses Sprint 8)
- Business entries use the same `ledger_entries` table with `space_type = 'BUSINESS'`
- `useBusinessLedger.ts` — thin wrappers over Sprint 8 ledger hooks scoped to BUSINESS

### Screens (all local-first, no backend calls)
- **BusinessDashboard** — monthly P&L strip (Income / Expenses / Net), 12-month bar chart (income vs expenses per month), nav cards to Income / Expenses / Reports
- **BusinessIncomeScreen** — monthly income list, Add Income modal (source, category, amount, date, description)
- **BusinessExpensesScreen** — monthly expense list with deductible total strip, Add Expense modal (grouped category picker, payment method, tax-deductible toggle auto-set by category)
- **BusinessReportsScreen** — year picker, P&L summary card, LHDN estimated taxable income card, expense breakdown by group, disclaimer footer
- **BusinessSpace** — sub-router connecting all four screens

## V1 Feature Parity

| Feature | PWA | Sprint 9 |
|---|---|---|
| Business dashboard (monthly P&L) | ✅ | ✅ |
| 12-month P&L bar chart | ✅ | ✅ |
| Income list (monthly) | ✅ | ✅ |
| Add income | ✅ | ✅ |
| Business expense list (monthly) | ✅ | ✅ |
| Add business expense | ✅ | ✅ |
| Tax deductible auto-set by category | ✅ | ✅ |
| Business reports (P&L + LHDN estimate) | ✅ | ✅ |
| PDF report download | ✅ | ⏳ Sprint 12 (backend) |

## App.tsx Integration

- `PersonalSpace` and `BusinessSpace` are rendered outside the shared ScrollView so each space manages its own layout
- `FeatureGate` wrapper preserved for Business Space (subscription tier check)
- `DeferredSpace` placeholders removed for both spaces

## Verification

TypeScript check passes with no errors in any new Sprint 8 or Sprint 9 file:

```powershell
corepack pnpm -C apps/user-mobile-v2 typecheck
```

## Known Follow-ups

- PDF business report download requires Sprint 12 backend
- All data is local-only until Sprint 11/12 backend sync
- Income source list (Grab, FoodPanda, Lalamove) may need expanding based on user feedback
