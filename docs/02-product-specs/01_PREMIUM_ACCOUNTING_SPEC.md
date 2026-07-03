# myexpensio — Premium Accounting Feature: Product Specification

**Version:** 1.0  
**Date:** 2026-05-13  
**Status:** Draft for review

---

## 1. Overview

myexpensio is evolving from an employee expense claim tool into a complete pocket finance manager. This document defines the **Premium Accounting** feature set — a "Level 0" bookkeeping layer built specifically for solo business owners, e-hailers (Grab, FoodPanda, Lalamove), freelancers, and single-operator businesses.

### Design Principles

1. **No breaking changes.** Existing claims, mileage, and expense tables are not modified.
2. **Spaces separate everything.** Three distinct financial contexts prevent data mixing.
3. **Personal expense is a baseline feature** — accessible to all plan tiers.
4. **Business accounting is Premium-only** — income tracking, P&L, tax summary.
5. **We are NOT building SQL Accounting or Xero.** We are building for people who currently use nothing at all.

---

## 2. Target Users

### Primary segment
- Grab / e-hailing drivers
- FoodPanda / Lalamove delivery riders
- Shopee / Lazada home sellers
- Freelancers and consultants
- Single-owner Sdn Bhd / sole proprietors

### What they have in common
- No monthly accountant
- Hate bookkeeping
- Need tax-ready records
- Need income and expense tracking in one place

### Positioning
Do not call this "Accounting Software". Position it as:
> **"Tax-ready i/o tracker for solo business — myexpensio"**

"i/o" = income / outgoing. Clean, modern, and jargon-free. People fear the word *accounting*. They love the phrase *tax-ready*, and "i/o" signals simplicity — money in, money out, nothing more.

---

## 3. Subscription Tier Design

| Feature | Free | Standard | Premium (Solo Biz) |
|---|---|---|---|
| Work Claims | ✅ | ✅ | ✅ |
| Personal Expense Tracking | ✅ | ✅ | ✅ |
| Personal Tax Deduction Marking | ✅ | ✅ | ✅ |
| Business Income Tracking | ❌ | ❌ | ✅ |
| Business Expense (bookkeeping) | ❌ | ❌ | ✅ |
| Profit Dashboard | ❌ | ❌ | ✅ |
| P&L Report (PDF) | ❌ | ❌ | ✅ |
| LHDN Tax Summary | ❌ | ❌ | ✅ |

**Suggested price:** RM 12 – RM 18 / month for Premium plan.

---

## 4. The Spaces Architecture

### Core Concept

Instead of mixing all financial records into one list, the user app introduces **Spaces** — three separate financial contexts each with its own dashboard, data, and categories.

```
user
 ├── PERSONAL SPACE      (all tiers — personal expenses + tax deduction marking)
 ├── BUSINESS SPACE      (Premium only — income, bookkeeping, P&L, tax summary)
 └── WORK SPACE          (existing — claims, mileage, employer reimbursements)
```

A **Space Switcher** at the top of the user app lets users move between contexts. Each space has its own dashboard, its own "Add" flows, and its own reports. Data never crosses between spaces.

### Why Spaces — not categories

Without Spaces, users must ask: *"Is this expense a claim, a business cost, or personal?"*  
With Spaces, users ask: *"Which wallet am I using right now?"*

This mental model mirrors familiar apps — Google accounts, Slack workspaces, Notion. Users understand it immediately.

---

## 5. Feature Specification per Space

### 5.1 WORK SPACE (Existing — No Changes)

This is the current myexpensio — unchanged.

- Mileage claims
- Expense receipts for employer reimbursement
- Submit claim to workspace/company
- Governed by employer policies and Admin Workspace

**Implementation note:** Zero changes to existing tables, routes, or UI flows.

---

### 5.2 PERSONAL SPACE (All Tiers)

Personal expense tracking for daily life. Kept completely separate from work and business.

**Categories:**
- Groceries
- Food & Dining
- Shopping
- Utilities & Bills
- Entertainment
- Transport (personal)
- Medical
- Education
- Others

**Key feature — Tax Deduction Marking:**

