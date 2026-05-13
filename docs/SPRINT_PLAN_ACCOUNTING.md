# myexpensio Premium Accounting — Sprint Plan

**Feature:** Tax-ready i/o tracker for solo business  
**Tracking starts:** 2026-05-13  
**Baseline versions:** user `3.1.3` · admin `0.1.0` · cs `0.1.0` · root `1.0.0`

---

## Sprint Overview

| Sprint | Focus | User App | Admin App | Commit Tag |
|--------|-------|----------|-----------|------------|
| S1 | DB Schema Foundation | — | — | `chore(db): spaces + ledger schema` |
| S2 | API Layer | `3.2.0` | — | `feat(api): spaces + ledger routes v3.2.0` |
| S3 | Personal Space UI | `3.2.1` | — | `feat(personal): personal space UI v3.2.1` |
| S4 | Personal Tax Summary | `3.2.2` | — | `feat(personal): tax deduction summary v3.2.2` |
| S5 | Premium Gate + Subscription | `3.3.0` | `0.2.0` | `feat(premium): subscription + upgrade flow v3.3.0` |
| S6 | Business Space — i/o | `3.3.1` | — | `feat(business): income + expense tracking v3.3.1` |
| S7 | Reports & P&L | `3.4.0` | — | `feat(reports): P&L + LHDN tax summary v3.4.0` |
| S8 | Polish & Stable Release | `4.0.0` | `1.0.0` | `release: Premium Accounting stable v4.0.0` |

---

## Sprint 1 — DB Schema Foundation

**Goal:** All new tables and columns deployed to Supabase. No UI changes. No app version bump.  
**Deliverable:** Migration SQL ready to run in Supabase SQL editor.

### Tasks

- [ ] Create `spaces` table with RLS
- [ ] Create `ledger_entries` table with RLS
- [ ] Add `subscription_plan` column to `profiles`
- [ ] Write backfill SQL: create PERSONAL space for all existing users
- [ ] Verify RLS policies block cross-user access

### Migration SQL to run

```sql
-- 1. spaces table
CREATE TABLE spaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id      UUID REFERENCES organizations(id) ON DELETE SET NULL,
  type        TEXT NOT NULL CHECK (type IN ('PERSONAL', 'BUSINESS', 'WORK')),
  name        TEXT NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'MYR',
  is_default  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX spaces_user_id_idx ON spaces(user_id);
CREATE UNIQUE INDEX spaces_user_type_unique ON spaces(user_id, type);

ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY spaces_select ON spaces FOR SELECT USING (user_id = auth.uid());
CREATE POLICY spaces_insert ON spaces FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY spaces_update ON spaces FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY spaces_delete ON spaces FOR DELETE USING (user_id = auth.uid());

-- 2. ledger_entries table
CREATE TABLE ledger_entries (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id           UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_type         TEXT NOT NULL CHECK (entry_type IN ('EXPENSE', 'INCOME')),
  amount             NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency           TEXT NOT NULL DEFAULT 'MYR',
  entry_date         DATE NOT NULL,
  category           TEXT NOT NULL,
  subcategory        TEXT,
  description        TEXT,
  is_tax_deductible  BOOLEAN NOT NULL DEFAULT false,
  tax_category       TEXT,
  income_source      TEXT,
  payment_method     TEXT CHECK (payment_method IN ('CASH', 'CARD', 'ONLINE_BANKING', 'EWALLET', 'OTHER')),
  receipt_url        TEXT,
  attachment_path    TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ledger_entries_space_id_idx ON ledger_entries(space_id);
CREATE INDEX ledger_entries_user_id_idx ON ledger_entries(user_id);
CREATE INDEX ledger_entries_entry_date_idx ON ledger_entries(entry_date);
CREATE INDEX ledger_entries_type_idx ON ledger_entries(entry_type);

ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY ledger_select ON ledger_entries FOR SELECT USING (user_id = auth.uid());
CREATE POLICY ledger_insert ON ledger_entries FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY ledger_update ON ledger_entries FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY ledger_delete ON ledger_entries FOR DELETE USING (user_id = auth.uid());

-- 3. Add subscription_plan to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT NOT NULL DEFAULT 'FREE'
    CHECK (subscription_plan IN ('FREE', 'STANDARD', 'PREMIUM'));

-- 4. Backfill: create PERSONAL space for every existing user
INSERT INTO spaces (user_id, type, name, is_default)
SELECT id, 'PERSONAL', 'Personal', true
FROM profiles
ON CONFLICT (user_id, type) DO NOTHING;
```

