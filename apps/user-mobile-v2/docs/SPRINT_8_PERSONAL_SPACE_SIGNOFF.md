# Sprint 8 — Personal Space Sign-Off

Date: 2026-05-30

## Goal

Port the Personal Expense space from PWA (`apps/user`) into the local-first mobile v2 app.

## Implemented

### DB Migrations (id 9–11)
- `ledger_entries` — shared table for PERSONAL and BUSINESS expense/income entries (migration 9)
- `commitments` — recurring bills / monthly commitments (migration 10)
- `commitment_payments` — per-month payment status for each commitment (migration 11)

### Repositories
- `ledgerRepository.ts` — list by month/year, list for year, create, soft-delete; all with sync queue enqueue
- `commitmentRepository.ts` — list, get by id, create, deactivate; plus upsert and update payment status

### React Query Hooks
- `useLedger.ts` — `useLedgerEntries`, `useLedgerEntriesForYear`, `useCreateLedgerEntry`, `useDeleteLedgerEntry`
- `useCommitments.ts` — `useCommitments`, `useCommitment`, `usePaymentsForCommitment`, `usePaymentsForMonth`, `useCreateCommitment`, `useDeactivateCommitment`, `useUpsertPayment`, `useUpdatePaymentStatus`

### Screens (all local-first, no backend calls)
- **PersonalHomeScreen** — yearly stats (total expenses, tax deductible, entry count), nav cards to Expenses / Bills / Tax
- **PersonalExpensesScreen** — monthly list with totals strip, Add modal; categories, payment method, tax deductible toggle + LHDN category
- **PersonalBillsScreen** — monthly view of active commitments, Mark Paid/Unpaid per month, Add Bill 2-step flow (pick category → fill details), deactivate
- **PersonalTaxScreen** — year picker, LHDN relief breakdown from ledger entries + commitment tax relief (annualised), disclaimer footer
- **PersonalSpace** — sub-router connecting all four screens

### Sync
- `"ledger_entry"`, `"commitment"`, `"commitment_payment"` added to `SyncEntityType`
- All create/update operations enqueue to the local sync queue for future Sprint 11/12 backend sync

## V1 Feature Parity

| Feature | PWA | Sprint 8 |
|---|---|---|
| Personal home (yearly stats) | ✅ | ✅ |
| Add personal expense | ✅ | ✅ |
| Personal expenses list (monthly) | ✅ | ✅ |
| Bills & commitments list | ✅ | ✅ |
| Add bill (2-step) | ✅ | ✅ |
| Mark bill paid / unpaid | ✅ | ✅ |
| Tax deduction summary (LHDN) | ✅ | ✅ |
| Receipt upload per expense | ✅ | ⏳ Sprint 11 (upload pipeline) |
| Bill detail / payment history grid | ✅ | ⏳ Sprint 10 polish |

## Verification

```powershell
corepack pnpm -C apps/user-mobile-v2 typecheck
```

TypeScript check passes with no errors in any new Sprint 8 file.

## Known Follow-ups

- Receipt upload for personal expenses depends on Sprint 11 upload pipeline
- Full 12-month payment history grid per commitment is deferred to Sprint 10 polish
- All data is local-only until Sprint 11/12 backend sync
