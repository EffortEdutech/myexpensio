# Sprint 17 — Receipt Attachment on Expense Entries — Sign-off

**Date:** 2026-06-09
**Status:** ✅ SIGNED OFF
**Commit:** `40e8523`

---

## Problem

Personal and Business expense entries (`ledger_entries` table) had a
`receipt_path` column and matching TypeScript fields since Sprint 8
(migration 9), but the UI never exposed a way to attach, view, or change
a receipt. The column was always written as `NULL`.

Claim items had full receipt support (via the `receipts` table + camera
picker in `AddClaimItemModal`). This sprint closes the equivalent gap for
the Personal and Business ledger entry flows.

---

## Gap Analysis (pre-sprint)

| Layer | Status |
|---|---|
| `ledger_entries.receipt_path` column | ✅ Already existed (migration 9) |
| `LedgerEntry.receiptPath` TypeScript field | ✅ Already existed |
| `CreateLedgerEntryInput.receiptPath` | ✅ Already existed |
| `createLedgerEntry` writes `receipt_path` | ✅ Already existed |
| `updateLedgerEntry` updates `receipt_path` | ❌ **Missing** |
| Receipt picker UI in expense forms | ❌ **Missing** |
| Receipt indicator on expense list rows | ❌ **Missing** |
| Receipt thumbnail in expense detail view | ❌ **Missing** |

---

## Deliverables

### 1. Repository fix — `src/local-db/repositories/ledgerRepository.ts` ✅

Added `receiptPath` to the dynamic field builder in `updateLedgerEntry`.
Existing entries can now have their receipt attached, changed, or removed
via an edit:

```ts
if (input.receiptPath !== undefined) {
  fields.push("receipt_path = ?");
  values.push(input.receiptPath ?? null);
}
```

`UpdateLedgerEntryInput` (a `Partial<Omit<CreateLedgerEntryInput, ...>> & { id }`)
already included `receiptPath` via the base type — no type change needed.

---

### 2. Shared component — `src/components/ReceiptPickerField.tsx` ✅

New reusable component built on `expo-image-picker` (already installed).

**Empty state:**
- Dashed border button: "📎 Attach Receipt · optional"
- On press → `Alert.alert` on native with Camera / Photo Library options
- On web → library picker directly (no camera alert)

**Filled state:**
- Green-tinted preview card with 60×60 thumbnail
- "📎 Receipt attached" label
- "Change" (blue) and "Remove" (red) action buttons

**Permissions:**
- Camera: `requestCameraPermissionsAsync()` — prompts on first use
- Gallery: `requestMediaLibraryPermissionsAsync()` — prompts on first use
- Gracefully shows an `Alert` if denied

```ts
<ReceiptPickerField value={receiptPath} onChange={setReceiptPath} />
```

---

### 3. Personal expenses — `src/features/personal/components/PersonalExpensesScreen.tsx` ✅

Changes to `AddExpenseForm` (shared between Add and Edit via `initialData`):

| Change | Detail |
|---|---|
| `receiptPath` state | Initialised from `initialData.receiptPath ?? null` |
| `ReceiptPickerField` in form | Rendered before the Save button, inside a `Field` wrapper |
| `create.mutate()` | Passes `receiptPath: receiptPath ?? null` |
| `update.mutate()` | Passes `receiptPath: receiptPath ?? null` |

Changes to list rows:
- 📎 emoji chip (`styles.receiptChip`) shown alongside Tax ✓ when `entry.receiptPath` is set

Changes to `EntryDetailModal`:
- Full-width 180px thumbnail (`styles.receiptThumb`) shown below the tax deductible badge when `entry.receiptPath` is set

---

### 4. Business expenses — `src/features/business/components/BusinessExpensesScreen.tsx` ✅

Identical changes to `AddBusinessExpenseForm`, business list rows, and
`BusinessEntryDetailModal`. Business accent colour (red `#dc2626`) preserved
throughout; receipt UI uses the same green/blue neutral palette as Personal.

---

## UX Flow

```
Add/Edit Expense form
  └─ [📎 Attach Receipt] (dashed button)
       ├─ Camera     → requestCameraPermissionsAsync → launchCameraAsync
       └─ Photo Library → requestMediaLibraryPermissionsAsync → launchImageLibraryAsync
            └─ URI stored in state → passed to create/update mutation
                 └─ Saved to ledger_entries.receipt_path (local URI)

Expense list row
  └─ 📎 chip appears next to "Tax ✓" when receipt_path is not null

Expense detail modal
  └─ Full-width receipt thumbnail rendered below tax badge
  └─ Tap Edit → form pre-fills receiptPath, shows Change/Remove options
```

---

## QA Scenarios

| # | Scenario | Expected |
|---|---|---|
| R1 | Add expense, attach via Camera | Photo appears as thumbnail in form; saved with entry |
| R2 | Add expense, attach via Gallery | Same as R1 |
| R3 | Add expense, no receipt | Saves cleanly; no 📎 in list; no thumbnail in detail |
| R4 | Edit existing entry, attach receipt | Receipt saved on update; 📎 appears in list |
| R5 | Edit existing entry with receipt, tap Remove | receipt_path set to null; 📎 disappears |
| R6 | Edit existing entry with receipt, tap Change | New photo replaces old URI |
| R7 | Tap expense row with 📎 | Detail modal shows receipt thumbnail |
| R8 | Deny camera permission | Alert shown; form not affected; no crash |
| R9 | Business expense — same flow | All R1–R8 pass with red accent colour |

---

## Files Changed

| File | Change |
|---|---|
| `apps/user-mobile-v2/src/local-db/repositories/ledgerRepository.ts` | `updateLedgerEntry` now handles `receiptPath` |
| `apps/user-mobile-v2/src/components/ReceiptPickerField.tsx` | New shared component (created) |
| `apps/user-mobile-v2/src/features/personal/components/PersonalExpensesScreen.tsx` | Receipt state, picker UI, list indicator, detail thumbnail |
| `apps/user-mobile-v2/src/features/business/components/BusinessExpensesScreen.tsx` | Same as Personal |

---

## Storage Note

Receipt paths stored in `receipt_path` are **local device URIs** (e.g.
`file:///data/user/...`). Under the Option B architecture, these are
local-first — they persist on-device and are not uploaded to Supabase
Storage unless the user is on PRO (cloud backup sprint, deferred). This
is consistent with how claim item receipts work in the `receipts` table.
