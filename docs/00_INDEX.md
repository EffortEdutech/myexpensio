# myexpensio — Documentation Index

**Last reorganized:** 2026-07-02
**Scope:** this index covers `docs/` at the repo root only. Sprint-by-sprint execution records for the mobile app (Sprint 1–24 signoffs, build plans) live in `apps/user-mobile-v2/docs/` and are not duplicated here — that folder has its own numbering already (`SPRINT_NN_*.md`) and is out of scope for this reorg.

Start here if you're new to the project:
1. Read `01-architecture/` to understand the platform's role model and why `user-mobile-v2` exists as a separate local-first app.
2. Read `SHIP_READINESS_ACTION_PLAN.md` (this folder, root) for what's currently blocking launch — this is the live, actively-changing doc.
3. Everything else is organized by topic below.

---

## Folder Guide

### `01-architecture/`
Reference docs on how the system is put together — not sprint plans, not feature specs.
- `01_PLATFORM_ROLES_REFERENCE.md` — the two parallel role systems (`profiles.role` platform-level vs `org_members.org_role` workspace-level) and their DB tables.
- `02_MOBILE_V2_LOCAL_FIRST_DECISION.md` — the decision record for why `apps/user-mobile-v2` was built as a separate local-first (SQLite + offline queue) app instead of modifying `apps/user`.
- `03_BACKEND_API_HOME_DECISION.md` — where the shared `/api/*` backend lives given the eventual retirement of `apps/user`, and why that isn't urgent yet (2026-07-17). Set a calendar note for 2026-08-08 — the checkpoint this doc points back to.

### `02-product-specs/`
Feature specifications — what a feature is and who it's for, not how/when it gets built.
- `01_PREMIUM_ACCOUNTING_SPEC.md` — the Premium Accounting (business bookkeeping) feature spec.
- `02_AI_ASSISTANT_AUTOMATION_SPEC.md` — AI-assisted receipt/odometer/voice capture spec (Gemini free tier + BYOK + on-device fallback). Draft, 2026-07-17.

### `03-sprint-plans/`
How and when features got built. Three tracks:
- `accounting/01_SPRINT_PLAN_ACCOUNTING.md` — sprint-by-sprint plan for the Premium Accounting spec above.
- `ai-capture/01_SPRINT_PLAN_AI_CAPTURE.md` — sprint-by-sprint plan for the AI capture spec above (S0–S7, planning stage).
- `mobile-v2/` — the original four founding planning docs for the `user-mobile-v2` rewrite, in chronological order:
  1. `01_COMPREHENSIVE_SPRINT_PLAN.md` — the first concrete sprint (local-first architecture foundation)
  2. `02_FULL_DELIVERY_ROADMAP.md` — the umbrella roadmap through production launch (doc #1 explicitly points here for "the complete roadmap")
  3. `03_SPRINT_3_WORK_CLAIMS_CORE_PARITY.md` — Sprint 3 plan (Work Claims offline parity)
  4. `04_V1_PARITY_LOCK.md` — the v1 feature-parity baseline lock
  - **Note:** the actual sprint-by-sprint execution/signoff record (Sprints 1 through 24) lives in `apps/user-mobile-v2/docs/`, not here. These four docs are the founding rationale/plans that kicked the rewrite off.

### `04-billing-payments/`
- `01_STRIPE_SETUP_GUIDE.md` — founder-facing Stripe setup walkthrough. **Known issue:** references env var names (`STRIPE_PRO_MONTHLY_PRICE_ID`) that don't match what the checkout code actually reads (`STRIPE_PRICE_PRO`/`STRIPE_PRICE_PREMIUM`), and doesn't cover PREMIUM at all. Fix tracked in `SHIP_READINESS_ACTION_PLAN.md` §1.1/1.4.

### `05-qa-testing/`
Read in this order — methodology, then the actual test run, then results:
1. `01_ROLE_BY_ROLE_QA_PLAYBOOK.md` (+ `.docx` twin) — the 3-pass QA methodology by role/app
2. `02_UAT_CHECKLIST.md` — the manual UAT script to execute
3. `03_UAT_WORKFLOW_AUDIT.md` — code-level route/workflow audit findings
4. `04_INVITATION_FLOW_TEST_GUIDE.html` — narrow test guide for the invite flow specifically

### `06-legal-compliance/`
1. `01_PDPA_NOTES.md` — informal working notes on Malaysia PDPA 2010 requirements (not the policy itself)
2. `02_PDPA_COMPLIANCE_REFERENCE.html` — fuller PDPA compliance reference
3. `03_PRIVACY_POLICY.html` — privacy policy content
4. `04_TERMS_OF_SERVICE.html` — terms of service content
5. `05_SIGNUP_CONSENT.html` — signup consent copy/snippet
- These are reference copies, not the live served pages — confirmed nothing in `apps/*` code loads these files directly by path.

### `07-email-templates/`
1. `01_INVITE_EMAIL_FOOTER.html`
2. `02_ACCEPT_INVITE.html`

### `archive/`
Historical / superseded material — kept for record, not for day-to-day reference. See `archive/README.md` for what's there and why.

---

## Files Not Moved

- `SHIP_READINESS_ACTION_PLAN.md` stays at the docs root, unnumbered — it's the single current, actively-changing cross-cutting plan (subscription finalization + sync fixes + app store submission). Once its items are done, fold anything still relevant into the appropriate numbered folder above and archive the rest.