### GitHub commit (after SQL runs successfully in Supabase)

```
git add docs/
git commit -m "chore(db): add spaces, ledger_entries tables and subscription_plan [S1]"
```

---

## Sprint 2 — API Layer

**Goal:** All backend routes live. Fully testable via Postman/curl before any UI.  
**Version bump:** user app `3.1.3` → `3.2.0`

### Tasks

- [ ] `GET  /api/spaces` — list user's spaces, auto-create PERSONAL if missing
- [ ] `GET  /api/spaces/[spaceId]/summary` — monthly income/expense totals
- [ ] `GET  /api/ledger` — list entries (filter by spaceId, month, year, type)
- [ ] `POST /api/ledger` — create entry (validate space ownership)
- [ ] `PATCH /api/ledger/[entryId]` — update entry
- [ ] `DELETE /api/ledger/[entryId]` — delete entry
- [ ] `GET  /api/reports/tax-personal?year=` — personal tax deduction summary
- [ ] Bump user `package.json` version to `3.2.0`

### GitHub commit

```
git add apps/user/
git commit -m "feat(api): spaces + ledger API routes — user v3.2.0 [S2]"
git tag v3.2.0-user
```

---

## Sprint 3 — Personal Space UI

**Goal:** Users can switch to Personal space and log personal expenses with tax deduction marking.  
**Version bump:** user app `3.2.0` → `3.2.1`

### Tasks

- [ ] `SpaceSwitcher` component — top of app shell, dropdown between spaces
- [ ] Space auto-creation on first login (call `/api/spaces` ensure logic)
- [ ] `/personal` — Personal dashboard (month summary card)
- [ ] `/personal/expenses` — expense list with date, category, amount, tax badge
- [ ] `/personal/add` — add expense form:
  - Amount, Date, Category, Description
  - `is_tax_deductible` toggle
  - `tax_category` dropdown (LHDN relief categories)
  - `payment_method` optional dropdown (Cash / Card / Online Banking / E-wallet)
  - Receipt photo upload (optional)
- [ ] `/personal/expenses/[id]/edit` — edit form
- [ ] Empty state for new users
- [ ] Bump user `package.json` to `3.2.1`

### GitHub commit

```
git add apps/user/
git commit -m "feat(personal): Personal Space UI — expense tracking + space switcher v3.2.1 [S3]"
git tag v3.2.1-user
```

---

## Sprint 4 — Personal Tax Summary

**Goal:** Users can generate a personal tax deduction summary for LHDN filing reference.  
**Version bump:** user app `3.2.1` → `3.2.2`

### Tasks

- [ ] `/personal/tax` — Tax Deduction Summary page
  - Year picker (default: current year)
  - Grouped by `tax_category` with subtotals
  - Grand total deductible amount
  - LHDN disclaimer footer
- [ ] Export as PDF (simple browser print / generate via API)
- [ ] Link from Personal dashboard
- [ ] Bump user `package.json` to `3.2.2`

### GitHub commit

```
git add apps/user/
git commit -m "feat(personal): personal tax deduction summary page v3.2.2 [S4]"
git tag v3.2.2-user
```

---

## Sprint 5 — Premium Gate + Subscription

**Goal:** Stripe Premium plan live. Business Space locked behind it. Upgrade flow complete.  
**Version bump:** user app `3.2.2` → `3.3.0` · admin app `0.1.0` → `0.2.0`

### Tasks

- [ ] `PremiumGate` component — shows upgrade modal when non-Premium user hits a gated route
- [ ] `/upgrade` page — plan comparison table, CTA to checkout
- [ ] Stripe: create "Premium" price/product in Stripe dashboard
- [ ] `POST /api/billing/create-checkout` — Premium checkout session
- [ ] Stripe webhook: on `checkout.session.completed` → update `profiles.subscription_plan = PREMIUM` + create BUSINESS space
- [ ] `/api/billing/portal` — Stripe customer portal for plan management
- [ ] Admin app: subscription column on user list (FREE / STANDARD / PREMIUM badge)
- [ ] Bump user `package.json` to `3.3.0`, admin `package.json` to `0.2.0`

### GitHub commits

```
git add apps/user/ apps/admin/
git commit -m "feat(premium): subscription gate + upgrade flow + Stripe Premium plan — user v3.3.0 admin v0.2.0 [S5]"
git tag v3.3.0-user
git tag v0.2.0-admin
```

---