Each personal expense entry has:
- `is_tax_deductible` toggle (Yes / No)
- `tax_category` selector:
  - Lifestyle relief
  - Medical (self/family)
  - Education (self)
  - Life insurance / EPF
  - Books & learning materials
  - Equipment for disability
  - Others

When the user generates their **Personal Tax Declaration Summary**, myexpensio outputs:

```
Personal Tax Deduction Summary — 2026

Medical expenses:           RM 1,200
Lifestyle relief:           RM 2,300
Education (self):           RM 800
Books & materials:          RM 400
───────────────────────────────────
Total deductible expenses:  RM 4,700

Disclaimer: Final tax submission subject to LHDN rules and your tax agent's advice.
```

This becomes the evidence trail for LHDN declarations, replacing scattered receipts.

---

### 5.3 BUSINESS SPACE (Premium Only)

The full mini-accounting module for solo business users.

#### 5.3.1 Income Tracker

Add income entries with:
- Amount
- Date
- Source (Grab payout / Client payment / Bank transfer / Cash / Other)
- Category (Ride / Delivery / Sales / Service / Others)
- Note
- Attachment (payout screenshot optional)

No accounting jargon. Simple input, big value.

#### 5.3.2 Business Expense Tracking

Same UI as personal expenses, but with business-appropriate categories:

**Transport & Vehicle:**
- Fuel
- Toll
- Parking
- Car service / maintenance
- Insurance
- Road tax

**Business Operations:**
- Phone bill
- Internet / broadband
- Software subscriptions
- Equipment
- Marketing & advertising
- Professional fees

**Note:** Business expenses are marked as deductible by default. Non-deductible items (meals, entertainment above threshold) can be flagged.

#### 5.3.3 Profit Dashboard

The feature that converts users to Premium.

```
Monthly Snapshot — May 2026

  Income           RM 6,200
  Expenses       - RM 2,150
  Mileage deduction - RM 1,200
  ─────────────────────────────
  Estimated Profit   RM 2,850
```

**Annual chart** showing monthly profit/loss trend.

#### 5.3.4 Simple P&L Report (Downloadable PDF)

One-tap generation:

```
Profit & Loss Summary — 2026

INCOME
  Grab payouts          RM 52,300
  Cash rides             RM 8,200
  ─────────────────────────────────
  Total Income          RM 60,500

EXPENSES
  Fuel                  RM 12,200
  Toll                   RM 3,400
  Phone bill             RM 1,800
  Car maintenance        RM 2,100
  ─────────────────────────────────
  Total Expenses        RM 19,500

NET PROFIT             RM 41,000
```

Users can hand this to an accountant or attach to LHDN submission. The PDF is clean, simple, and professional.

#### 5.3.5 LHDN Tax Summary (Malaysia)

Generated per calendar year:

```
Business Tax Estimation Summary — 2026

Total Business Income:         RM 60,500
Total Deductible Expenses:   - RM 19,500
  (fuel, toll, phone, equipment)
Mileage Deduction:           -  RM 8,400
─────────────────────────────────────────
Estimated Taxable Income:      RM 32,600

Disclaimer: This is an estimate only. Final tax payable 
is subject to LHDN assessment and your tax agent's review.
```

---

## 6. Database Schema Changes

### Core principle: additive only. No existing tables are altered.

#### 6.1 New Table: `spaces`

```sql
CREATE TABLE spaces (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id        UUID REFERENCES organizations(id) ON DELETE SET NULL,
  type          TEXT NOT NULL CHECK (type IN ('PERSONAL', 'BUSINESS', 'WORK')),
  name          TEXT NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'MYR',
  is_default    BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX spaces_user_id_idx ON spaces(user_id);
CREATE UNIQUE INDEX spaces_user_type_unique ON spaces(user_id, type);
```

#### 6.2 New Table: `ledger_entries`

This is the heart of Personal and Business spaces. **Separate from the existing `expenses` table.**

