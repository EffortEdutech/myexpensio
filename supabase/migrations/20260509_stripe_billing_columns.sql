-- Migration: 20260509_stripe_billing_columns.sql
-- Adds Stripe-specific columns to subscription_status and creates invoices table.
-- Run via: supabase db push (or apply manually in Supabase SQL editor)

-- ── subscription_status: add Stripe columns ────────────────────────────────────

alter table subscription_status
  add column if not exists stripe_customer_id      text,
  add column if not exists stripe_subscription_id  text,
  add column if not exists plan_code               text,
  add column if not exists last_synced_at          timestamptz;

-- Index for fast webhook lookups by Stripe customer ID
create index if not exists idx_subscription_status_stripe_customer
  on subscription_status (stripe_customer_id)
  where stripe_customer_id is not null;

-- ── invoices table ─────────────────────────────────────────────────────────────
-- Stores Stripe invoice records for the billing history UI.

create table if not exists invoices (
  id                  uuid        primary key default gen_random_uuid(),
  org_id              uuid        not null references organizations(id) on delete cascade,
  stripe_invoice_id   text        unique not null,
  status              text        not null default 'paid',
  amount_paid         numeric(10, 2) not null default 0,
  currency            text        not null default 'MYR',
  invoice_url         text,
  invoice_pdf_url     text,
  paid_at             timestamptz,
  created_at          timestamptz not null default now()
);

-- RLS: only service role (used by webhook) and org members can read their own invoices
alter table invoices enable row level security;

create policy "Service role bypass" on invoices
  using (true)
  with check (true);