## Sprint 6 — Business Space: Income & Expense Tracking

**Goal:** Premium users can log business income and expenses, see live profit snapshot.  
**Version bump:** user app `3.3.0` → `3.3.1`

### Tasks

- [ ] `/business` — Business dashboard with monthly profit snapshot widget
  - Income total
  - Expense total
  - Estimated profit (income − expenses)
- [ ] `/business/income` — income entry list
- [ ] `/business/add-income` — add income form:
  - Amount, Date, Source (Grab / Client / Cash / Bank / Other)
  - Category (Ride / Delivery / Service / Sales / Other)
  - Note, attachment
- [ ] `/business/expenses` — business expense list
- [ ] `/business/add-expense` — add business expense form:
  - Business categories (Fuel, Toll, Parking, Phone, Internet, Equipment, etc.)
  - Tax deductible flag
  - Payment method
- [ ] Annual profit chart (monthly bars)
- [ ] Bump user `package.json` to `3.3.1`

### GitHub commit

```
git add apps/user/
git commit -m "feat(business): Business Space — income + expense tracking + profit dashboard v3.3.1 [S6]"
git tag v3.3.1-user
```

---

## Sprint 7 — Reports & P&L

**Goal:** Downloadable P&L report and LHDN business tax summary.  
**Version bump:** user app `3.3.1` → `3.4.0`

### Tasks

- [ ] `/business/reports` — Reports hub page
- [ ] `GET /api/reports/profit-summary` — monthly breakdown with category totals
- [ ] `GET /api/reports/tax-business?year=` — LHDN business tax estimation
  - Total income
  - Total deductible expenses (itemised by category)
  - Estimated taxable income
  - LHDN disclaimer
- [ ] `GET /api/reports/pl-pdf?year=` — generate P&L PDF
  - Income section
  - Expense section by category
  - Net profit
  - myexpensio branding + disclaimer
- [ ] Personal tax summary PDF (upgrade from Sprint 4's browser print)
- [ ] Bump user `package.json` to `3.4.0`

### GitHub commit

```
git add apps/user/
git commit -m "feat(reports): P&L report + LHDN tax summary + PDF export v3.4.0 [S7]"
git tag v3.4.0-user
```

---

## Sprint 8 — Polish & Stable Release

**Goal:** Production-ready. All edge cases handled. UAT passed.  
**Version bump:** user app `3.4.0` → `4.0.0` · admin app `0.2.0` → `1.0.0`

### Tasks

- [ ] Empty states for all new pages (first-time users)
- [ ] Error states and loading skeletons
- [ ] Mobile responsiveness audit on all new pages
- [ ] Upgrade modal polish (animation, value copy)
- [ ] UAT checklist for accounting feature (new section added to existing UAT doc)
- [ ] Supabase RLS edge case testing (cross-user access attempts)
- [ ] Update PREMIUM_ACCOUNTING_SPEC.md with any changes made during build
- [ ] Bump user `package.json` to `4.0.0`, admin `package.json` to `1.0.0`

### GitHub commits

```
git add .
git commit -m "release: myexpensio Premium Accounting — Tax-ready i/o tracker for solo business v4.0.0 [S8]"
git tag v4.0.0
git tag v4.0.0-user
git tag v1.0.0-admin
```

---

## Version Bump Reference

| Milestone | user app | admin app | commit message suffix |
|-----------|----------|-----------|----------------------|
| After S2 (API ready) | `3.2.0` | — | `v3.2.0 [S2]` |
| After S3 (Personal Space) | `3.2.1` | — | `v3.2.1 [S3]` |
| After S4 (Tax Summary) | `3.2.2` | — | `v3.2.2 [S4]` |
| After S5 (Premium Gate) | `3.3.0` | `0.2.0` | `v3.3.0 [S5]` |
| After S6 (Business Space) | `3.3.1` | — | `v3.3.1 [S6]` |
| After S7 (Reports) | `3.4.0` | — | `v3.4.0 [S7]` |
| After S8 (Stable) | `4.0.0` | `1.0.0` | `v4.0.0 [S8]` |

---

## Rules

1. Each sprint is tracked here — tasks checked off as completed.
2. No sprint is closed until all tasks are checked.
3. Version bump commit happens at the **end** of each sprint, after testing.
4. Sprint 1 has no version bump — it is DB-only.
5. All new routes go in `apps/user/app/api/` — no changes to existing routes.
6. Business Space routes always check `subscription_plan = PREMIUM` before proceeding.