```sql
CREATE TABLE ledger_entries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id         UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- EXPENSE or INCOME
  entry_type       TEXT NOT NULL CHECK (entry_type IN ('EXPENSE', 'INCOME')),
  
  amount           NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency         TEXT NOT NULL DEFAULT 'MYR',
  entry_date       DATE NOT NULL,
  
  -- Categorization
  category         TEXT NOT NULL,
  subcategory      TEXT,
  description      TEXT,
  
  -- Tax deduction (for PERSONAL space)
  is_tax_deductible   BOOLEAN NOT NULL DEFAULT false,
  tax_category        TEXT,   -- LHDN relief category
  
  -- Income source (for BUSINESS space INCOME entries)
  income_source    TEXT,   -- e.g. GRAB, CLIENT, CASH, BANK, OTHER

  -- Payment method (OPTIONAL label only — not tracked as balance)
  payment_method   TEXT,   -- CASH, CARD, ONLINE_BANKING, EWALLET, OTHER
  
  -- Attachment
  receipt_url      TEXT,
  attachment_path  TEXT,
  
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ledger_entries_space_id_idx ON ledger_entries(space_id);
CREATE INDEX ledger_entries_user_id_idx ON ledger_entries(user_id);
CREATE INDEX ledger_entries_entry_date_idx ON ledger_entries(entry_date);
CREATE INDEX ledger_entries_type_idx ON ledger_entries(entry_type);
```

#### 6.3 Profile: add subscription plan

```sql
-- Add to existing profiles table
ALTER TABLE profiles 
  ADD COLUMN subscription_plan TEXT NOT NULL DEFAULT 'FREE'
    CHECK (subscription_plan IN ('FREE', 'STANDARD', 'PREMIUM'));
```

#### 6.4 RLS Policies

```sql
-- Spaces: users can only see their own spaces
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY spaces_owner ON spaces 
  USING (user_id = auth.uid());

-- Ledger entries: users can only access their own
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY ledger_owner ON ledger_entries 
  USING (user_id = auth.uid());
```

#### 6.5 Migration: create default spaces for all existing users

```sql
-- Run once after schema changes deploy
INSERT INTO spaces (user_id, type, name, is_default)
SELECT id, 'PERSONAL', 'Personal', true
FROM profiles
ON CONFLICT (user_id, type) DO NOTHING;

-- Business space only for users who upgrade to Premium (created on plan activation)
-- Work space is virtual — linked to org_members, no row needed initially
```

---

## 7. API Routes (Next.js App Router)

All new routes live in `apps/user/app/api/` — no changes to existing routes.

### 7.1 Spaces

```
GET  /api/spaces                   — list user's spaces
POST /api/spaces/ensure            — create default spaces if not exist (called on first login)
GET  /api/spaces/[spaceId]/summary — dashboard summary for one space
```

### 7.2 Ledger (Personal + Business)

```
GET    /api/ledger?spaceId=&month=&year=&type=   — list entries with filters
POST   /api/ledger                                — create entry
PATCH  /api/ledger/[entryId]                      — update entry
DELETE /api/ledger/[entryId]                      — delete entry
```

### 7.3 Reports

```
GET /api/reports/profit-summary?spaceId=&month=&year=
GET /api/reports/tax-personal?year=                    — PERSONAL space tax deductions
GET /api/reports/tax-business?spaceId=&year=           — BUSINESS space LHDN summary
GET /api/reports/pl-pdf?spaceId=&year=                 — generate P&L PDF (Premium)
```

### 7.4 Subscription Guard

All `/api/reports/pl-pdf`, `/api/reports/tax-business`, and any Business Space ledger routes check:

```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('subscription_plan')
  .eq('id', user.id)
  .single()

if (profile?.subscription_plan !== 'PREMIUM') {
  return NextResponse.json({ error: 'UPGRADE_REQUIRED' }, { status: 403 })
}
```

---

## 8. Navigation & UX in User App

### Space Switcher (new top-level component)

Added to the user app shell. Shows current active space; tap to switch.

```
[ 💼 Work Claims ▼ ]
  ─────────────────
  👤 Personal
  🏢 My Business   ← Premium badge if not subscribed
  💼 Work Claims
```

### New pages/routes in user app

```
/personal              — Personal space dashboard
/personal/expenses     — List personal expenses
/personal/add          — Add personal expense
/personal/tax          — Personal tax deduction summary

/business              — Business dashboard (Premium gate)
/business/income       — Income list
/business/add-income   — Add income entry
/business/expenses     — Business expense list
/business/add-expense  — Add business expense
/business/reports      — P&L + tax summary

/upgrade               — Upgrade to Premium page
```

### Existing routes — completely unchanged

```
/dashboard       (existing work claims dashboard)
/claims/*        (existing)
/mileage/*       (existing)
/settings/*      (existing)
```

---

## 9. Premium Gate UX

When a free/standard user taps into a Business Space feature:

1. Show a clean upgrade modal — not a hard error page.
2. Display a 3-bullet value summary: Income tracking · P&L Report · Tax Summary.
3. Link to `/upgrade` page with Stripe payment flow.
4. On successful payment: `profiles.subscription_plan` updated to `PREMIUM`, Business space auto-created.

---

## 10. Release Phases

### Phase 1 — Foundation & Personal Space (All Tiers)
- Deploy schema migrations (`spaces`, `ledger_entries`, `subscription_plan`)
- Space Switcher UI component
- Personal expense entry + tax deduction marking
- Personal tax deduction summary (basic)
- Spaces created automatically on login for all existing users

### Phase 2 — Business Space Launch (Premium)
- Income tracking
- Business expense categorization
- Profit dashboard (monthly snapshot)
- Upgrade flow + Stripe integration for Premium plan
- Premium gate on all Business Space routes

### Phase 3 — Reports & Tax
- P&L PDF generation
- LHDN Business tax estimation summary
- Year-on-year comparison chart
- Personal tax declaration summary (full LHDN relief mapping)

---

## 11. Key Architecture Decisions

| Decision | Choice | Reason |
|---|---|---|
| Existing tables modified? | No | Additive schema only — zero migration risk |
| Personal/Business data store | New `ledger_entries` table | Completely isolated from claims/expenses |
| Subscription enforcement | Profile column + API middleware + RLS | Multi-layer security |
| Business space auto-create? | On Premium activation only | Prevents empty spaces for free users |
| Malaysia tax categories | Hardcoded LHDN relief taxonomy | Specific, accurate, low maintenance |
| PDF generation | Existing PDF skill / server-side | Consistent with existing report pattern |

---

## 12. Accounting Scope Boundaries (Important)

### What we are NOT building

- **No double-entry bookkeeping.** No debits, credits, journals, or ledgers.
- **No balance sheet.** Our users don't have investors or bank auditors. They don't need one.
- **No account tracking.** We do not track cash balances, bank account balances, or credit card balances.
- **No accounts payable / receivable.** We record expenses when spent, income when received. That's it.
- **No bank feed or statement import.** Users enter records manually or from receipts.
- **No GST/SST filing.** Future phase only.
- **No payroll or invoicing.**
- **No multi-currency accounting.** MYR only for now.

### Why "which account did you pay from?" is not required

Our users are individuals — e-hailers, freelancers, solo operators. LHDN does not require them to track which bank account or credit card was used for each expense. They only need to show the expense was legitimate and business-related.

We add an **optional `payment_method` tag** (Cash / Card / Online Banking / E-wallet) purely as a convenience label for the user's own memory. It is not used in any calculation, report, or tax summary. It is not tracked as a balance.

### How credit card expenses are handled

Record the expense on the date it was incurred — not when the credit card bill arrives, not when the user pays it off. This is **cash-basis accounting** and it is valid for LHDN purposes for individuals and small sole proprietors. The credit card is just a payment method label, nothing more.

### What income "going into an account" means here

Income is simply a log entry: "on this date, I received this amount from this source." There is no destination account. The income accumulates in the user's Business Space records and contributes to their profit calculation and tax summary. myexpensio is not a bank and does not hold or move money.

### The honest mental model

Think of this as a **digital cashbook** — the kind a small trader keeps in a physical notebook:
- Left column: money in (income)
- Right column: money out (expenses)
- Bottom line: profit

That is all. Simple, clean, and exactly what LHDN accepts for sole proprietors and individuals.

This scope control is intentional. We serve people currently using *nothing*. Simple always beats complete for this market.
